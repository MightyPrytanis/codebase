---
Document ID: OWASP-ZAP-CONFIGURATION
Title: OWASP ZAP Configuration Guide
Subject(s): Security | OWASP ZAP | Configuration
Project: Cyrano
Version: v548
Created: 2025-01-07 (2025-W01)
Last Substantive Revision: 2025-01-07 (2025-W01)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Configuration guide for OWASP ZAP security testing.
Status: Active
---

# OWASP ZAP Configuration Guide

**Purpose:** Configure OWASP ZAP for dynamic application security testing  
**Last Updated:** 2025-01-07

---

## Quick Start

### 1. Download OWASP ZAP
- Go to https://www.zaproxy.org/download/
- Download for your OS
- Install ZAP

### 2. Start ZAP
- Launch OWASP ZAP
- Choose "I want to persist this session"
- Select "Automated Scan" mode

---

## Application Endpoints

### LexFiat Client

**Development:**
- **URL:** `http://localhost:5173`
- **Type:** Single Page Application (SPA)
- **Framework:** React + Vite

**Production Preview:**
- **URL:** `http://localhost:4173`
- **Type:** Single Page Application (SPA)

**Key Endpoints:**
- `/` - Dashboard
- `/dashboard` - Dashboard
- `/settings` - Settings
- `/mae-workflows` - MAE Workflow Management
- `/performance` - Performance page
- `/research` - Research page

### Arkiver Frontend

**Development:**
- **URL:** `http://localhost:5174`
- **Type:** Single Page Application (SPA)
- **Framework:** React + Vite

**Production Preview:**
- **URL:** `http://localhost:4174`
- **Type:** Single Page Application (SPA)

**Key Endpoints:**
- `/` - Home/Dashboard
- `/dashboard` - Dashboard
- `/extractor` - File Extractor
- `/insights` - Insights
- `/visualizations` - Visualizations
- `/ai-assistant` - AI Assistant
- `/ai-integrity` - AI Integrity
- `/settings` - Settings

### Cyrano MCP HTTP Bridge

**Base URL:** `http://localhost:5001` (or configured port)

**Key Endpoints:**
- `GET /mcp/tools` - List available tools
- `POST /mcp/execute` - Execute a tool
- `GET /mcp/tools/info` - Get tool information
- `GET /health` - Health check (if exists)

**Authentication:**
- May require API key or session-based auth
- Check `Cyrano/src/http-bridge.ts` for auth configuration

---

## ZAP Configuration

### 1. Create Context

1. **Right-click "Contexts" → "New Context"**
2. **Name:** "LexFiat" or "Arkiver" or "Cyrano API"
3. **Add URLs:**
   - Include: `http://localhost:5173/*` (LexFiat)
   - Include: `http://localhost:5174/*` (Arkiver)
   - Include: `http://localhost:5001/*` (Cyrano API)

### 2. Configure Spider

**For SPAs (LexFiat, Arkiver):**
- **Max Depth:** 5
- **Max Children:** 100
- **Enable AJAX Spider:** Yes
- **AJAX Max Duration:** 10 minutes
- **AJAX Max Crawl Depth:** 10

**For API (Cyrano):**
- **Max Depth:** 3
- **Max Children:** 50
- **Enable AJAX Spider:** No

### 3. Configure Active Scan

**Policy:** Default
**Strength:** Medium (recommended for first scan)
**Attack Mode:** Standard

**Customize Policy:**
- Enable all relevant attack types
- Focus on:
  - SQL Injection
  - XSS (Cross-Site Scripting)
  - CSRF (Cross-Site Request Forgery)
  - Authentication bypass
  - Session management
  - Sensitive data exposure

### 4. Authentication (if required)

**For Cyrano API:**
1. **Right-click Context → "Authentication"**
2. **Authentication Method:** 
   - API Key (if using API keys)
   - Form-based (if using forms)
   - JSON (if using JSON auth)
3. **Configure credentials**
4. **Test authentication**

---

## Running Scans

### Quick Scan (Recommended for First Run)

1. **Enter target URL** in address bar
2. **Click "Attack" → "Quick Start"**
3. **Wait for scan to complete**
4. **Review results in Alerts tab**

### Full Scan

1. **Right-click target URL in Sites tree**
2. **Select "Attack" → "Spider"**
3. **Wait for spider to complete**
4. **Select "Attack" → "Active Scan"**
5. **Review results**

### AJAX Spider (for SPAs)

1. **Right-click target URL**
2. **Select "Attack" → "AJAX Spider"**
3. **Configure:**
   - Max duration: 10 minutes
   - Max crawl depth: 10
4. **Run scan**

---

## Key Information for OWASP ZAP

### Application Details

**LexFiat:**
- **Type:** React SPA
- **API Backend:** Cyrano MCP (port 5001)
- **CORS:** Configured in `Cyrano/src/http-bridge.ts`
- **Authentication:** May use session-based or API key

**Arkiver:**
- **Type:** React SPA
- **API Backend:** Cyrano MCP (port 5001)
- **CORS:** Configured in `Cyrano/src/http-bridge.ts`
- **Authentication:** May use session-based or API key

**Cyrano API:**
- **Type:** REST API (Express)
- **Framework:** Node.js + Express
- **CORS:** Configured in `Cyrano/src/http-bridge.ts`
- **Authentication:** Check `Cyrano/src/http-bridge.ts`

### Security Headers to Check

ZAP should verify presence of:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`
- `X-XSS-Protection`
- `Referrer-Policy`

### Common Vulnerabilities to Test

1. **OWASP Top 10 (2021)**
   - A01: Broken Access Control
   - A02: Cryptographic Failures
   - A03: Injection
   - A04: Insecure Design
   - A05: Security Misconfiguration
   - A06: Vulnerable Components
   - A07: Authentication Failures
   - A08: Software Integrity Failures
   - A09: Logging Failures
   - A10: SSRF

2. **API-Specific**
   - Missing rate limiting
   - Insufficient input validation
   - Information disclosure
   - Insecure direct object references

3. **SPA-Specific**
   - XSS vulnerabilities
   - CSRF vulnerabilities
   - Missing security headers
   - CORS misconfiguration

---

## Expected Findings

### Common Issues

1. **Missing Security Headers**
   - Add security headers to `Cyrano/src/http-bridge.ts`

2. **CORS Configuration**
   - Review CORS settings
   - Ensure not using `*` for production

3. **Authentication Issues**
   - Review session management
   - Check JWT handling
   - Verify authorization checks

4. **Input Validation**
   - Review all API endpoints
   - Check tool input validation

---

## Report Generation

1. **Report → Generate Report**
2. **Select Format:**
   - HTML (recommended for review)
   - JSON (for automation)
   - XML (for integration)
3. **Include:**
   - All alerts
   - Request/response details
   - Evidence
4. **Save report**

---

## Automation

### ZAP Baseline Scan

```bash
# Install ZAP CLI
docker pull owasp/zap2docker-stable

# Run baseline scan
docker run -t owasp/zap-baseline-scan.py \
  -t http://localhost:5173 \
  -J zap-report.json \
  -r zap-report.html
```

### ZAP Full Scan

```bash
docker run -t owasp/zap-full-scan.py \
  -t http://localhost:5173 \
  -J zap-report.json \
  -r zap-report.html
```

---

## Resources

- **OWASP ZAP Documentation:** https://www.zaproxy.org/docs/
- **ZAP API:** https://www.zaproxy.org/docs/api/
- **ZAP Docker:** https://www.zaproxy.org/docs/docker/

---

**Document Owner:** David W Towne / Cognisint LLC  
**Last Updated:** 2025-01-07


