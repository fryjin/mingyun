#!/usr/bin/env python3
from pathlib import Path
import json,re,hashlib,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def fail(msg): errors.append(msg)
def norm(text): return re.sub(r'[\s，。！？、：“”‘’；（）()《》【】…—-]+','',str(text)).lower()
required=['index.html','manifest.webmanifest','sw.js','styles/app.css','styles/games.css','styles/adult-plus.css','styles/ui-refresh.css','src/main.js','src/core/store.js','src/modules/overlay.js','src/modules/lobby.js','src/modules/players.js','src/modules/game-sheet.js','src/modules/questions.js','src/games/registry.js','src/games/shared.js','src/games/five-second.js','src/games/hot-potato.js','src/games/undercover.js']
for rel in required:
    if not (ROOT/rel).exists(): fail(f'缺少文件：{rel}')

shared_manifest=json.loads((ROOT/'data/questions/manifest.json').read_text(encoding='utf-8'))
shared=[]
for entry in shared_manifest['files']:
    path=ROOT/entry['file']
    if not path.exists(): fail(f'共享题库缺失：{entry["file"]}');continue
    if hashlib.sha256(path.read_bytes()).hexdigest()!=entry['sha256']: fail(f'共享题库摘要不一致：{entry["file"]}')
    data=json.loads(path.read_text(encoding='utf-8'))
    if data['count']!=len(data['items']) or data['count']!=entry['count']: fail(f'共享题库数量错误：{entry["file"]}')
    shared.extend(data['items'])
if len(shared)!=4500: fail(f'共享题库总量应为4500，实际{len(shared)}')
if len({x['id'] for x in shared})!=len(shared): fail('共享题库 ID 重复')
if len({norm(x['text']) for x in shared})!=len(shared): fail('共享题库正文重复')

special_manifest=json.loads((ROOT/'data/games/manifest.json').read_text(encoding='utf-8'))
special=[];ids=set();content=set();game_counts={};adult_plus_counts={}
for entry in special_manifest['files']:
    path=ROOT/entry['file']
    if not path.exists(): fail(f'专用内容缺失：{entry["file"]}');continue
    if hashlib.sha256(path.read_bytes()).hexdigest()!=entry['sha256']: fail(f'专用内容摘要不一致：{entry["file"]}')
    data=json.loads(path.read_text(encoding='utf-8'))
    if data['count']!=len(data['items']) or data['count']!=entry['count']: fail(f'专用内容数量错误：{entry["file"]}')
    game_counts[data['game']]=game_counts.get(data['game'],0)+data['count']
    if data.get('level')=='adult-plus': adult_plus_counts[data['game']]=data['count']
    for item in data['items']:
        if item['id'] in ids: fail(f'专用内容 ID 重复：{item["id"]}')
        ids.add(item['id'])
        if 'text' in item:key=norm(item['text'])
        elif 'prompt' in item:key=norm(item['prompt'])
        elif 'instruction' in item:key=norm(item['instruction'])
        elif 'optionA' in item:key=norm(item.get('question','')+'|'+item['optionA']+'|'+item['optionB'])
        else:key=norm(item['civilian']+'|'+item['undercover'])
        composite=f'{data["game"]}:{key}'
        if composite in content: fail(f'专用内容正文重复：{item["id"]}')
        content.add(composite);special.append(item)
if len(special)!=5500: fail(f'专用内容总量应为5500，实际{len(special)}')
expected={'most-likely':1000,'would-rather':1000,'five-second':1000,'king':1500,'undercover':1000}
for game,count in expected.items():
    if game_counts.get(game)!=count: fail(f'{game} 应为{count}，实际{game_counts.get(game)}')
for game,count in {'most-likely':500,'would-rather':500,'five-second':500,'undercover':500,'king':1000}.items():
    if adult_plus_counts.get(game)!=count: fail(f'{game} 成人进阶应为{count}，实际{adult_plus_counts.get(game)}')

for fn in ['most-likely-adult-plus.json','would-rather-adult-plus.json','five-second-adult-plus.json','undercover-adult-plus.json','king-adult-plus.json']:
    path=ROOT/'data/games'/fn
    if not path.exists(): fail(f'成人进阶专用题库缺失：{fn}')

five=json.loads((ROOT/'data/games/five-second-adult-plus.json').read_text(encoding='utf-8'))
for item in five['items']:
    req=item.get('requirements')
    if not isinstance(req,dict): fail(f'五秒挑战缺少 requirements：{item["id"]}');continue
    if item.get('consentRequired') and (req.get('contact') or req.get('kissing') or req.get('alcohol')) and not item.get('alternatives'): fail(f'五秒挑战缺少替代方案：{item["id"]}')

uc=json.loads((ROOT/'data/games/undercover-adult-plus.json').read_text(encoding='utf-8'))
for item in uc['items']:
    for field in ('civilian','undercover'):
        word=str(item.get(field,''))
        if not 1<=len(word)<=4: fail(f'谁是卧底词长错误：{item["id"]} {field}')
        if re.search(r'[\s，。！？、：“”‘’；（）()《》【】…—-]',word): fail(f'谁是卧底词含标点：{item["id"]}')

forbidden=['一口闷','喝完整杯','必须喝完','灌酒','脱衣','私密部位','掐脖','限制呼吸','捆绑','掌掴']
for path in list((ROOT/'data/questions').glob('adult-plus-*.json'))+list((ROOT/'data/games').glob('*adult-plus.json')):
    text=path.read_text(encoding='utf-8')
    for token in forbidden:
        if token in text: fail(f'发现禁止内容 {token}：{path.name}')

sheet=(ROOT/'src/modules/game-sheet.js').read_text(encoding='utf-8')
for token in ("game.supportsAdult?['adult-plus']",'level-picker','sheet-action-bar','adult-plus-panel'):
    if token not in sheet: fail(f'游戏详情缺少：{token}')
undercover=(ROOT/'src/games/undercover.js').read_text(encoding='utf-8')
if "'adult-plus'" not in undercover: fail('谁是卧底未开放成人进阶')
hot=(ROOT/'src/games/hot-potato.js').read_text(encoding='utf-8')
for token in ('short:[10,20]','standard:[20,40]','long:[40,60]','10–20 秒','20–40 秒','40–60 秒'):
    if token not in hot: fail(f'炸弹时长缺失：{token}')
overlay=(ROOT/'src/modules/overlay.js').read_text(encoding='utf-8')
for token in ('focusable','event.key===\'Escape\'','sheet-close','lastFocused'):
    if token not in overlay: fail(f'弹层交互缺失：{token}')
css=(ROOT/'styles/ui-refresh.css').read_text(encoding='utf-8')
for token in ('--space-2:8px','min-height:44px','level-picker','sheet-action-bar','focus-visible'):
    if token not in css: fail(f'UI刷新样式缺失：{token}')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if 'party-game-v9.1.4' not in sw or 'ui-refresh.css' not in sw: fail('Service Worker 版本或缓存清单错误')

report={'version':'v9.1.4','sharedQuestions':len(shared),'specializedContent':len(special),'enabledContentTotal':len(shared)+len(special),'gameCounts':game_counts,'adultPlusCounts':adult_plus_counts,'errors':errors,'status':'PASS' if not errors else 'FAIL'}
(ROOT/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if errors else 0)
