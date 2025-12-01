---
Document ID: OPEN-SOURCE-IMPLEMENTATION-PLAN
Title: Open Source Implementation Plan
Subject(s): Cyrano
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Open Source Implementation Plan
**Created:** 2025-01-27  
**Purpose:** Implementation plan for integrating recommended open-source libraries  
**Status:** Ready for Implementation

---

## Executive Summary

This plan implements Step 6: Search for Open-Source Enhancements. Research has been completed (`OPEN_SOURCE_RESEARCH.md`), and this document provides the implementation roadmap for TypeScript/Node.js compatible libraries.

---

## Already Integrated

### Current Dependencies (from package.json)

✅ **pdf-parse** (v2.4.5)
- PDF text extraction
- Status: Integrated in PDF extractor

✅ **mammoth** (v1.11.0)
- DOCX text extraction
- Status: Integrated in DOCX extractor

✅ **tesseract.js** (v6.0.1)
- OCR for scanned documents
- Status: Available, needs integration

✅ **zod** (v3.25.76)
- Schema validation
- Status: Widely used

✅ **vitest** (v4.0.13)
- Testing framework
- Status: Configured

---

## Recommended Integrations

### Priority 1: High Value, Low Effort

#### 1. Enhanced PDF Extraction

**Current:** `pdf-parse` (basic text extraction)

**Enhancement Options:**

**Option A: pdf.js (Mozilla)**
- **Package:** `pdfjs-dist`
- **License:** Apache 2.0
- **Stars:** 47K
- **Status:** ✅ Very Active
- **Value:** Better layout analysis, table extraction
- **Effort:** 3-4 hours
- **Priority:** 🟡 Medium (current solution works)

**Option B: Keep pdf-parse, enhance with layout analysis**
- **Value:** Lower effort, incremental improvement
- **Effort:** 2-3 hours
- **Priority:** 🟢 High (pragmatic)

**Recommendation:** Option B - Enhance current implementation

---

#### 2. OCR Integration (tesseract.js)

**Status:** ✅ Already installed, needs integration

**Implementation:**
- Add OCR support to PDF extractor
- Enable for scanned documents
- Configuration option: `enableOCR`

**Effort:** 4-5 hours  
**Priority:** 🟢 High (already have library)

**Code Location:**
- `Cyrano/src/modules/arkiver/extractors/pdf-extractor.ts`
- Add OCR fallback when text extraction fails

---

#### 3. JSON Rules Engine

**Package:** `json-rules-engine`
- **License:** MIT
- **Status:** ✅ Active
- **Value:** Ethics rules for GoodCounsel engine
- **Effort:** 4-6 hours
- **Priority:** 🟡 Medium (GoodCounsel not yet complete)

**Use Case:**
- GoodCounsel ethics monitoring
- Rule-based decision making
- Compliance checking

**Recommendation:** Defer to Step 9 (GoodCounsel implementation)

---

#### 4. CourtListener API Integration

**API:** CourtListener API (free tier available)
- **License:** Free API
- **Value:** Citation resolution and validation
- **Effort:** 3-4 hours
- **Priority:** 🟢 High (enhances citation formatter)

**Implementation:**
- Add API client for CourtListener
- Integrate with citation formatter
- Validate citations against real case data

**Code Location:**
- `Cyrano/src/tools/verification/citation-checker.ts`
- New service: `Cyrano/src/services/courtlistener.ts`

---

### Priority 2: Testing Enhancements

#### 5. Playwright for E2E Testing

**Package:** `playwright`
- **License:** Apache 2.0
- **Status:** ✅ Very Active (Microsoft)
- **Value:** E2E testing for LexFiat
- **Effort:** 3-4 hours
- **Priority:** 🟡 Medium (LexFiat UI not yet complete)

**Recommendation:** Defer to Step 7 (LexFiat UI/UX)

---

## Implementation Roadmap

### Phase 1: Immediate (Step 6)

**Timeline:** 1-2 days

1. **OCR Integration** (4-5 hours)
   - [ ] Add OCR support to PDF extractor
   - [ ] Add `enableOCR` configuration option
   - [ ] Test with scanned PDFs
   - [ ] Update documentation

2. **CourtListener API Integration** (3-4 hours)
   - [ ] Create CourtListener API client
   - [ ] Integrate with citation checker
   - [ ] Add citation validation endpoint
   - [ ] Test with sample citations

**Total Effort:** 7-9 hours  
**Deliverables:**
- Enhanced PDF extractor with OCR
- CourtListener API integration
- Updated documentation

---

### Phase 2: Short-term (Step 9+)

**Timeline:** After core development

3. **JSON Rules Engine** (4-6 hours)
   - [ ] Install and configure
   - [ ] Create ethics rules definitions
   - [ ] Integrate with GoodCounsel engine
   - [ ] Test rule evaluation

4. **Enhanced PDF Extraction** (2-3 hours)
   - [ ] Evaluate pdf.js vs current solution
   - [ ] Implement layout analysis if needed
   - [ ] Test with complex PDFs

5. **Playwright E2E Testing** (3-4 hours)
   - [ ] Install and configure
   - [ ] Create test suite for LexFiat
   - [ ] Set up CI/CD integration

**Total Effort:** 9-13 hours

---

## Detailed Implementation

### 1. OCR Integration

**File:** `Cyrano/src/modules/arkiver/extractors/pdf-extractor.ts`

**Changes:**
```typescript
import Tesseract from 'tesseract.js';

export class PDFExtractor {
  async extract(
    buffer: Buffer,
    options: ExtractionOptions
  ): Promise<ExtractionResult> {
    // Try text extraction first
    let text = await this.extractText(buffer);
    
    // If OCR enabled and text extraction failed/insufficient
    if (options.enableOCR && (!text || text.length < 100)) {
      text = await this.extractWithOCR(buffer);
    }
    
    return { text, ... };
  }
  
  private async extractWithOCR(buffer: Buffer): Promise<string> {
    const { data: { text } } = await Tesseract.recognize(
      buffer,
      'eng',
      { logger: m => console.log(m) }
    );
    return text;
  }
}
```

**Configuration:**
```typescript
interface ExtractionOptions {
  extractionMode: 'standard' | 'deep' | 'fast';
  enableOCR?: boolean; // New option
}
```

---

### 2. CourtListener API Integration

**New File:** `Cyrano/src/services/courtlistener.ts`

```typescript
export class CourtListenerService {
  private apiKey: string;
  private baseUrl = 'https://www.courtlistener.com/api/rest/v3';
  
  constructor() {
    this.apiKey = process.env.COURTLISTENER_API_KEY || '';
  }
  
  async searchCitation(citation: string): Promise<CaseResult | null> {
    // Search for citation in CourtListener database
    const response = await fetch(
      `${this.baseUrl}/search/?q=${encodeURIComponent(citation)}`,
      {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
        },
      }
    );
    
    const data = await response.json();
    return data.results?.[0] || null;
  }
  
  async validateCitation(citation: string): Promise<ValidationResult> {
    const caseData = await this.searchCitation(citation);
    
    return {
      valid: !!caseData,
      caseData: caseData || undefined,
      confidence: caseData ? 1.0 : 0.0,
    };
  }
}
```

**Integration:** `Cyrano/src/tools/verification/citation-checker.ts`

```typescript
import { courtListenerService } from '../services/courtlistener.js';

export class CitationChecker {
  async validateCitation(citation: string): Promise<ValidationResult> {
    // Try CourtListener first
    const courtListenerResult = await courtListenerService.validateCitation(citation);
    
    if (courtListenerResult.valid) {
      return courtListenerResult;
    }
    
    // Fallback to pattern matching
    return this.validateByPattern(citation);
  }
}
```

---

## Environment Variables

Add to `.env`:

```bash
# CourtListener API (optional, free tier available)
COURTLISTENER_API_KEY=your_api_key_here

# OCR Configuration
ARKIVER_OCR_LANGUAGE=eng
ARKIVER_OCR_WORKER_PATH=./node_modules/tesseract.js-core/tesseract-core.wasm.js
```

---

## Testing

### OCR Testing

```typescript
// tests/extractors/pdf-extractor-ocr.test.ts
import { PDFExtractor } from '../../src/modules/arkiver/extractors/pdf-extractor.js';
import { readFileSync } from 'fs';

describe('PDFExtractor with OCR', () => {
  it('should extract text from scanned PDF using OCR', async () => {
    const extractor = new PDFExtractor();
    const buffer = readFileSync('./test-fixtures/scanned-document.pdf');
    
    const result = await extractor.extract(buffer, {
      extractionMode: 'standard',
      enableOCR: true,
    });
    
    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(100);
  });
});
```

### CourtListener Testing

```typescript
// tests/services/courtlistener.test.ts
import { CourtListenerService } from '../../src/services/courtlistener.js';

describe('CourtListenerService', () => {
  it('should validate known citation', async () => {
    const service = new CourtListenerService();
    const result = await service.validateCitation('500 F.3d 100');
    
    expect(result.valid).toBe(true);
    expect(result.caseData).toBeDefined();
  });
});
```

---

## Status

✅ **Research Complete:**
- Open source libraries identified
- TypeScript-compatible options selected
- Implementation plan created

⏳ **Ready for Implementation:**
- OCR integration (tesseract.js)
- CourtListener API integration

📋 **Deferred:**
- JSON Rules Engine (Step 9)
- Playwright (Step 7)
- Enhanced PDF extraction (Step 9)

---

## Next Steps

1. **Implement OCR integration** (4-5 hours)
2. **Implement CourtListener API** (3-4 hours)
3. **Test and document** (1-2 hours)
4. **Update package.json** with any new dependencies

**Total Estimated Time:** 8-11 hours

---

**Last Updated:** 2025-01-27  
**Next Review:** After implementation




