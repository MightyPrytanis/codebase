/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Retention Enforcement Job
 * 
 * Scheduled job to enforce data retention policies by purging expired data.
 * Should be run daily via OS cron job.
 * 
 * Usage:
 *   node -e "import('./src/jobs/retention-enforcement.js').then(m => m.runRetentionEnforcement())"
 * 
 * OS Cron:
 *   0 2 * * * /path/to/node /path/to/retention-enforcement.js
 */

import { hipaaCompliance } from '../services/hipaa-compliance.js';

/**
 * Run retention enforcement for all data types
 */
export async function runRetentionEnforcement() {
  console.log('[Retention Enforcement] Starting retention enforcement job...');
  
  try {
    // Enforce retention for wellness data (HIPAA-covered)
    console.log('[Retention Enforcement] Enforcing wellness data retention...');
    await hipaaCompliance.enforceRetention();
    console.log('[Retention Enforcement] Wellness data retention enforced');
    
    // TODO: Add retention enforcement for other data types:
    // - Client matter data
    // - Email drafts
    // - Arkiver files
    // - Generated documents
    // - Audit logs
    
    console.log('[Retention Enforcement] Retention enforcement job completed successfully');
  } catch (error) {
    console.error('[Retention Enforcement] Retention enforcement job failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRetentionEnforcement()
    .then(() => {
      console.log('[Retention Enforcement] Job completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Retention Enforcement] Job failed:', error);
      process.exit(1);
    });
}

)