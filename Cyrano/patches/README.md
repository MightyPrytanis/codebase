# Security Patches Directory

## Status: No Active Patches

This directory previously contained a security patch for `@modelcontextprotocol/sdk` v1.25.1 that
fixed a ReDoS (Regular Expression Denial of Service) vulnerability in the `UriTemplate` class
(`partToRegExp()` function). The vulnerable regex pattern `([^/]+(?:,[^/]+)*)` was replaced with
`([^/,]+(?:,[^/,]+)*)` to prevent catastrophic backtracking.

**This patch was retired in Phase 2 of the cursor/general-codebase-debugging-18e6 integration
(2026-03-15)** because the fix was merged upstream by the MCP SDK maintainers in version 1.25.2.
Cyrano's `package.json` now specifies `^1.26.0`, so the patch-applied version (1.25.1) is no
longer installed and the patch would fail version-mismatch checks.

### What replaced the patch

- The `@modelcontextprotocol/sdk` dependency was bumped to `^1.26.0` (resolved: 1.26.0), which
  includes the ReDoS fix natively.
- The `patch-package` dev-dependency and `postinstall` hook were removed from `package.json`
  since there are no active patches to apply.
- The security regression test (`tests/security/redos-uri-template.test.ts`) is **retained** as a
  regression guard — it verifies the SDK's `UriTemplate` is not vulnerable to catastrophic
  backtracking, regardless of which mechanism delivered the fix.

### If a future patch is needed

1. Install `patch-package` as a dev-dependency.
2. Add `"postinstall": "patch-package"` to the `scripts` section of `package.json`.
3. Create your patch: `npx patch-package <package-name>`
4. Commit the resulting `.patch` file to this directory.
5. Update this README.

---

**Last Updated:** 2026-03-15
**Patch removed:** `@modelcontextprotocol+sdk+1.25.1.patch`
**Reason:** Fix upstreamed in SDK v1.25.2; current version is v1.26.0
