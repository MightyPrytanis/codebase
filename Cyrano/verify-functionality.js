#!/usr/bin/env node

/**
 * Comprehensive Cyrano MCP Server Verification Script
 * 
 * This script performs thorough testing to verify if the Cyrano MCP server
 * actually implements functional AI tools or just returns mock responses.
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}🔍 COMPREHENSIVE CYRANO MCP SERVER VERIFICATION${RESET}`);
console.log('=' .repeat(60));

let failedTests = 0;
const findings = [];

// Test 1: Verify if tools produce different outputs for different inputs
async function testToolConsistency() {
    console.log(`${YELLOW}📊 Testing tool output consistency...${RESET}`);
    
    try {
        // Start HTTP server
        const server = spawn('npm', ['run', 'http'], { stdio: 'pipe' });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for server to start
        
        // Test document analyzer with different inputs
        const inputs = [
            { text: "This is a simple contract with basic terms.", type: "comprehensive" },
            { text: "Complex legal document with multiple liability clauses, indemnification provisions, and force majeure terms.", type: "comprehensive" },
            { text: "Short agreement.", type: "comprehensive" }
        ];
        
        const responses = [];
        
        for (const input of inputs) {
            const response = await fetch('http://localhost:5002/mcp/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tool: 'document_analyzer',
                    input: {
                        document_text: input.text,
                        analysis_type: input.type
                    }
                })
            });
            const result = await response.json();
            responses.push({ input: input.text, output: result });
        }
        
        // Check if responses are actually different based on input complexity
        const complexities = responses.map(r => {
            try {
                const parsed = JSON.parse(r.output.content[0].text);
                return parsed.metadata.word_count;
            } catch (e) {
                return 0;
            }
        });
        
        const isActuallyAnalyzing = complexities[0] !== complexities[1] && 
                                   complexities[1] > complexities[2];
        
        if (isActuallyAnalyzing) {
            console.log(`${GREEN}✅ Tool produces different outputs for different inputs${RESET}`);
        } else {
            console.log(`${RED}❌ Tool responses suggest static/mock behavior${RESET}`);
            findings.push("Document analyzer appears to use basic text processing, not AI analysis");
            failedTests++;
        }
        
        server.kill();
        return isActuallyAnalyzing;
        
    } catch (error) {
        console.log(`${RED}❌ Tool consistency test failed: ${error.message}${RESET}`);
        failedTests++;
        return false;
    }
}

// Test 2: Check for API key validation
async function testAPIKeyValidation() {
    console.log(`${YELLOW}🔑 Testing API key validation...${RESET}`);
    
    try {
        // Check if tools validate API keys
        const server = spawn('npm', ['run', 'http'], { stdio: 'pipe' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const response = await fetch('http://localhost:5002/mcp/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool: 'ai_orchestrator',
                input: {
                    task_description: "Analyze this legal document using multiple AI providers",
                    ai_providers: ["perplexity", "openai", "anthropic", "google", "xai", "deepseek"]
                }
            })
        });
        
        const result = await response.json();
        const responseText = result.content[0].text;
        
        // Check if it mentions API keys or authentication
        const hasAPIValidation = responseText.toLowerCase().includes('api') && 
                                responseText.toLowerCase().includes('key');
        
        if (hasAPIValidation) {
            console.log(`${GREEN}✅ Tools validate API keys${RESET}`);
        } else {
            console.log(`${RED}❌ No API key validation detected - tools may be mocked${RESET}`);
            findings.push("AI orchestrator doesn't validate API keys, suggesting mock implementation");
            failedTests++;
        }
        
        server.kill();
        return hasAPIValidation;
        
    } catch (error) {
        console.log(`${RED}❌ API key validation test failed: ${error.message}${RESET}`);
        failedTests++;
        return false;
    }
}

// Test 3: Verify MCP Protocol Compliance
async function testMCPCompliance() {
    console.log(`${YELLOW}🔧 Testing MCP protocol compliance...${RESET}`);
    
    try {
        // Test stdio mode MCP server
        const server = spawn('tsx', ['src/mcp-server.ts'], { 
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: process.cwd()
        });
        
        // Send MCP list tools request
        const listToolsRequest = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/list",
            params: {}
        }) + '\n';
        
        server.stdin.write(listToolsRequest);
        
        let responseData = '';
        server.stdout.on('data', (data) => {
            responseData += data.toString();
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        server.kill();
        
        // Check if response follows MCP protocol
        try {
            const lines = responseData.trim().split('\n').filter(line => line.trim());
            const lastLine = lines[lines.length - 1];
            const response = JSON.parse(lastLine);
            
            const isValidMCP = response.jsonrpc === "2.0" && 
                              response.id === 1 && 
                              Array.isArray(response.result.tools);
            
            if (isValidMCP) {
                console.log(`${GREEN}✅ MCP protocol compliance verified${RESET}`);
                console.log(`${GREEN}   - Found ${response.result.tools.length} tools${RESET}`);
                return true;
            } else {
                console.log(`${RED}❌ Invalid MCP protocol response${RESET}`);
                findings.push("Server doesn't properly implement MCP protocol");
                failedTests++;
                return false;
            }
        } catch (parseError) {
            console.log(`${RED}❌ Failed to parse MCP response: ${parseError.message}${RESET}`);
            findings.push("Server output is not valid JSON-RPC MCP protocol");
            failedTests++;
            return false;
        }
        
    } catch (error) {
        console.log(`${RED}❌ MCP compliance test failed: ${error.message}${RESET}`);
        failedTests++;
        return false;
    }
}

// Test 4: Check for real AI provider integration
async function testRealAIIntegration() {
    console.log(`${YELLOW}🤖 Testing real AI provider integration...${RESET}`);
    
    try {
        // Check if any environment variables are actually used
        process.env.OPENAI_API_KEY = 'test-key-123';
        process.env.ANTHROPIC_API_KEY = 'test-key-456';
        
        const server = spawn('npm', ['run', 'http'], { 
            stdio: 'pipe',
            env: { ...process.env }
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const response = await fetch('http://localhost:5002/mcp/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool: 'ai_orchestrator',
                input: {
                    task_description: "This should fail if real AI integration exists",
                    ai_providers: ["openai"]
                }
            })
        });
        
        const result = await response.json();
        const responseText = result.content[0].text;
        
        // If it's real AI integration, it should either succeed with real API call
        // or fail with authentication error
        const hasRealIntegration = responseText.toLowerCase().includes('authentication') ||
                                  responseText.toLowerCase().includes('unauthorized') ||
                                  responseText.toLowerCase().includes('invalid api key');
        
        if (hasRealIntegration) {
            console.log(`${GREEN}✅ Real AI integration detected${RESET}`);
        } else {
            console.log(`${RED}❌ No real AI integration - responses appear mocked${RESET}`);
            findings.push("AI tools don't connect to real AI APIs, returning mock responses");
            failedTests++;
        }
        
        server.kill();
        return hasRealIntegration;
        
    } catch (error) {
        console.log(`${RED}❌ AI integration test failed: ${error.message}${RESET}`);
        failedTests++;
        return false;
    }
}

// Test 5: Verify tool schema validation
async function testSchemaValidation() {
    console.log(`${YELLOW}📝 Testing input schema validation...${RESET}`);
    
    try {
        const server = spawn('npm', ['run', 'http'], { stdio: 'pipe' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Send invalid input to see if schema validation works
        const response = await fetch('http://localhost:5002/mcp/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool: 'document_analyzer',
                input: {
                    // Missing required field: document_text
                    analysis_type: "comprehensive"
                }
            })
        });
        
        const result = await response.json();
        const isError = result.isError || result.content[0].text.toLowerCase().includes('error');
        
        if (isError) {
            console.log(`${GREEN}✅ Input schema validation working${RESET}`);
        } else {
            console.log(`${RED}❌ No input validation - accepts invalid data${RESET}`);
            findings.push("Tools don't properly validate input schemas");
            failedTests++;
        }
        
        server.kill();
        return isError;
        
    } catch (error) {
        console.log(`${RED}❌ Schema validation test failed: ${error.message}${RESET}`);
        failedTests++;
        return false;
    }
}

// Main execution
async function runVerification() {
    console.log(`${BLUE}Starting comprehensive verification...${RESET}\n`);
    
    const tests = [
        { name: "Tool Output Consistency", fn: testToolConsistency },
        { name: "API Key Validation", fn: testAPIKeyValidation },
        { name: "MCP Protocol Compliance", fn: testMCPCompliance },
        { name: "Real AI Integration", fn: testRealAIIntegration },
        { name: "Schema Validation", fn: testSchemaValidation }
    ];
    
    for (const test of tests) {
        console.log(`\n${BLUE}Running: ${test.name}${RESET}`);
        await test.fn();
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`${BLUE}VERIFICATION RESULTS${RESET}`);
    console.log('='.repeat(60));
    
    if (failedTests === 0) {
        console.log(`${GREEN}🎉 All tests passed! Cyrano appears to be a functional MCP server.${RESET}`);
    } else {
        console.log(`${RED}⚠️  ${failedTests} test(s) failed. Issues found:${RESET}`);
        findings.forEach((finding, index) => {
            console.log(`${RED}${index + 1}. ${finding}${RESET}`);
        });
        
        console.log(`\n${YELLOW}CONCLUSION:${RESET}`);
        console.log(`${RED}Cyrano MCP Server appears to be a mock/prototype system without real AI integration.${RESET}`);
        console.log(`${RED}The tools return static/computed responses rather than utilizing actual AI APIs.${RESET}`);
    }
    
    process.exit(failedTests > 0 ? 1 : 0);
}

// Add fetch polyfill for Node.js
if (!global.fetch) {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
}

runVerification().catch(console.error);