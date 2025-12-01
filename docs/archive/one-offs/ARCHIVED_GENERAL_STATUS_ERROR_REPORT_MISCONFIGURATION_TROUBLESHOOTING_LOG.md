---
⚠️ ARCHIVED DOCUMENT - INACTIVE

This document has been archived as a one-off/historical record.
For current project status, see: docs/PROJECT_CHANGE_LOG.md
Archived: 2025-11-28
---

---
Document ID: ERROR-REPORT-CLAUDE-MISCONFIG
Title: ERROR REPORT — Misconfiguration & Troubleshooting Log
Subject(s): General
Project: Cyrano
Version: v541
Created: 2025-10-07 (2025-W41)
Last Substantive Revision: 2025-10-07 (2025-W41)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

Severity: HIGH
Impact: Deployment broken / stale UI served; ~2–3 hours lost during troubleshooting
Author: Automated handoff (created on user request)
Date: 2025-10-07

Summary
-------
A recent troubleshooting session introduced temporary changes and a misdirected investigation that caused significant wasted time and deployment confusion.

Root cause
----------
- The frontend Vite config uses `client/` as the Vite root and outputs `dist/` to the repo root via `vite.config.ts`.
- During troubleshooting an incorrect assumption was made that the app's code live at the repo root instead of verifying the Vite root; this led to building/deploying the wrong files and chasing cache/ETag problems.
- Multiple attempts to force clean builds and cache-bust were made, but Render continued serving older asset bundles because either the wrong build path or CDN cache persisted.

Files modified by the troubleshooting agent
-------------------------------------------
These edits were made to the repository during the session and may be reverted safely.

- render.yaml
  - Commits: b5bfe3e, 6ed0281, 247da38
  - Edits: changed buildCommand to run builds in `client/`, moved `dist/` to repo root, and added BUILD_CACHE_BUST entries.
- client/src/main.tsx
  - Commit: d45dc16
  - Edits: added a single-line build-bump comment (non-functional)
- client/src/styles/piquette.css
  - Commit: 2810863
  - Edits: added a single-line build-bump comment (non-functional)
- dashboard_copy.tsx (repo root)
  - Commit: f358ed1
  - Created: a tiny wrapper file to help inspect the dashboard at repo root.

Why this is safe to revert
--------------------------
- The actual UI implementation (e.g., `client/src/pages/dashboard.tsx` and component files) was NOT deleted or altered in a destructive way. Only small comments and the `render.yaml` changes were made.
- Reverting the commits listed above will restore the previous `render.yaml` and remove the build-bump comments and wrapper file without losing the dashboard/work.

Immediate actions (recommended)
-------------------------------
1. Do NOT delete `client/src/pages` or other source files.
2. To revert the troubleshooting edits safely (non-destructive):

```bash
cd /Users/davidtowne/Projects/LexFiat
# This will create revert commits undoing the edits listed above
git revert --no-edit f358ed1 2810863 d45dc16 247da38 6ed0281 b5bfe3e
git push
```

3. Verify Render settings (UI or file):
   - Root Directory: (leave empty)
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
   - Env: `VITE_CYRANO_API_URL = https://cyrano-mcp-server.onrender.com`

4. If Render still serves stale assets after a correct deploy, use Render dashboard’s **Clear build cache & deploy** option or purge CDN cache.

Verification steps
------------------
- Locally build and inspect assets:

```bash
cd /Users/davidtowne/Projects/LexFiat
npm ci
npm run build
ls -la dist/assets
sed -n '1,60p' dist/index.html
```

- Compare with the live site:

```bash
curl -s https://lexfiat.onrender.com/ | sed -n '1,60p'
# confirm asset filenames match local dist/index.html
curl -I https://lexfiat.onrender.com/assets/index-<hash>.css
```

Contact & Notes
---------------
- This file was created at the user’s request to preserve a fault log and instructions for reverting the troubleshooting changes. Treat this as part of the codebase; remove only after the team has reviewed and accepted the fixes.

End of report.
