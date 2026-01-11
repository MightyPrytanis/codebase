import { michiganCitationValidator } from './src/tools/verification/citations/michigan-citations.js';

const testCases = [
  'People v Smith, 500 Mich 123 (2020)',
  'Doe v Roe, 300 Mich App 456 (2019)',
  'People v Smith, 2020 MI 45',
  'People v Smith, 2020 MI App 123, ¶ 12',
  'MCL 600.2922',
  'MCR 2.116(C)(10)',
  'People v Smith, 500 N.W.2d 100 (2020)', // Should warn about periods
  'People v Smith, 500 Mich. 100 (2020)', // Should warn about periods
];

console.log('Testing Michigan Citation Validator\n');
console.log('=' .repeat(60));

for (const citation of testCases) {
  const result = michiganCitationValidator.validate(citation);
  console.log(`\nCitation: ${citation}`);
  console.log(`Valid: ${result.isValid ? '✓' : '✗'}`);
  console.log(`Format: ${result.format}`);
  
  if (result.reporter) console.log(`Reporter: ${result.reporter}`);
  if (result.volume) console.log(`Volume: ${result.volume}`);
  if (result.page) console.log(`Page: ${result.page}`);
  if (result.year) console.log(`Year: ${result.year}`);
  if (result.court) console.log(`Court: ${result.court}`);
  
  if (result.errors.length > 0) {
    console.log(`Errors: ${result.errors.join('; ')}`);
  }
  if (result.warnings.length > 0) {
    console.log(`Warnings: ${result.warnings.join('; ')}`);
  }
  console.log('-'.repeat(60));
}

}
)
}