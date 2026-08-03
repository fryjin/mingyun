from pathlib import Path
import re

base = Path(__file__).resolve().parents[1]
allowed_runtime = {
    'index.html',
    'sw.js',
    'styles/midnight-game-hall.css',
}

runtime = []
for path in base.rglob('*'):
    if not path.is_file():
        continue
    rel = path.relative_to(base).as_posix()
    if rel.startswith(('docs/', 'scripts/')) or rel in {
        'README.md', 'CHANGELOG.md', 'MIGRATION.md', 'TEST-REPORT.md',
        'SHA256SUMS.txt', 'patch-validation-report.json'
    }:
        continue
    runtime.append(rel)

unexpected = sorted(set(runtime) - allowed_runtime)
missing = sorted(allowed_runtime - set(runtime))
if unexpected:
    raise SystemExit('Unexpected runtime files: ' + ', '.join(unexpected))
if missing:
    raise SystemExit('Missing runtime files: ' + ', '.join(missing))

index = (base / 'index.html').read_text(encoding='utf-8')
sw = (base / 'sw.js').read_text(encoding='utf-8')
css = (base / 'styles/midnight-game-hall.css').read_text(encoding='utf-8')

checks = {
    'index css version': 'midnight-game-hall.css?v=9.2.3' in index,
    'index build id': "v9.2.3-design-system-ui-only" in index,
    'service worker version': "party-game-v9.2.3-design-system-ui-only" in sw,
    'service worker css version': 'midnight-game-hall.css?v=9.2.3' in sw,
    'css braces': css.count('{') == css.count('}'),
    'no src files': not (base / 'src').exists(),
    'no data files': not (base / 'data').exists(),
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Validation failed: ' + ', '.join(failed))
print('V9.2.3 UI-only patch validation OK')
