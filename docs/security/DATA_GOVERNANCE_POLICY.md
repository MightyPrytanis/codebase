# Data Governance Policy

**Date:** 2025-12-28  
**Status:** Active  
**Purpose:** Document data storage locations, third-party data sharing, state bar ethics compliance, and subpoena response procedures

---

## Executive Summary

This document defines the data governance policy for the Cyrano legal AI system, including where client data is stored, what data is shared with third parties, compliance with state bar ethics opinions, and procedures for responding to subpoenas.

**Scope:**
- Data storage locations (local vs. cloud)
- Third-party data sharing (AI providers, cloud services)
- State bar ethics compliance
- Subpoena response procedures
- Data retention and destruction

---

## Data Storage Locations

### 1. Database Storage

**Primary Database:** PostgreSQL

**Location:**
- Local development: Local PostgreSQL instance
- Production: TBD (cloud provider to be determined)

**Data Stored:**
- User accounts and authentication
- Practice profiles
- Library items metadata
- Wellness journal entries (encrypted)
- Email drafts
- Arkiver file metadata
- Audit logs

**Encryption:**
- Wellness data: Fully encrypted (AES-256-GCM)
- Integration credentials: Encrypted
- Other data: Encryption status varies (see `ENCRYPTION_AT_REST_STATUS.md`)

---

### 2. File System Storage

**Local Filesystem:**
- Library item files (user-specified paths)
- Arkiver uploaded files
- Generated documents
- Temporary processing files
- Wellness audio files (encrypted)

**Cloud Storage (Optional):**
- OneDrive (if configured)
- Google Drive (if configured)
- Amazon S3 (if configured)

**Encryption:**
- Wellness audio files: Encrypted
- Other files: Encryption status depends on storage backend (see `ENCRYPTION_AT_REST_STATUS.md`)

---

### 3. Vector Database (RAG)

**Storage:**
- Document embeddings stored in vector database
- Location: TBD (local or cloud)

**Data Stored:**
- Document embeddings (vector representations)
- Document metadata
- Source tracking information

**Encryption:**
- Encryption status: TBD (requires verification)

---

## Third-Party Data Sharing

### 1. AI Providers

#### Perplexity AI

**Data Shared:**
- User prompts and queries
- Document content (when analyzing documents)
- Legal research queries

**Data Retention:**
- Perplexity privacy policy applies
- No Business Associate Agreement (BAA) available
- Data may be used for model improvement

**Compliance:**
- ⚠️ No HIPAA BAA
- ⚠️ No attorney-client privilege protection
- ⚠️ Data may be retained by Perplexity

**Recommendations:**
- Avoid sharing client confidential information in prompts
- Use redaction before sending documents to Perplexity
- Consider using Perplexity only for non-confidential research

---

#### OpenRouter

**Data Shared:**
- User prompts and queries
- Document content (when analyzing documents)
- Legal research queries

**Data Retention:**
- OpenRouter privacy policy applies
- No Business Associate Agreement (BAA) available
- Data routed to underlying AI providers (OpenAI, Anthropic, etc.)

**Compliance:**
- ⚠️ No HIPAA BAA
- ⚠️ No attorney-client privilege protection
- ⚠️ Data may be retained by underlying providers

**Recommendations:**
- Avoid sharing client confidential information in prompts
- Use redaction before sending documents to OpenRouter
- Consider using OpenRouter only for non-confidential research

---

#### Anthropic (Claude)

**Data Shared:**
- User prompts and queries
- Document content (when analyzing documents)

**Data Retention:**
- Anthropic privacy policy applies
- No Business Associate Agreement (BAA) available (as of 2025-12-28)
- Data may be used for model improvement

**Compliance:**
- ⚠️ No HIPAA BAA
- ⚠️ No attorney-client privilege protection
- ⚠️ Data may be retained by Anthropic

**Recommendations:**
- Avoid sharing client confidential information in prompts
- Use redaction before sending documents to Anthropic
- Consider using Anthropic only for non-confidential work

---

#### OpenAI (GPT)

**Data Shared:**
- User prompts and queries
- Document content (when analyzing documents)

**Data Retention:**
- OpenAI privacy policy applies
- No Business Associate Agreement (BAA) available (as of 2025-12-28)
- Data may be used for model improvement

**Compliance:**
- ⚠️ No HIPAA BAA
- ⚠️ No attorney-client privilege protection
- ⚠️ Data may be retained by OpenAI

**Recommendations:**
- Avoid sharing client confidential information in prompts
- Use redaction before sending documents to OpenAI
- Consider using OpenAI only for non-confidential work

---

#### Google (Gemini)

**Data Shared:**
- User prompts and queries
- Document content (when analyzing documents)

**Data Retention:**
- Google privacy policy applies
- No Business Associate Agreement (BAA) available (as of 2025-12-28)
- Data may be used for model improvement

**Compliance:**
- ⚠️ No HIPAA BAA
- ⚠️ No attorney-client privilege protection
- ⚠️ Data may be retained by Google

**Recommendations:**
- Avoid sharing client confidential information in prompts
- Use redaction before sending documents to Google
- Consider using Google only for non-confidential work

---

### 2. Cloud Storage Providers

#### OneDrive (Microsoft)

**Data Shared:**
- Library item files (if OneDrive enabled)
- Document files stored in OneDrive

**Data Retention:**
- Microsoft privacy policy applies
- No Business Associate Agreement (BAA) available (as of 2025-12-28)

**Compliance:**
- ⚠️ No HIPAA BAA
- ⚠️ Attorney-client privilege protection uncertain

**Recommendations:**
- Encrypt files before uploading to OneDrive
- Use only for non-confidential documents
- Consider using OneDrive only with client consent

---

#### Google Drive

**Data Shared:**
- Library item files (if Google Drive enabled)
- Document files stored in Google Drive

**Data Retention:**
- Google privacy policy applies
- No Business Associate Agreement (BAA) available (as of 2025-12-28)

**Compliance:**
- ⚠️ No HIPAA BAA
- ⚠️ Attorney-client privilege protection uncertain

**Recommendations:**
- Encrypt files before uploading to Google Drive
- Use only for non-confidential documents
- Consider using Google Drive only with client consent

---

#### Amazon S3

**Data Shared:**
- Library item files (if S3 enabled)
- Document files stored in S3

**Data Retention:**
- AWS privacy policy applies
- Business Associate Agreement (BAA) available for HIPAA compliance

**Compliance:**
- ✅ HIPAA BAA available
- ⚠️ Attorney-client privilege protection depends on configuration

**Recommendations:**
- Use S3 with BAA for HIPAA-covered data
- Encrypt files before uploading to S3
- Configure S3 bucket encryption

---

### 3. Practice Management Integrations

#### Clio

**Data Shared:**
- Matter information
- Client information
- Document metadata
- Case status information

**Data Retention:**
- Clio privacy policy applies
- No Business Associate Agreement (BAA) available (as of 2025-12-28)

**Compliance:**
- ⚠️ No HIPAA BAA
- ⚠️ Attorney-client privilege protection depends on Clio's policies

**Recommendations:**
- Review Clio's privacy policy and data handling practices
- Ensure Clio integration complies with state bar ethics opinions
- Use Clio only with client consent

---

## State Bar Ethics Compliance

### Michigan State Bar Ethics Opinions

**Relevant Opinions:**
- State Bar of Michigan Ethics Opinion RI-381 (Cloud Computing)
- State Bar of Michigan Ethics Opinion RI-382 (Technology Competence)

**Key Requirements:**
1. **Competence (MRPC 1.1):**
   - Attorneys must understand technology used
   - Attorneys must supervise AI assistance
   - Attorneys must review AI-generated work product

2. **Confidentiality (MRPC 1.6):**
   - Attorneys must protect client confidential information
   - Attorneys must ensure third-party services protect confidentiality
   - Attorneys must obtain client consent for cloud storage

3. **Supervision (MRPC 5.3):**
   - Attorneys must supervise nonlawyer assistants (including AI)
   - Attorneys must ensure AI work is compatible with professional obligations
   - Attorneys must review AI-generated work product

**Compliance Measures:**
- ✅ Attorney review warnings on all AI-generated content
- ✅ MRPC compliance checks in workflows
- ✅ Encryption for sensitive data
- ⚠️ Third-party data sharing requires client consent
- ⚠️ Cloud storage requires client consent

---

## Subpoena Response Procedures

### 1. Receipt of Subpoena

**Immediate Actions:**
1. **Preserve Data:**
   - Do not delete any data subject to subpoena
   - Implement litigation hold
   - Document all actions taken

2. **Legal Review:**
   - Consult with attorney (if applicable)
   - Review subpoena scope and requirements
   - Identify responsive documents

3. **Client Notification:**
   - Notify affected clients
   - Obtain client consent if required
   - Coordinate response with clients

---

### 2. Data Preservation

**Procedures:**
1. **Identify Responsive Data:**
   - Search database for responsive records
   - Identify files subject to subpoena
   - Document search methodology

2. **Preserve Data:**
   - Create backup of responsive data
   - Implement litigation hold
   - Prevent deletion or modification

3. **Document Chain of Custody:**
   - Document all data access
   - Maintain audit trail
   - Preserve metadata

---

### 3. Attorney-Client Privilege Protection

**Procedures:**
1. **Identify Privileged Documents:**
   - Review documents for attorney-client privilege
   - Review documents for work product protection
   - Document privilege claims

2. **Privilege Log:**
   - Create privilege log for withheld documents
   - Document privilege basis
   - Provide privilege log to requesting party

3. **Redaction:**
   - Redact privileged information from responsive documents
   - Use document redaction tool
   - Verify redaction completeness

---

### 4. Data Production

**Procedures:**
1. **Format:**
   - Produce data in requested format
   - Maintain original format when possible
   - Provide metadata and audit trails

2. **Verification:**
   - Verify data completeness
   - Verify data integrity
   - Document production process

3. **Delivery:**
   - Deliver data securely
   - Use encrypted transmission
   - Obtain receipt confirmation

---

## Data Retention and Destruction

### Retention Periods

**Client Data:**
- Active matters: Retain while matter is active
- Closed matters: Retain per state bar requirements (typically 5-7 years)
- Client files: Retain per state bar requirements

**Wellness Data:**
- Retain per HIPAA requirements (typically 6 years)
- Soft delete implemented (deletedAt timestamp)
- Hard delete after retention period

**Audit Logs:**
- Retain per HIPAA requirements (typically 6 years)
- Automatic purging after retention period (to be implemented)

**System Logs:**
- Retain 90 days (configurable)
- Automatic rotation and deletion

---

### Destruction Procedures

**Secure Deletion:**
1. **Database Records:**
   - Soft delete (set deletedAt timestamp)
   - Hard delete after retention period
   - Verify deletion

2. **Files:**
   - Delete files from filesystem
   - Overwrite deleted files (if possible)
   - Verify deletion

3. **Encrypted Data:**
   - Delete encryption keys (if data no longer needed)
   - Verify data cannot be recovered

**Documentation:**
- Document all data destruction
- Maintain destruction logs
- Verify destruction completion

---

## Recommendations

### Pre-Beta

1. **Document Third-Party Agreements:**
   - Review all third-party privacy policies
   - Document data sharing agreements
   - Identify BAA availability

2. **Client Consent:**
   - Develop client consent forms for cloud storage
   - Develop client consent forms for third-party AI providers
   - Document client consent procedures

3. **Data Minimization:**
   - Minimize data shared with third parties
   - Use redaction before sharing documents
   - Avoid sharing client confidential information

### Post-Beta

1. **BAA Negotiations:**
   - Negotiate BAAs with AI providers where possible
   - Negotiate BAAs with cloud storage providers
   - Document BAA status

2. **Enhanced Encryption:**
   - Implement end-to-end encryption for third-party sharing
   - Encrypt all data before transmission
   - Implement key management service

3. **Audit and Monitoring:**
   - Implement data access auditing
   - Monitor third-party data sharing
   - Alert on unusual data access

---

## Compliance Checklist

### Pre-Beta

- [x] Document data storage locations
- [x] Document third-party data sharing
- [x] Document state bar ethics compliance measures
- [x] Document subpoena response procedures
- [ ] Review third-party privacy policies
- [ ] Develop client consent forms
- [ ] Document data retention periods

### Post-Beta

- [ ] Negotiate BAAs with providers
- [ ] Implement enhanced encryption
- [ ] Implement data access auditing
- [ ] Implement data destruction procedures
- [ ] Test subpoena response procedures

---

## References

- `docs/security/ENCRYPTION_AT_REST_STATUS.md` - Encryption status
- `docs/security/CREDENTIAL_MANAGEMENT.md` - Credential management
- `docs/security/DATA_RETENTION_POLICY.md` - Data retention policy
- `docs/AI_INTEGRATIONS_SETUP.md` - AI integration setup
- State Bar of Michigan Ethics Opinions RI-381, RI-382

---

**Last Updated:** 2025-12-28
