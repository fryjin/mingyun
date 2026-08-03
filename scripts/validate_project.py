#!/usr/bin/env python3
from pathlib import Path
import json, re, hashlib, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def fail(msg): errors.append(msg)
def norm(text): return re.sub(r'[\s，。！？、：“”‘’；（）()《》【】…—-]+','',str(text)).lower()
required=['index.html','manifest.webmanifest','sw.js','src/main.js','src/core/store.js','src/modules/lobby.js','src/modules/players.js','src/modules/questions.js','src/games/registry.js','styles/app.css','styles/games.css']
for rel in required:
    if not (ROOT/rel).exists(): fail(f'缺少文件：{rel}')
shared_manifest=json.loads((ROOT/'data/questions/manifest.json').read_text(encoding='utf-8'))
shared=[]
for entry in shared_manifest['files']:
    path=ROOT/entry['file']
    if not path.exists(): fail(f'共享题库缺失：{entry["file"]}'); continue
    data=json.loads(path.read_text(encoding='utf-8'))
    if data['count']!=len(data['items']) or data['count']!=entry['count']: fail(f'共享题库数量错误：{entry["file"]}')
    shared.extend(data['items'])
if len(shared)!=3500: fail(f'共享题库总量应为3500，实际{len(shared)}')
if len({x['id'] for x in shared})!=len(shared): fail('共享题库 ID 重复')
if len({norm(x['text']) for x in shared})!=len(shared): fail('共享题库正文重复')
special_manifest=json.loads((ROOT/'data/games/manifest.json').read_text(encoding='utf-8'))
special=[]; ids=set(); content=set(); game_counts={}
for entry in special_manifest['files']:
    path=ROOT/entry['file']; data=json.loads(path.read_text(encoding='utf-8'))
    if hashlib.sha256(path.read_bytes()).hexdigest()!=entry['sha256']: fail(f'摘要不一致：{entry["file"]}')
    if data['count']!=len(data['items']) or data['count']!=entry['count']: fail(f'专用内容数量错误：{entry["file"]}')
    game_counts[data['game']]=game_counts.get(data['game'],0)+data['count']
    for item in data['items']:
        if item['id'] in ids: fail(f'专用内容 ID 重复：{item["id"]}')
        ids.add(item['id'])
        if 'text' in item: key=norm(item['text'])
        elif 'prompt' in item: key=norm(item['prompt'])
        elif 'instruction' in item: key=norm(item['instruction'])
        elif 'optionA' in item: key=norm(item.get('question','')+'|'+item['optionA']+'|'+item['optionB'])
        else: key=norm(item['civilian']+'|'+item['undercover'])
        composite=f'{data["game"]}:{key}'
        if composite in content: fail(f'专用内容正文重复：{item["id"]}')
        content.add(composite);special.append(item)
if len(special)!=2500: fail(f'专用内容总量应为2500，实际{len(special)}')
for game in ['most-likely','would-rather','five-second','king','undercover']:
    if game_counts.get(game)!=500: fail(f'{game} 应为500，实际{game_counts.get(game)}')
# V9.1.2 interaction and content regression checks
wr=(ROOT/'src/games/would-rather.js').read_text(encoding='utf-8')
if 'data-value="random"' in wr or 'data-value="discuss"' in wr: fail('二选一仍包含多余结算规则')
for entry in special_manifest['files']:
    if entry['game']!='would-rather': continue
    data=json.loads((ROOT/entry['file']).read_text(encoding='utf-8'))
    for item in data['items']:
        if not item.get('question'): fail(f'二选一缺少情境问题：{item["id"]}')
        if norm(item.get('optionA'))==norm(item.get('optionB')): fail(f'二选一选项相同：{item["id"]}')

hp=(ROOT/'src/games/hot-potato.js').read_text(encoding='utf-8')
if 'data-value="random"' in hp: fail('炸弹传递仍包含随机方向')
if '当前持有者</span><h2>' in hp: fail('炸弹传递仍显示具体持有者')
uc=(ROOT/'src/games/undercover.js').read_text(encoding='utf-8')
if '你的身份' in uc or 'role-name' in uc: fail('谁是卧底私密页仍显示身份')
for item in special:
    if item.get('id','').startswith('uc-'):
        for field in ('civilian','undercover'):
            word=str(item.get(field,''))
            if not (1<=len(word)<=4): fail(f'谁是卧底不是1-4字短词：{item["id"]} {field}={word}')
            if re.search(r'[\s，。！？、：“”‘’；（）()《》【】…—-]',word): fail(f'谁是卧底包含句式符号：{item["id"]}')

store=(ROOT/'src/core/store.js').read_text(encoding='utf-8')
sheet=(ROOT/'src/modules/game-sheet.js').read_text(encoding='utf-8')
if 'export function startGame' not in store or "closeOverlay();startGame(game.id,next)" not in sheet: fail('开始游戏仍可能先渲染大厅再进入游戏')
wheel=(ROOT/'src/games/wheel.js').read_text(encoding='utf-8')
for token in ('casino-wood-rim','casino-gold-rim','casino-ball-orbit','casino-wheel-disc'):
    if token not in wheel: fail(f'赌场转盘结构缺失：{token}')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if 'party-game-v9.1.2' not in sw: fail('Service Worker 缓存版本不正确')
report={'version':'v9.1.2','sharedQuestions':len(shared),'specializedContent':len(special),'enabledContentTotal':len(shared)+len(special),'gameCounts':game_counts,'errors':errors,'status':'PASS' if not errors else 'FAIL'}
(ROOT/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
