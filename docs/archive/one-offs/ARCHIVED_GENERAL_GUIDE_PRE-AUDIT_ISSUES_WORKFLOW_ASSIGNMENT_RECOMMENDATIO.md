---
⚠️ ARCHIVED DOCUMENT - INACTIVE

This document has been archived as a one-off/historical record.
For current project status, see: docs/PROJECT_CHANGE_LOG.md
Archived: 2025-11-28
---

---
Document ID: AUDIT-ISSUES-WORKFLOW-ASSIGNMENT
Title: Pre-Audit Issues: Workflow Assignment Recommendation
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-25 (2025-W48)
Last Substantive Revision: 2025-11-25 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Date:** 2025-11-25  
**Reviewer:** Managing Agent  
**Decision:** Workflow Assignment

---

## NOTE: This document introduces the terms "Managing Agent," "Primary Agent," "Special Agent" and "Independent Agent."

- **Managing Agent:** The agent that manages the project master plan/to-do list, implements and enforces project rules, orchestrates workflows, monitors and reports on progress, identifies and resolves blocks, makes adjustments and changes as needed with user approval.  Typically has the most user interactions.
- **Primary Agent:** The agent carrying out the primary project coding or other workflow. The project may not require separate primary and managing agents, so these titles may be functionally synonymous in some projects.
- **Special Agent:** An agent with a specific project portfolio.  When the work in the portfolio is done, the agent may be reassigned or shut down.
- **Independent Agent:** A third-party assistant or agent, brought in for specific process(es), workflow(s), objective(s) or duration.

## Executive Summary

**Recommendation:** **Integrate fixes into primary agent workflow** rather than having special agent fix independently.

**Rationale:**
1. Most issues align with **Step 9: Comprehensive Refactoring** scope
2. Some quick fixes can be done immediately as part of ongoing work
3. Maintains workflow continuity and avoids duplicate effort
4. Ensures fixes are properly tested and integrated

---

## Issue Categorization

### ✅ Already Fixed by User
- **#3:** Duplicate requirement in legal-reviewer.ts ✅
- **#4:** Provider fallback logic ✅

### 🔧 Quick Fixes (Do Now - Part of Ongoing Work)
**Estimated Time:** 1-2 hours  
**Can be done immediately without blocking other work**

1. **#1:** Placeholder accuracy score - Document as estimation or implement basic logic
2. **#11:** Legal comparator placeholder - Verify if needed, implement or remove
3. **#14:** Error message sanitization - Add basic sanitization helper

**Action:** Primary agent can fix these during current session.

---

### 📋 Step 9: Comprehensive Refactoring (Weeks 9-10)
**Estimated Time:** 15-20 hours (as planned)  
**These issues are exactly what Step 9 is designed to address**

#### High Priority for Step 9:
1. **#5, #6, #7:** Artifact Collectors (Document, Email, Calendar)
   - Core Chronometric functionality
   - Currently placeholders
   - **Note:** These are already part of Step 1.2 (Chronometric module), but placeholders remain
   - **Recommendation:** Complete in Step 9 as part of "Refactor tool implementations"

2. **#8:** Gap Identifier Clio API integration
   - Part of Chronometric module
   - Needs Clio API implementation
   - **Recommendation:** Complete in Step 9

#### Medium Priority for Step 9:
3. **#9:** Source Verifier HTTP request
   - Verification tool enhancement
   - **Recommendation:** Complete in Step 9

4. **#10:** Claim Extractor database loading
   - Database integration
   - **Recommendation:** Complete in Step 9

5. **#12:** PDF OCR implementation
   - Arkiver module enhancement
   - **Recommendation:** Complete in Step 9 as part of "Refactor module implementations"

#### Low Priority for Step 9:
6. **#2:** Practice area documentation
   - Documentation update
   - **Recommendation:** Part of Step 10 (Document Sweep) or Step 9

---

## Recommended Workflow Integration

### Immediate Actions (Current Session)
**Primary Agent:**
1. ✅ Fix #1: Placeholder accuracy score - IMPLEMENTED (legal-reviewer.ts)
2. ✅ Fix #11: Legal comparator placeholder - IMPLEMENTED (legal-comparator.ts)
3. ✅ Fix #14: Error message sanitization - IMPLEMENTED (error-sanitizer.ts utility)
4. ✅ Document remaining issues in Step 9 task list - COMPLETE
5. Continue with current priority: Step 4 (Arkiver), Step 6, etc.

### Step 9 Integration
**Add to Step 9 task list:**

```markdown
### Step 9.1: Fix Placeholder Implementations
- [ ] #5: Document Artifact Collector - Implement actual collection
- [ ] #6: Email Artifact Collector - Implement actual collection  
- [ ] #7: Calendar Artifact Collector - Implement actual collection
- [ ] #8: Gap Identifier Clio API - Implement Clio integration
- [ ] #9: Source Verifier HTTP - Implement HTTP requests
- [ ] #10: Claim Extractor DB - Implement database loading
- [ ] #12: PDF OCR - Implement OCR pipeline

### Step 9.2: Documentation Updates
- [ ] #2: Document practice area support matrix
- [ ] Update tool definitions to indicate placeholder vs. implemented features
```

---

## Why Not Special Agent Fix Now?

### ❌ Reasons Against Special Agent Fixing Now:
1. **Workflow Disruption:** Step 9 is specifically designed for this work
2. **Testing Coordination:** Fixes need integration testing with ongoing work
3. **Priority Alignment:** Current focus is Step 4-8, refactoring comes later
4. **Resource Efficiency:** Better to batch similar work in Step 9
5. **Quality Assurance:** Step 9 includes comprehensive testing phase

### ✅ Reasons for Primary Agent Quick Fixes:
1. **Non-Blocking:** Quick fixes don't disrupt current workflow
2. **Immediate Value:** Simple improvements provide instant benefit
3. **Low Risk:** Small changes, easy to verify
4. **Momentum:** Keeps development moving forward

---

## Action Plan

### Phase 1: Immediate (Current Session)
**Primary Agent:**
1. ✅ Fix #1: Placeholder accuracy score (document or implement)
2. ✅ Fix #11: Legal comparator placeholder (verify and fix/remove)
3. ✅ Fix #14: Error message sanitization (add helper function)
4. ✅ Update Step 9 task list with remaining issues

**Time:** 1-2 hours

### Phase 2: Step 9 (Weeks 9-10)
**Primary Agent (during Step 9):**
1. Implement artifact collectors (#5, #6, #7)
2. Complete integration placeholders (#8, #9, #10)
3. Implement PDF OCR (#12)
4. Update documentation (#2)

**Time:** 15-20 hours (as planned for Step 9)

---

## Special Agent Role

**Special Agent should:**
- ✅ Continue auditing and identifying issues
- ✅ Document issues clearly (as done)
- ❌ NOT start fixing issues independently
- ✅ Provide detailed reports for primary agent workflow integration

**Value:** Special agent's audit work is excellent and provides clear roadmap for Step 9.

---

## Summary

**Decision:** **Integrate fixes into primary agent workflow**

**Immediate Actions:**
- Primary agent fixes 3 quick issues now (1-2 hours)
- Remaining issues added to Step 9 task list

**Step 9 Enhancement:**
- Step 9 scope already covers these issues
- Add specific checklist items from pre-audit report
- Estimated time remains 15-20 hours (issues fit within scope)

**Benefits:**
- Maintains workflow continuity
- Avoids duplicate effort
- Ensures proper testing integration
- Keeps focus on current priorities (Steps 4-8)

---

**Recommendation Status:** ✅ APPROVED FOR IMPLEMENTATION  
**Next Action:** Primary agent proceeds with quick fixes, documents remaining for Step 9

