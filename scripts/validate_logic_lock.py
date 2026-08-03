from pathlib import Path
import hashlib
root=Path(__file__).resolve().parents[1]
baseline=Path('/mnt/data/v914_baseline/src')
errors=[]
for current in (root/'src').rglob('*.js'):
    source=baseline/current.relative_to(root/'src')
    if not source.exists():
        errors.append(f'missing baseline: {current.relative_to(root)}')
        continue
    if hashlib.sha256(current.read_bytes()).digest()!=hashlib.sha256(source.read_bytes()).digest():
        errors.append(f'logic changed: {current.relative_to(root)}')
if errors: raise SystemExit('\n'.join(errors))
print('All packaged JS files match V9.1.4 baseline.')
