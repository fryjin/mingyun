#!/usr/bin/env python3
from pathlib import Path
import json,re,hashlib,sys
ROOT=Path(__file__).resolve().parents[1];errors=[]
def fail(x):errors.append(x)
def norm(x):return re.sub(r'[\s，。！？、：“”‘’；（）()《》【】…—-]+','',str(x)).lower()
for rel,count,field in [('data/questions/adult-plus-truth.json',500,'text'),('data/questions/adult-plus-dare.json',500,'text'),('data/games/king-adult-plus.json',1000,'instruction')]:
 p=ROOT/rel
 if not p.exists():fail(f'缺少{rel}');continue
 d=json.loads(p.read_text(encoding='utf-8'))
 if d.get('count')!=count or len(d.get('items',[]))!=count:fail(f'数量错误：{rel}')
 vals=[norm(x[field]) for x in d['items']]
 if len(vals)!=len(set(vals)):fail(f'正文重复：{rel}')
 for x in d['items']:
  r=x.get('requirements',{})
  if not all(k in r for k in ['contact','contactLevel','kissing','alcohol','pairConsent']):fail(f'requirements不完整：{x.get("id")}')
  if (r.get('contact') or r.get('kissing') or r.get('alcohol')) and not x.get('alternatives'):fail(f'无替代方案：{x.get("id")}')
for rel in ['src/core/store.js','src/modules/questions.js','src/modules/game-sheet.js','src/games/shared.js','src/games/king.js','src/games/wheel.js','styles/adult-plus.css','index.html','sw.js']:
 if not (ROOT/rel).exists():fail(f'缺少补丁文件：{rel}')
if 'party-game-v9.1.3' not in (ROOT/'sw.js').read_text(encoding='utf-8'):fail('SW版本错误')
report={'version':'v9.1.3','newContent':2000,'truth':500,'dare':500,'king':1000,'errors':errors,'status':'PASS' if not errors else 'FAIL'}
(ROOT/'patch-validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if errors else 0)
