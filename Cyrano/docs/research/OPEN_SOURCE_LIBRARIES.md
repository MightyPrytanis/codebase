---
Document ID: OPEN-SOURCE-LIBRARIES
Title: Open Source Libraries
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

# Open-Source Libraries Survey for Legal Tech

**Created:** 2025-11-24  
**Purpose:** Identify and evaluate open-source libraries for legal document processing, citation parsing, and legal research

---

## Overview

### Evaluation Criteria
- **License**: MIT, Apache 2.0, BSD preferred (permissive)
- **Maintenance**: Active development, recent commits
- **TypeScript Support**: Native TypeScript or type definitions available
- **Documentation**: Clear docs, examples, API reference
- **Community**: GitHub stars, contributors, issues response
- **Integration**: Ease of integration with Cyrano

### Priority Levels
- 🟢 **High**: Critical for core functionality, integrate immediately
- 🟡 **Medium**: Useful for enhancements, integrate if time permits
- 🔴 **Low**: Nice-to-have, defer to future phases

---

## 1. Document Parsing

### PDF Parsing

#### pdf-parse
- **Repository**: https://github.com/modesty/pdf-parse
- **NPM**: `pdf-parse` (1.1.1)
- **License**: MIT
- **Stars**: 2.3K
- **Maintenance**: ⚠️ Last commit 2023 (low activity)
- **TypeScript**: ✅ Type definitions available via `@types/pdf-parse`
- **Priority**: 🟡 Medium

**Pros:**
- Simple API, easy to use
- Extracts text, metadata, page info
- Works with Node.js buffers
- Well-documented

**Cons:**
- Limited maintenance
- No layout/structure preservation
- No table extraction
- No OCR support

**Usage Example:**
```typescript
import fs from 'fs';
import pdf from 'pdf-parse';

const dataBuffer = fs.readFileSync('document.pdf');
const data = await pdf(dataBuffer);

console.log(data.text);       // Extracted text
console.log(data.numpages);   // Number of pages
console.log(data.info);       // PDF metadata
```

**Integration Notes:**
- Use for basic text extraction from PDFs
- Combine with `pdf.js` for better layout analysis
- Consider Apache Tika for complex PDFs

---

#### pdf.js (Mozilla)
- **Repository**: https://github.com/mozilla/pdf.js
- **NPM**: `pdfjs-dist` (4.0.379)
- **License**: Apache 2.0
- **Stars**: 47K
- **Maintenance**: ✅ Active (daily commits)
- **TypeScript**: ✅ TypeScript definitions included
- **Priority**: 🟢 High

**Pros:**
- Industry standard, used by Firefox
- Excellent rendering and parsing
- Preserves layout and structure
- Supports annotations, forms
- Canvas rendering for preview

**Cons:**
- Larger bundle size
- More complex API
- Primarily browser-focused (but works in Node)

**Usage Example:**
```typescript
import * as pdfjsLib from 'pdfjs-dist';

const loadingTask = pdfjsLib.getDocument('document.pdf');
const pdf = await loadingTask.promise;

for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const textContent = await page.getTextContent();
  const text = textContent.items.map(item => item.str).join(' ');
  console.log(`Page ${i}:`, text);
}
```

**Integration Notes:**
- Use for advanced PDF parsing with layout preservation
- Essential for extracting structured data (tables, forms)
- Enable canvas rendering for document preview in UI

---

#### Apache Tika (via tika-server)
- **Repository**: https://github.com/apache/tika
- **Docker**: `apache/tika:latest`
- **License**: Apache 2.0
- **Maintenance**: ✅ Active (Apache project)
- **TypeScript**: ✅ Via REST API (Node client available)
- **Priority**: 🟢 High

**Pros:**
- Supports 1000+ file formats (PDF, DOCX, images, etc.)
- OCR support (with Tesseract)
- Metadata extraction
- Language detection
- Robust and battle-tested

**Cons:**
- Requires Java/Docker deployment
- REST API adds latency
- Heavier resource usage

**Usage Example:**
```typescript
import axios from 'axios';
import fs from 'fs';

const fileBuffer = fs.readFileSync('document.pdf');

const response = await axios.put('http://localhost:9998/tika', fileBuffer, {
  headers: { 'Content-Type': 'application/pdf' },
});

const text = response.data;
console.log(text);
```

**Integration Notes:**
- Deploy Tika as Docker container alongside Cyrano
- Use for multi-format document ingestion
- Essential for OCR of scanned documents
- Cache results to minimize latency

---

### DOCX Parsing

#### mammoth.js
- **Repository**: https://github.com/mwilliamson/mammoth.js
- **NPM**: `mammoth` (1.6.0)
- **License**: BSD-2-Clause
- **Stars**: 8K
- **Maintenance**: ⚠️ Moderate (last commit 2023)
- **TypeScript**: ✅ Type definitions available via `@types/mammoth`
- **Priority**: 🟡 Medium

**Pros:**
- Clean HTML/Markdown output from DOCX
- Preserves formatting and structure
- Simple API
- Good documentation

**Cons:**
- Limited to DOCX format
- No write support (read-only)
- Some complex formatting lost

**Usage Example:**
```typescript
import mammoth from 'mammoth';

const result = await mammoth.extractRawText({ path: 'document.docx' });
console.log(result.value);  // Plain text

const htmlResult = await mammoth.convertToHtml({ path: 'document.docx' });
console.log(htmlResult.value);  // HTML
```

**Integration Notes:**
- Use for DOCX → plain text conversion
- Generate HTML preview for UI
- Combine with Tika for broader format support

---

#### docx (Office Open XML)
- **Repository**: https://github.com/dolanmiu/docx
- **NPM**: `docx` (8.5.0)
- **License**: MIT
- **Stars**: 4.5K
- **Maintenance**: ✅ Active
- **TypeScript**: ✅ Written in TypeScript
- **Priority**: 🟡 Medium

**Pros:**
- Full read/write support for DOCX
- Generate DOCX documents programmatically
- Excellent TypeScript support
- Well-documented

**Cons:**
- More complex for simple parsing
- Focused on generation, not parsing

**Usage Example:**
```typescript
import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        children: [
          new TextRun('Legal Document Title'),
        ],
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('generated.docx', buffer);
```

**Integration Notes:**
- Use for generating legal documents from templates
- Create automated filings, briefs, contracts
- Combine with template engine for dynamic content

---

### HTML/Email Parsing

#### cheerio
- **Repository**: https://github.com/cheeriojs/cheerio
- **NPM**: `cheerio` (1.0.0-rc.12)
- **License**: MIT
- **Stars**: 28K
- **Maintenance**: ✅ Active
- **TypeScript**: ✅ Type definitions included
- **Priority**: 🟢 High

**Pros:**
- jQuery-like API for HTML parsing
- Fast and efficient
- Server-side DOM manipulation
- Excellent for email parsing

**Cons:**
- No JavaScript execution (not a browser)
- No CSS rendering

**Usage Example:**
```typescript
import * as cheerio from 'cheerio';

const $ = cheerio.load('<html><body><p>Hello</p></body></html>');
const text = $('p').text();  // "Hello"

// Email parsing
const emailBody = $(emailHtml).find('.email-content').text();
```

**Integration Notes:**
- Use for parsing email bodies (Gmail, Outlook exports)
- Extract structured data from HTML documents
- Clean up and normalize HTML content

---

## 2. Citation Parsing & Legal References

### Blue Book / Legal Citation Parsers

#### citation-js
- **Repository**: https://github.com/citation-js/citation-js
- **NPM**: `@citation-js/core` (0.7.9)
- **License**: MIT
- **Stars**: 1.6K
- **Maintenance**: ✅ Active
- **TypeScript**: ⚠️ Partial (JSDoc types)
- **Priority**: 🟡 Medium

**Pros:**
- Parse and format citations (BibTeX, CSL, etc.)
- Multiple output formats
- Extensible plugin system
- Good documentation

**Cons:**
- Not legal-specific (academic focus)
- Blue Book support requires custom plugin
- TypeScript support incomplete

**Usage Example:**
```typescript
import { Cite } from '@citation-js/core';

const cite = new Cite('Q30000000');  // Wikidata ID
const bibtex = cite.format('bibtex');
const apa = cite.format('bibliography', { format: 'text', template: 'apa' });
```

**Integration Notes:**
- Use for general citation parsing
- Extend with custom Blue Book plugin
- Integrate with legal citation validator

---

#### Legal Citation Parser (custom implementation needed)
- **Status**: ❌ No comprehensive open-source solution found
- **Recommendation**: Build custom parser based on Michigan Appellate Opinion Manual
- **Priority**: 🟢 High

**Requirements:**
- Parse Blue Book citations (cases, statutes, court rules)
- Validate citation format
- Extract components (case name, reporter, court, year)
- Support jurisdictional variations

**Implementation Plan:**
1. Use regex patterns for citation structure
2. Leverage `chevrotain` or `peggy` for parsing grammar
3. Build validator based on Blue Book rules
4. Add jurisdiction-specific rules (Michigan, federal, etc.)

**Potential Libraries:**
- `chevrotain`: Parser building toolkit
- `peggy`: Parser generator
- `regex-railroad`: Visualize regex patterns

---

### Case Law & Statutes

#### CourtListener API
- **API**: https://www.courtlistener.com/api/rest-info/
- **License**: API access (free tier available)
- **Documentation**: ✅ Excellent
- **Priority**: 🟢 High

**Pros:**
- Comprehensive case law database
- Free access to opinions
- API for searching, filtering
- Citation resolution

**Cons:**
- Rate limits on free tier
- Requires account
- US-focused

**Usage Example:**
```typescript
import axios from 'axios';

const response = await axios.get('https://www.courtlistener.com/api/rest/v3/search/', {
  params: {
    q: 'First Amendment',
    type: 'o',  // Opinions
  },
  headers: {
    'Authorization': `Token ${process.env.COURTLISTENER_API_KEY}`,
  },
});

const cases = response.data.results;
```

**Integration Notes:**
- Use for citation verification
- Fetch full text of opinions
- Resolve citations to cases
- Build legal research features

---

#### Free Law Project Libraries
- **Repository**: https://github.com/freelawproject
- **License**: Various (mostly permissive)
- **Maintenance**: ✅ Active (non-profit)
- **Priority**: 🟢 High

**Key Projects:**
- `juriscraper`: Court website scrapers
- `courtlistener`: Case law aggregation
- `doctor`: Document converter (RECAP, etc.)
- `eyecite`: Citation extraction and resolution

**eyecite Usage Example:**
```typescript
// Note: Python library, would need Node wrapper
import { exec } from 'child_process';

const text = 'See Smith v. Jones, 123 F.3d 456 (9th Cir. 2020)';
exec(`python -c "from eyecite import get_citations; print(get_citations('${text}'))"`, (err, stdout) => {
  console.log(stdout);  // Extracted citations
});
```

**Integration Notes:**
- Use `eyecite` for citation extraction (wrap Python lib or port to JS)
- Integrate CourtListener API for case lookup
- Use `juriscraper` for court data updates

---

## 3. Document Comparison & Diff

#### diff-match-patch
- **Repository**: https://github.com/google/diff-match-patch
- **NPM**: `diff-match-patch` (1.0.5)
- **License**: Apache 2.0
- **Stars**: 2.5K
- **Maintenance**: ⚠️ Stable (infrequent updates)
- **TypeScript**: ⚠️ Via `@types/diff-match-patch`
- **Priority**: 🟢 High

**Pros:**
- Google-maintained
- Efficient diff algorithm
- Patch generation/application
- Handles large documents

**Cons:**
- Plain text only (no structure awareness)
- Basic API

**Usage Example:**
```typescript
import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();
const diffs = dmp.diff_main('Original text', 'Modified text');
dmp.diff_cleanupSemantic(diffs);

console.log(diffs);  // Array of [operation, text] tuples
```

**Integration Notes:**
- Use for document version comparison
- Generate redlines for contract revisions
- Track changes in legal briefs

---

#### jsdiff
- **Repository**: https://github.com/kpdecker/jsdiff
- **NPM**: `diff` (5.2.0)
- **License**: BSD-3-Clause
- **Stars**: 3.8K
- **Maintenance**: ✅ Active
- **TypeScript**: ✅ Type definitions included
- **Priority**: 🟢 High

**Pros:**
- Multiple diff modes (lines, words, characters, JSON)
- Patch generation
- Simple API
- TypeScript support

**Cons:**
- Less efficient for very large documents

**Usage Example:**
```typescript
import * as Diff from 'diff';

const diff = Diff.diffLines('Original\ntext', 'Modified\ntext');

diff.forEach(part => {
  const prefix = part.added ? '+' : part.removed ? '-' : ' ';
  console.log(prefix + part.value);
});
```

**Integration Notes:**
- Use for line-by-line comparison
- Generate unified diff format for Git-like diffs
- Support JSON diff for structured data

---

#### monaco-editor (diff editor)
- **Repository**: https://github.com/microsoft/monaco-editor
- **NPM**: `monaco-editor` (0.44.0)
- **License**: MIT
- **Stars**: 39K
- **Maintenance**: ✅ Active (Microsoft)
- **TypeScript**: ✅ Written in TypeScript
- **Priority**: 🟡 Medium (UI component)

**Pros:**
- VS Code's editor engine
- Built-in diff viewer
- Syntax highlighting
- Feature-rich

**Cons:**
- Browser only (no Node.js)
- Large bundle size
- Complex integration

**Usage Example:**
```typescript
import * as monaco from 'monaco-editor';

const diffEditor = monaco.editor.createDiffEditor(document.getElementById('container'), {
  enableSplitViewResizing: true,
  renderSideBySide: true,
});

diffEditor.setModel({
  original: monaco.editor.createModel('Original text', 'text/plain'),
  modified: monaco.editor.createModel('Modified text', 'text/plain'),
});
```

**Integration Notes:**
- Use for UI document comparison
- Display redlines in web interface
- Integrate with Cyrano's document viewer

---

## 4. Natural Language Processing (Legal-Specific)

#### spaCy (via spacy-to-json)
- **Repository**: https://github.com/explosion/spaCy
- **NPM**: `spacy` (via Python bridge or REST API)
- **License**: MIT
- **Stars**: 29K
- **Maintenance**: ✅ Active
- **TypeScript**: Via REST API wrapper
- **Priority**: 🟢 High

**Pros:**
- State-of-the-art NLP
- Named entity recognition (NER)
- Legal-specific models available
- Dependency parsing, POS tagging

**Cons:**
- Python dependency
- Requires separate service
- Models can be large

**Usage Example:**
```typescript
// Via REST API (spaCy-services)
import axios from 'axios';

const response = await axios.post('http://localhost:8000/api/parse', {
  text: 'The plaintiff, John Doe, filed a complaint in the Eastern District of Michigan.',
  model: 'en_legal_ner',
});

const entities = response.data.ents;  // Extract persons, organizations, locations
```

**Integration Notes:**
- Deploy spaCy as microservice
- Use legal NER model for entity extraction
- Extract parties, courts, dates from legal docs
- Consider blackstone-spacy for UK law

---

#### Compromise
- **Repository**: https://github.com/spencermountain/compromise
- **NPM**: `compromise` (14.10.0)
- **License**: MIT
- **Stars**: 11K
- **Maintenance**: ✅ Active
- **TypeScript**: ⚠️ Partial (JSDoc types)
- **Priority**: 🟡 Medium

**Pros:**
- Pure JavaScript NLP
- No external dependencies
- Fast and lightweight
- Good for basic NLP tasks

**Cons:**
- Less accurate than spaCy
- No legal-specific models
- Limited advanced NLP features

**Usage Example:**
```typescript
import nlp from 'compromise';

const doc = nlp('The plaintiff, John Doe, filed a complaint.');
const people = doc.people().out('array');  // ["John Doe"]
const nouns = doc.nouns().out('array');    // ["plaintiff", "complaint"]
```

**Integration Notes:**
- Use for lightweight NLP tasks
- Good for quick entity extraction
- Faster than spaCy for simple cases
- Extend with custom legal terms

---

## 5. Date & Time Parsing (Legal Deadlines)

#### chrono-node
- **Repository**: https://github.com/wanasit/chrono
- **NPM**: `chrono-node` (2.7.4)
- **License**: MIT
- **Stars**: 5K
- **Maintenance**: ✅ Active
- **TypeScript**: ✅ Type definitions included
- **Priority**: 🟢 High

**Pros:**
- Natural language date parsing
- Handles complex expressions ("30 days from now", "next Tuesday")
- Multiple locales
- Deadline calculation support

**Cons:**
- Some ambiguous cases require context
- Not legal-specific (no court calendar rules)

**Usage Example:**
```typescript
import * as chrono from 'chrono-node';

const text = 'The deadline is 30 days from August 15, 2025';
const results = chrono.parse(text, new Date('2025-08-15'));

console.log(results[0].start.date());  // 2025-09-14
```

**Integration Notes:**
- Use for extracting deadlines from documents
- Calculate filing dates, statute of limitations
- Combine with court calendar rules (e.g., exclude weekends/holidays)
- Build deadline tracker feature

---

#### date-fns
- **Repository**: https://github.com/date-fns/date-fns
- **NPM**: `date-fns` (3.0.6)
- **License**: MIT
- **Stars**: 34K
- **Maintenance**: ✅ Active
- **TypeScript**: ✅ Written in TypeScript
- **Priority**: 🟢 High

**Pros:**
- Comprehensive date manipulation
- Immutable, functional API
- Tree-shakeable (small bundle)
- Excellent TypeScript support

**Cons:**
- Doesn't parse natural language (use with chrono-node)

**Usage Example:**
```typescript
import { addDays, isWeekend, nextMonday, format } from 'date-fns';

let deadline = addDays(new Date('2025-08-15'), 30);  // Add 30 days

// Skip weekends
if (isWeekend(deadline)) {
  deadline = nextMonday(deadline);
}

console.log(format(deadline, 'PPP'));  // "September 14th, 2025"
```

**Integration Notes:**
- Use for date arithmetic (add days, business days, etc.)
- Handle court calendar rules (skip weekends/holidays)
- Format dates for display
- Combine with chrono-node for full date parsing + manipulation

---

## 6. Text Analysis & Search

#### flexsearch
- **Repository**: https://github.com/nextapps-de/flexsearch
- **NPM**: `flexsearch` (0.7.43)
- **License**: Apache 2.0
- **Stars**: 12K
- **Maintenance**: ✅ Active
- **TypeScript**: ⚠️ Via `@types/flexsearch`
- **Priority**: 🟡 Medium

**Pros:**
- Fastest full-text search for JavaScript
- Fuzzy matching
- Phonetic search
- Low memory footprint

**Cons:**
- In-memory only (no persistence)
- No distributed search

**Usage Example:**
```typescript
import FlexSearch from 'flexsearch';

const index = new FlexSearch.Index({ tokenize: 'forward' });

index.add(1, 'The plaintiff filed a motion for summary judgment.');
index.add(2, 'The defendant responded with a counterclaim.');

const results = index.search('motion');  // [1]
```

**Integration Notes:**
- Use for in-memory document search
- Index legal briefs, cases, emails
- Provide instant search in UI
- Combine with database for persistence

---

#### fuse.js
- **Repository**: https://github.com/krisk/fuse
- **NPM**: `fuse.js` (7.0.0)
- **License**: Apache 2.0
- **Stars**: 17K
- **Maintenance**: ✅ Active
- **TypeScript**: ✅ Type definitions included
- **Priority**: 🟡 Medium

**Pros:**
- Fuzzy search
- Weighted search (score fields differently)
- No dependencies
- Browser and Node.js

**Cons:**
- Slower than flexsearch for large datasets
- In-memory only

**Usage Example:**
```typescript
import Fuse from 'fuse.js';

const documents = [
  { title: 'Motion for Summary Judgment', content: '...' },
  { title: 'Response to Motion', content: '...' },
];

const fuse = new Fuse(documents, {
  keys: ['title', 'content'],
  threshold: 0.3,  // Fuzzy match threshold
});

const results = fuse.search('summry judgement');  // Finds despite typos
```

**Integration Notes:**
- Use for fuzzy search in UI
- Handle typos in legal term search
- Search across document metadata
- Good for small to medium datasets

---

## 7. PDF Generation

#### pdfkit
- **Repository**: https://github.com/foliojs/pdfkit
- **NPM**: `pdfkit` (0.14.0)
- **License**: MIT
- **Stars**: 9K
- **Maintenance**: ⚠️ Moderate
- **TypeScript**: ⚠️ Via `@types/pdfkit`
- **Priority**: 🟢 High

**Pros:**
- Generate PDFs programmatically
- Vector graphics support
- Text layout and formatting
- Embed fonts

**Cons:**
- Complex API for advanced layouts
- No HTML → PDF

**Usage Example:**
```typescript
import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('output.pdf'));

doc.fontSize(25).text('Legal Document Title', 100, 100);
doc.fontSize(12).text('This is the document body.', 100, 150);

doc.end();
```

**Integration Notes:**
- Use for generating legal PDFs from data
- Create automated filings, reports
- Combine with templates for consistent formatting
- Good for simple layouts

---

#### puppeteer (HTML → PDF)
- **Repository**: https://github.com/puppeteer/puppeteer
- **NPM**: `puppeteer` (21.6.1)
- **License**: Apache 2.0
- **Stars**: 87K
- **Maintenance**: ✅ Active (Google)
- **TypeScript**: ✅ Type definitions included
- **Priority**: 🟢 High

**Pros:**
- Convert HTML → PDF with full CSS support
- Headless Chrome rendering
- High-fidelity output
- Screenshots, automation

**Cons:**
- Requires Chrome binary (large)
- Resource-intensive
- Slower than pdfkit

**Usage Example:**
```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.setContent('<html><body><h1>Legal Document</h1></body></html>');
await page.pdf({ path: 'output.pdf', format: 'Letter' });

await browser.close();
```

**Integration Notes:**
- Use for HTML → PDF conversion
- Generate PDFs from templates (Handlebars, EJS, etc.)
- Render complex layouts with CSS
- Good for branded documents with logos, formatting

---

## 8. OCR (Optical Character Recognition)

#### tesseract.js
- **Repository**: https://github.com/naptha/tesseract.js
- **NPM**: `tesseract.js` (5.0.4)
- **License**: Apache 2.0
- **Stars**: 34K
- **Maintenance**: ✅ Active
- **TypeScript**: ✅ Type definitions included
- **Priority**: 🟢 High

**Pros:**
- Pure JavaScript OCR
- No external dependencies
- Supports 100+ languages
- Works in browser and Node.js

**Cons:**
- Slower than native Tesseract
- Less accurate on low-quality scans
- Large model files

**Usage Example:**
```typescript
import Tesseract from 'tesseract.js';

const { data: { text } } = await Tesseract.recognize(
  'scanned_document.png',
  'eng',
  { logger: m => console.log(m) }
);

console.log(text);  // Extracted text
```

**Integration Notes:**
- Use for OCR of scanned legal documents
- Essential for digitizing paper records
- Combine with PDF parsing for searchable PDFs
- Consider Apache Tika for better accuracy

---

## 9. Workflow & Task Management

#### Bull (Redis-based queues)
- **Repository**: https://github.com/OptimalBits/bull
- **NPM**: `bull` (4.12.0)
- **License**: MIT
- **Stars**: 15K
- **Maintenance**: ✅ Active
- **TypeScript**: ⚠️ Via `@types/bull`
- **Priority**: 🟡 Medium

**Pros:**
- Robust job queues
- Delayed jobs, retries
- Rate limiting
- UI dashboard (bull-board)

**Cons:**
- Requires Redis
- More complex setup

**Usage Example:**
```typescript
import Queue from 'bull';

const documentQueue = new Queue('document-processing', 'redis://localhost:6379');

documentQueue.process(async job => {
  const { documentId } = job.data;
  // Process document
  return { status: 'complete' };
});

await documentQueue.add({ documentId: '12345' });
```

**Integration Notes:**
- Use for background document processing
- Queue OCR, extraction, analysis tasks
- Retry failed operations
- Monitor with bull-board UI

---

## 10. Authentication & Authorization

#### Passport.js
- **Repository**: https://github.com/jaredhanson/passport
- **NPM**: `passport` (0.7.0)
- **License**: MIT
- **Stars**: 22K
- **Maintenance**: ✅ Active
- **TypeScript**: ⚠️ Via `@types/passport`
- **Priority**: 🟡 Medium

**Pros:**
- 500+ authentication strategies
- OAuth, SAML, JWT, local
- Express/Node.js integration
- Well-documented

**Cons:**
- Middleware-based (Express-specific)
- Callback-heavy API

**Usage Example:**
```typescript
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

passport.use(new LocalStrategy(
  async (username, password, done) => {
    const user = await findUser(username);
    if (!user || !await verifyPassword(user, password)) {
      return done(null, false);
    }
    return done(null, user);
  }
));
```

**Integration Notes:**
- Use for user authentication
- Support OAuth (Google, Microsoft) for law firms
- JWT for API authentication
- SAML for enterprise SSO

---

## 11. Database & ORM

#### Prisma
- **Repository**: https://github.com/prisma/prisma
- **NPM**: `prisma` (5.7.1)
- **License**: Apache 2.0
- **Stars**: 37K
- **Maintenance**: ✅ Active
- **TypeScript**: ✅ Written in TypeScript
- **Priority**: 🟢 High

**Pros:**
- Type-safe database access
- Auto-generated client
- Migrations
- Multiple databases (PostgreSQL, MySQL, SQLite)

**Cons:**
- Opinionated schema
- Learning curve

**Usage Example:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const case = await prisma.case.create({
  data: {
    title: 'Smith v. Jones',
    court: 'Eastern District of Michigan',
    filingDate: new Date('2025-08-15'),
  },
});
```

**Integration Notes:**
- Use as primary ORM for Cyrano
- Store cases, documents, users, tasks
- Type-safe queries prevent SQL injection
- Easy migrations for schema changes

---

## 12. API & HTTP

#### Axios
- **Repository**: https://github.com/axios/axios
- **NPM**: `axios` (1.6.2)
- **License**: MIT
- **Stars**: 105K
- **Maintenance**: ✅ Active
- **TypeScript**: ✅ Type definitions included
- **Priority**: 🟢 High

**Pros:**
- Promise-based HTTP client
- Request/response interceptors
- Timeout support
- Automatic JSON parsing

**Cons:**
- Larger than native fetch
- Browser + Node.js bundle

**Usage Example:**
```typescript
import axios from 'axios';

const response = await axios.get('https://api.courtlistener.com/api/rest/v3/search/', {
  params: { q: 'First Amendment' },
  headers: { Authorization: `Token ${process.env.API_KEY}` },
});

const cases = response.data.results;
```

**Integration Notes:**
- Use for external API calls (CourtListener, Clio, etc.)
- Standardize HTTP error handling
- Add interceptors for auth, logging

---

## Summary & Recommendations

### Immediate Integration (High Priority) 🟢
1. **pdf.js**: Advanced PDF parsing with layout preservation
2. **Apache Tika**: Multi-format document parsing + OCR
3. **cheerio**: HTML/email parsing
4. **CourtListener API**: Case law access and citation resolution
5. **diff-match-patch** or **jsdiff**: Document comparison
6. **spaCy** (via microservice): Legal NER and entity extraction
7. **chrono-node** + **date-fns**: Date parsing and deadline calculation
8. **tesseract.js**: OCR for scanned documents
9. **puppeteer**: HTML → PDF conversion
10. **Prisma**: Database ORM
11. **Axios**: HTTP client

### Consider for Enhancements (Medium Priority) 🟡
1. **mammoth.js**: DOCX parsing
2. **docx**: DOCX generation
3. **citation-js**: General citation parsing
4. **Compromise**: Lightweight NLP
5. **flexsearch** or **fuse.js**: In-memory search
6. **pdfkit**: PDF generation
7. **Bull**: Background job queues
8. **Passport.js**: Authentication
9. **monaco-editor**: UI diff viewer

### Defer to Future (Low Priority) 🔴
1. Custom plugins/extensions as needed
2. Specialized legal databases (paid services)
3. Advanced ML models (LLMs for legal analysis)

### Custom Development Needed
1. **Legal Citation Parser**: No comprehensive open-source solution; build based on Blue Book rules
2. **Michigan-specific validator**: Already in progress
3. **Court calendar rules**: Custom logic for jurisdictional deadline calculation
4. **Legal template engine**: Combine docx + puppeteer with custom templates

---

**Last Updated:** 2025-11-24  
**Next Review:** Q1 2026
