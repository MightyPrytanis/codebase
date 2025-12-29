# Data Retention Policy

**Date:** 2025-12-28  
**Status:** Active  
**Purpose:** Define data retention periods and destruction procedures for all data types in the Cyrano system

---

## Executive Summary

This document defines data retention periods and destruction procedures for all data types stored in the Cyrano legal AI system. Retention periods are based on legal requirements, state bar ethics rules, and HIPAA requirements.

**Key Principles:**
- Retain data as required by law and professional obligations
- Destroy data securely after retention period
- Document all retention and destruction activities
- Maintain audit trails for compliance

---

## Retention Periods

### 1. Client Matter Data

**Retention Period:** 7 years after matter closure

**Rationale:**
- Michigan state bar requirements (typically 5-7 years)
- Statute of limitations considerations
- Professional liability insurance requirements

**Data Types:**
- Case files
- Client communications
- Legal documents
- Billing records
- Time records

**Implementation:**
- Soft delete: Set `deletedAt` timestamp
- Hard delete: After 7 years from matter closure
- Automatic purging: To be implemented

---

### 2. Wellness Data (HIPAA-Covered)

**Retention Period:** 6 years (HIPAA requirement)

**Rationale:**
- HIPAA requires retention of PHI for 6 years
- Wellness journal entries contain PHI
- Access logs must be retained for 6 years

**Data Types:**
- Wellness journal entries (encrypted)
- Wellness access logs
- Wellness audit trails
- Wellness feedback

**Implementation:**
- Soft delete: Set `deletedAt` timestamp
- Hard delete: After 6 years from creation
- Automatic purging: `enforceRetention()` method exists

**Code Evidence:**
```typescript
// Cyrano/src/services/hipaa-compliance.ts:150-169
async enforceRetention(): Promise<void> {
  const retentionCutoff = new Date();
  retentionCutoff.setFullYear(retentionCutoff.getFullYear() - this.defaultRetentionYears);
  // Hard delete entries older than retention period
}
```

---

### 3. Audit Logs

**Retention Period:** 6 years (HIPAA requirement)

**Rationale:**
- HIPAA requires audit log retention for 6 years
- Legal compliance requirements
- Security incident investigation

**Data Types:**
- Access logs
- Audit trails
- Security event logs
- Data operation logs

**Implementation:**
- Automatic purging: After 6 years
- Retention enforcement: To be implemented

---

### 4. Email Drafts

**Retention Period:** 7 years after matter closure

**Rationale:**
- Part of client matter data
- May contain attorney-client privileged communications
- Professional liability considerations

**Data Types:**
- Email draft content
- Email metadata
- Recipient information

**Implementation:**
- Soft delete: Set `deletedAt` timestamp
- Hard delete: After 7 years from matter closure
- Automatic purging: To be implemented

---

### 5. Library Items

**Retention Period:** Indefinite (user-controlled)

**Rationale:**
- Library items are user-managed resources
- May contain templates, rules, playbooks
- User controls retention via deletion

**Data Types:**
- Library item metadata
- Library item files
- Storage location configurations

**Implementation:**
- User-controlled deletion
- No automatic purging
- Soft delete: Set `deletedAt` timestamp (if implemented)

---

### 6. Arkiver Files

**Retention Period:** 7 years after upload (or matter closure)

**Rationale:**
- Part of client matter data
- May contain confidential information
- Professional liability considerations

**Data Types:**
- Uploaded file metadata
- Uploaded file contents
- Processing results

**Implementation:**
- Soft delete: Set `deletedAt` timestamp
- Hard delete: After 7 years from upload
- Automatic purging: To be implemented

---

### 7. Generated Documents

**Retention Period:** 7 years after matter closure

**Rationale:**
- Part of client matter data
- May contain attorney work product
- Professional liability considerations

**Data Types:**
- Generated document files
- Document metadata
- Generation history

**Implementation:**
- Soft delete: Set `deletedAt` timestamp
- Hard delete: After 7 years from matter closure
- Automatic purging: To be implemented

---

### 8. System Logs

**Retention Period:** 90 days (configurable)

**Rationale:**
- Operational logs for troubleshooting
- Security event logs
- Performance monitoring

**Data Types:**
- Application logs
- Error logs
- Performance logs
- Security logs

**Implementation:**
- Automatic rotation: Daily
- Automatic purging: After 90 days
- Configurable via `LOG_MAX_FILES` and `LOG_MAX_FILE_SIZE`

**Code Evidence:**
```typescript
// Cyrano/src/services/logging-service.ts:48-54
maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760', 10), // 10MB default
maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
```

---

## Destruction Procedures

### 1. Soft Delete

**Procedure:**
1. Set `deletedAt` timestamp
2. Mark record as deleted
3. Exclude from normal queries
4. Retain for retention period

**Implementation:**
- Database: `deletedAt` timestamp column
- Queries: Filter by `isNull(deletedAt)`
- Retention: Check `deletedAt` date for hard delete

**Code Evidence:**
```typescript
// Cyrano/src/services/wellness-service.ts:155-195
.where(
  and(
    eq(wellnessJournalEntries.id, entryId),
    eq(wellnessJournalEntries.userId, userId),
    isNull(wellnessJournalEntries.deletedAt) // Soft delete check
  )
)
```

---

### 2. Hard Delete

**Procedure:**
1. Verify retention period expired
2. Delete from database
3. Delete associated files
4. Delete encryption keys (if applicable)
5. Verify deletion
6. Log destruction

**Implementation:**
- Database: `DELETE` statement
- Files: `fs.unlink()` or cloud storage delete
- Encryption keys: Delete if data no longer needed
- Verification: Confirm deletion success
- Logging: Record destruction in audit log

**Code Evidence:**
```typescript
// Cyrano/src/services/hipaa-compliance.ts:150-169
async enforceRetention(): Promise<void> {
  const retentionCutoff = new Date();
  retentionCutoff.setFullYear(retentionCutoff.getFullYear() - this.defaultRetentionYears);
  
  await db
    .delete(wellnessJournalEntries)
    .where(
      and(
        lt(wellnessJournalEntries.createdAt, retentionCutoff),
        isNotNull(wellnessJournalEntries.deletedAt)
      )
    );
}
```

---

### 3. Secure Deletion

**Status:** ⚠️ **STUB IMPLEMENTATION**

**Current State:**
- `secureDelete()` method exists but is stub-only
- No overwrite or secure deletion implemented

**Required Implementation:**
1. Overwrite file data (multiple passes)
2. Delete file from filesystem
3. Delete database record
4. Verify deletion
5. Log secure deletion

**Code Evidence:**
```typescript
// Cyrano/src/services/hipaa-compliance.ts:298-309
secureDelete: async (entryId: string) => {
  const service = getHIPAAComplianceService();
  return service.secureDelete(entryId);
}
```

**Action Required:** Implement secure deletion with overwrite

---

## Retention Enforcement

### 1. Automatic Purging

**Status:** ⚠️ **PARTIALLY IMPLEMENTED**

**Current State:**
- `enforceRetention()` method exists for wellness data
- No scheduled job/cron task
- No automatic purging for other data types

**Implementation:**
- Wellness data: `enforceRetention()` method exists
- Other data: Retention enforcement to be implemented
- Scheduling: OS cron job or scheduled task

**Code Evidence:**
```typescript
// Cyrano/src/services/hipaa-compliance.ts:150-169
async enforceRetention(): Promise<void> {
  // Implementation exists but not scheduled
}
```

**Action Required:**
- Create scheduled job for retention enforcement
- Implement retention enforcement for all data types
- Schedule automatic purging (daily/weekly)

---

### 2. Retention Policy Check

**Status:** ✅ **IMPLEMENTED**

**Current State:**
- `checkRetentionPolicy()` method exists
- Checks if entry should be retained
- Returns boolean result

**Code Evidence:**
```typescript
// Cyrano/src/services/hipaa-compliance.ts:95-112
async checkRetentionPolicy(entryId: string): Promise<boolean> {
  const retentionCutoff = new Date();
  retentionCutoff.setFullYear(retentionCutoff.getFullYear() - this.defaultRetentionYears);
  // Check if entry should be retained
  return entry.createdAt >= retentionCutoff;
}
```

**Assessment:** ✅ Compliant - Retention policy check implemented

---

## Scheduled Jobs

### Retention Enforcement Job

**Status:** ⚠️ **NOT IMPLEMENTED**

**Required Implementation:**
- Create OS cron job or scheduled task
- Run `enforceRetention()` daily/weekly
- Log retention enforcement activities
- Alert on errors

**Proposed Implementation:**
```bash
# OS cron job (daily at 2 AM)
0 2 * * * /path/to/node /path/to/retention-enforcement.js
```

**Action Required:** Create retention enforcement job

---

## Destruction Verification

### 1. Database Deletion Verification

**Procedure:**
1. Query database for deleted records
2. Verify records no longer exist
3. Log verification results
4. Alert on verification failures

**Implementation:**
- Query: `SELECT COUNT(*) FROM table WHERE id = ?`
- Verification: Count should be 0
- Logging: Record verification in audit log

---

### 2. File Deletion Verification

**Procedure:**
1. Check file existence
2. Verify file no longer exists
3. Log verification results
4. Alert on verification failures

**Implementation:**
- Check: `fs.existsSync(filePath)`
- Verification: Should return false
- Logging: Record verification in audit log

---

## Compliance Requirements

### HIPAA Requirements

**Retention:**
- PHI: 6 years minimum
- Access logs: 6 years minimum
- Audit trails: 6 years minimum

**Destruction:**
- Secure deletion required
- Overwrite data before deletion
- Verify deletion completion

**Current Compliance:**
- ✅ Retention periods defined
- ✅ Retention enforcement method exists
- ⚠️ Secure deletion not implemented
- ⚠️ Automatic purging not scheduled

---

### State Bar Requirements

**Retention:**
- Client files: 5-7 years (varies by jurisdiction)
- Billing records: 5-7 years
- Time records: 5-7 years

**Destruction:**
- Secure deletion recommended
- Document destruction activities
- Maintain destruction logs

**Current Compliance:**
- ✅ Retention periods defined (7 years)
- ⚠️ Destruction procedures to be implemented
- ⚠️ Destruction logging to be implemented

---

## Recommendations

### Critical (Pre-Beta)

1. **Implement Secure Deletion:**
   - Complete `secureDelete()` implementation
   - Add file overwrite functionality
   - Verify deletion completion

2. **Schedule Retention Enforcement:**
   - Create OS cron job for retention enforcement
   - Run daily/weekly
   - Log enforcement activities

### High Priority (Post-Beta)

1. **Implement Retention Enforcement for All Data Types:**
   - Client matter data
   - Email drafts
   - Arkiver files
   - Generated documents

2. **Implement Destruction Verification:**
   - Database deletion verification
   - File deletion verification
   - Logging and alerting

3. **Document Destruction Procedures:**
   - Create destruction workflow
   - Document destruction steps
   - Train staff on procedures

---

## Implementation Status

### Completed

- [x] Retention periods defined
- [x] Retention policy check implemented
- [x] Retention enforcement method exists (wellness data)
- [x] Soft delete implemented

### Pending

- [ ] Secure deletion implementation
- [ ] Retention enforcement scheduling
- [ ] Retention enforcement for all data types
- [ ] Destruction verification
- [ ] Destruction logging

---

## References

- `Cyrano/src/services/hipaa-compliance.ts` - HIPAA compliance service
- `docs/security/ENCRYPTION_AT_REST_STATUS.md` - Encryption status
- `docs/security/DATA_GOVERNANCE_POLICY.md` - Data governance policy
- HIPAA Privacy Rule (45 CFR 164.530)
- State Bar of Michigan Ethics Rules

---

**Last Updated:** 2025-12-28
