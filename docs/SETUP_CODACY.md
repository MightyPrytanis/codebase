# Quick setup: Codacy for this repository

This repository includes a minimal Codacy configuration and a GitHub Actions workflow to run tests, produce coverage, and report to Codacy. To finish setup with the least amount of work, do one of the two options below.

## Option A — Recommended (one click)
1. Install the Codacy GitHub App: https://github.com/apps/codacy
2. During installation, select this repository and grant the requested permissions.
3. Push a commit or open a PR — the workflow in `.github/workflows/codacy-analysis.yml` will run and Codacy will receive coverage and analysis results automatically.

## Option B — If you prefer token-based setup
1. In Codacy (codacy.com), add this repository and generate a project token (CODACY_PROJECT_TOKEN) for the repository.
2. In GitHub, go to Settings → Secrets and variables → Actions → New repository secret and add the token as `CODACY_PROJECT_TOKEN`.
3. Push a commit or open a PR to trigger the workflow.

## ESLint Configuration for TypeScript

ESLint `no-undef` errors are disabled for TypeScript files (`.ts`, `.tsx`) following TypeScript-ESLint recommendations. TypeScript's own type checking is more accurate for detecting undefined variables than ESLint's no-undef rule.

### Type Safety for Environment Variables

**Cyrano Backend (Node.js):**
- Type definitions for `process.env` variables are in `Cyrano/src/global.d.ts`
- This provides IntelliSense and type safety for all environment variables
- The file augments the `NodeJS.ProcessEnv` interface

**LexFiat Frontend (Vite):**
- Type definitions for `import.meta.env` variables are in `apps/lexfiat/client/src/global.d.ts`
- This provides type safety for Vite environment variables (prefixed with `VITE_`)
- The file augments the `ImportMetaEnv` interface

These declaration files ensure that environment variable access is type-safe while keeping ESLint focused on code quality issues rather than type checking.

## Troubleshooting
- If coverage isn't appearing, make sure tests actually generate a coverage report (Jest writes to `coverage/` by default).
- If Codacy analysis CLI needs a token, add `CODACY_PROJECT_TOKEN` to secrets as described above.
- ESLint `no-undef` errors in TypeScript files should be resolved by the configuration in `.eslintrc.json`

