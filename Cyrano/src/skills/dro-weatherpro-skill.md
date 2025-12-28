---
name: DRO WeatherPro
description: Forecast QDRO and EDRO outcomes for private/public plans, defined-contribution or defined-benefit, for plan participants or alternate payees. Produces scenario-based forecasts with ERISA compliance checks.
version: 2025.1
domain: forensic-finance
proficiency:
  - QDRO
  - EDRO
  - ERISA compliance
  - Defined contribution plans
  - Defined benefit plans
  - Retirement asset division
stability: beta
resources:
  - erisa_qdro_template
  - db_calculation_rules
  - dc_calculation_rules
  - irs_tax_brackets_2025
prompts:
  - qdro_calculation
  - erisa_compliance
  - scenario_generation
checklist:
  - Confirm plan type (DC vs DB, private vs public)
  - Identify plan participant and alternate payee
  - Determine marital service period
  - Calculate division percentage
  - Verify ERISA compliance
  - Generate forecast scenarios
input_schema:
  type: object
  required: [matter_id, plan_type, participant_role]
  properties:
    matter_id:
      type: string
      description: "Clio matter ID or internal matter identifier"
    plan_type:
      type: string
      enum: ["defined_contribution", "defined_benefit"]
      description: "Type of retirement plan"
    plan_scope:
      type: string
      enum: ["private", "public"]
      description: "Private (ERISA) or public (non-ERISA) plan"
    participant_role:
      type: string
      enum: ["plan_participant", "alternate_payee"]
      description: "Role of the person for whom forecast is generated"
    division_percentage:
      type: number
      minimum: 0
      maximum: 100
      description: "Proposed division percentage (0-100)"
    marital_service_start:
      type: string
      format: date
      description: "Start date of marital service period (YYYY-MM-DD)"
    marital_service_end:
      type: string
      format: date
      description: "End date of marital service period (YYYY-MM-DD)"
    current_balance:
      type: number
      description: "Current plan balance (for DC plans) or benefit amount (for DB plans)"
    retirement_age:
      type: number
      minimum: 55
      maximum: 75
      description: "Assumed retirement age for DB plan calculations"
    scenario_variations:
      type: array
      items:
        type: object
        properties:
          division_percentage: { type: number }
          retirement_age: { type: number }
      description: "Optional: Array of scenario variations to forecast"
output_schema:
  type: object
  properties:
    summary:
      type: string
      description: "Plain-language summary of forecast results"
    recommended_split:
      type: object
      properties:
        participant_share: { type: number }
        alternate_payee_share: { type: number }
        division_percentage: { type: number }
    scenarios:
      type: array
      items:
        type: object
        properties:
          scenario_name: { type: string }
          division_percentage: { type: number }
          participant_share: { type: number }
          alternate_payee_share: { type: number }
          assumptions: { type: object }
    risk_flags:
      type: array
      items: { type: string }
      description: "Array of compliance or calculation risk warnings"
    erisa_compliance:
      type: object
      properties:
        compliant: { type: boolean }
        issues: { type: array, items: { type: string } }
    forecast_metadata:
      type: object
      properties:
        plan_type: { type: string }
        plan_scope: { type: string }
        calculation_method: { type: string }
        generated_at: { type: string, format: date-time }
side_effects:
  reads:
    - clio_integration
    - internal_library
    - erisa_qdro_template
  writes:
    - forecast_audit_log
  external_calls: []
usage_policy:
  should_call_when:
    - "User asks for QDRO or EDRO forecast"
    - "User wants to explore division scenarios for retirement assets"
    - "User needs ERISA compliance verification for a proposed division"
    - "User asks 'what if' questions about different division percentages"
  should_not_call_when:
    - "User only wants a plain-language explanation of what a QDRO/EDRO is"
    - "User is asking about non-retirement assets (real estate, bank accounts, etc.)"
    - "Plan type cannot be determined from context"
    - "User is asking about plan administration (not division forecasting)"
  requires_context:
    - matter_id
    - plan_type
    - participant_role
error_modes:
  - code: MISSING_MATTER
    description: "Matter ID not found in Clio or internal database"
    recoverable: false
  - code: INSUFFICIENT_DATA
    description: "Required plan data incomplete (missing balance, dates, etc.)"
    recoverable: true
  - code: INVALID_PLAN_TYPE
    description: "Plan type not recognized or unsupported"
    recoverable: false
  - code: ERISA_COMPLIANCE_FAILURE
    description: "Proposed division fails ERISA compliance checks"
    recoverable: true
  - code: CALCULATION_ERROR
    description: "Mathematical error in division calculation"
    recoverable: false
workflow_id: forecast:qdro_forecast_v1
engine: forecast
knowledge_scope:
  per_skill:
    - erisa_qdro_template
    - db_calculation_rules
    - dc_calculation_rules
  shared:
    - irs_tax_brackets_2025
---

# DRO WeatherPro Skill

## Overview

DRO WeatherPro generates comprehensive forecasts for Qualified Domestic Relations Orders (QDROs) and Eligible Domestic Relations Orders (EDROs) across all plan types and participant roles.

## Supported Plan Types

- **Defined Contribution (DC)**: 401(k), 403(b), 457, IRA, etc.
- **Defined Benefit (DB)**: Traditional pensions, cash balance plans
- **Plan Scope**: Private (ERISA-governed) and Public (non-ERISA) plans

## Participant Roles

- **Plan Participant**: The employee/spouse who earned the retirement benefit
- **Alternate Payee**: The ex-spouse receiving a portion of the benefit

## Forecast Capabilities

1. **Single Scenario Forecast**: Calculate division for one set of assumptions
2. **Multi-Scenario Analysis**: Compare outcomes across different division percentages and retirement ages
3. **ERISA Compliance Check**: Verify proposed division meets ERISA requirements
4. **Risk Flagging**: Identify potential compliance or calculation issues

## Calculation Methods

### Defined Contribution Plans
- Uses current balance and division percentage
- Accounts for marital service period if specified
- Handles pre-tax vs. post-tax contributions

### Defined Benefit Plans
- Uses benefit formula and marital service period
- Projects benefit to retirement age
- Calculates present value if requested

## Usage Examples

### Basic QDRO Forecast
```json
{
  "matter_id": "matter_12345",
  "plan_type": "defined_contribution",
  "plan_scope": "private",
  "participant_role": "plan_participant",
  "division_percentage": 50,
  "current_balance": 500000,
  "marital_service_start": "2010-01-15",
  "marital_service_end": "2024-12-31"
}
```

### Multi-Scenario EDRO Forecast
```json
{
  "matter_id": "matter_12345",
  "plan_type": "defined_benefit",
  "plan_scope": "public",
  "participant_role": "alternate_payee",
  "division_percentage": 50,
  "retirement_age": 65,
  "scenario_variations": [
    { "division_percentage": 40, "retirement_age": 62 },
    { "division_percentage": 50, "retirement_age": 65 },
    { "division_percentage": 60, "retirement_age": 67 }
  ]
}
```

## Error Handling

The skill handles errors gracefully:

- **MISSING_MATTER**: Returns error immediately, cannot proceed
- **INSUFFICIENT_DATA**: Prompts user for missing information
- **ERISA_COMPLIANCE_FAILURE**: Returns forecast with compliance issues flagged, allows user to adjust

## Integration Notes

This skill integrates with:
- **Forecast Engine**: Uses `qdro_forecast` module workflow
- **Clio Integration**: Retrieves matter and plan data
- **Resource Provisioner**: Loads ERISA templates and calculation rules
- **Ethics Services**: All outputs pass through dual-thread ethics checks

## Testing

Test cases should cover:
1. DC plan with 50/50 split
2. DB plan with marital service period calculation
3. Public plan (non-ERISA) EDRO
4. ERISA compliance failure scenario
5. Multi-scenario comparison
