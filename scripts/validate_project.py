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
        elif 'optionA' in item: key=norm(item['optionA']+'|'+item['optionB'])
        else: key=norm(item['civilian']+'|'+item['undercover'])
        composite=f'{data["game"]}:{key}'
        if composite in content: fail(f'专用内容正文重复：{item["id"]}')
        content.add(composite);special.append(item)
if len(special)!=2500: fail(f'专用内容总量应为2500，实际{len(special)}')
for game in ['most-likely','would-rather','five-second','king','undercover']:
    if game_counts.get(game)!=500: fail(f'{game} 应为500，实际{game_counts.get(game)}')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if 'party-game-v9.1.0' not in sw: fail('Service Worker 缓存版本不正确')
report={'version':'v9.1','sharedQuestions':len(shared),'specializedContent':len(special),'enabledContentTotal':len(shared)+len(special),'gameCounts':game_counts,'errors':errors,'status':'PASS' if not errors else 'FAIL'}
(ROOT/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
