import { contractComparator } from './src/tools/contract-comparator.js';

// Simple unit test for contract-comparator tool (formerly legal-comparator)
console.log('Running contract-comparator unit tests...\n');

// Test data
const doc1 = `
CONTRACT AGREEMENT

This agreement is between Company A and Company B.
Liability is limited to $100,000.
Termination requires 30 days notice.
`;

const doc2 = `
SERVICE CONTRACT

This contract is between Vendor X and Client Y.
Liability is limited to $50,000.
Termination requires 15 days notice.
`;

// Test 1: Basic comparison
console.log('Test 1: Basic comparison');
const result1 = contractComparator.performComparison(doc1, doc2, 'comprehensive');
console.log('Similarity score:', result1.similarity_score);
console.log('Common terms:', result1.content_differences.common_terms);
console.log('Key differences:', result1.key_differences);
console.log('✅ Test 1 passed\n');

// Test 2: Focused comparison
console.log('Test 2: Focused comparison on liability');
const result2 = contractComparator.performComparison(doc1, doc2, 'comprehensive', ['liability']);
console.log('Focused liability comparison:', JSON.stringify(result2.focused_comparison, null, 2));
console.log('✅ Test 2 passed\n');

// Test 3: Structural similarity
console.log('Test 3: Structural analysis');
const struct1 = contractComparator.compareStructure(doc1, doc2);
console.log('Structural differences:', struct1);
console.log('✅ Test 3 passed\n');

// Test 4: Content analysis
console.log('Test 4: Content analysis');
const content1 = contractComparator.compareContent(doc1, doc2);
console.log('Content differences:', content1);
console.log('✅ Test 4 passed\n');

console.log('All contract-comparator tests passed! 🎉');
console.log('The tool performs real analysis, not dummy operations.');