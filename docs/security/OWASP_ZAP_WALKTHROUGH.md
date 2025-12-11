# OWASP ZAP Walkthrough - Verified Instructions

**Last Verified:** 2025-12-07  
**ZAP Version:** 2.14.0+ (current stable)

---

## Prerequisites

1. **Applications Running:**
   - LexFiat: `http://localhost:5173` (dev server)
   - Arkiver: `http://localhost:5174` (dev server)
   - Cyrano API: `http://localhost:5001` (if testing API)

2. **ZAP Installed:**
   - Download from: https://www.zaproxy.org/download/
   - macOS: Download `.dmg` or use Homebrew: `brew install --cask owasp-zap`
   - If Gatekeeper blocks: `xattr -d com.apple.quarantine /Applications/OWASP\ ZAP.app`

---

## Step 1: Launch ZAP

1. **Open OWASP ZAP**
   - Find "OWASP ZAP" in Applications (macOS) or Start Menu (Windows)
   - Double-click to launch

2. **Initial Dialog - Session Persistence**
   - **Choose:** "I want to persist this session" ✅
   - **Session Name:** `lexfiat-security-scan` (or your choice)
   - **Location:** Default is fine
   - Click **"Start"**

3. **Welcome Screen**
   - You'll see the main ZAP interface
   - **Top tabs:** Quick Start | Manual Explore | Automation Framework | API
   - **Left sidebar:** Sites tree (empty initially)
   - **Bottom:** Alerts, History, etc.

---

## Step 2: Quick Start Scan (Easiest Method)

### Method A: Quick Start Tab (Recommended)

1. **Click "Quick Start" tab** (top of window)

2. **You'll see three large buttons:**
   - **Left:** "Automated Scan" (green circle with lightning bolt) ⚡
   - **Middle:** "Manual Explore" (browser icon)
   - **Right:** "Learn More"

3. **Click "Automated Scan"** (left button, green circle)

4. **Enter Target URL:**
   - **For LexFiat:** `http://localhost:5173`
   - **For Arkiver:** `http://localhost:5174`
   - **For Cyrano API:** `http://localhost:5001`

5. **Click "Attack"** button (green button at bottom)

6. **Scan Progress:**
   - You'll see progress in the bottom panel
   - "Spider" runs first (crawling/discovering pages)
   - Then "Active Scan" runs (testing for vulnerabilities)
   - This takes 5-15 minutes depending on app size

---

## Step 3: Alternative - Manual Scan Setup

If Quick Start doesn't work, use this method:

### Method B: Manual Scan

1. **Enter URL in Address Bar:**
   - Top of ZAP window, enter: `http://localhost:5173`
   - Press Enter

2. **Right-click URL in Sites Tree:**
   - Left sidebar, you'll see `http://localhost:5173` appear
   - Right-click on it

3. **Select "Attack" → "Spider"**
   - This crawls/discover pages
   - Wait for it to complete (shows progress in bottom panel)

4. **After Spider Completes:**
   - Right-click URL again
   - Select "Attack" → "Active Scan"
   - This tests for vulnerabilities
   - Wait for completion

---

## Step 4: View Results

### Alerts Tab

1. **Click "Alerts" tab** (bottom panel)

2. **Review by Risk Level:**
   - **🔴 High** - Critical issues (fix immediately)
   - **🟠 Medium** - Important issues (fix soon)
   - **🟡 Low** - Minor issues (consider fixing)
   - **🔵 Informational** - Info only (no action needed)

3. **Click any alert** to see details:
   - Description
   - Risk level
   - Affected URL
   - Evidence/Request/Response

### Common Findings to Expect:

**Informational (Expected):**
- Missing security headers (CSP, HSTS, etc.)
- Cookie without Secure flag (if not HTTPS)
- X-Powered-By header (we fixed this, but ZAP may still flag)

**Low/Medium (Review):**
- CORS configuration
- Missing security headers
- Session management issues

**High (Fix Immediately):**
- XSS vulnerabilities
- SQL injection
- Authentication bypass
- Sensitive data exposure

---

## Step 5: Generate Report

1. **Menu Bar:** Click **"Report"** → **"Generate Report"**

2. **Report Options:**
   - **Report Title:** "LexFiat Security Scan - [Date]"
   - **Template:** HTML (recommended) or JSON/XML
   - **Include:** All alerts (or filter by risk level)
   - **Sections:** All sections

3. **Save Report:**
   - **Location:** `docs/security/reports/owasp-zap/`
   - **Filename:** `lexfiat-zap-report-[YYYY-MM-DD].html`
   - Click **"Generate"**

---

## Step 6: Scan All Applications

Repeat Steps 2-5 for each application:

### LexFiat
- URL: `http://localhost:5173`
- Report: `lexfiat-zap-report-[date].html`

### Arkiver
- URL: `http://localhost:5174`
- Report: `arkiver-zap-report-[date].html`

### Cyrano API (Optional)
- URL: `http://localhost:5001`
- Report: `cyrano-api-zap-report-[date].html`
- **Note:** May need authentication configured

---

## Troubleshooting

### ZAP Won't Start (macOS Gatekeeper)

```bash
# Find exact path
ls -la /Applications/ | grep -i zap

# Remove quarantine attribute (replace with actual path)
xattr -d com.apple.quarantine "/Applications/OWASP ZAP.app"
```

### Can't Connect to Localhost

1. **Verify app is running:**
   ```bash
   # Check if port is listening
   lsof -i :5173  # LexFiat
   lsof -i :5174  # Arkiver
   lsof -i :5001  # Cyrano
   ```

2. **Check firewall:** macOS may block connections
   - System Settings → Network → Firewall
   - Allow ZAP if prompted

### Scan Takes Too Long

- **For SPAs:** Use AJAX Spider (handles JavaScript better)
- **Reduce scope:** Create context with only specific URLs
- **Lower scan strength:** Use "Low" instead of "Medium"

### No Alerts Found

- **Check Alerts tab:** May be filtered
- **Verify scan completed:** Check bottom panel for "Complete"
- **Try Full Scan:** More thorough but slower

---

## Advanced: AJAX Spider (For SPAs)

For React/Vite apps, AJAX Spider works better:

1. **Right-click URL** in Sites tree
2. **Select "Attack" → "AJAX Spider"**
3. **Configure:**
   - Max Duration: 10 minutes
   - Max Crawl Depth: 10
4. **Click "Start Scan"**
5. **After AJAX Spider completes:** Run Active Scan

---

## Advanced: Context Configuration

For more targeted scans:

1. **Right-click "Contexts"** (left sidebar)
2. **New Context** → Name: "LexFiat"
3. **Add URLs:** `http://localhost:5173/*`
4. **Configure:**
   - Authentication (if needed)
   - Spider settings
   - Active scan policy
5. **Set as Active Context:** Right-click → "Set as Active"

---

## Command Line Alternative

If GUI isn't working, use Docker:

```bash
# Baseline scan (faster, less thorough)
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:5173 \
  -J zap-report.json \
  -r zap-report.html

# Full scan (slower, more thorough)
docker run -t owasp/zap2docker-stable zap-full-scan.py \
  -t http://localhost:5173 \
  -J zap-report.json \
  -r zap-report.html
```

---

## Next Steps After Scanning

1. **Review all HIGH and MEDIUM alerts**
2. **Fix critical vulnerabilities**
3. **Re-run scan** to verify fixes
4. **Save reports** to `docs/security/reports/owasp-zap/`
5. **Update** `SECURITY_REVIEW_SUMMARY.md` with findings

---

## Quick Reference

| Application | URL | Type | Scan Method |
|------------|-----|------|-------------|
| LexFiat | `http://localhost:5173` | SPA | Quick Start or AJAX Spider |
| Arkiver | `http://localhost:5174` | SPA | Quick Start or AJAX Spider |
| Cyrano API | `http://localhost:5001` | REST API | Quick Start or Manual |

**Scan Time Estimates:**
- Quick Start: 5-10 minutes
- Full Scan: 15-30 minutes
- AJAX Spider + Active Scan: 10-20 minutes

---

## Questions?

- **ZAP Documentation:** https://www.zaproxy.org/docs/
- **ZAP User Guide:** https://www.zaproxy.org/docs/desktop/
- **Report Issues:** Check ZAP logs in Help → Show Log File




