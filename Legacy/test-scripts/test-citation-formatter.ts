/**
 * Test Citation Formatter
 * Tests jurisdiction-specific citation formatting
 */

import { citationFormatter, Jurisdiction } from './src/tools/verification/citation-formatter.js';

console.log('Testing Citation Formatter\n');
console.log('='.repeat(80));

// Test cases
const testCases = [
  // Michigan citations with periods (should be corrected)
  {
    text: 'People v Smith, 500 N.W.2d 100 (2020)',
    jurisdiction: Jurisdiction.MICHIGAN,
    expected: 'People v Smith, 500 NW 2d 100 (2020)',
    description: 'Michigan: Remove periods from N.W.2d',
  },
  {
    text: 'Doe v Roe, 300 Mich. App. 456 (2019)',
    jurisdiction: Jurisdiction.MICHIGAN,
    expected: 'Doe v Roe, 300 Mich App 456 (2019)',
    description: 'Michigan: Remove periods from Mich. App.',
  },
  {
    text: 'M.C.L. 600.2922',
    jurisdiction: Jurisdiction.MICHIGAN,
    expected: 'MCL 600.2922',
    description: 'Michigan: Remove periods from M.C.L.',
  },
  {
    text: 'M.C.R. 2.116(C)(10)',
    jurisdiction: Jurisdiction.MICHIGAN,
    expected: 'MCR 2.116(C)(10)',
    description: 'Michigan: Remove periods from M.C.R.',
  },
  
  // Michigan citations already correct
  {
    text: 'People v Smith, 500 Mich 123 (2020)',
    jurisdiction: Jurisdiction.MICHIGAN,
    expected: 'People v Smith, 500 Mich 123 (2020)',
    description: 'Michigan: Already correct',
  },
  {
    text: 'MCL 600.972',
    jurisdiction: Jurisdiction.MICHIGAN,
    expected: 'MCL 600.972',
    description: 'Michigan: Statutory citation already correct',
  },
  
  // Federal citations
  {
    text: 'Smith v Jones, 500 F. 2d 100 (2020)',
    jurisdiction: Jurisdiction.FEDERAL,
    expected: 'Smith v Jones, 500 F.2d 100 (2020)',
    description: 'Federal: Normalize spacing in F. 2d',
  },
  {
    text: 'FR Civ P 52(a)',
    jurisdiction: Jurisdiction.FEDERAL,
    expected: 'Fed. R. Civ. P. 52(a)',
    description: 'Federal: Expand FR Civ P',
  },
  
  // Auto-detect
  {
    text: 'People v Smith, 500 N.W.2d 100 (2020)',
    jurisdiction: Jurisdiction.AUTO,
    expected: 'People v Smith, 500 NW 2d 100 (2020)',
    description: 'Auto-detect: Should detect Michigan and correct',
  },
];

// Test single citations
console.log('\n## Single Citation Tests\n');
for (const testCase of testCases) {
  console.log(`\nTest: ${testCase.description}`);
  console.log(`Input: ${testCase.text}`);
  console.log(`Jurisdiction: ${testCase.jurisdiction}`);
  
  const result = await citationFormatter.formatCitations({
    text: testCase.text,
    jurisdiction: testCase.jurisdiction,
    correct: true,
    strictMode: true,
    documentMode: false,
  });
  
  if ('corrected' in result) {
    console.log(`Expected: ${testCase.expected}`);
    console.log(`Got:      ${result.corrected}`);
    console.log(`Match: ${result.corrected === testCase.expected ? '✓' : '✗'}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Rule Source: ${result.ruleSource}`);
    if (result.changes.length > 0) {
      console.log(`Changes: ${result.changes.map(c => c.description).join('; ')}`);
    }
  }
  console.log('-'.repeat(80));
}

// Test document mode
console.log('\n\n## Document Mode Test\n');
const documentText = `
In People v Smith, 500 N.W.2d 100 (2020), the court held that M.C.L. 600.2922
applies. See also Doe v Roe, 300 Mich. App. 456 (2019). The rule is found in
M.C.R. 2.116(C)(10). For federal cases, see Smith v Jones, 500 F. 2d 100 (2020)
and FR Civ P 52(a).
`;

console.log('Input Document:');
console.log(documentText);

const docResult = await citationFormatter.formatCitations({
  text: documentText,
  jurisdiction: Jurisdiction.MICHIGAN,
  correct: true,
  strictMode: true,
  documentMode: true,
});

if ('totalCitations' in docResult) {
  console.log(`\nTotal Citations Found: ${docResult.totalCitations}`);
  console.log(`Corrected: ${docResult.correctedCitations}`);
  console.log(`Uncorrectable: ${docResult.uncorrectableCitations}`);
  console.log(`\nCorrected Document:`);
  console.log(docResult.correctedText);
  console.log(`\nSummary by Jurisdiction:`, docResult.summary.byJurisdiction);
  console.log(`Summary by Type:`, docResult.summary.byType);
}

console.log('\n' + '='.repeat(80));


}
)