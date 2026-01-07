# Data Flow Diagram

**Date:** 2025-12-28  
**Status:** Active  
**Purpose:** Document client data flow through the Cyrano system, including processing, storage, transmission, and third-party integrations

---

## Overview

This document provides data flow diagrams and descriptions for how client data flows through the Cyrano legal AI system, from input to storage to third-party processing.

---

## High-Level Data Flow

```mermaid
flowchart TD
    User[User Input] --> Frontend[LexFiat Frontend]
    Frontend --> HTTP[HTTP Bridge]
    HTTP --> MCP[MCP Server]
    MCP --> Engine[BaseEngine/MAE]
    Engine --> AI[AI Service]
    Engine --> Tools[Tools]
    Engine --> Modules[Modules]
    Tools --> DB[(PostgreSQL Database)]
    Tools --> Filesystem[File System]
    Modules --> RAG[RAG Service]
    RAG --> VectorDB[(Vector Database)]
    AI --> ThirdParty[Third-Party AI Providers]
    Tools --> ThirdParty
    DB --> Backup[Backup Storage]
    Filesystem --> Backup
```

---

## Detailed Data Flow: Document Processing

```mermaid
flowchart TD
    Upload[User Uploads Document] --> Processor[Document Processor]
    Processor --> Redact{Redaction Required?}
    Redact -->|Yes| RedactTool[Redaction Tool]
    Redact -->|No| Analyze[Document Analyzer]
    RedactTool --> Analyze
    Analyze --> AI[AI Service]
    AI --> Perplexity[Perplexity API]
    AI --> OpenRouter[OpenRouter]
    AI --> Anthropic[Anthropic Claude]
    AI --> OpenAI[OpenAI GPT]
    Analyze --> RAG[RAG Service]
    RAG --> VectorDB[(Vector Database)]
    Processor --> Filesystem[File System Storage]
    Processor --> DB[(Database Metadata)]
    RAG --> DB
```

---

## Detailed Data Flow: AI-Generated Content

```mermaid
flowchart TD
    User[User Request] --> Engine[BaseEngine]
    Engine --> AI[AI Service]
    AI --> Provider{AI Provider}
    Provider -->|Perplexity| Perplexity[Perplexity API]
    Provider -->|OpenRouter| OpenRouter[OpenRouter API]
    Provider -->|Anthropic| Anthropic[Anthropic API]
    Provider -->|OpenAI| OpenAI[OpenAI API]
    Perplexity --> Response[AI Response]
    OpenRouter --> Response
    Anthropic --> Response
    OpenAI --> Response
    Response --> Ethics[Ethics Check]
    Ethics --> MRPC[MRPC Check]
    MRPC --> MCR[MCR Validation]
    MCR --> Warning[Add Warnings]
    Warning --> User
    Response --> Audit[Audit Log]
    Audit --> DB[(Database)]
```

---

## Data Storage Flow

```mermaid
flowchart TD
    Data[Client Data] --> Type{Data Type}
    Type -->|Wellness| Encrypt[Encryption Service]
    Type -->|Credentials| Encrypt
    Type -->|Documents| Filesystem[File System]
    Type -->|Metadata| DB[(PostgreSQL)]
    Encrypt --> DB
    Filesystem --> Cloud{Cloud Storage?}
    Cloud -->|OneDrive| OneDrive[Microsoft OneDrive]
    Cloud -->|Google Drive| GoogleDrive[Google Drive]
    Cloud -->|S3| S3[Amazon S3]
    Cloud -->|Local| Local[Local Filesystem]
    DB --> Backup[Backup Storage]
    Filesystem --> Backup
    OneDrive --> Backup
    GoogleDrive --> Backup
    S3 --> Backup
    Local --> Backup
```

---

## Third-Party Data Sharing Flow

```mermaid
flowchart TD
    User[User Input] --> Tool[Tool/Module]
    Tool --> AI[AI Service]
    AI --> Select{Provider Selection}
    Select -->|Perplexity| Perplexity[Perplexity API<br/>Data: Prompts, Documents]
    Select -->|OpenRouter| OpenRouter[OpenRouter API<br/>Data: Prompts, Documents]
    Select -->|Anthropic| Anthropic[Anthropic API<br/>Data: Prompts, Documents]
    Select -->|OpenAI| OpenAI[OpenAI API<br/>Data: Prompts, Documents]
    Perplexity --> Retention1[Perplexity Retention Policy]
    OpenRouter --> Retention2[OpenRouter Retention Policy]
    Anthropic --> Retention3[Anthropic Retention Policy]
    OpenAI --> Retention4[OpenAI Retention Policy]
    Tool --> Cloud{Cloud Storage?}
    Cloud -->|OneDrive| OneDrive[Microsoft OneDrive<br/>Data: Files]
    Cloud -->|Google Drive| GoogleDrive[Google Drive<br/>Data: Files]
    Cloud -->|S3| S3[Amazon S3<br/>Data: Files]
    OneDrive --> Retention5[Microsoft Retention Policy]
    GoogleDrive --> Retention6[Google Retention Policy]
    S3 --> Retention7[AWS Retention Policy]
```

---

## Data Encryption Flow

```mermaid
flowchart TD
    Input[Sensitive Data] --> Type{Data Type}
    Type -->|Wellness| WellnessEncrypt[Wellness Encryption<br/>AES-256-GCM]
    Type -->|Credentials| CredEncrypt[Credential Encryption<br/>AES-256-GCM]
    Type -->|PII| PIIEncrypt[PII Encryption<br/>AES-256-GCM]
    WellnessEncrypt --> Key1[Master Key<br/>WELLNESS_ENCRYPTION_KEY]
    CredEncrypt --> Key1
    PIIEncrypt --> Key1
    Key1 --> PBKDF2[PBKDF2 Key Derivation<br/>100k iterations]
    PBKDF2 --> FieldKey[Field-Specific Key]
    FieldKey --> AES[AES-256-GCM Encryption]
    AES --> Encrypted[Encrypted Data]
    Encrypted --> DB[(Database)]
    Encrypted --> Filesystem[File System]
```

---

## RAG Pipeline Data Flow

```mermaid
flowchart TD
    Document[Document Input] --> Source{Source Type}
    Source -->|User Upload| UserUpload[User-Uploaded]
    Source -->|Email| Email[Email Attachment]
    Source -->|Clio| Clio[Clio Integration]
    Source -->|CourtListener| CourtListener[CourtListener API]
    Source -->|Westlaw| Westlaw[Westlaw Integration]
    UserUpload --> Processor[Document Processor]
    Email --> Processor
    Clio --> Processor
    CourtListener --> Processor
    Westlaw --> Processor
    Processor --> Chunk[Text Chunking]
    Chunk --> Embed[Embedding Generation]
    Embed --> VectorDB[(Vector Database)]
    Processor --> Metadata[Metadata Extraction]
    Metadata --> DB[(PostgreSQL)]
    VectorDB --> Query[RAG Query]
    Query --> Search[Vector Search]
    Search --> Results[Retrieved Documents]
    Results --> AI[AI Service]
    AI --> Response[AI Response with Citations]
    Response --> User[User]
```

---

## Audit Logging Flow

```mermaid
flowchart TD
    Action[User Action] --> Log[Audit Logger]
    Log --> Type{Action Type}
    Type -->|Document Access| DocLog[Document Access Log]
    Type -->|Wellness Access| WellnessLog[Wellness Access Log]
    Type -->|Data Operation| DataLog[Data Operation Log]
    DocLog --> Encrypt[Encrypt Sensitive Fields]
    WellnessLog --> Encrypt
    DataLog --> Encrypt
    Encrypt --> DB[(Audit Tables)]
    DB --> Retention{Retention Check}
    Retention -->|Expired| Purge[Automatic Purge]
    Retention -->|Active| Keep[Retain]
    DB --> Review[Audit Review Interface]
    Review --> Security[Security Review]
```

---

## Data Transmission Security

### In Transit Encryption

**All Data Transmission:**
- HTTPS/TLS for HTTP Bridge
- TLS for database connections
- TLS for API calls to third parties
- Encrypted OAuth token transmission

**Implementation:**
- HTTP Bridge: Express with HTTPS support
- Database: TLS connection strings
- API Calls: HTTPS endpoints
- OAuth: TLS-protected OAuth flows

---

## Data Processing Locations

### Local Processing

**Location:** User's local machine or server

**Data Processed:**
- Document processing (redaction, analysis)
- RAG query processing
- Workflow execution
- Encryption/decryption

**Third-Party Access:** None (local processing only)

---

### Cloud Processing

**Location:** Third-party AI providers

**Data Processed:**
- AI-generated content
- Document analysis
- Legal research queries

**Third-Party Access:**
- Perplexity AI
- OpenRouter (routes to underlying providers)
- Anthropic Claude
- OpenAI GPT
- Google Gemini

**Data Shared:**
- User prompts
- Document content
- Query text

---

## Data Retention by Third Parties

### AI Providers

**Perplexity:**
- Retention: Per Perplexity privacy policy
- BAA: Not available
- Use: Research and analysis only

**OpenRouter:**
- Retention: Per underlying provider policies
- BAA: Not available
- Use: Research and analysis only

**Anthropic:**
- Retention: Per Anthropic privacy policy
- BAA: Not available (as of 2025-12-28)
- Use: Document generation and analysis

**OpenAI:**
- Retention: Per OpenAI privacy policy
- BAA: Not available (as of 2025-12-28)
- Use: Document generation and analysis

**Google:**
- Retention: Per Google privacy policy
- BAA: Not available (as of 2025-12-28)
- Use: Document generation and analysis

---

## Recommendations

### Data Minimization

1. **Redaction Before AI Processing:**
   - Redact client confidential information before sending to AI providers
   - Use redaction tool before document analysis
   - Minimize data shared with third parties

2. **Local Processing:**
   - Process sensitive documents locally when possible
   - Use RAG for document retrieval (local processing)
   - Minimize third-party AI usage for confidential work

3. **Encryption:**
   - Encrypt all data before transmission
   - Encrypt all data at rest
   - Use end-to-end encryption for third-party sharing

---

## Compliance Considerations

### Attorney-Client Privilege

**Protection Measures:**
- Encrypt sensitive data at rest
- Minimize third-party data sharing
- Use redaction before AI processing
- Document all data access

**Risks:**
- Third-party AI providers may retain data
- No BAA protection for most providers
- Attorney-client privilege may be waived

**Recommendations:**
- Obtain client consent for third-party AI usage
- Use AI only for non-confidential work
- Review AI provider privacy policies

---

### HIPAA Compliance

**Protected Health Information (PHI):**
- Wellness journal entries: Encrypted
- Health-related data: Encrypted
- Access logging: Implemented

**Compliance Measures:**
- Encryption at rest for PHI
- Access controls implemented
- Audit logging implemented
- Retention policies defined

**Gaps:**
- No BAA with AI providers
- No BAA with most cloud storage providers
- Retention enforcement incomplete

---

## Next Steps

1. **Complete Data Flow Documentation:**
   - Document all data flows
   - Document all third-party integrations
   - Document all data retention policies

2. **Implement Enhanced Security:**
   - End-to-end encryption for third-party sharing
   - Key management service
   - Enhanced audit logging

3. **Negotiate BAAs:**
   - Negotiate BAAs with AI providers
   - Negotiate BAAs with cloud storage providers
   - Document BAA status

---

**Last Updated:** 2025-12-28
