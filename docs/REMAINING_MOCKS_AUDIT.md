# Remaining Mocks Audit - Inquisitor Readiness

**Date:** 2025-12-28  
**Status:** ⚠️ **3 CRITICAL VIOLATIONS FOUND**

---

## Executive Summary

**Total Remaining Mocks:** 3 violations  
**Test Mocks:** ✅ **NONE** (all removed per COMPLETE_MOCK_REMOVAL_SUMMARY.md)  
**Production Code Mocks:** ❌ **3 violations**  
**Demo Mode Compliance:** ✅ **Clio integration is compliant** (opt-in only)

---

## Critical Violations

### 1. ❌ `workflow-status.ts` - Random Mock Data

**Location:** `Cyrano/src/tools/workflow-status.ts`  
**Lines:** 34-45  
**Violation:** Returns random mock counts without checking demo mode

```typescript
// For demo purposes, return mock counts
const incomingRespond = Math.floor(Math.random() * 5);
const incomingReviewForResponse = Math.floor(Math.random() * 3);
// ... more random mocks
```

**Issue:** Tool returns fake random data without:
- Checking `isDemoModeEnabled()`
- Returning errors when data unavailable
- Indicating data is mock/demo

**Impact:** HIGH - Core workflow status tool returns fake data in production

**Fix Required:**
- Query real audit logs/database
- Return errors if data unavailable
- Only use mock data if `DEMO_MODE=true` explicitly set

---

### 2. ❌ `priority-alerts-row.tsx` - Hardcoded Mock Fallback

**Location:** `apps/lexfiat/client/src/components/dashboard/priority-alerts-row.tsx`  
**Lines:** 149-188  
**Violation:** Returns hardcoded mock data when no alerts found

```typescript
// Fallback mock deadline
if (alerts.length === 0) {
  alerts.push({
    id: 'deadline-1',
    type: 'deadline',
    priority: 'critical',
    client: 'Johnson',
    matter: 'Johnson v Johnson',
    // ... hardcoded mock data
  });
}

// If no alerts, return mock data
if (alerts.length === 0) {
  return [
    { id: 'alert-1', ... }, // Hardcoded mock
    { id: 'alert-2', ... }, // Hardcoded mock
  ];
}
```

**Issue:** Component returns fake alerts instead of:
- Empty array when no alerts
- Error state when fetch fails
- Demo mode check

**Impact:** HIGH - Dashboard shows fake alerts to users

**Fix Required:**
- Return empty array when no alerts
- Show error state when fetch fails
- Only show mock data if explicitly in demo mode

---

### 3. ⚠️ `simple-http-bridge.ts` - Mock Responses

**Location:** `Cyrano/src/simple-http-bridge.ts`  
**Lines:** 84-111  
**Violation:** Returns mock responses for tools

**Issue:** This appears to be a test/development bridge, but still contains mocks

**Impact:** MEDIUM - May be used in development, but should not be in production

**Fix Required:**
- Verify if this is production code or test-only
- If production: Remove mocks, use real tool implementations
- If test-only: Move to test directory or clearly mark as test utility

---

## ✅ Compliant Implementations

### Clio Integration (`clio-integration.ts`)

**Status:** ✅ **COMPLIANT**  
**Implementation:** Correctly checks `isDemoModeEnabled()` before returning mock data

```typescript
if (isDemoModeEnabled()) {
  return this.getDemoMatterInfo(matterId);
}

if (!this.clioApiKey) {
  return this.createErrorResult(this.getClioApiKeyError());
}
```

**Behavior:**
- Returns errors when API key missing (unless `DEMO_MODE=true`)
- Only uses mock data when explicitly opted-in
- Follows policy: "Missing credentials should return errors or N/A status, not mock data"

---

## Test Mocks Status

**Status:** ✅ **ALL REMOVED**  
**Reference:** `docs/COMPLETE_MOCK_REMOVAL_SUMMARY.md`

All test mocks have been removed. Tests now use:
- Real implementations
- Real error handling
- Real credential validation

---

## Inquisitor Readiness Assessment

### ❌ **NOT READY** - 3 Critical Violations

**Blockers:**
1. `workflow-status.ts` returns random fake data
2. `priority-alerts-row.tsx` returns hardcoded fake alerts
3. `simple-http-bridge.ts` has mock responses (needs verification if production)

**Required Actions Before Inquisitor:**
1. Fix `workflow-status.ts` to query real data or return errors
2. Fix `priority-alerts-row.tsx` to return empty array, not mock data
3. Verify `simple-http-bridge.ts` status (production vs test-only)

**Estimated Fix Time:** 1-2 hours

---

## Recommendations

1. **Immediate:** Fix the 3 violations above
2. **Verification:** Run full codebase search for "mock", "Mock", "MOCK" after fixes
3. **Policy Enforcement:** Add pre-commit hook to detect mock data fallbacks
4. **Documentation:** Update policy to explicitly forbid mock fallbacks in production code

---

## Policy Compliance

**Current Policy (from `demo-mode.ts`):**
> "Missing credentials should return errors or N/A status, not mock data."

**Violations:**
- ❌ `workflow-status.ts` - Returns mock data without demo mode check
- ❌ `priority-alerts-row.tsx` - Returns mock data without demo mode check
- ⚠️ `simple-http-bridge.ts` - Needs verification

**Compliant:**
- ✅ `clio-integration.ts` - Only uses mocks when `DEMO_MODE=true` explicitly set
