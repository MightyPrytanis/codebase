#!/usr/bin/env tsx
/**
 * API Key Validation and Integration Testing Script
 * Tests all API keys in .env and verifies real integrations work
 */

import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
dotenv.config();

import { apiValidator } from './src/utils/api-validator.js';
import { aiService } from './src/services/ai-service.js';
import { PerplexityService } from './src/services/perplexity.js';

// Reload config after dotenv has loaded
apiValidator.reloadConfig();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

interface TestResult {
  provider: string;
  keyExists: boolean;
  formatValid: boolean;
  apiCallWorks: boolean;
  error?: string;
  response?: string;
}

async function testProvider(provider: string): Promise<TestResult> {
  const result: TestResult = {
    provider,
    keyExists: false,
    formatValid: false,
    apiCallWorks: false,
  };

  console.log(`\n${colors.blue}Testing ${provider}...${colors.reset}`);

  // 1. Check if key exists directly from process.env
  const envKey = provider === 'google' 
    ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
    : process.env[`${provider.toUpperCase()}_API_KEY`];
  
  result.keyExists = !!envKey;
  
  if (!envKey) {
    result.error = `No API key found in environment`;
    console.log(`${colors.red}❌ No API key found${colors.reset}`);
    return result;
  }
  
  console.log(`${colors.green}✅ API key found${colors.reset}`);
  
  // 2. Validate format
  const validation = apiValidator.validateProvider(provider);
  result.formatValid = validation.valid;

  if (!validation.valid) {
    result.error = validation.error;
    console.log(`${colors.red}❌ ${validation.error}${colors.reset}`);
    return result;
  }

  console.log(`${colors.green}✅ API key exists and format is valid${colors.reset}`);

  // 2. Test actual API call
  try {
    const testPrompt = `Answer in one sentence: What is 2+2?`;
    
    let response: string;
    if (provider === 'perplexity') {
      const perplexityService = new PerplexityService({
        apiKey: process.env.PERPLEXITY_API_KEY!,
      });
      // Try different Perplexity models
      let model = 'sonar';
      let apiResponse;
      try {
        apiResponse = await perplexityService.makeRequest({
          model: model,
          messages: [
            { role: 'user', content: testPrompt }
          ],
          max_tokens: 50,
        });
      } catch (e) {
        // Try alternative model
        model = 'llama-3.1-sonar-small-128k-online';
        apiResponse = await perplexityService.makeRequest({
          model: model,
          messages: [
            { role: 'user', content: testPrompt }
          ],
          max_tokens: 50,
        });
      }
      response = apiResponse.choices[0]?.message?.content || 'No response';
    } else {
      response = await aiService.call(provider as any, testPrompt, {
        maxTokens: 50,
      });
    }

    result.apiCallWorks = true;
    result.response = response.substring(0, 100); // First 100 chars
    console.log(`${colors.green}✅ API call successful${colors.reset}`);
    console.log(`${colors.yellow}Response: ${response.substring(0, 100)}...${colors.reset}`);
  } catch (error) {
    result.apiCallWorks = false;
    result.error = error instanceof Error ? error.message : String(error);
    console.log(`${colors.red}❌ API call failed: ${result.error}${colors.reset}`);
  }

  return result;
}

async function testAllProviders() {
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}API Key Validation and Testing${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  const providers = ['perplexity', 'openai', 'anthropic', 'google', 'xai', 'deepseek'];
  const results: TestResult[] = [];

  for (const provider of providers) {
    const result = await testProvider(provider);
    results.push(result);
  }

  // Summary
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  const working = results.filter(r => r.apiCallWorks);
  const configured = results.filter(r => r.formatValid);
  const missing = results.filter(r => !r.keyExists);

  console.log(`${colors.green}✅ Working Providers: ${working.length}${colors.reset}`);
  working.forEach(r => {
    console.log(`   - ${r.provider} (${r.response?.substring(0, 50)}...)`);
  });

  console.log(`\n${colors.yellow}⚠️  Configured but not tested: ${configured.length - working.length}${colors.reset}`);
  results.filter(r => r.formatValid && !r.apiCallWorks).forEach(r => {
    console.log(`   - ${r.provider}: ${r.error}`);
  });

  console.log(`\n${colors.red}❌ Missing API Keys: ${missing.length}${colors.reset}`);
  missing.forEach(r => {
    console.log(`   - ${r.provider}`);
  });

  return results;
}

// Run tests
testAllProviders()
  .then(results => {
    const workingCount = results.filter(r => r.apiCallWorks).length;
    process.exit(workingCount > 0 ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    process.exit(1);
  });
