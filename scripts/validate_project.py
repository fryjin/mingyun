#!/usr/bin/env python3
from pathlib import Path
import json,re,hashlib,sys
ROOT=Path(__file__).resolve().parents[1];errors=[]
def fail(x):errors.append(x)
def norm(x):return re.sub(r'[\s，。！？、：“”‘’；（）()《》【】…—-]+','',str(x)).lower()
required=['index.html','sw.js','styles/adult-plus.css','src/core/store.js','src/modules/questions.js','src/modules/game-sheet.js','src/games/shared.js','src/games/king.js','data/questions/adult-plus-truth.json','data/questions/adult-plus-dare.json','data/games/king-adult-plus.json']
for rel in required:
    if not (ROOT/rel).exists():fail(f'缺少文件：{rel}')
qmanifest=json.loads((ROOT/'data/questions/manifest.json').read_text(encoding='utf-8'));shared=[]
for entry in qmanifest['files']:
    p=ROOT/entry['file']
    if not p.exists():fail(f'共享题库缺失：{entry["file"]}');continue
    data=json.loads(p.read_text(encoding='utf-8'))
    if data['count']!=len(data['items']) or data['count']!=entry['count']:fail(f'共享题库数量错误：{entry["file"]}')
    if hashlib.sha256(p.read_bytes()).hexdigest()!=entry['sha256']:fail(f'共享题库摘要错误：{entry["file"]}')
    shared.extend(data['items'])
if len(shared)!=4500:fail(f'共享题库总量应为4500，实际{len(shared)}')
if len({x['id'] for x in shared})!=len(shared):fail('共享题库ID重复')
if len({norm(x['text']) for x in shared})!=len(shared):fail('共享题库正文重复')
for name,count in [('adult-plus-truth.json',500),('adult-plus-dare.json',500)]:
    data=json.loads((ROOT/'data/questions'/name).read_text(encoding='utf-8'))
    if data['count']!=count:fail(f'{name}数量错误')
    for item in data['items']:
        if item.get('levelKey')!='adult-plus':fail(f'levelKey错误：{item["id"]}')
        r=item.get('requirements',{})
        for key in ['contact','contactLevel','kissing','alcohol','pairConsent']:
            if key not in r:fail(f'缺少requirements.{key}：{item["id"]}')
        if (r.get('contact') or r.get('kissing') or r.get('alcohol')) and not item.get('alternatives'):fail(f'缺少替代方案：{item["id"]}')
king=json.loads((ROOT/'data/games/king-adult-plus.json').read_text(encoding='utf-8'))
if king['count']!=1000 or len(king['items'])!=1000:fail('成人进阶国王指令数量错误')
for item in king['items']:
    if item['targetCount']<1 or item['targetCount']>2:fail(f'国王目标人数错误：{item["id"]}')
    if item['targetCount']==2 and '{target2}' not in item['instruction']:fail(f'国王双人占位符缺失：{item["id"]}')
    r=item.get('requirements',{})
    if (r.get('contact') or r.get('kissing') or r.get('alcohol')) and not item.get('alternatives'):fail(f'国王替代方案缺失：{item["id"]}')
texts=['src/modules/questions.js','src/modules/game-sheet.js','src/games/shared.js','src/games/king.js']
joined='\n'.join((ROOT/x).read_text(encoding='utf-8') for x in texts)
for token in ["'adult-plus'",'adultPlusAccepted','allowedByAdultPlus','逐题确认','使用替代']:
    if token not in joined:fail(f'关键逻辑缺失：{token}')
if '>命<' in (ROOT/'src/games/wheel.js').read_text(encoding='utf-8'):fail('转盘中心仍包含命字')
if 'party-game-v9.1.3' not in (ROOT/'sw.js').read_text(encoding='utf-8'):fail('SW版本错误')
report={'version':'v9.1.3','sharedQuestions':len(shared),'adultPlusTruth':500,'adultPlusDare':500,'adultPlusKing':1000,'enabledContentTotal':8000,'errors':errors,'status':'PASS' if not errors else 'FAIL'}
(ROOT/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if errors else 0)
