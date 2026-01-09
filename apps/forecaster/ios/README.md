## iOS scaffold (placeholder)

This folder is a **scaffold placeholder** for an iOS version of LexFiat Forecaster™.

Current status:
- **UI**: not implemented here yet (desktop UI lives in `apps/forecaster/frontend`)
- **Tax engine + PDF generation**: implemented in `apps/forecaster/backend`

Intended direction:
- **SwiftUI shell** that embeds the web UI via `WKWebView`, similar to the Electron desktop shell
- **Local backend** running on-device (either:
  - a lightweight native service, or
  - a bundled Node runtime, if acceptable)

Minimum requirement to be implemented for iOS parity:
- Same “default advisory + danger-zone 2-layer confirmation + 24h auto-reset” behavior
- Same “generate filled PDFs from official templates” pipeline

