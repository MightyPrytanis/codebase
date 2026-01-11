## Cyrano MCP scaffold (placeholder)

This folder is a **scaffold placeholder** for a Cyrano/MCP-native version of LexFiat Forecaster™.

Current status in this repo:
- Cyrano already includes:
  - `Cyrano/src/engines/forecast/forecast-engine.ts`
  - `Cyrano/src/modules/forecast/tax-forecast-module.ts`
  - `Cyrano/src/tools/pdf-form-filler.ts`
- The HTTP bridge now exposes compatibility endpoints for the standalone UI:
  - `POST /api/forecast/tax`
  - `POST /api/forecast/tax/pdf`

Next steps (to implement):
- Register dedicated MCP tools for:
  - tax forecast calculation (2023–2025, federal + MI)
  - PDF generation for IRS + Michigan forms
- Ensure the same advisory/danger-zone policy is enforced within MCP tool execution.

