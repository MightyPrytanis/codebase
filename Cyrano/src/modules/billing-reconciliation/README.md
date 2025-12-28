# Billing Reconciliation Module

**Billing Reconciliation Module** - Generates comprehensive reports for reconciling billing discrepancies with Clio or other billing systems.

## Overview

This module provides reconciliation functionality for billing discrepancies. It combines gap identification and artifact collection to generate comprehensive reports useful for reconciling time entries with Clio or other billing systems.

**Note:** This module preserves the report generation functionality from the legacy ChronometricModule, repurposed specifically for billing reconciliation. The ChronometricModule has been archived and its core functionality moved to the ChronometricEngine.

## Features

- **Generate Reconciliation Reports**: Combines gap identification and artifact collection into comprehensive reports
- **Compare with Clio**: Compare time entries with Clio billing records to identify discrepancies
- **Identify Discrepancies**: Analyze discrepancies between recorded time and artifacts

## Actions

### `generate_reconciliation_report`

Generates a comprehensive reconciliation report combining gaps and artifacts.

**Input:**
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `matter_id` (optional): Matter ID
- `include_artifacts` (optional): Array of artifact types to include ['email', 'calendar', 'documents', 'calls']

**Output:**
- Report with gaps, artifacts, summary, and recommendations

### `compare_with_clio`

Compares time entries with Clio billing records.

**Input:**
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `clio_matter_id` (required): Clio matter ID
- `matter_id` (optional): Matter ID

**Output:**
- Comparison report with gaps, Clio entries, and discrepancies

### `identify_discrepancies`

Identifies discrepancies between recorded time and artifacts.

**Input:**
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `matter_id` (optional): Matter ID
- `include_artifacts` (optional): Array of artifact types to include

**Output:**
- Discrepancy analysis with severity levels

## Usage

```typescript
import { billingReconciliationModule } from './billing-reconciliation-module.js';

// Generate reconciliation report
const result = await billingReconciliationModule.execute({
  action: 'generate_reconciliation_report',
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  matter_id: 'matter-123',
  include_artifacts: ['email', 'calendar', 'documents'],
});

// Compare with Clio
const clioResult = await billingReconciliationModule.execute({
  action: 'compare_with_clio',
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  clio_matter_id: 'clio-456',
  matter_id: 'matter-123',
});
```

## Tools Used

- `gap_identifier` - Identifies gaps in time recording
- `email_artifact_collector` - Collects email artifacts
- `calendar_artifact_collector` - Collects calendar artifacts
- `document_artifact_collector` - Collects document artifacts
- `clio_integration` - Integrates with Clio API

## Resources

- `clio_config` - Clio API configuration

## Migration from ChronometricModule

The old `ChronometricModule` has been archived. Its report generation functionality has been preserved in this module, specifically repurposed for billing reconciliation. For time reconstruction functionality, use the ChronometricEngine and its TimeReconstructionModule.
