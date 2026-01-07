# User Warning Requirements

**Date:** 2025-12-28  
**Status:** Active  
**Purpose:** Define all required warnings for AI-generated content in the Cyrano system

---

## Overview

All AI-generated content in the Cyrano system must include explicit warnings that attorney review is required. This document defines the standard warning text, where warnings must appear, and compliance requirements.

---

## Standard Warning Text

### Primary Attorney Review Warning

**Text:**
```
⚠️ ATTORNEY REVIEW REQUIRED: This AI-generated content has not been reviewed by a licensed attorney. All legal documents, calculations, and research results must be reviewed and verified by a qualified attorney before use. The system and its developers disclaim all liability for any errors, omissions, or inaccuracies in AI-generated content.
```

**Usage:** This warning must appear on all AI-generated content, including:
- Legal documents (motions, briefs, pleadings, contracts)
- Legal research results
- Tax and financial forecasts
- QDRO/EDRO calculations
- Child support calculations
- Any other AI-generated legal content

---

## Warning Placement Requirements

### 1. UI Components

**Frontend Components:**
- `apps/lexfiat/client/src/components/warnings/AttorneyReviewWarning.tsx` - Reusable warning component
- `apps/lexfiat/client/src/components/warnings/ComplianceWarning.tsx` - Compliance-specific warnings

**Required Locations:**
- Document generation outputs
- Legal research results display
- Forecast calculation results
- Drafted document previews
- All AI-generated content displays

### 2. API Responses

**BaseEngine Metadata:**
- All AI-generated content from `BaseEngine.executeStep()` includes warnings in metadata
- `metadata.attorneyReviewRequired: true`
- `metadata.standardWarning: <warning text>`
- `metadata.warnings: <array of all warnings>`

**Tool Responses:**
- All tools extending `BaseTool` automatically include warnings in `createSuccessResult()`
- Warnings included in `metadata.warnings` array
- `metadata.attorneyReviewRequired: true`

### 3. Workflow Results

**Workflow Metadata:**
- All workflow execution results include warnings
- MCR compliance warnings (if violations detected)
- MRPC compliance warnings (if issues detected)
- Standard attorney review warning (always)

---

## Content Types Requiring Warnings

### Legal Documents
- **Type:** Motions, briefs, pleadings, contracts, orders
- **Warning:** Standard attorney review warning + MCR compliance warnings (if applicable)
- **Location:** Document preview, document metadata, workflow results

### Legal Research
- **Type:** Case law research, statutory research, legal analysis
- **Warning:** Standard attorney review warning
- **Location:** Research results display, search results

### Financial Forecasts
- **Type:** Tax return forecasts, QDRO forecasts, child support forecasts
- **Warning:** Standard attorney review warning + calculation accuracy disclaimer
- **Location:** Forecast results, PDF outputs, workflow results

### Document Analysis
- **Type:** Contract analysis, document comparison, redaction results
- **Warning:** Standard attorney review warning
- **Location:** Analysis results, comparison reports

### Drafted Content
- **Type:** Email drafts, letter drafts, any AI-generated text
- **Warning:** Standard attorney review warning
- **Location:** Draft preview, draft metadata

---

## Compliance Warnings

### MCR Compliance Warnings

**Format:**
```
[MCR <rule>] <description> - <recommendation>
```

**Examples:**
- `[MCR 2.113] Document missing required caption with case name and number - Fix: Add caption with case name and case number at the top of the document`
- `[MCR 1.109] E-filing requires PDF format - Fix: Convert document to PDF format before e-filing`

**Location:** Included in workflow results when MCR validation detects issues

### MRPC Compliance Warnings

**Format:**
```
MRPC <rule number> (<rule name>): <compliance status> - <reasoning>
```

**Examples:**
- `MRPC 5.3 (Supervision of Nonlawyer Assistants): ambiguous - Review should be required`
- `MRPC 1.1 (Competence): compliant - AI assistance properly supervised`

**Location:** Included in workflow results when MRPC validation detects issues

---

## Warning Compliance Checklist

### Pre-Beta Release Verification

- [ ] All AI-generated content includes standard attorney review warning
- [ ] Frontend components display warnings on all AI outputs
- [ ] API responses include warnings in metadata
- [ ] Workflow results include warnings
- [ ] MCR compliance warnings appear when violations detected
- [ ] MRPC compliance warnings appear when issues detected
- [ ] Footer banner includes updated warning text
- [ ] Warning components created and available for use
- [ ] BaseEngine includes warnings in all AI step results
- [ ] BaseTool includes warnings in all tool responses

### Testing Requirements

- [ ] Verify warnings appear on document generation outputs
- [ ] Verify warnings appear on legal research results
- [ ] Verify warnings appear on forecast calculations
- [ ] Verify warnings appear on drafted content
- [ ] Verify MCR warnings appear when violations detected
- [ ] Verify MRPC warnings appear when issues detected
- [ ] Verify warnings are visible and clear in UI
- [ ] Verify warnings are included in API responses

---

## Implementation Details

### BaseEngine Integration

**File:** `Cyrano/src/engines/base-engine.ts`

**Implementation:**
- Standard warning added to all AI step results
- Warnings included in `metadata.warnings` array
- `metadata.attorneyReviewRequired: true` always set for AI-generated content
- MCR and MRPC warnings merged into warnings array

### BaseTool Integration

**File:** `Cyrano/src/tools/base-tool.ts`

**Implementation:**
- `createSuccessResult()` automatically includes standard warning
- Warnings merged into metadata
- `metadata.attorneyReviewRequired: true` always set

### Frontend Components

**Files:**
- `apps/lexfiat/client/src/components/warnings/AttorneyReviewWarning.tsx`
- `apps/lexfiat/client/src/components/warnings/ComplianceWarning.tsx`

**Usage:**
```tsx
import { AttorneyReviewWarning } from '@/components/warnings/AttorneyReviewWarning';
import { ComplianceWarning } from '@/components/warnings/ComplianceWarning';

// In component:
<AttorneyReviewWarning variant="banner" />
<ComplianceWarning rule="MCR 2.113" description="..." severity="high" />
```

---

## Maintenance

### Updates Required When:
- Warning text changes
- New content types added
- New compliance requirements identified
- UI/UX improvements needed

### Review Schedule:
- Monthly during beta period
- Quarterly after production release
- As needed when requirements change

---

## References

- `Cyrano/src/engines/base-engine.ts` - BaseEngine warning implementation
- `Cyrano/src/tools/base-tool.ts` - BaseTool warning implementation
- `apps/lexfiat/client/src/components/warnings/` - Frontend warning components
- `docs/archive/status-reports/2025-12-21-beta-prep/AUDITOR_GENERAL_REPORT_FINAL.md` - Appendix A: Perplexity Assessment

---

**Last Updated:** 2025-12-28
