#!/usr/bin/env python3
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
wheel = ROOT / 'src/games/wheel.js'
sw = ROOT / 'sw.js'
errors = []

for path in (wheel, sw):
    if not path.exists():
        errors.append(f'缺少文件: {path.relative_to(ROOT)}')

if not errors:
    wheel_text = wheel.read_text(encoding='utf-8')
    sw_text = sw.read_text(encoding='utf-8')

    if 'class="casino-spindle" aria-hidden="true"></div>' not in wheel_text:
        errors.append('未找到无文字的 casino-spindle 轴帽结构')

    spindle_match = re.search(r'<div class="casino-spindle"[^>]*>(.*?)</div>', wheel_text, re.S)
    if not spindle_match:
        errors.append('未找到 casino-spindle')
    elif spindle_match.group(1).strip():
        errors.append('casino-spindle 内仍存在内容')

    required_tokens = [
        'casino-ball-orbit', 'casino-wheel-disc', 'casino-top-marker',
        'requestAnimationFrame', 'winnerIndex=randomInt', 'showResult(player)'
    ]
    for token in required_tokens:
        if token not in wheel_text:
            errors.append(f'关键轮盘逻辑缺失: {token}')

    if "const VERSION='party-game-v9.1.2.1';" not in sw_text:
        errors.append('Service Worker 缓存版本不正确')

report = {
    'version': 'V9.1.2.1',
    'status': 'PASS' if not errors else 'FAIL',
    'checks': {
        'wheelFileExists': wheel.exists(),
        'serviceWorkerExists': sw.exists(),
        'spindleHasNoText': not errors or 'casino-spindle 内仍存在内容' not in errors,
        'cacheVersion': 'party-game-v9.1.2.1',
    },
    'errors': errors,
    'sha256': {}
}

for path in (wheel, sw):
    if path.exists():
        report['sha256'][str(path.relative_to(ROOT))] = hashlib.sha256(path.read_bytes()).hexdigest()

(ROOT / 'validation-report.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2),
    encoding='utf-8'
)

if errors:
    for error in errors:
        print(f'FAIL: {error}')
    sys.exit(1)

print('PASS: V9.1.2.1 wheel center patch validated.')
