# Security Patch: ReDoS Vulnerability in @modelcontextprotocol/sdk

## Overview
This patch fixes a Regular Expression Denial of Service (ReDoS) vulnerability in the `UriTemplate` class of the Model Context Protocol TypeScript SDK.

## Vulnerability Details

**Affected Package:** `@modelcontextprotocol/sdk` version 1.25.1  
**Affected File:** `dist/esm/shared/uriTemplate.js` and `dist/cjs/shared/uriTemplate.js`  
**Affected Function:** `partToRegExp()`  
**Severity:** High (Potential Denial of Service)

### Technical Description
The vulnerable regular expression pattern `([^/]+(?:,[^/]+)*)` used for RFC 6570 URI Template exploded array patterns can cause catastrophic backtracking when processing specially crafted input strings. This occurs in two locations:

1. **Line 184 (ESM) / Line 187 (CJS):** Base exploded pattern
   - Vulnerable: `pattern = part.exploded ? '([^/]+(?:,[^/]+)*)' : '([^/,]+)';`
   - Fixed: `pattern = part.exploded ? '([^/,]+(?:,[^/,]+)*)' : '([^/,]+)';`

2. **Line 194 (ESM) / Line 197 (CJS):** Slash operator exploded pattern
   - Vulnerable: `pattern = '/' + (part.exploded ? '([^/]+(?:,[^/]+)*)' : '([^/,]+)');`
   - Fixed: `pattern = '/' + (part.exploded ? '([^/,]+(?:,[^/,]+)*)' : '([^/,]+)');`

### Root Cause
The original pattern `[^/]+` allows matching characters including commas, followed by an optional repetition of comma-separated segments. When the input contains patterns that partially match but ultimately fail, the regex engine backtracks exponentially, trying different combinations of the two `+` quantifiers.

## Fix Applied

### Change Summary
Changed the regex pattern from `([^/]+(?:,[^/]+)*)` to `([^/,]+(?:,[^/,]+)*)`.

The fix adds a comma to the negated character class in the first part of the pattern: `[^/,]+` instead of `[^/]+`. This prevents catastrophic backtracking by ensuring:
- The initial segment cannot contain commas
- Subsequent comma-separated segments are clearly delimited
- The regex engine cannot try multiple overlapping match combinations

### Files Modified
- `node_modules/@modelcontextprotocol/sdk/dist/esm/shared/uriTemplate.js` (lines 184, 194)
- `node_modules/@modelcontextprotocol/sdk/dist/cjs/shared/uriTemplate.js` (lines 187, 197)

## Testing

### Test Coverage
Comprehensive tests have been added in `tests/security/redos-uri-template.test.ts` covering:

1. **Normal functionality:** Verify correct matching and expansion of exploded arrays
2. **ReDoS prevention:** Test with malicious payloads designed to trigger catastrophic backtracking
3. **Performance benchmarks:** Ensure linear (not exponential) time complexity
4. **Edge cases:** Handle various malformed or unusual inputs gracefully

### Test Results
All 15 security tests pass successfully:
- Normal exploded array patterns execute in < 100ms
- Malicious ReDoS payloads execute in < 1000ms
- Performance scales linearly with input size
- Pattern matching correctness is maintained

### Running Tests
```bash
npm run test:unit -- tests/security/redos-uri-template.test.ts
```

## Patch Application

This patch is automatically applied during `npm install` via the `patch-package` tool.

### Setup
1. The `postinstall` script in `package.json` runs `patch-package` after dependencies are installed
2. The patch file at `patches/@modelcontextprotocol+sdk+1.25.1.patch` contains the modifications
3. `patch-package` is installed as a dev dependency

### Manual Application
To manually apply the patch:
```bash
npm run postinstall
```

To regenerate the patch after making changes:
```bash
npx patch-package @modelcontextprotocol/sdk
```

## Impact Assessment

### Security Impact
- **Before:** System vulnerable to CPU exhaustion via malicious URI template patterns
- **After:** ReDoS attack vector eliminated; system handles malicious input gracefully

### Functional Impact
- **Breaking Changes:** None
- **Behavior Changes:** Pattern matching semantics remain identical for valid RFC 6570 URI templates
- **Performance:** Slight improvement due to more efficient regex pattern

### Compatibility
- Fully compatible with existing code using the MCP SDK
- No changes required to application code
- All existing tests continue to pass

## Upstream Status

This is a local patch applied to the Cyrano codebase. Consider:
1. Reporting this vulnerability to the MCP SDK maintainers
2. Contributing the fix upstream
3. Monitoring for an official release with the fix

### Reporting to Upstream
```bash
npx patch-package @modelcontextprotocol/sdk --create-issue
```

## References

- **RFC 6570:** URI Template specification
- **ReDoS:** Regular Expression Denial of Service
- **MCP SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **Patch Package:** https://github.com/ds300/patch-package

## Maintenance

### When to Update
- Monitor for official MCP SDK releases that fix this vulnerability
- Test and potentially remove this patch when an official fix is available
- Keep the patch file in version control for reproducibility

### Version History
- **v1.0.0** (2026-01-07): Initial patch creation for SDK version 1.25.1
  - Fixed exploded array pattern ReDoS vulnerability
  - Added comprehensive security tests
  - Established automated patch application

---

**Last Updated:** 2026-01-07  
**Patch Maintainer:** Cyrano Security Team  
**Status:** Active
