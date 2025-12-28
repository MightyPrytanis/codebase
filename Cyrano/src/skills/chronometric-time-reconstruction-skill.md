---
name: Chronometric Time Reconstruction
description: Reconstructs billable time from email, calendar, and document artifacts. Uses pattern learning to identify billable activities and generates time entries with proper categorization.
version: 2025.1
domain: time-tracking
proficiency:
  - Time reconstruction
  - Pattern learning
  - Billable time analysis
  - Workflow archaeology
stability: beta
resources:
  - time_patterns
  - billing_categories
  - activity_templates
prompts:
  - time_reconstruction_prompt
  - pattern_learning_prompt
checklist:
  - Identify billable activities
  - Categorize time entries
  - Apply learned patterns
  - Generate time entries
input_schema:
  type: object
  required: [date_range, matter_id]
  properties:
    date_range:
      type: object
      properties:
        start: { type: string, format: date }
        end: { type: string, format: date }
      required: [start, end]
      description: "Date range for time reconstruction"
    matter_id:
      type: string
      description: "Matter ID for time entries"
    include_patterns:
      type: boolean
      default: true
      description: "Whether to apply learned patterns"
    artifact_sources:
      type: array
      items: { type: string, enum: ["email", "calendar", "documents", "tasks"] }
      description: "Which artifact sources to analyze"
output_schema:
  type: object
  properties:
    summary:
      type: string
      description: "Summary of reconstruction results"
    time_entries:
      type: array
      items:
        type: object
        properties:
          date: { type: string, format: date }
          duration: { type: number }
          category: { type: string }
          description: { type: string }
          source: { type: string }
          confidence: { type: number, minimum: 0, maximum: 1 }
    total_hours:
      type: number
      description: "Total billable hours reconstructed"
    pattern_applications:
      type: array
      items:
        type: object
        properties:
          pattern_id: { type: string }
          applications: { type: number }
          confidence: { type: number }
side_effects:
  reads:
    - email_artifact_collector
    - calendar_artifact_collector
    - document_artifact_collector
    - tasks_collector
    - time_patterns
  writes:
    - time_entries_db
    - pattern_learning_db
  external_calls: []
usage_policy:
  should_call_when:
    - "User wants to reconstruct billable time"
    - "User needs to capture missed time entries"
    - "User asks for time analysis"
    - "User wants pattern-based time entry"
  should_not_call_when:
    - "User only wants to view existing time entries"
    - "Date range is invalid or too large"
    - "Matter ID is not provided"
  requires_context:
    - date_range
    - matter_id
error_modes:
  - code: INVALID_DATE_RANGE
    description: "Date range is invalid or too large"
    recoverable: true
  - code: MATTER_NOT_FOUND
    description: "Matter ID not found"
    recoverable: false
  - code: NO_ARTIFACTS
    description: "No artifacts found for date range"
    recoverable: true
  - code: RECONSTRUCTION_FAILED
    description: "Time reconstruction encountered an error"
    recoverable: true
workflow_id: chronometric:time_reconstruction
engine: chronometric
knowledge_scope:
  per_skill:
    - time_patterns
    - billing_categories
    - activity_templates
  shared: []
---

# Chronometric Time Reconstruction Skill

## Overview

The Chronometric Time Reconstruction skill reconstructs billable time from email, calendar, document, and task artifacts. It uses pattern learning to identify billable activities and generates properly categorized time entries.

## Capabilities

1. **Artifact Analysis**: Analyzes emails, calendar events, documents, and tasks
2. **Pattern Learning**: Applies learned patterns to identify billable activities
3. **Time Entry Generation**: Creates time entries with proper categorization
4. **Confidence Scoring**: Provides confidence scores for each reconstructed entry
5. **Workflow Archaeology**: Traces activities back to source artifacts

## Usage Examples

### Basic Reconstruction
```json
{
  "date_range": {
    "start": "2024-12-01",
    "end": "2024-12-31"
  },
  "matter_id": "matter_12345",
  "include_patterns": true,
  "artifact_sources": ["email", "calendar", "documents"]
}
```

### Pattern-Only Reconstruction
```json
{
  "date_range": {
    "start": "2024-12-01",
    "end": "2024-12-31"
  },
  "matter_id": "matter_12345",
  "include_patterns": true,
  "artifact_sources": []
}
```

## Output Format

The skill returns:
- **Time Entries**: Array of reconstructed time entries with metadata
- **Total Hours**: Sum of all billable hours
- **Pattern Applications**: Which patterns were applied and how often
- **Confidence Scores**: Confidence level for each entry

## Integration

This skill integrates with:
- **Chronometric Engine**: Uses time reconstruction workflow
- **Artifact Collectors**: Email, calendar, document, task collectors
- **Pattern Learning**: Applies learned billing patterns
- **Time Entry Database**: Writes reconstructed entries
