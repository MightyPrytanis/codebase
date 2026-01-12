# OWASP ZAP Report Generation - Quick Guide

**TL;DR:** Report → Generate Report → HTML → Save to `docs/security/reports/owasp-zap/`

---

## Generate a Single Report

### Step 1: Generate Report
1. **Menu Bar:** Click **"Report"** (top menu)
2. **Select:** **"Generate Report"**

### Step 2: Configure Report
- **Report Title:** "LexFiat Security Scan - [Date]" (or "Arkiver Security Scan")
- **Template:** **HTML** (easiest to read)
- **Include:** 
  - ✅ All alerts (or filter by risk: High + Medium)
  - ✅ All sections
- **Sections:** Leave all checked

### Step 3: Save Report
- **Location:** `docs/security/reports/owasp-zap/`
- **Filename:** `lexfiat-zap-report-[YYYY-MM-DD].html` (or `arkiver-zap-report-[YYYY-MM-DD].html`)
- Click **"Generate"**

---

## Consolidate Multiple Scans into One Report

If you scanned both LexFiat and Arkiver separately:

### Option 1: Scan Both in One Session
1. **Before scanning:** Right-click "Sites" → "Include in Context" → Add both URLs
2. Run scans on both
3. Generate one report covering both

### Option 2: Merge Reports Manually
1. Generate report from LexFiat scan
2. Generate report from Arkiver scan  
3. Open both HTML files
4. Copy/paste findings into a single document

### Option 3: Export to JSON and Merge
1. Generate reports as **JSON** format
2. Use a script to merge JSON files
3. Convert merged JSON to HTML

---

## Quick Export (Alternative)

If the menu is confusing:

1. **Right-click** on the site in the "Sites" tree (left sidebar)
2. Look for **"Export"** or **"Report"** option
3. Select format (HTML recommended)

---

## Report Location

All reports should be saved to:
```
docs/security/reports/owasp-zap/
```

---

## What to Do With the Report

1. **Review HIGH and MEDIUM alerts** - These are the important ones
2. **Ignore LOW and Informational** - Usually not critical
3. **Fix critical issues** - XSS, injection, auth bypass, etc.
4. **Re-scan after fixes** - Verify issues are resolved
5. **Update** `SECURITY_REVIEW_SUMMARY.md` with findings

---

## Common Findings (Don't Panic)

**Expected/Informational:**
- Missing security headers (CSP, HSTS) - Expected in dev
- Cookie without Secure flag - Expected if not HTTPS
- X-Powered-By header - We already fixed this

**Actually Important:**
- XSS vulnerabilities - Fix these
- SQL injection - Fix these  
- Authentication bypass - Fix these
- Sensitive data exposure - Fix these

---

## If ZAP Crashes or Freezes

1. **Save your session:** File → Save Session (so you don't lose progress)
2. **Restart ZAP** and load the saved session
3. **Generate report** from saved session

---

## Pro Tip

**Export to JSON** for easier processing:
- Report → Generate Report → **JSON** format
- Can be parsed/analyzed programmatically
- Easier to filter and sort findings


)
)
)
)
)
)
)
)
)
)
)