---
Document ID: SNYK-CONFIGURATION
Title: Snyk Configuration Guide
Subject(s): Security | Snyk | Configuration
Project: Cyrano
Version: v548
Created: 2025-01-07 (2025-W01)
Last Substantive Revision: 2025-01-07 (2025-W01)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Configuration guide for Snyk security scanning.
Status: Active
---

# Snyk Configuration Guide

**Purpose:** Configure Snyk for dependency vulnerability scanning  
**Last Updated:** 2025-01-07

---

## Quick Start

### 1. Install Snyk CLI
```bash
npm install -g snyk
```

### 2. Authenticate
```bash
snyk auth
```

### 3. Test Connection
```bash
snyk test
```

---

## Project Configuration

### Cyrano MCP Server

**Location:** `/Cyrano/`  
**Package Manager:** npm  
**Main Files:**
- `package.json`
- `package-lock.json`

**Scan Command:**
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/Cyrano
snyk test
```

**Monitor Setup:**
```bash
snyk monitor
```

### LexFiat Client

**Location:** `/LexFiat/`  
**Package Manager:** npm  
**Main Files:**
- `package.json`
- `package-lock.json`

**Scan Command:**
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/LexFiat
snyk test
```

### Arkiver Frontend

**Location:** `/apps/arkiver/frontend/`  
**Package Manager:** npm  
**Main Files:**
- `package.json`
- `package-lock.json`

**Scan Command:**
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/apps/arkiver/frontend
snyk test
```

---

## Snyk Configuration File

Create `.snyk` file in project root to configure policies:

```yaml
# .snyk policy file
version: v1.22.0
ignore: {}
patch: {}
```

---

## GitHub Integration

1. **Connect Repository**
   - Go to Snyk dashboard
   - Add project → Import from Git
   - Connect: `MightyPrytanis/codebase`

2. **Configure Projects**
   - Select: `Cyrano/`
   - Select: `LexFiat/`
   - Select: `apps/arkiver/frontend/`

3. **Set Up PR Checks**
   - Enable Snyk GitHub Action
   - Configure PR checks
   - Set up alerting

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Snyk Security Scan
on:
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

---

## Key Information for Snyk

### Project Structure
- **Monorepo:** Yes (multiple package.json files)
- **Package Managers:** npm
- **Languages:** TypeScript, JavaScript
- **Frameworks:** React, Express, Node.js

### Dependencies to Monitor
- All npm packages in:
  - `Cyrano/package.json`
  - `LexFiat/package.json`
  - `apps/arkiver/frontend/package.json`

### Critical Dependencies
- `@anthropic-ai/sdk` - Anthropic API client
- `openai` - OpenAI API client
- `@modelcontextprotocol/sdk` - MCP SDK
- `express` - Web framework
- `react` - Frontend framework
- `@tanstack/react-query` - Data fetching

---

## Expected Output

Snyk will report:
- Vulnerable dependencies
- CVEs with severity levels
- Remediation recommendations
- Upgrade paths

---

**Document Owner:** David W Towne / Cognisint LLC  
**Last Updated:** 2025-01-07


