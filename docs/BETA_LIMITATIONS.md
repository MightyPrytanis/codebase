# Beta Release Limitations

**Date:** 2025-12-28  
**Status:** Active  
**Purpose:** Document known limitations and missing features for beta release

---

## Overview

This document identifies limitations, missing features, and workarounds for the Cyrano beta release. These limitations are documented to set appropriate expectations for beta testers and guide post-beta development priorities.

---

## Critical Limitations

### 1. Calendar API Integration

**Status:** ⚠️ **NOT IMPLEMENTED**

**Impact:**
- No direct calendar API integration (Google Calendar, Microsoft Calendar)
- Calendar functionality depends on email OAuth (Gmail/Outlook)
- Deadline tracking workflows may not function correctly
- Statute of limitations tracking unavailable
- Court appearance scheduling unavailable
- Discovery response date calculation unavailable

**Current Workaround:**
- `calendar_artifact_collector` tool exists but depends on email OAuth
- Calendar events can be collected via Gmail/Outlook OAuth if configured
- No direct calendar API access

**Affected Workflows:**
- `discovery_management` - Uses `calendar_artifact_collector` (may fail if OAuth not configured)
- Any workflow requiring deadline tracking
- Any workflow requiring calendar event creation/updates

**Beta Workaround:**
- Users must configure Gmail/Outlook OAuth for calendar access
- Calendar-dependent workflows will fail gracefully with clear error messages
- Manual deadline tracking required

**Post-Beta Priority:** High - Calendar API integration is critical for legal practice management

---

### 2. Deadline Management

**Status:** ⚠️ **NOT IMPLEMENTED**

**Impact:**
- No automated deadline tracking
- No statute of limitations management
- No court appearance scheduling
- No discovery response date calculation
- No conflict checking

**Current State:**
- `track_deadlines` step in workflows uses `red_flag_finder` (not a calendar tool)
- No dedicated deadline management tool
- No deadline manager service

**Beta Workaround:**
- Manual deadline tracking required
- Users must track deadlines outside the system
- Calendar-dependent workflows disabled or will fail gracefully

**Post-Beta Priority:** Critical - Deadline management is essential for legal practice

---

## Feature Flags

### Calendar-Dependent Workflows

**Feature Flag:** `ENABLE_CALENDAR_WORKFLOWS`

**Default:** `false` (disabled in beta)

**Affected Workflows:**
- `discovery_management` - Calendar collection step may be skipped
- Any workflow with `calendar_artifact_collector` step

**Implementation:**
```typescript
// Check feature flag before calendar-dependent steps
if (process.env.ENABLE_CALENDAR_WORKFLOWS !== 'true') {
  // Skip calendar step or return clear error
  return {
    error: 'Calendar workflows disabled in beta. Configure Gmail/Outlook OAuth or enable calendar workflows.',
    requiresCalendar: true,
  };
}
```

---

## User Warnings

### Calendar Features Unavailable

**Warning Text:**
```
⚠️ CALENDAR FEATURES UNAVAILABLE: Calendar API integration is not available in beta release. 
Deadline tracking, statute of limitations management, and calendar event management are not functional. 
Manual deadline tracking is required. Calendar-dependent workflows will fail gracefully with clear error messages.
```

**Display Locations:**
- Workflow execution results when calendar step fails
- UI when calendar-dependent features accessed
- Beta release notes

---

## Workflow Modifications

### Discovery Management Workflow

**Current State:**
- Includes `collect_calendar` step using `calendar_artifact_collector`
- Includes `track_deadlines` step using `red_flag_finder`

**Beta Behavior:**
- `collect_calendar` step will fail if OAuth not configured (graceful failure)
- `track_deadlines` step will execute but won't track actual calendar deadlines
- Workflow will continue with other steps

**Recommended Modification:**
- Add feature flag check before calendar steps
- Skip calendar steps if feature flag disabled
- Add warning to workflow results

---

## External Dependencies

### Required for Full Functionality

1. **Gmail OAuth:**
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_ACCESS_TOKEN`
   - `GMAIL_REFRESH_TOKEN`
   - Required for calendar event collection via Gmail

2. **Outlook OAuth:**
   - `OUTLOOK_CLIENT_ID`
   - `OUTLOOK_CLIENT_SECRET`
   - `OUTLOOK_ACCESS_TOKEN`
   - `OUTLOOK_REFRESH_TOKEN`
   - Required for calendar event collection via Outlook

**Beta Status:**
- Calendar features require OAuth configuration
- Without OAuth, calendar-dependent workflows will fail gracefully
- Error messages clearly indicate OAuth requirement

---

## Post-Beta Development Priorities

### High Priority

1. **Calendar API Integration:**
   - Implement Google Calendar API service
   - Implement Microsoft Calendar API service
   - Create deadline manager tool
   - Integrate into workflows

2. **Deadline Management:**
   - Statute of limitations tracking
   - Court appearance scheduling
   - Discovery response date calculation
   - Conflict checking

### Medium Priority

1. **Workflow Feature Flags:**
   - Implement feature flag system
   - Add feature flag checks to workflows
   - Document feature flag usage

2. **Enhanced Error Messages:**
   - Improve error messages for missing dependencies
   - Add actionable guidance for users
   - Provide setup instructions

---

## Beta Testing Guidelines

### For Testers

1. **Calendar Features:**
   - Calendar-dependent workflows will fail if OAuth not configured
   - This is expected behavior in beta
   - Manual deadline tracking required

2. **Workflow Testing:**
   - Test workflows that don't require calendar
   - Document calendar-dependent workflow failures
   - Report calendar feature requirements

3. **Error Reporting:**
   - Report unclear error messages
   - Report missing feature warnings
   - Report workflow failures

---

## Documentation Updates

### Required Updates

1. **Workflow Documentation:**
   - Document calendar dependencies
   - Document OAuth requirements
   - Document beta limitations

2. **Setup Documentation:**
   - Update `AI_INTEGRATIONS_SETUP.md` with calendar limitations
   - Document OAuth setup for calendar access
   - Document feature flag usage

3. **User Guides:**
   - Document manual deadline tracking
   - Document calendar feature workarounds
   - Document beta limitations

---

## Conclusion

Calendar API integration is not implemented in beta release. Calendar-dependent workflows will fail gracefully with clear error messages. Manual deadline tracking is required. This limitation is documented and will be addressed post-beta.

**Status:** ⚠️ **LIMITATION DOCUMENTED - POST-BETA PRIORITY**

---

**Last Updated:** 2025-12-28
