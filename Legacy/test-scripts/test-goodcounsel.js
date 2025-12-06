import 'dotenv/config';
import { goodCounsel } from './dist/tools/goodcounsel.js';

async function testGoodCounsel() {
  try {
    console.log('Testing GoodCounsel...');
    console.log('PERPLEXITY_API_KEY exists:', !!process.env.PERPLEXITY_API_KEY);

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('Test timed out after 10 seconds');
      process.exit(0);
    }, 10000);

    const result = await goodCounsel.execute({
      context: 'Test legal case - client confidentiality issues',
      ai_provider: 'perplexity'
    });

    clearTimeout(timeout);
    console.log('Result:', result);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testGoodCounsel();