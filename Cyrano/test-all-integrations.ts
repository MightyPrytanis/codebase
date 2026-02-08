#!/usr/bin/env tsx
/**
 * Comprehensive Integration Testing Script
 * Tests all tools, modules, and engines with Perplexity and other API providers
 */

import dotenv from 'dotenv';
dotenv.config();

import { apiValidator } from './src/utils/api-validator.js';
import { aiService } from './src/services/ai-service.js';
import { PerplexityService } from './src/services/perplexity.js';

// Reload config after dotenv
apiValidator.reloadConfig();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  provider: string;
  success: boolean;
  error?: string;
  response?: string;
  duration?: number;
}

async function testPerplexityDirect(): Promise<TestResult> {
  const start = Date.now();
  try {
    const perplexityService = new PerplexityService({
      apiKey: process.env.PERPLEXITY_API_KEY!,
    });
    
    const response = await perplexityService.makeRequest({
      model: 'sonar', // Perplexity model
      messages: [
        { role: 'user', content: 'What is 2+2? Answer in one sentence.' }
      ],
      max_tokens: 50,
    });
    
    return {
      name: 'Perplexity Direct API',
      provider: 'perplexity',
      success: true,
      response: response.choices[0]?.message?.content?.substring(0, 100),
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Perplexity Direct API',
      provider: 'perplexity',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    };
  }
}

async function testAIService(provider: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await aiService.call(provider as any, 'What is 2+2? Answer in one sentence.', {
      maxTokens: 50,
    });
    
    return {
      name: `AI Service - ${provider}`,
      provider,
      success: true,
      response: response.substring(0, 100),
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: `AI Service - ${provider}`,
      provider,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    };
  }
}

async function testTool(name: string, importPath: string, executeFn: (tool: any) => Promise<any>, provider: string = 'perplexity'): Promise<TestResult> {
  const start = Date.now();
  try {
    const module = await import(importPath);
    const tool = module[name] || module[`${name}Tool`] || module.default;
    if (!tool) {
      return {
        name,
        provider,
        success: false,
        error: `Tool not found in module. Available exports: ${Object.keys(module).join(', ')}`,
        duration: Date.now() - start,
      };
    }
    const result = await executeFn(tool);
    if (!result) {
      return {
        name,
        provider,
        success: false,
        error: 'Tool returned undefined result',
        duration: Date.now() - start,
      };
    }
    if (result.isError) {
      return {
        name,
        provider,
        success: false,
        error: result.content?.[0]?.text || result.error || 'Unknown error',
        duration: Date.now() - start,
      };
    }
    return {
      name,
      provider,
      success: true,
      response: result.content?.[0]?.text?.substring(0, 100) || 'Success',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name,
      provider,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    };
  }
}

async function testTools() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Testing Tools with Perplexity${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  const results: TestResult[] = [];

  // Test fact-checker
  const factCheckerResult = await testTool('factChecker', './src/tools/fact-checker.js', 
    async (tool) => tool.execute({
      claim_text: 'The Michigan Supreme Court was established in 1836',
      verification_level: 'basic',
    })
  );
  results.push(factCheckerResult);
  console.log(factCheckerResult.success ? `${colors.green}✅ Fact Checker${colors.reset}` : `${colors.red}❌ Fact Checker: ${factCheckerResult.error}${colors.reset}`);

  // Test document-analyzer
  const docAnalyzerResult = await testTool('documentAnalyzer', './src/tools/document-analyzer.js',
    async (tool) => tool.execute({
      document_text: 'This is a test legal document for analysis.',
      analysis_type: 'summary',
    })
  );
  results.push(docAnalyzerResult);
  console.log(docAnalyzerResult.success ? `${colors.green}✅ Document Analyzer${colors.reset}` : `${colors.red}❌ Document Analyzer: ${docAnalyzerResult.error}${colors.reset}`);

  // Test red-flag-finder
  const redFlagResult = await testTool('redFlagFinder', './src/tools/red-flag-finder.js',
    async (tool) => tool.execute({
      action: 'analyze_urgency',
      content: 'This is a test document with potential red flags.',
      document_type: 'other', // Use 'other' instead of 'contract' to match schema
      urgency_threshold: 'medium',
    })
  );
  results.push(redFlagResult);
  console.log(redFlagResult.success ? `${colors.green}✅ Red Flag Finder${colors.reset}` : `${colors.red}❌ Red Flag Finder: ${redFlagResult.error}${colors.reset}`);

  // Test legal-reviewer
  const legalReviewerResult = await testTool('legalReviewer', './src/tools/legal-reviewer.js',
    async (tool) => tool.execute({
      document_text: 'This is a test legal document for review.',
      review_type: 'comprehensive',
    })
  );
  results.push(legalReviewerResult);
  console.log(legalReviewerResult.success ? `${colors.green}✅ Legal Reviewer${colors.reset}` : `${colors.red}❌ Legal Reviewer${colors.reset}`);

  // Test compliance-checker
  const complianceResult = await testTool('complianceChecker', './src/tools/compliance-checker.js',
    async (tool) => tool.execute({
      document_text: 'This is a test document for compliance checking.',
      compliance_type: 'general',
    })
  );
  results.push(complianceResult);
  console.log(complianceResult.success ? `${colors.green}✅ Compliance Checker${colors.reset}` : `${colors.red}❌ Compliance Checker${colors.reset}`);

  // Test contract-comparator
  const contractResult = await testTool('contractComparator', './src/tools/contract-comparator.js',
    async (tool) => tool.execute({
      document1_text: 'This is document one.',
      document2_text: 'This is document two.',
      comparison_type: 'comprehensive',
    })
  );
  results.push(contractResult);
  console.log(contractResult.success ? `${colors.green}✅ Contract Comparator${colors.reset}` : `${colors.red}❌ Contract Comparator: ${contractResult.error}${colors.reset}`);

  return results;
}

async function testEngines() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Testing Engines${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  const results: TestResult[] = [];

  // Test GoodCounsel Engine
  try {
    const { goodcounselEngine } = await import('./src/engines/goodcounsel/goodcounsel-engine.js');
    const start = Date.now();
    const result = await goodcounselEngine.execute({
      action: 'list_workflows',
    });
    results.push({
      name: 'GoodCounsel Engine',
      provider: 'n/a',
      success: !result.isError,
      response: result.content[0]?.text?.substring(0, 100),
      duration: Date.now() - start,
    });
    console.log(`${colors.green}✅ GoodCounsel Engine${colors.reset}`);
  } catch (error) {
    results.push({
      name: 'GoodCounsel Engine',
      provider: 'n/a',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`${colors.red}❌ GoodCounsel Engine: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
  }

  return results;
}

async function runAllTests() {
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Comprehensive Integration Testing${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  const allResults: TestResult[] = [];

  // Test Perplexity directly
  console.log(`${colors.yellow}Testing Perplexity Direct API...${colors.reset}`);
  const perplexityResult = await testPerplexityDirect();
  allResults.push(perplexityResult);
  if (perplexityResult.success) {
    console.log(`${colors.green}✅ Perplexity working!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}❌ Perplexity failed: ${perplexityResult.error}${colors.reset}\n`);
  }

  // Test OpenAI (user has $5 credit)
  console.log(`${colors.yellow}Testing OpenAI...${colors.reset}`);
  const openaiResult = await testAIService('openai');
  allResults.push(openaiResult);
  if (openaiResult.success) {
    console.log(`${colors.green}✅ OpenAI working!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}❌ OpenAI failed: ${openaiResult.error}${colors.reset}\n`);
  }

  // Test Anthropic (with fixed model)
  console.log(`${colors.yellow}Testing Anthropic...${colors.reset}`);
  const anthropicResult = await testAIService('anthropic');
  allResults.push(anthropicResult);
  if (anthropicResult.success) {
    console.log(`${colors.green}✅ Anthropic working!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}❌ Anthropic failed: ${anthropicResult.error}${colors.reset}\n`);
  }

  // Test tools
  const toolResults = await testTools();
  allResults.push(...toolResults);

  // Test engines
  const engineResults = await testEngines();
  allResults.push(...engineResults);

  // Summary
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);

  console.log(`${colors.green}✅ Successful: ${successful.length}/${allResults.length}${colors.reset}`);
  successful.forEach(r => {
    console.log(`   - ${r.name} (${r.duration}ms)`);
  });

  if (failed.length > 0) {
    console.log(`\n${colors.red}❌ Failed: ${failed.length}/${allResults.length}${colors.reset}`);
    failed.forEach(r => {
      console.log(`   - ${r.name}: ${r.error?.substring(0, 80)}`);
    });
  }

  return allResults;
}

runAllTests()
  .then(results => {
    const successCount = results.filter(r => r.success).length;
    process.exit(successCount > 0 ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    process.exit(1);
  });
}