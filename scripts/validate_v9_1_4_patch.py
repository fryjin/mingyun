#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []


def fail(message):
    errors.append(message)


def norm(value):
    return re.sub(r'[\s，。！？、：“”‘’；（）()《》【】…—-]+', '', str(value)).lower()


def item_text(item):
    if 'text' in item:
        return item['text']
    if 'prompt' in item:
        return item['prompt']
    if 'instruction' in item:
        return item['instruction']
    if 'optionA' in item:
        return f"{item.get('question', '')}|{item['optionA']}|{item['optionB']}"
    return f"{item.get('civilian', '')}|{item.get('undercover', '')}"


required = [
    'index.html', 'sw.js', 'styles/adult-plus.css', 'styles/ui-refresh.css',
    'src/main.js', 'src/core/store.js', 'src/modules/overlay.js',
    'src/modules/lobby.js', 'src/modules/players.js',
    'src/modules/game-sheet.js', 'src/modules/settings.js',
    'src/modules/questions.js', 'src/games/shared.js',
    'src/games/most-likely.js', 'src/games/would-rather.js',
    'src/games/five-second.js', 'src/games/hot-potato.js',
    'src/games/undercover.js', 'src/games/king.js', 'src/games/wheel.js',
    'data/games/manifest.json', 'data/questions/manifest.json',
    'README.md', 'MIGRATION.md', 'TEST-REPORT.md',
    'docs/UI-SKILL-REVIEW.md', 'docs/UI-UX-DECISIONS.md'
]
for rel in required:
    if not (ROOT / rel).exists():
        fail(f'升级包缺少：{rel}')

expected_shared = {
    'adult-plus-truth.json': 500,
    'adult-plus-dare.json': 500,
}
expected_specialized = {
    'most-likely-adult-plus.json': 500,
    'would-rather-adult-plus.json': 500,
    'five-second-adult-plus.json': 500,
    'undercover-adult-plus.json': 500,
    'king-adult-plus.json': 1000,
}

all_ids = set()
all_content = set()
counts = {}
all_items = []


def validate_bank(path, expected_count, category):
    if not path.exists():
        fail(f'缺少题库：{path.relative_to(ROOT)}')
        return None
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except Exception as error:
        fail(f'题库无法解析：{path.name}：{error}')
        return None
    if data.get('schemaVersion') != '1.0.0':
        fail(f'{path.name} schemaVersion 错误')
    if data.get('count') != expected_count or len(data.get('items', [])) != expected_count:
        fail(f'{path.name} 数量错误')
    for item in data.get('items', []):
        item_id = item.get('id')
        if not item_id:
            fail(f'{path.name} 存在无 ID 内容')
            continue
        if item_id in all_ids:
            fail(f'成人进阶 ID 重复：{item_id}')
        all_ids.add(item_id)
        key = f'{category}:{norm(item_text(item))}'
        if key in all_content:
            fail(f'成人进阶正文重复：{item_id}')
        all_content.add(key)
        all_items.append((path.name, item))
    return data


shared_banks = {}
for filename, count in expected_shared.items():
    bank = validate_bank(ROOT / 'data/questions' / filename, count, 'shared')
    if bank:
        shared_banks[filename] = bank
        counts[filename.removesuffix('.json')] = bank.get('count', 0)

specialized_banks = {}
for filename, count in expected_specialized.items():
    game = filename.removesuffix('-adult-plus.json')
    bank = validate_bank(ROOT / 'data/games' / filename, count, game)
    if bank:
        specialized_banks[filename] = bank
        counts[game] = bank.get('count', 0)

# Validate both manifests, including hashes and aggregate totals.
question_manifest = json.loads((ROOT / 'data/questions/manifest.json').read_text(encoding='utf-8'))
if question_manifest.get('totals', {}).get('all') != 4500:
    fail('共享题库总量不是 4500')
if question_manifest.get('totals', {}).get('adultPlus') != 1000:
    fail('共享成人进阶总量不是 1000')
for filename in expected_shared:
    entry = next((e for e in question_manifest.get('files', []) if Path(e['file']).name == filename), None)
    if not entry:
        fail(f'共享题库 Manifest 缺少：{filename}')
        continue
    path = ROOT / entry['file']
    if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() != entry.get('sha256'):
        fail(f'共享题库 Manifest 摘要错误：{filename}')
    if entry.get('count') != expected_shared[filename]:
        fail(f'共享题库 Manifest 数量错误：{filename}')

game_manifest = json.loads((ROOT / 'data/games/manifest.json').read_text(encoding='utf-8'))
if game_manifest.get('totalEnabledSpecialized') != 5500:
    fail('专用内容总量不是 5500')
for filename in expected_specialized:
    entry = next((e for e in game_manifest.get('files', []) if Path(e['file']).name == filename), None)
    if not entry:
        fail(f'专用内容 Manifest 缺少：{filename}')
        continue
    path = ROOT / entry['file']
    if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() != entry.get('sha256'):
        fail(f'专用内容 Manifest 摘要错误：{filename}')
    if entry.get('count') != expected_specialized[filename]:
        fail(f'专用内容 Manifest 数量错误：{filename}')

# Boundary schema and task-level consent checks.
action_files = {
    'adult-plus-dare.json',
    'five-second-adult-plus.json',
    'king-adult-plus.json',
}
for filename, item in all_items:
    requirements = item.get('requirements')
    if not isinstance(requirements, dict):
        fail(f'{filename} 缺少 requirements：{item.get("id")}')
        continue
    required_fields = ('contact', 'contactLevel', 'kissing', 'alcohol', 'pairConsent')
    for field in required_fields:
        if field not in requirements:
            fail(f'{item.get("id")} requirements 缺少 {field}')
    level = int(requirements.get('contactLevel') or 0)
    if level not in (0, 1, 2):
        fail(f'{item.get("id")} contactLevel 超出 0–2')
    if requirements.get('kissing') and not requirements.get('contact'):
        fail(f'{item.get("id")} 亲吻内容未标记 contact')
    if filename in action_files and (
        requirements.get('contact') or requirements.get('kissing') or requirements.get('alcohol')
    ):
        if not item.get('consentRequired'):
            fail(f'{item.get("id")} 涉及接触/亲吻/酒水但未要求逐题同意')
        if not item.get('alternatives'):
            fail(f'{item.get("id")} 涉及接触/亲吻/酒水但无替代方案')

# King placeholders must match targetCount.
for item in specialized_banks.get('king-adult-plus.json', {}).get('items', []):
    numbers = [int(n) for n in re.findall(r'\{target(\d+)\}', item.get('instruction', ''))]
    target_count = int(item.get('targetCount') or 0)
    if not numbers or max(numbers) > target_count:
        fail(f'国王指令目标占位符错误：{item.get("id")}')
    if not 1 <= target_count <= 3:
        fail(f'国王指令 targetCount 异常：{item.get("id")}')

# Undercover remains short and glanceable on the private screen.
for item in specialized_banks.get('undercover-adult-plus.json', {}).get('items', []):
    for field in ('civilian', 'undercover'):
        word = str(item.get(field, ''))
        if not 1 <= len(word) <= 4:
            fail(f'谁是卧底词长错误：{item.get("id")} {field}={word}')
        if re.search(r'[\s，。！？、：“”‘’；（）()《》【】…—-]', word):
            fail(f'谁是卧底词含句式标点：{item.get("id")}')

# Explicitly excluded coercive, dangerous, recording, or humiliating tasks.
forbidden = [
    '一口闷', '喝完整杯', '喝完一杯', '必须喝', '连续罚饮', '连喝', '灌酒',
    '脱衣', '脱掉衣', '内衣', '裸体', '私密部位', '胸部', '臀部', '胯部',
    '掐脖', '限制呼吸', '窒息', '捆绑', '掌掴', '扇耳光', '坐腿', '骑乘',
    '偷拍视频', '偷拍', '强制拍摄', '公开发布', '发朋友圈', '发到群里'
]
for filename, item in all_items:
    text = ' '.join([
        str(item.get('text', '')), str(item.get('prompt', '')),
        str(item.get('instruction', '')), str(item.get('question', '')),
        str(item.get('optionA', '')), str(item.get('optionB', '')),
        str(item.get('civilian', '')), str(item.get('undercover', '')),
        ' '.join(item.get('alternatives', [])),
    ])
    for token in forbidden:
        if token in text:
            fail(f'发现禁止内容“{token}”：{filename}/{item.get("id")}')

# Ensure every boundary combination keeps usable content and all-on exposes all items.
def allowed(item, preferences):
    requirements = item.get('requirements', {})
    if requirements.get('contact') and preferences['contact'] is False:
        return False
    if requirements.get('contact') and not requirements.get('kissing') and int(requirements.get('contactLevel') or 1) > preferences['contactLevel']:
        return False
    if requirements.get('kissing') and not preferences['kissing']:
        return False
    if requirements.get('alcohol') and not preferences['alcohol']:
        return False
    return True

all_off = {'contact': False, 'contactLevel': 1, 'kissing': False, 'alcohol': False}
all_on = {'contact': True, 'contactLevel': 2, 'kissing': True, 'alcohol': True}
eligibility = {}
for filename, bank in {**shared_banks, **specialized_banks}.items():
    off_count = sum(allowed(item, all_off) for item in bank.get('items', []))
    on_count = sum(allowed(item, all_on) for item in bank.get('items', []))
    eligibility[filename] = {'allOff': off_count, 'allOn': on_count}
    if off_count == 0:
        fail(f'{filename} 关闭全部边界后无可用内容')
    if on_count != bank.get('count'):
        fail(f'{filename} 开启全部边界后仍有内容被过滤')

# Code/UI regression tokens.
hot = (ROOT / 'src/games/hot-potato.js').read_text(encoding='utf-8')
for token in ('short:[10,20]', 'standard:[20,40]', 'long:[40,60]', '10–20 秒', '20–40 秒', '40–60 秒'):
    if token not in hot:
        fail(f'炸弹时长缺失：{token}')

sheet = (ROOT / 'src/modules/game-sheet.js').read_text(encoding='utf-8')
for token in ("game.supportsAdult?['adult-plus']", 'level-picker', 'sheet-action-bar', 'adult-plus-panel', 'confirmInsideSheet'):
    if token not in sheet:
        fail(f'游戏详情缺少：{token}')

questions = (ROOT / 'src/modules/questions.js').read_text(encoding='utf-8')
for token in ("'adult-plus'", 'allowedByAdultPlus', 'adultPlusFilterKey'):
    if token not in questions:
        fail(f'题库加载器缺少：{token}')

overlay = (ROOT / 'src/modules/overlay.js').read_text(encoding='utf-8')
for token in ('focusable', "event.key==='Escape'", 'sheet-close', 'lastFocused'):
    if token not in overlay:
        fail(f'弹层交互缺失：{token}')

css = (ROOT / 'styles/ui-refresh.css').read_text(encoding='utf-8')
for token in ('--space-2:8px', 'min-height:44px', 'level-picker', 'sheet-action-bar', 'focus-visible'):
    if token not in css:
        fail(f'UI 刷新样式缺失：{token}')

sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
if 'party-game-v9.1.4' not in sw or 'ui-refresh.css' not in sw:
    fail('Service Worker 版本或缓存清单错误')

html = (ROOT / 'index.html').read_text(encoding='utf-8')
try:
    HTMLParser().feed(html)
except Exception as error:
    fail(f'index.html 解析失败：{error}')
if 'V9.1.4' not in html or 'ui-refresh.css' not in html:
    fail('index.html 版本或 UI 样式引用错误')

for stylesheet in ('styles/adult-plus.css', 'styles/ui-refresh.css'):
    text = (ROOT / stylesheet).read_text(encoding='utf-8')
    if text.count('{') != text.count('}'):
        fail(f'CSS 花括号不平衡：{stylesheet}')

report = {
    'version': 'v9.1.4',
    'newSpecializedContent': 2000,
    'includedAdultPlusShared': sum(expected_shared.values()),
    'includedAdultPlusSpecialized': sum(expected_specialized.values()),
    'includedAdultPlusTotal': sum(expected_shared.values()) + sum(expected_specialized.values()),
    'enabledProjectContentAfterUpgrade': 10000,
    'counts': counts,
    'eligibility': eligibility,
    'errors': errors,
    'status': 'PASS' if not errors else 'FAIL',
}
(ROOT / 'patch-validation-report.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8'
)
print(json.dumps(report, ensure_ascii=False, indent=2))
sys.exit(1 if errors else 0)
