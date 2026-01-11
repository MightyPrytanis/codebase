# Snyk Security Report - Cyrano MCP Server

**Date:** 2025-12-07  
**Organization:** mightyprytanis  
**Package Manager:** npm  
**Target File:** package-lock.json  
**Project Name:** cyrano-mcp-server  
**Project Path:** /Users/davidtowne/Desktop/Coding/codebase/Cyrano  
**Open Source:** no  
**Licenses:** enabled

---

## Summary

- **Dependencies Tested:** 362 (after fixes)
- **Issues Found:** 0 ✅ **FIXED**
- **Vulnerable Paths:** 0 ✅ **FIXED**

**Status:** ✅ **All vulnerabilities resolved**

---

## Issues to Fix by Upgrading

### Issue 1: @modelcontextprotocol/sdk

**Severity:** High  
**Vulnerability:** Insecure Default Initialization of Resource  
**CVE/SNYK ID:** [SNYK-JS-MODELCONTEXTPROTOCOLSDK-14171914](https://security.snyk.io/vuln/SNYK-JS-MODELCONTEXTPROTOCOLSDK-14171914)

**Current Version:** @modelcontextprotocol/sdk@0.5.0  
**Recommended Upgrade:** @modelcontextprotocol/sdk@1.24.0

**Status:** New vulnerability  
**Introduced by:** @modelcontextprotocol/sdk@0.5.0

**Action Required:** Upgrade to version 1.24.0

---

## Issues with No Direct Upgrade or Patch

### Issue 2: jws (via jsonwebtoken)

**Severity:** High  
**Vulnerability:** Improper Verification of Cryptographic Signature  
**CVE/SNYK ID:** [SNYK-JS-JWS-14188253](https://security.snyk.io/vuln/SNYK-JS-JWS-14188253)

**Current Version:** jws@3.2.2  
**Fixed Versions:** 3.2.3, 4.0.1

**Dependency Chain:**
- jsonwebtoken@9.0.2 > jws@3.2.2

**Action Required:** 
- Upgrade jsonwebtoken to a version that uses jws@3.2.3 or jws@4.0.1
- Or update jsonwebtoken to latest version that includes fixed jws dependency

---

## Fixes Applied

### ✅ Issue 1: @modelcontextprotocol/sdk - RESOLVED
- **Upgraded:** @modelcontextprotocol/sdk@0.5.0 → @modelcontextprotocol/sdk@1.24.0
- **Date Fixed:** 2025-12-07
- **Status:** ✅ Resolved

### ✅ Issue 2: jws (via jsonwebtoken) - RESOLVED
- **Upgraded:** jsonwebtoken@9.0.2 → jsonwebtoken@9.0.3
- **Result:** Now uses jws@4.0.1 (fixed version)
- **Date Fixed:** 2025-12-07
- **Status:** ✅ Resolved

---

## Verification

**Re-scan Results (2025-12-07):**
- ✅ Tested 362 dependencies for known issues
- ✅ No vulnerable paths found
- ✅ All security issues resolved

---

## Recommendations

1. ✅ **Completed:** Upgraded @modelcontextprotocol/sdk to 1.24.0
2. ✅ **Completed:** Upgraded jsonwebtoken to resolve jws vulnerability
3. **Ongoing:** Set up continuous monitoring with `snyk monitor`
4. **Ongoing:** Integrate Snyk testing into CI/CD pipeline
5. **Note:** Snyk detected multiple supported manifests - consider using `--all-projects` flag to scan all projects at once

---

## Next Steps

- ✅ All vulnerabilities fixed and verified
- Set up continuous monitoring with `snyk monitor`
- Integrate Snyk testing into CI/CD pipeline
- Regular security scanning schedule


)
)