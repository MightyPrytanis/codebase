# MiFile Confirmation Email Processing

**Date:** 2025-12-21  
**Status:** ✅ Implemented  
**Purpose:** Capture and link MiFile filing/service confirmation emails to matters for Chronometric evidence

---

## Overview

Even though direct MiFile API integration is not available, users receive email confirmations from MiFile when they file documents or serve parties. These emails are valuable evidence for:

1. **Chronometric Time Tracking** - Proof of filing/service activities
2. **Matter Documentation** - Official confirmation records
3. **Evidence Chain** - Direct evidence of completed actions

---

## Implementation

### Email Artifact Collector Enhancement

The `email-artifact-collector` tool has been enhanced to:

1. **Detect MiFile Confirmation Emails:**
   - Subject line patterns: "MiFile", "filing", "service", "confirmation"
   - From addresses: `mifile@`, `courts.michigan.gov`
   - Content keywords: "electronic filing confirmation", "service confirmation", "filing accepted"

2. **Extract Structured Data:**
   - Case number (patterns: `2024-CV-12345`, `24-CV-12345`)
   - Confirmation type (filing vs. service)
   - Dates (filing date, service date)
   - Document information

3. **Link to Matters:**
   - Automatic linking when `matter_id` provided
   - Case number extraction for candidate linking
   - Metadata for manual linking if needed

4. **Mark for Chronometric:**
   - Evidence type: `direct` (high confidence)
   - Chronometric priority: `high`
   - Available for time reconstruction workflows

---

## Email Metadata Structure

When a MiFile confirmation email is detected, it includes:

```typescript
{
  id: "gmail_12345",
  date: "2024-12-21",
  subject: "MiFile - Filing Confirmation",
  from: "mifile@courts.michigan.gov",
  to: "attorney@lawfirm.com",
  sent: true,
  evidence_type: "direct",
  provider: "gmail",
  snippet: "...",
  
  // MiFile-specific metadata
  mifile_confirmation: true,
  confirmation_type: "filing" | "service" | "general",
  case_number: "2024-CV-12345",
  extracted_date: "12/21/2024",
  chronometric_priority: "high",
  matter_linking_candidate: true,
  linked_matter_id: "case-001", // If linked
  linking_method: "explicit_matter_id" | "case_number_match"
}
```

---

## Usage

### Automatic Detection

MiFile confirmation emails are automatically detected when using `email_artifact_collector`:

```typescript
{
  action: "email_artifact_collector",
  start_date: "2024-12-01",
  end_date: "2024-12-31",
  matter_id: "case-001", // Optional - helps with linking
  email_provider: "both"
}
```

### Results Include

- All emails in the date range
- MiFile confirmations marked with `mifile_confirmation: true`
- Case numbers extracted for automatic matter linking
- High-priority evidence for Chronometric workflows

---

## Integration with Chronometric

MiFile confirmation emails are automatically:

1. **Marked as Direct Evidence:**
   - `evidence_type: "direct"`
   - High confidence for time reconstruction

2. **Prioritized:**
   - `chronometric_priority: "high"`
   - Included in time reconstruction workflows

3. **Linked to Matters:**
   - When `matter_id` provided, automatically linked
   - Case number extraction enables candidate linking

4. **Available in Matter Files:**
   - Stored in case evidence/documentation
   - Accessible via `case_manager.get` action
   - Visible in LexFiat matter cards

---

## Matter File Storage

MiFile confirmations are stored in matter files/cards:

```typescript
{
  case_id: "case-001",
  case_data: {
    // ... case information
    evidence: [
      {
        type: "email",
        source: "mifile_confirmation",
        confirmation_type: "filing",
        case_number: "2024-CV-12345",
        date: "2024-12-21",
        email_id: "gmail_12345",
        chronometric_evidence: true,
      }
    ],
    mifile_confirmations: [
      {
        type: "filing",
        case_number: "2024-CV-12345",
        date: "2024-12-21",
        email_id: "gmail_12345",
      }
    ]
  }
}
```

---

## Detection Patterns

The system detects MiFile confirmations using:

### Subject Line Patterns
- Contains "MiFile"
- Contains "Michigan" + ("filing" | "service" | "confirmation")
- Contains "Electronic Filing"
- Contains "Service Confirmation"

### From Address Patterns
- `*@mifile.*`
- `*@courts.michigan.gov`
- `*@michigan.gov` + filing/service keywords

### Content Patterns
- "electronic filing confirmation"
- "service confirmation"
- "filing accepted"
- "filing received"
- "service completed"

### Case Number Patterns
- `YYYY-CV-#####` (e.g., `2024-CV-12345`)
- `YY-CV-#####` (e.g., `24-CV-12345`)
- `YYYY-FC-#####` (Family Court)
- `YYYY-PC-#####` (Probate Court)

---

## Benefits

1. **Automatic Evidence Collection:**
   - No manual entry required
   - Emails automatically detected and processed

2. **Time Tracking Support:**
   - Direct evidence for Chronometric
   - High-priority for time reconstruction
   - Links filing/service activities to time entries

3. **Matter Documentation:**
   - Official confirmation records stored
   - Case number extraction for organization
   - Complete evidence chain

4. **Integration Ready:**
   - Works with existing email artifact collector
   - Compatible with Chronometric workflows
   - Available in matter files/cards

---

## Future Enhancements

1. **Automatic Matter Linking:**
   - Match case numbers to existing matters
   - Create matter links automatically
   - Update matter files with confirmations

2. **Document Extraction:**
   - Extract PDF attachments from confirmations
   - Store confirmation documents in matter files
   - Link documents to time entries

3. **Notification System:**
   - Alert when new confirmations detected
   - Update matter cards in real-time
   - Notify attorneys of filing/service confirmations

---

**Last Updated:** 2025-12-21
