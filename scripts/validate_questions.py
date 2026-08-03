#!/usr/bin/env python3
import json, hashlib, pathlib, re, sys
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'data/questions/manifest.json').read_text(encoding='utf-8'))
items=[]
for entry in manifest['files']:
    path=root/entry['file']
    assert path.exists(), path
    assert hashlib.sha256(path.read_bytes()).hexdigest()==entry['sha256'], path
    data=json.loads(path.read_text(encoding='utf-8'))
    assert data['count']==len(data['items'])==entry['count']
    items.extend(data['items'])
norm=lambda s: re.sub(r'[\s，。！？、：“”‘’；（）()《》【】…—-]+','',s).lower()
assert len(items)==manifest['totals']['all']==3500
assert len({x['id'] for x in items})==3500
assert len({norm(x['text']) for x in items})==3500
print('PASS: 3500 questions, IDs and normalized texts are unique.')
