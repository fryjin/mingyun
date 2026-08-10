# Mingyun V10.5 Architecture Closeout Patch

Base: `8a802fd2181630d9191a536e6f7cda23ba20d29f` (V10.4.0)  
Target: `V10.5.0`

## Contents

- `apply-v10.5.mjs` — applies rename/delete/overlay operations.
- `OPERATIONS.json` — machine-readable structural changes and V10.4 blob references.
- `overlay/` — files to add or replace in the repository.
- `V10.5-AUDIT.md` — scope, verification and deployment notes.
- `PACKAGE-SHA256SUMS.txt` — package file checksums.

## Apply

```bash
node apply-v10.5.mjs /path/to/mingyun
cd /path/to/mingyun
npm install
npm run verify
```

Do not copy only `overlay/`; V10.5 requires the rename/delete operations as part of the architecture closeout.
