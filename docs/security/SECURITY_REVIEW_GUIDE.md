---
Document ID: SECURITY-REVIEW-GUIDE
Title: Security Review Guide for Snyk + OWASP ZAP
Subject(s): Security | Review | Snyk | OWASP ZAP
Project: Cyrano
Version: v548
Created: 2025-01-07 (2025-W01)
Last Substantive Revision: 2025-01-07 (2025-W01)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Comprehensive guide for conducting security review using Snyk and OWASP ZAP for pre-beta release.
Status: Active
---

# Security Review Guide - Snyk + OWASP ZAP

**Purpose:** Guide for conducting comprehensive security review using Snyk and OWASP ZAP  
**Target Audience:** Security reviewers, developers, QA team  
**Last Updated:** 2025-01-07  
**Status:** Active

---

## Overview

This guide provides step-by-step instructions for conducting a security review of the Cyrano/LexFiat/Arkiver codebase using:
- **Snyk** - Dependency vulnerability scanning and SAST
- **OWASP ZAP** - Dynamic Application Security Testing (DAST)

---

## Project Structure

### Applications Under Review

1. **Cyrano MCP Server**
   - **Location:** `/Cyrano/`
   - **Type:** Node.js/TypeScript MCP server
   - **Port:** 5001 (default)
   - **Key Files:**
     - `src/http-bridge.ts` - HTTP bridge for MCP
     - `src/tools/` - All MCP tools
     - `src/services/` - Core services (AI, authentication, etc.)
     - `src/engines/` - Engine layer (MAE, GoodCounsel, Potemkin)
     - `src/modules/` - Module layer (Chronometric, RAG, Arkiver)

2. **LexFiat Client**
   - **Location:** `/LexFiat/client/`
   - **Type:** React/Vite frontend application
   - **Port:** 5173 (dev), 4173 (preview)
   - **Key Files:**
     - `src/pages/` - Page components
     - `src/components/` - React components
     - `src/lib/` - API clients and utilities

3. **Arkiver Frontend**
   - **Location:** `/apps/arkiver/frontend/`
   - **Type:** React/Vite frontend application
   - **Port:** 5174 (dev), 4174 (preview)
   - **Key Files:**
     - `src/pages/` - Page components
     - `src/components/` - React components
     - `src/lib/` - API clients

### Backend Services

- **Cyrano HTTP Bridge:** `http://localhost:5001` (or configured port)
- **MCP Endpoints:**
  - `GET /mcp/tools` - List available tools
  - `POST /mcp/execute` - Execute a tool
  - `GET /mcp/tools/info` - Get tool information

---

## Part 1: Snyk Security Review

### Setup

1. **Create Snyk Account**
   - Go to https://snyk.io
   - Sign up for free account
   - Verify email address

2. **Install Snyk CLI**
   ```bash
   npm install -g snyk
   ```

3. **Authenticate**
   ```bash
   snyk auth
   ```
   Follow the prompts to authenticate via browser.

### Dependency Scanning

#### Scan Cyrano
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/Cyrano
snyk test
```

#### Scan LexFiat
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/LexFiat
snyk test
```

#### Scan Arkiver
```bash
cd /Users/davidtowne/Desktop/Coding/codebase/apps/arkiver/frontend
snyk test
```

### Continuous Monitoring

1. **Connect Repository to Snyk**
   - Go to Snyk dashboard
   - Add project → Import from Git
   - Connect GitHub repository: `MightyPrytanis/codebase`
   - Select projects to monitor:
     - `Cyrano/`
     - `LexFiat/`
     - `apps/arkiver/frontend/`

2. **Configure Snyk for CI/CD**
   - Set up Snyk GitHub Action (if using GitHub Actions)
   - Configure PR checks
   - Set up alerting

### SAST (Static Application Security Testing)

**Note:** Full SAST requires Snyk Code (paid tier). Free tier includes basic dependency scanning.

If using Snyk Code:
```bash
snyk code test
```

### Key Areas to Review

1. **Dependencies**
   - All `package.json` files
   - Check for known CVEs
   - Review transitive dependencies

2. **Environment Variables**
   - `.env` files (should be in `.gitignore`)
   - API key handling
   - Secret management

3. **Authentication/Authorization**
   - `Cyrano/src/services/auth-service.ts`
   - `Cyrano/auth-server/`
   - Session management
   - JWT handling

4. **API Security**
   - `Cyrano/src/http-bridge.ts`
   - CORS configuration
   - Rate limiting
   - Input validation

5. **Data Handling**
   - Database queries (SQL injection risks)
   - File upload handling
   - PII data processing

### Expected Output

Snyk will generate reports showing:
- Vulnerable dependencies with CVEs
- Severity levels (Critical, High, Medium, Low)
- Remediation recommendations
- Upgrade paths

### Action Items

- [ ] Review all Critical and High severity vulnerabilities
- [ ] Update vulnerable dependencies
- [ ] Review and fix Medium severity issues
- [ ] Document Low severity issues for future review
- [ ] Re-run scan after fixes
- [ ] Set up continuous monitoring

---

## Part 2: OWASP ZAP Security Testing

### Setup

1. **Download OWASP ZAP**
   - Go to https://www.zaproxy.org/download/
   - Download for your OS (macOS, Windows, Linux)
   - Install ZAP

2. **Start ZAP**
   - Launch OWASP ZAP
   - Choose "I want to persist this session" (recommended)
   - Select "Automated Scan" mode

### Configuration

#### 1. Configure Target Application

**For LexFiat:**
- **URL:** `http://localhost:5173` (dev) or `http://localhost:4173` (preview)
- **Application Type:** Single Page Application (SPA)

**For Arkiver:**
- **URL:** `http://localhost:5174` (dev) or `http://localhost:4174` (preview)
- **Application Type:** Single Page Application (SPA)

**For Cyrano API:**
- **URL:** `http://localhost:5001`
- **Application Type:** REST API

#### 2. Configure Context

1. **Create Context**
   - Right-click "Contexts" → "New Context"
   - Name: "LexFiat" or "Arkiver" or "Cyrano API"
   - Add target URL

2. **Authentication (if required)**
   - Configure authentication method
   - For Cyrano API, may need API key or session-based auth
   - Test authentication

3. **Configure Spider**
   - Set max depth (recommended: 5)
   - Set max children (recommended: 100)
   - Enable AJAX spider for SPAs

### Running Scans

#### Quick Scan
1. Enter target URL
2. Click "Attack" → "Quick Start"
3. Review results

#### Full Scan
1. Right-click target URL in Sites tree
2. Select "Attack" → "Spider"
3. Wait for spider to complete
4. Select "Attack" → "Active Scan"
5. Review results

#### AJAX Spider (for SPAs)
1. Right-click target URL
2. Select "Attack" → "AJAX Spider"
3. Configure options:
   - Max duration: 10 minutes
   - Max crawl depth: 10
4. Run scan

### Key Tests Performed

OWASP ZAP will test for:

1. **OWASP Top 10 (2021)**
   - A01:2021 – Broken Access Control
   - A02:2021 – Cryptographic Failures
   - A03:2021 – Injection
   - A04:2021 – Insecure Design
   - A05:2021 – Security Misconfiguration
   - A06:2021 – Vulnerable and Outdated Components
   - A07:2021 – Identification and Authentication Failures
   - A08:2021 – Software and Data Integrity Failures
   - A09:2021 – Security Logging and Monitoring Failures
   - A10:2021 – Server-Side Request Forgery (SSRF)

2. **Specific Tests**
   - SQL Injection
   - XSS (Cross-Site Scripting)
   - CSRF (Cross-Site Request Forgery)
   - Authentication bypass
   - Session management issues
   - Sensitive data exposure
   - Missing security headers
   - CORS misconfiguration

### Reviewing Results

1. **Alerts Tab**
   - Review all alerts by risk level:
     - High
     - Medium
     - Low
     - Informational

2. **Key Areas to Focus**
   - Authentication/authorization issues
   - Injection vulnerabilities
   - XSS vulnerabilities
   - Missing security headers
   - CORS configuration
   - Sensitive data exposure

3. **Generate Report**
   - Report → Generate Report
   - Select format (HTML, JSON, XML)
   - Include all alerts
   - Save report

### Expected Findings

Common issues to look for:

1. **Missing Security Headers**
   - `Content-Security-Policy`
   - `X-Frame-Options`
   - `X-Content-Type-Options`
   - `Strict-Transport-Security`

2. **CORS Issues**
   - Overly permissive CORS
   - Missing CORS headers

3. **Authentication Issues**
   - Weak password policies
   - Session fixation
   - Insecure session management

4. **API Security**
   - Missing rate limiting
   - Insufficient input validation
   - Information disclosure

### Action Items

- [ ] Review all High and Medium risk alerts
- [ ] Fix authentication/authorization issues
- [ ] Add missing security headers
- [ ] Fix CORS configuration
- [ ] Address injection vulnerabilities
- [ ] Fix XSS vulnerabilities
- [ ] Review and fix Low risk issues
- [ ] Re-run scan after fixes
- [ ] Document all findings

---

## Part 3: Manual Security Review

### Authentication & Authorization

**Files to Review:**
- `Cyrano/src/services/auth-service.ts`
- `Cyrano/auth-server/`
- `Cyrano/src/http-bridge.ts` (authentication middleware)

**Checklist:**
- [ ] Password hashing (bcrypt with appropriate salt rounds)
- [ ] Session management (secure, httpOnly cookies)
- [ ] JWT token handling (proper signing, expiration)
- [ ] Authorization checks on all protected endpoints
- [ ] API key validation
- [ ] Rate limiting on authentication endpoints

### Data Security

**Files to Review:**
- `Cyrano/src/db/` - Database access
- `Cyrano/src/services/` - Data processing services
- All file upload handlers

**Checklist:**
- [ ] SQL injection prevention (parameterized queries)
- [ ] Input validation and sanitization
- [ ] File upload restrictions (type, size, content validation)
- [ ] PII data encryption at rest
- [ ] Data encryption in transit (HTTPS/TLS)
- [ ] Secure data deletion

### API Security

**Files to Review:**
- `Cyrano/src/http-bridge.ts`
- `Cyrano/src/tools/` - All tool implementations

**Checklist:**
- [ ] CORS configuration (restrictive, not `*`)
- [ ] Rate limiting implementation
- [ ] Input validation on all endpoints
- [ ] Error handling (no sensitive data in errors)
- [ ] API key storage (environment variables, not in code)
- [ ] Request size limits

### Environment & Configuration

**Files to Review:**
- `.env.example` (if exists)
- `.gitignore` (ensure `.env` is ignored)
- All configuration files

**Checklist:**
- [ ] No secrets in code
- [ ] `.env` files in `.gitignore`
- [ ] Secure default configurations
- [ ] Production vs development configuration separation

---

## Part 4: Security Headers Configuration

### Required Headers

Add to `Cyrano/src/http-bridge.ts`:

```typescript
// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### CORS Configuration

Review and update CORS settings in `Cyrano/src/http-bridge.ts`:

```typescript
// Restrictive CORS (update with actual frontend URLs)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## Part 5: Reporting

### Security Review Report Template

1. **Executive Summary**
   - Overview of review
   - Total vulnerabilities found
   - Risk assessment

2. **Snyk Findings**
   - Dependency vulnerabilities
   - CVEs identified
   - Remediation recommendations

3. **OWASP ZAP Findings**
   - High risk issues
   - Medium risk issues
   - Low risk issues
   - Informational findings

4. **Manual Review Findings**
   - Authentication/authorization issues
   - Data security issues
   - API security issues

5. **Remediation Plan**
   - Prioritized list of fixes
   - Timeline for fixes
   - Verification steps

6. **Appendices**
   - Full Snyk report
   - Full OWASP ZAP report
   - Configuration files reviewed

---

## Success Criteria

- [ ] All Critical and High severity vulnerabilities fixed
- [ ] No critical dependency vulnerabilities
- [ ] Authentication/authorization secure
- [ ] Data handling secure
- [ ] OWASP ZAP scan shows no critical issues
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] All findings documented

---

## Resources

- **Snyk Documentation:** https://docs.snyk.io
- **OWASP ZAP Documentation:** https://www.zaproxy.org/docs/
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Security Headers:** https://securityheaders.com

---

**Document Owner:** David W Towne / Cognisint LLC  
**Last Updated:** 2025-01-07


