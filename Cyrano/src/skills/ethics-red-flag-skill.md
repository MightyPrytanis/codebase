---
name: Ethics Red-Flag Scanner
description: Scans legal documents, communications, and case data for potential ethics violations, conflicts of interest, and professional responsibility issues. Uses dual-thread ethics (systemic AI ethics + professional duty) to flag risks.
version: 2025.1
domain: legal-reasoning
proficiency:
  - Ethics compliance
  - MRPC/ABA rules
  - Conflict detection
  - Professional responsibility
stability: beta
resources:
  - mrpc_rules
  - aba_model_rules
  - conflict_check_templates
prompts:
  - ethics_scan_prompt
  - conflict_detection_prompt
checklist:
  - Scan for client conflicts
  - Check confidentiality issues
  - Verify competence requirements
  - Flag potential MRPC violations
input_schema:
  type: object
  required: [content_type, content]
  properties:
    content_type:
      type: string
      enum: ["document", "email", "case_data", "communication"]
      description: "Type of content being scanned"
    content:
      type: string
      description: "Content to scan for ethics issues"
    matter_id:
      type: string
      description: "Optional: Matter ID for context"
    client_ids:
      type: array
      items: { type: string }
      description: "Optional: List of client IDs for conflict checking"
output_schema:
  type: object
  properties:
    summary:
      type: string
      description: "Summary of ethics scan results"
    red_flags:
      type: array
      items:
        type: object
        properties:
          severity: { type: string, enum: ["critical", "high", "medium", "low"] }
          rule: { type: string }
          description: { type: string }
          recommendation: { type: string }
    conflicts:
      type: array
      items:
        type: object
        properties:
          type: { type: string }
          description: { type: string }
          affected_clients: { type: array, items: { type: string } }
    compliance_score:
      type: number
      minimum: 0
      maximum: 100
      description: "Overall compliance score (0-100)"
    requires_review:
      type: boolean
      description: "Whether manual attorney review is required"
side_effects:
  reads:
    - clio_integration
    - internal_library
    - mrpc_rules
  writes:
    - ethics_audit_log
  external_calls: []
usage_policy:
  should_call_when:
    - "User asks to check for ethics issues"
    - "User wants conflict of interest check"
    - "User needs professional responsibility review"
    - "Before sending client communications"
    - "When reviewing case documents"
  should_not_call_when:
    - "User only wants general ethics information"
    - "Content is not legal-related"
    - "User is asking about non-professional ethics"
  requires_context:
    - content_type
    - content
error_modes:
  - code: INVALID_CONTENT_TYPE
    description: "Content type not recognized"
    recoverable: false
  - code: INSUFFICIENT_CONTEXT
    description: "Not enough context to perform scan"
    recoverable: true
  - code: SCAN_FAILED
    description: "Ethics scan encountered an error"
    recoverable: true
workflow_id: goodcounsel:ethics_review
engine: goodcounsel
knowledge_scope:
  per_skill:
    - mrpc_rules
    - aba_model_rules
    - conflict_check_templates
  shared: []
---

# Ethics Red-Flag Scanner Skill

## Overview

The Ethics Red-Flag Scanner performs comprehensive ethics compliance checks on legal documents, communications, and case data. It uses Cyrano's dual-thread ethics system to check both systemic AI ethics (toxicity, bias) and professional responsibility (MRPC/ABA rules).

## Capabilities

1. **Conflict Detection**: Identifies potential conflicts of interest between clients
2. **Confidentiality Checks**: Flags potential privilege or confidentiality violations
3. **Competence Verification**: Ensures work product meets competence standards
4. **MRPC Compliance**: Checks against Model Rules of Professional Conduct
5. **Risk Scoring**: Provides overall compliance score and severity ratings

## Usage Examples

### Scan Document
```json
{
  "content_type": "document",
  "content": "Document text here...",
  "matter_id": "matter_12345",
  "client_ids": ["client_001", "client_002"]
}
```

### Scan Email
```json
{
  "content_type": "email",
  "content": "Email content here...",
  "matter_id": "matter_12345"
}
```

## Output Format

The skill returns:
- **Red Flags**: Array of ethics issues with severity and recommendations
- **Conflicts**: Detected conflicts of interest
- **Compliance Score**: 0-100 score (higher is better)
- **Requires Review**: Boolean indicating if manual review needed

## Integration

This skill integrates with:
- **GoodCounsel Engine**: Uses ethics review workflow
- **Clio Integration**: Retrieves matter and client data
- **Ethics Services**: Dual-thread ethics checks
- **Audit Logging**: All scans logged for compliance
