---
Document ID: RAG-DATA-SOURCES
Title: RAG Pipeline Data Sources
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-26 (2025-W48)
Last Substantive Revision: 2025-11-26 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Date:** 2025-11-26  
**Status:** Implementation Complete

---

## Data Source Transparency

The RAG (Retrieval-Augmented Generation) pipeline processes documents from multiple sources. This document outlines all data sources and how they are tracked and displayed.

---

## Supported Data Sources

### 1. **User-Uploaded Documents**
- **Source Type:** `user-upload`
- **Description:** Documents manually uploaded by users through the LexFiat interface
- **Tracking:** Document ID, upload timestamp, user identifier
- **Notice:** "This information was retrieved from user-uploaded documents"

### 2. **Email Attachments**
- **Source Type:** `email`
- **Description:** Documents extracted from email attachments via Gmail/Outlook integration
- **Tracking:** Email ID, sender, date, attachment filename
- **Notice:** "This information was retrieved from email attachments processed by the system"

### 3. **Clio Integration**
- **Source Type:** `clio`
- **Description:** Documents and case information from Clio practice management system
- **Tracking:** Clio matter ID, document ID, sync timestamp
- **Notice:** "This information was retrieved from Clio practice management system"

### 4. **CourtListener**
- **Source Type:** `courtlistener`
- **Description:** Public legal documents and case law from CourtListener API
- **Tracking:** CourtListener case ID, court, date
- **Notice:** "This information was retrieved from public legal documents via CourtListener"

### 5. **Westlaw**
- **Source Type:** `westlaw`
- **Description:** Legal research documents imported from Westlaw
- **Tracking:** Westlaw document ID, import date
- **Notice:** "This information was retrieved from Westlaw legal research database"

### 6. **Manual Entry**
- **Source Type:** `manual`
- **Description:** Documents or text manually entered into the system
- **Tracking:** Entry timestamp, user identifier
- **Notice:** "This information was manually entered into the system"

---

## Data Source Attribution

### In API Responses

All RAG query results include:
- `dataSources`: Array of unique source identifiers
- `sourceNotice`: Human-readable notice about data sources
- `citations`: Each citation includes `source` and `sourceType` fields

### In UI Display

The LexFiat UI displays data source information:
- Source badges on retrieved content
- Source notice banner on RAG results
- Citation tooltips showing source details
- Settings page showing all data sources in use

---

## Implementation

### RAG Service

The `RAGService` class tracks sources:
- Documents include `source` and `sourceType` fields
- All chunks preserve source metadata
- Query results include aggregated source information

### RAG Query Tool

The `rag_query` MCP tool:
- Accepts `source` and `sourceType` when ingesting documents
- Returns `dataSources` and `sourceNotice` in query results
- Includes source information in all citations

---

## User Notices

### In-Game/Application Notices

When users interact with RAG features, they see:

1. **On Document Ingestion:**
   - "Document ingested from source: [source name]. This document will be available for retrieval in RAG queries."

2. **On Query Results:**
   - "This response was generated using information from the following sources: [sources list]. All retrieved information includes source attribution for transparency and verification."

3. **In Settings:**
   - List of all data sources currently in the system
   - Option to filter by source type
   - Source statistics and usage

---

## Privacy and Security

- User-uploaded documents are marked as private
- Email documents retain sender/recipient privacy
- Clio documents respect Clio access permissions
- Public sources (CourtListener, Westlaw) are clearly marked
- All source tracking is for transparency, not data sharing

---

## Future Enhancements

- Source filtering in queries
- Source-based access controls
- Source quality scoring
- Source expiration/archival policies

---

**Status:** Fully implemented with source tracking and user notices

