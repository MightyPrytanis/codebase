# Broken Tools Archive

This directory contains tools that have been archived due to fundamental design flaws or defects.

## status-indicator

**Archived:** 2025-12-08  
**Status:** ⚠️ BROKEN - Fundamentally defective design

### Why Archived

The `status-indicator` tool was archived due to multiple fundamental design flaws:

1. **Inaccurate Information**: Despite claiming to be "based on actual codebase scanning," the tool provides wildly inaccurate status information
2. **Brittle Heuristics**: Many checks are hardcoded or use fragile heuristics that break easily
3. **No Verification**: There's no way to verify the accuracy of the tool's assessments
4. **Inconsistent Logic**: Different steps use wildly different approaches - some check files thoroughly, others are hardcoded placeholders
5. **Fragile Path Resolution**: The `PROJECT_ROOT` assumptions break easily depending on how the code is run
6. **Misleading Evidence**: The "evidence" system gives false confidence by listing things that may not actually indicate completion

### Files Archived

- `status-indicator.ts.original` - Original tool implementation
- `status-indicator.ts` - Archive marker with explanation
- `status-updater.ts` - Script that used the tool

### References Removed From

- `Cyrano/src/http-bridge.ts` - Import, tool definition, and execution handlers removed
- `Cyrano/src/mcp-server.ts` - Import, tool definition, and execution handlers removed  
- `Cyrano/test-all-tools.ts` - Test entry commented out

### Decision

The tool is not worth fixing. It would require a complete redesign to be reliable, and the effort is not justified given the fundamental flaws in its approach.



