---
Document ID: CITATION-FORMATTER
Title: Citation Formatter Tool
Subject(s): General
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

The Citation Formatter is a jurisdiction-specific citation checker and corrector that enforces citation rules according to different legal jurisdictions. It can process single citations or entire documents.

**CRITICAL:** In Michigan state courts, the Michigan Appellate Opinions Manual controls over all other citation formats. **No periods in abbreviations is a MANDATORY RULE, not a preference.**

## Features

- **Jurisdiction-Specific Rules**: Enforces Michigan, Federal, and Bluebook citation formats
- **Auto-Detection**: Automatically detects jurisdiction from citation content
- **Document Processing**: Can process entire documents with multiple citations
- **Correction**: Actively corrects citations to proper format
- **Validation**: Validates citations against jurisdiction rules

## Supported Jurisdictions

### Michigan (MANDATORY Rules)
- **Source**: Michigan Appellate Opinions Manual
- **Key Rule**: No periods in abbreviations (MANDATORY)
- **Examples**:
  - `N.W.2d` → `NW 2d`
  - `Mich.` → `Mich`
  - `M.C.L.` → `MCL`
  - `M.C.R.` → `MCR`

### Federal
- **Source**: Federal Court Rules, local rules, Bluebook (supplemental)
- **Format**: Generally follows Bluebook with periods
- **Examples**:
  - `FR Civ P` → `Fed. R. Civ. P.`
  - `FRE` → `Fed. R. Evid.`
  - `F. 2d` → `F.2d`

### Bluebook
- **Source**: The Bluebook: A Uniform System of Citation
- **Format**: Standard legal citation format (reference/fallback)

## Usage

### Single Citation

```typescript
import { citationFormatter, Jurisdiction } from './tools/verification/citation-formatter.js';

const result = await citationFormatter.formatCitations({
  text: 'People v Smith, 500 N.W.2d 100 (2020)',
  jurisdiction: Jurisdiction.MICHIGAN,
  correct: true,
  strictMode: true,
});

// Result:
// {
//   original: 'People v Smith, 500 N.W.2d 100 (2020)',
//   corrected: 'People v Smith, 500 NW 2d 100 (2020)',
//   jurisdiction: 'michigan',
//   changes: [
//     { type: 'removed_period', description: 'Remove periods from N.W.2d' },
//     { type: 'added_space', description: 'Add space in NW2d → NW 2d' }
//   ],
//   confidence: 0.8,
//   ruleSource: 'Michigan Appellate Opinions Manual § 1:8 (Punctuation in Case Citations)'
// }
```

### Document Mode

```typescript
const doc = `
In People v Smith, 500 N.W.2d 100 (2020), the court held that M.C.L. 600.2922
applies. See also Doe v Roe, 300 Mich. App. 456 (2019).
`;

const result = await citationFormatter.formatCitations({
  text: doc,
  jurisdiction: Jurisdiction.MICHIGAN,
  documentMode: true,
  correct: true,
  strictMode: true,
});

// Result:
// {
//   totalCitations: 3,
//   correctedCitations: 3,
//   uncorrectableCitations: 0,
//   corrections: [...],
//   summary: {
//     byJurisdiction: { michigan: 3, ... },
//     byType: { case: 2, statutory: 1 }
//   },
//   correctedText: '... (with all citations corrected)'
// }
```

### Auto-Detection

```typescript
// Automatically detects jurisdiction from citation content
const result = await citationFormatter.formatCitations({
  text: 'M.C.L. 600.2922', // Detects Michigan
  jurisdiction: Jurisdiction.AUTO,
  correct: true,
});
```

## Citation Types Supported

### Case Citations
- Traditional: `People v Smith, 500 Mich 123 (2020)`
- Short-form: `Smith, 500 Mich at 59`
- Id.: `Id. at 59`
- Supra: `Smith, supra at 59`

### Statutory Citations
- Michigan: `MCL 600.2922`
- Federal: `42 U.S.C. § 1983`
- Court Rules: `MCR 2.116(C)(10)`, `Fed. R. Civ. P. 52(a)`

### Public Domain Citations
- Michigan: `2020 MI 45`, `2020 MI App 123, ¶ 12`

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | required | Text containing citations (single or document) |
| `jurisdiction` | Jurisdiction | `AUTO` | Target jurisdiction or auto-detect |
| `correct` | boolean | `true` | Whether to correct citations |
| `strictMode` | boolean | `true` | Strict enforcement (Michigan: mandatory rules) |
| `documentMode` | boolean | `false` | Process entire document vs single citation |

## Return Types

### Single Citation Result
```typescript
interface CitationCorrection {
  original: string;
  corrected: string;
  jurisdiction: Jurisdiction;
  changes: Array<{
    type: 'removed_period' | 'added_space' | 'removed_space' | 'format_change' | 'reporter_change';
    description: string;
    position?: { start: number; end: number };
  }>;
  confidence: number; // 0.0-1.0
  ruleSource: string;
  error?: string;
}
```

### Document Result
```typescript
interface DocumentCitationResult {
  totalCitations: number;
  correctedCitations: number;
  uncorrectableCitations: number;
  corrections: CitationCorrection[];
  summary: {
    byJurisdiction: Record<Jurisdiction, number>;
    byType: Record<string, number>;
  };
  correctedText: string;
}
```

## MCP Integration

The tool is registered as `citation_formatter` in the MCP server and HTTP bridge.

**Tool Name**: `citation_formatter`

**Example MCP Call**:
```json
{
  "name": "citation_formatter",
  "arguments": {
    "text": "People v Smith, 500 N.W.2d 100 (2020)",
    "jurisdiction": "michigan",
    "correct": true,
    "strictMode": true
  }
}
```

## Examples

### Michigan Citation Correction

**Input**: `People v Smith, 500 N.W.2d 100 (2020)`  
**Output**: `People v Smith, 500 NW 2d 100 (2020)`  
**Changes**: Removed periods from `N.W.2d`, added space in `NW2d`

**Input**: `M.C.L. 600.2922`  
**Output**: `MCL 600.2922`  
**Changes**: Removed periods from `M.C.L.`

### Federal Citation Correction

**Input**: `FR Civ P 52(a)`  
**Output**: `Fed. R. Civ. P. 52(a)`  
**Changes**: Expanded abbreviation

**Input**: `Smith v Jones, 500 F. 2d 100 (2020)`  
**Output**: `Smith v Jones, 500 F.2d 100 (2020)`  
**Changes**: Normalized spacing

## Important Notes

1. **Michigan Rules are MANDATORY**: The Michigan Appellate Opinions Manual controls in Michigan state courts. No periods in abbreviations is a rule, not a preference.

2. **Auto-Detection**: When `jurisdiction: AUTO`, the tool detects jurisdiction from citation content. Michigan indicators include: `MCL`, `MCR`, `Mich`, `NW`, `MI App`, etc.

3. **Document Mode**: In document mode, each citation is processed individually and jurisdiction is detected per citation (useful for mixed-jurisdiction documents).

4. **Confidence Scores**: Lower confidence indicates potential issues or uncertainty in correction.

5. **Error Handling**: Invalid citations return with low confidence but don't throw errors.

## Integration with Other Tools

The Citation Formatter works alongside:
- **Citation Checker**: Validates citations
- **Claim Extractor**: Extracts claims that may contain citations
- **Potemkin Engine**: Uses for document verification
- **Arkiver Processors**: Processes extracted citations from documents

## Testing

Run tests with:
```bash
npm test citation-formatter
```

Or use the test file:
```bash
npx tsx test-citation-formatter.ts
```

## References

- [Michigan Appellate Opinions Manual](https://www.courts.michigan.gov/siteassets/publications/manuals/msc/miappopmanual.pdf)
- [The Bluebook: A Uniform System of Citation](https://www.legalbluebook.com/)
- Federal Rules of Civil Procedure
- Federal Rules of Criminal Procedure
- Federal Rules of Evidence

