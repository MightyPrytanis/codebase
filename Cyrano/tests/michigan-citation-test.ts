/**
 * Michigan Citation Format Test
 * 
 * Tests citation-checker.ts with Michigan-specific citation formats
 * Michigan disfavors periods in abbreviations
 * 
 * Test cases:
 * - Michigan Supreme Court citations (NW, NW2d, Mich)
 * - Michigan Court of Appeals citations (NW2d, MichApp)
 * - Alternative formats with periods (N.W., N.W.2d, Mich., Mich.App.)
 * - Invalid citations
 * 
 * Created: 2025-11-23
 */

import { citationChecker } from '../src/tools/verification/citation-checker.ts';

// Test data - real Michigan citations
const testCitations = [
  // Michigan Supreme Court - preferred format (no periods)
  {
    citation: '500 NW2d 100 (Mich 2010)',
    expected: 'valid',
    court: 'Michigan Supreme Court',
    format: 'Michigan preferred (no periods)',
  },
  {
    citation: '450 Mich 500 (2015)',
    expected: 'valid',
    court: 'Michigan Supreme Court',
    format: 'Michigan preferred (no periods)',
  },
  
  // Michigan Court of Appeals - preferred format (no periods)
  {
    citation: '300 MichApp 200 (2013)',
    expected: 'valid',
    court: 'Michigan Court of Appeals',
    format: 'Michigan preferred (no periods)',
  },
  {
    citation: '400 NW2d 350 (Mich Ct App 2018)',
    expected: 'valid',
    court: 'Michigan Court of Appeals',
    format: 'Michigan preferred (no periods)',
  },
  
  // Alternative format with periods (accepted but not preferred)
  {
    citation: '500 N.W.2d 100 (Mich. 2010)',
    expected: 'valid',
    court: 'Michigan Supreme Court',
    format: 'Alternative with periods',
  },
  {
    citation: '300 Mich.App. 200 (2013)',
    expected: 'valid',
    court: 'Michigan Court of Appeals',
    format: 'Alternative with periods',
  },
  
  // Invalid citations
  {
    citation: 'invalid citation format',
    expected: 'invalid',
    court: 'N/A',
    format: 'Invalid',
  },
  {
    citation: '500 XYZ 100',
    expected: 'invalid',
    court: 'N/A',
    format: 'Unknown reporter',
  },
];

/**
 * Run Michigan citation tests
 */
async function runMichiganCitationTests() {
  console.log('='.repeat(80));
  console.log('MICHIGAN CITATION FORMAT TEST');
  console.log('='.repeat(80));
  console.log();
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCitations) {
    console.log(`Testing: ${test.citation}`);
    console.log(`Expected: ${test.expected} | Court: ${test.court} | Format: ${test.format}`);
    
    try {
      const result = await citationChecker.checkCitations({
        citations: [test.citation],
        verifyFormat: true,
        strictMode: false,
      });
      
      const validation = result.validations[0];
      
      console.log(`Status: ${validation.status}`);
      console.log(`Confidence: ${validation.confidence.toFixed(2)}`);
      
      if (validation.parsed) {
        console.log(`Parsed reporter: ${validation.parsed.reporter}`);
        console.log(`Volume: ${validation.parsed.volume}, Page: ${validation.parsed.page}`);
      }
      
      if (validation.issues.length > 0) {
        console.log('Issues:');
        validation.issues.forEach(issue => console.log(`  - ${issue}`));
      }
      
      // Check if test passed
      const isValid = validation.status === 'valid' || validation.status === 'partial';
      const testPassed = (test.expected === 'valid' && isValid) || 
                        (test.expected === 'invalid' && !isValid);
      
      if (testPassed) {
        console.log('✓ TEST PASSED');
        passed++;
      } else {
        console.log('✗ TEST FAILED');
        failed++;
      }
      
    } catch (error) {
      console.log(`✗ TEST ERROR: ${error}`);
      failed++;
    }
    
    console.log('-'.repeat(80));
    console.log();
  }
  
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total tests: ${testCitations.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / testCitations.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));
}

/**
 * Test Michigan citation context checking
 */
async function testMichiganCitationContext() {
  console.log();
  console.log('='.repeat(80));
  console.log('MICHIGAN CITATION CONTEXT TEST');
  console.log('='.repeat(80));
  console.log();
  
  const documentContext = `
    In Smith v. Jones, 500 NW2d 100 (Mich 2010), the Michigan Supreme Court held
    that the trial court erred in denying defendant's motion. The Court of Appeals
    in Brown v. Green, 300 MichApp 200 (2013), distinguished Smith and found that
    the circumstances warranted different treatment.
  `;
  
  const citations = [
    '500 NW2d 100 (Mich 2010)',
    '300 MichApp 200 (2013)',
    '999 NW2d 999 (Mich 2020)', // Not in context
  ];
  
  console.log('Document context contains 2 Michigan citations.');
  console.log('Testing 3 citations (2 in context, 1 not in context)...');
  console.log();
  
  const result = await citationChecker.checkCitations({
    citations,
    documentContext,
    verifyFormat: true,
    strictMode: false,
  });
  
  result.validations.forEach((validation, index) => {
    console.log(`Citation ${index + 1}: ${validation.citation}`);
    console.log(`Status: ${validation.status}`);
    console.log(`Confidence: ${validation.confidence.toFixed(2)}`);
    
    const contextIssue = validation.issues.find(i => i.includes('context'));
    if (contextIssue) {
      console.log(`Context: ${contextIssue}`);
    } else {
      console.log('Context: Found in document');
    }
    
    console.log('-'.repeat(80));
  });
}

// Run tests
async function main() {
  try {
    await runMichiganCitationTests();
    await testMichiganCitationContext();
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

main();

}
}
)
}
)
}
)
}
)
)
}