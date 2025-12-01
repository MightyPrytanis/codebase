---
Document ID: ARCHIVED-UI_FEATURE_ACCESS_ANALYSIS
Title: Ui Feature Access Analysis
Subject(s): Archived | One-Off | Limited Utility
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Document archived due to limited current utility (superseded by other docs, one-off, or historical).
Status: Archived
---

**ARCHIVED:** This document has limited current utility and has been archived. Archived 2025-11-28.

---

---
Document ID: UI-FEATURE-ACCESS-ANALYSIS
Title: Ui Feature Access Analysis
Subject(s): LexFiat | UI
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# LexFiat UI Feature Access Analysis
**Date:** 2025-11-26  
**Purpose:** Identify Cyrano tools/features without UI access and suggest integration paths

---

## Executive Summary

This document analyzes all Cyrano MCP tools and identifies which features have UI access in LexFiat and which do not. Recommendations are provided for integrating missing features.

---

## Tools with UI Access ✅

### 1. **GoodCounsel** ✅
- **UI Access:** Dashboard widget → Expanded panel
- **Status:** Fully integrated
- **Location:** `/components/dashboard/good-counsel-widget.tsx`

### 2. **Case Manager** ✅
- **UI Access:** Dashboard (cases display), Today's Focus widget → `/todays-focus` page
- **Status:** Integrated
- **Location:** Dashboard widgets, Today's Focus page

### 3. **Workflow Manager** ✅
- **UI Access:** Workflow Pipeline component on dashboard
- **Status:** Integrated
- **Location:** `/components/dashboard/workflow-pipeline.tsx`

### 4. **Document Processor** ✅
- **UI Access:** Workflow Pipeline (Intake stage)
- **Status:** Integrated
- **Location:** Workflow pipeline metrics

### 5. **Alert Generator** ✅
- **UI Access:** Priority Ticker component
- **Status:** Integrated
- **Location:** `/components/dashboard/priority-ticker.tsx`

### 6. **Performance Metrics** ✅
- **UI Access:** Performance widget → `/performance` page
- **Status:** Integrated
- **Location:** Dashboard widget, Performance page

---

## Tools WITHOUT UI Access ❌

### 1. **RAG Query** ❌
- **Tool:** `rag_query`
- **Functionality:** Document retrieval and context generation
- **Current Status:** No UI access
- **Recommendation:** 
  - Add "Research & Documents" widget to dashboard
  - Create `/research` page with:
    - Document search interface
    - RAG query input
    - Results display with citations
    - Data source notices
  - Link from workflow pipeline "AI Analysis" stage

### 2. **Document Analyzer** ❌
- **Tool:** `document_analyzer`
- **Functionality:** AI-powered document analysis
- **Current Status:** No direct UI access
- **Recommendation:**
  - Add "Document Analysis" widget to dashboard
  - Create `/documents/analyze` page
  - Allow document upload and analysis
  - Display analysis results with AI insights

### 3. **Legal Reviewer** ❌
- **Tool:** `legal_reviewer`
- **Functionality:** Legal document review
- **Current Status:** No UI access
- **Recommendation:**
  - Add to workflow pipeline "Attorney Review" stage
  - Create expanded panel for review interface
  - Show review results and recommendations

### 4. **Fact Checker** ❌
- **Tool:** `fact_checker`
- **Functionality:** Verify facts in documents
- **Current Status:** No UI access
- **Recommendation:**
  - Add "Fact Check" button to document analysis results
  - Create fact-checking panel/modal
  - Display verification results

### 5. **Compliance Checker** ❌
- **Tool:** `compliance_checker`
- **Functionality:** Check compliance with regulations
- **Current Status:** No UI access
- **Recommendation:**
  - Add "Compliance" widget to dashboard
  - Create `/compliance` page
  - Show compliance status for active cases
  - Allow manual compliance checks

### 6. **Contract Comparator** ❌
- **Tool:** `contract_comparator`
- **Functionality:** Compare contracts and documents
- **Current Status:** No UI access
- **Recommendation:**
  - Add "Compare Documents" option to document menu
  - Create `/documents/compare` page
  - Allow side-by-side comparison
  - Highlight differences

### 7. **Clio Integration** ⚠️
- **Tool:** `clio_integration`
- **Functionality:** Clio practice management integration
- **Current Status:** Partial (status shown in header)
- **Recommendation:**
  - Add "Clio Sync" widget to dashboard
  - Create `/clio` page showing:
    - Sync status
    - Recent syncs
    - Manual sync button
    - Clio data preview

### 8. **Chronometric Module** ❌
- **Tool:** `chronometric_module`
- **Functionality:** Time tracking and billing
- **Current Status:** No UI access
- **Recommendation:**
  - Add "Time Tracking" widget to dashboard
  - Create `/time-tracking` page
  - Show time entries, billable hours
  - Link to time-value-billing tool

### 9. **Time Value Billing** ❌
- **Tool:** `time_value_billing`
- **Functionality:** Value-based billing calculations
- **Current Status:** No UI access
- **Recommendation:**
  - Add to Time Tracking page
  - Create billing calculator interface
  - Show value-based pricing recommendations

### 10. **Arkiver Tools** ❌
- **Tools:** `arkiver_process_file`, `arkiver_job_status`
- **Functionality:** Document processing and extraction
- **Current Status:** No UI access
- **Recommendation:**
  - Add "Document Processing" section to dashboard
  - Create `/documents/process` page
  - Show processing queue and job status
  - Allow file upload and processing

### 11. **Citation Tools** ❌
- **Tools:** `citation_checker`, `citation_formatter`, `source_verifier`
- **Functionality:** Legal citation verification and formatting
- **Current Status:** No UI access
- **Recommendation:**
  - Add "Citation Tools" to document analysis page
  - Create citation verification interface
  - Show formatted citations with verification status

### 12. **Sync Manager** ❌
- **Tool:** `sync_manager`
- **Functionality:** Manage data synchronization
- **Current Status:** No UI access
- **Recommendation:**
  - Add to Settings page
  - Create sync management interface
  - Show sync status and history

### 13. **System Status** ⚠️
- **Tool:** `system_status`
- **Functionality:** System health and configuration
- **Current Status:** Partial (shown in API status banner)
- **Recommendation:**
  - Add "System Status" to Settings page
  - Create detailed status dashboard
  - Show AI provider status, tool availability

### 14. **Quality Assessor** ❌
- **Tool:** `quality_assessor`
- **Functionality:** Assess document quality
- **Current Status:** No UI access
- **Recommendation:**
  - Add to document analysis results
  - Show quality scores and recommendations
  - Link from workflow pipeline

---

## Integration Priority Recommendations

### High Priority (Core Legal Workflow)
1. **Document Analyzer** - Essential for legal practice
2. **Legal Reviewer** - Critical for attorney review stage
3. **RAG Query** - Important for research and context
4. **Clio Integration** - Full sync management UI

### Medium Priority (Productivity)
5. **Chronometric/Time Tracking** - Billing and time management
6. **Compliance Checker** - Regulatory compliance
7. **Fact Checker** - Document verification
8. **Citation Tools** - Legal citation management

### Lower Priority (Advanced Features)
9. **Contract Comparator** - Specialized use case
10. **Arkiver Tools** - Advanced document processing
11. **Quality Assessor** - Quality metrics
12. **Sync Manager** - System administration

---

## Suggested UI Structure

### New Pages to Create:
1. `/research` - RAG query and document search
2. `/documents` - Document management hub
   - `/documents/analyze` - Document analysis
   - `/documents/compare` - Document comparison
   - `/documents/process` - Arkiver processing
3. `/time-tracking` - Time and billing
4. `/compliance` - Compliance checking
5. `/clio` - Clio integration management
6. `/settings/system` - System status and configuration

### Widget Additions:
- Research & Documents widget
- Time Tracking widget
- Compliance Status widget
- Clio Sync widget

---

## Implementation Notes

- All new pages should follow the same design system as existing pages
- Use the expanded panel component for modal-style interfaces
- Ensure all features include data source notices where applicable
- Link widgets to their respective pages for consistency
- Add navigation breadcrumbs for deep pages

---

**Status:** Analysis complete, ready for implementation prioritization

