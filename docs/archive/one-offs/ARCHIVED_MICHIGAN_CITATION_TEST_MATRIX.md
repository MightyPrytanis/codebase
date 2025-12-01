---
Document ID: ARCHIVED-MICHIGAN_CITATION_TEST_MATRIX
Title: Michigan Citation Test Matrix
Subject(s): Archived | Limited Utility
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Document archived due to limited current or future utility (mock data, test files, old/duplicate content, etc.)
Status: Archived
---

**ARCHIVED:** This document has limited current or future utility and has been archived. Archived 2025-11-28.

---

---
Document ID: MICHIGAN-CITATION-TEST-MATRIX
Title: Michigan Citation Test Matrix
Subject(s): Cyrano | Testing
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Michigan Citation Test Matrix

**Created:** 2025-11-24  
**Purpose:** Define comprehensive test coverage for Michigan citation validator

---

## Test Categories

### 1. Traditional Case Citations

#### Valid Formats
| Test Case | Format | Expected | Notes |
|-----------|--------|----------|-------|
| Michigan Supreme Court | `People v Smith, 500 Mich 123 (2020)` | ✅ Accept | No periods in abbreviations |
| With pinpoint | `People v Smith, 500 Mich 123, 125 (2020)` | ✅ Accept | Pinpoint page included |
| Court of Appeals | `Doe v Roe, 300 Mich App 456 (2019)` | ✅ Accept | Mich App format |
| Northwestern Reporter | `Smith v Jones, 500 NW 2d 100 (2020)` | ✅ Accept | Regional reporter, no periods |
| NW 3d series | `Smith v Jones, 500 NW 3d 100 (2020)` | ✅ Accept | Third series |
| Without year | `People v Smith, 500 Mich 123` | ✅ Accept | Year optional |
| Without court | `People v Smith, 500 Mich 123 (2020)` | ✅ Accept | Court optional for official reporters |

#### Invalid/Warning Formats
| Test Case | Format | Expected | Reason |
|-----------|--------|----------|--------|
| Periods in Mich | `People v Smith, 500 Mich. 123 (2020)` | ⚠️ Warn | Michigan disfavors periods |
| Periods in reporter | `People v Smith, 500 N.W.2d 100 (2020)` | ⚠️ Warn | Should be NW 2d |
| Periods in court | `People v Smith, 500 Mich 123 (Mich. 2020)` | ⚠️ Warn | Should be Mich not Mich. |
| Parallel citations | `People v Smith, 500 Mich 123, 600 NW 2d 200 (2020)` | ⚠️ Warn | No longer required in Michigan |
| Unknown reporter | `People v Smith, 500 Unknown 123 (2020)` | ❌ Invalid | Reporter not recognized |
| Missing volume | `People v Smith, Mich 123 (2020)` | ❌ Invalid | Volume required |
| Missing page | `People v Smith, 500 Mich (2020)` | ❌ Invalid | Page required |

### 2. Public Domain Citations

#### Valid Formats
| Test Case | Format | Expected | Notes |
|-----------|--------|----------|-------|
| Supreme Court | `People v Smith, 2020 MI 45` | ✅ Accept | Public domain format |
| With paragraph | `People v Smith, 2020 MI 45, ¶ 12` | ✅ Accept | Paragraph pinpoint |
| Court of Appeals | `Doe v Roe, 2019 MI App 123` | ✅ Accept | MI App for CoA |
| With comma before para | `People v Smith, 2020 MI 45, ¶ 12` | ✅ Accept | Comma optional |
| Without para | `People v Smith, 2020 MI 45` | ✅ Accept | Paragraph optional |

#### Invalid Formats
| Test Case | Format | Expected | Reason |
|-----------|--------|----------|--------|
| Wrong court code | `People v Smith, 2020 Mich 45` | ❌ Invalid | Should be MI not Mich |
| Missing year | `People v Smith, MI 45` | ❌ Invalid | Year required |
| Missing sequence | `People v Smith, 2020 MI` | ❌ Invalid | Sequence number required |
| Invalid paragraph | `People v Smith, 2020 MI 45, para 12` | ⚠️ Warn | Should use ¶ symbol |

### 3. Statutory Citations

#### Valid Formats
| Test Case | Format | Expected | Notes |
|-----------|--------|----------|-------|
| MCL basic | `MCL 600.2922` | ✅ Accept | Michigan Compiled Laws |
| MCL with subsection | `MCL 600.2922(1)` | ✅ Accept | Subsection in parens |
| MCL with sub-sub | `MCL 600.2922(1)(a)` | ✅ Accept | Multiple subsections |
| MSA | `MSA 27.1498` | ✅ Accept | Michigan Statutes Annotated |
| MCLA | `MCLA 600.2922` | ✅ Accept | Annotated version |

#### Invalid/Warning Formats
| Test Case | Format | Expected | Reason |
|-----------|--------|----------|--------|
| Periods in MCL | `M.C.L. 600.2922` | ⚠️ Warn | Michigan disfavors periods |
| Without section | `MCL 600` | ❌ Invalid | Section number required |
| Invalid format | `MCL Section 600.2922` | ❌ Invalid | Word "Section" not needed |

### 4. Court Rules

#### Valid Formats
| Test Case | Format | Expected | Notes |
|-----------|--------|----------|-------|
| MCR basic | `MCR 2.116` | ✅ Accept | Michigan Court Rules |
| With subsection | `MCR 2.116(C)` | ✅ Accept | Subsection letter |
| With sub-sub | `MCR 2.116(C)(10)` | ✅ Accept | Multiple subsections |
| Complex | `MCR 2.116(C)(10)(a)` | ✅ Accept | Multi-level subsections |

#### Invalid/Warning Formats
| Test Case | Format | Expected | Reason |
|-----------|--------|----------|--------|
| Periods in MCR | `M.C.R. 2.116` | ⚠️ Warn | Should be MCR |
| Without rule number | `MCR 2` | ❌ Invalid | Rule number required |
| Invalid format | `MCR Rule 2.116` | ❌ Invalid | Word "Rule" not needed |

### 5. Federal Citations (Michigan Format)

#### Valid Formats
| Test Case | Format | Expected | Notes |
|-----------|--------|----------|-------|
| US Reports | `Smith v Jones, 500 US 100 (2020)` | ✅ Accept | No periods |
| F Supp | `Smith v Jones, 500 F Supp 100 (ED Mich 2020)` | ✅ Accept | Federal district |
| F 4th | `Smith v Jones, 500 F 4th 100 (CA 6 2020)` | ✅ Accept | Fourth series |
| S Ct | `Smith v Jones, 500 S Ct 100 (2020)` | ✅ Accept | Supreme Court Reporter |

#### Warning Formats
| Test Case | Format | Expected | Reason |
|-----------|--------|----------|--------|
| Bluebook format | `Smith v Jones, 500 U.S. 100 (2020)` | ⚠️ Warn | Michigan prefers US not U.S. |
| F.Supp. with periods | `Smith v Jones, 500 F.Supp. 100 (2020)` | ⚠️ Warn | Should be F Supp |

---

## Warning Categories

### W001: Periods in Abbreviations
**Message:** "Michigan disfavors periods in abbreviations. Use '{correct}' instead of '{incorrect}'"  
**Examples:**
- `N.W.2d` → `NW 2d`
- `Mich.` → `Mich`
- `M.C.L.` → `MCL`

### W002: Parallel Citations
**Message:** "Parallel citations are no longer required in Michigan"  
**Context:** Multiple reporters in same citation

### W003: Non-Preferred Format
**Message:** "Michigan prefers '{preferred}' format over '{used}'"  
**Examples:**
- Bluebook federal citations in Michigan state filings

### W004: Missing Court Designation
**Message:** "Court designation recommended for clarity: '{suggestion}'"  
**Context:** Ambiguous jurisdiction

---

## Test Coverage Requirements

### Minimum Test Cases Per Category
- ✅ **Traditional citations:** 15+ cases (10 valid, 5 warnings/invalid)
- ✅ **Public domain:** 8+ cases (5 valid, 3 invalid)
- ✅ **Statutory:** 8+ cases (5 valid, 3 warnings/invalid)
- ✅ **Court rules:** 6+ cases (4 valid, 2 warnings/invalid)
- ✅ **Federal (Michigan format):** 6+ cases (4 valid, 2 warnings)

### Edge Cases Required
- [ ] Empty string input
- [ ] Whitespace-only input
- [ ] Very long case names (200+ chars)
- [ ] Special characters in case names
- [ ] Unicode characters (em dash, section symbol, etc.)
- [ ] Mixed format citations in single string
- [ ] Malformed dates
- [ ] Future dates
- [ ] Very old dates (pre-1900)

### Negative Test Cases
- [ ] SQL injection attempts in citation strings
- [ ] XSS attempts in citation strings
- [ ] Buffer overflow attempts (extremely long strings)
- [ ] Null/undefined inputs
- [ ] Non-string inputs (numbers, objects, arrays)

---

## Test Execution

### Runner Command
```bash
# Run all citation tests
npm test -- michigan-citations.test.ts

# Run with coverage
npm test -- --coverage michigan-citations.test.ts

# Run in watch mode
npm test -- --watch michigan-citations.test.ts
```

### Pass Criteria
- ✅ All valid citations must parse correctly
- ✅ All warnings must be triggered with correct codes
- ✅ All invalid citations must be rejected with clear messages
- ✅ No false positives (valid citations rejected)
- ✅ No false negatives (invalid citations accepted)
- ✅ Warning messages must be stable (no random ordering)
- ✅ Code coverage: minimum 90% for validator logic

---

## Future Enhancements

### Additional Jurisdictions
- [ ] Federal Bluebook format (for federal court filings)
- [ ] Other state citation formats (as needed)
- [ ] International citations (treaties, etc.)

### Advanced Features
- [ ] Citation auto-correction suggestions
- [ ] Citation formatting/normalization
- [ ] Batch citation validation
- [ ] Citation extraction from documents
- [ ] Link generation to case databases

---

## Notes

1. **Authority:** Michigan Appellate Opinion Manual is the authoritative source for Michigan state court citation rules
2. **Periods Rule:** This is a mandatory rule, not a preference—Michigan explicitly disfavors periods in abbreviations
3. **Parallel Citations:** No longer required per Michigan rules, but not invalid if present (warn only)
4. **Federal Citations:** Use Michigan format (no periods) when citing federal cases in Michigan state court filings
5. **Public Domain:** Michigan adopted public domain citations; both traditional and public domain formats are valid

---

**Last Updated:** 2025-11-24  
**Test Suite Location:** `src/tools/verification/citations/__tests__/michigan-citations.test.ts`  
**Validator Location:** `src/tools/verification/citations/michigan-citations.ts`
