from pathlib import Path
required=[
    'index.html','sw.js','styles/midnight-game-hall.css',
    'src/modules/lobby.js','src/modules/players.js','src/modules/settings.js','src/modules/game-sheet.js',
    'src/games/shared.js','src/games/wheel.js',
    'assets/midnight/brand-crest.svg','assets/midnight/divider.svg','assets/midnight/corner-flourish.svg','assets/midnight/stage-arch.svg','assets/midnight/starfield.svg'
]
base=Path(__file__).resolve().parents[1]
missing=[rel for rel in required if not (base/rel).exists()]
if missing:
    raise SystemExit('Missing files: ' + ', '.join(missing))
print('V9.2.0 patch structure OK')
