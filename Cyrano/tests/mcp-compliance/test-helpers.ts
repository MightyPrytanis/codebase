/**
 * Test Helpers for MCP Compliance Tests
 * 
 * Provides utilities for testing MCP server compliance
 */

import { CyranoMCPServer } from '../../src/mcp-server.js';
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Get all tool definitions from the server
 */
export async function getToolDefinitions(): Promise<Tool[]> {
  const server = new CyranoMCPServer();
  
  // Access the server's internal handler
  // Note: This is a workaround since the server doesn't expose listTools directly
  // In a real scenario, we'd use the MCP protocol to request tools
  
  // For now, we'll need to test via the actual MCP protocol
  // or add a test helper method to the server class
  return [];
}

/**
 * Execute a tool via the server
 */
export async function executeTool(
  toolName: string,
  args: any
): Promise<CallToolResult> {
  const server = new CyranoMCPServer();
  
  // Similar issue - we need to use the MCP protocol
  // or add a test helper method
  throw new Error('Not implemented - requires MCP protocol or test helper');
}

/**
 * Get tool definitions directly from imports
 * This is a workaround for testing without running the full server
 */
export function getToolDefinitionsFromImports(): Tool[] {
  // Import all tools and get their definitions
  // This allows us to test tool structure without running the server
  const tools: Tool[] = [];
  
  // We'll need to import each tool and call getToolDefinition()
  // For now, return empty array as placeholder
  return tools;
}

/**
 * Validate a tool definition follows MCP spec
 */
export function validateToolDefinition(tool: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!tool.name || typeof tool.name !== 'string') {
    errors.push('Tool must have a string "name" field');
  }
  
  if (!tool.description || typeof tool.description !== 'string') {
    errors.push('Tool must have a string "description" field');
  }
  
  if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
    errors.push('Tool must have an object "inputSchema" field');
  }
  
  if (tool.inputSchema) {
    const schema = tool.inputSchema as any;
    if (!schema.type) {
      errors.push('inputSchema must have a "type" field');
    }
    if (schema.type === 'object' && !schema.properties) {
      errors.push('inputSchema with type "object" must have "properties"');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a CallToolResult follows MCP spec
 */
export function validateCallToolResult(result: CallToolResult): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!result.content || !Array.isArray(result.content)) {
    errors.push('CallToolResult must have a "content" array');
  }
  
  if (result.content && result.content.length > 0) {
    for (const item of result.content) {
      if (!item.type) {
        errors.push('Content items must have a "type" field');
      }
      if (item.type === 'text' && !item.text) {
        errors.push('Text content items must have a "text" field');
      }
    }
  }
  
  if (result.isError === true && result.content && result.content.length > 0) {
    const hasErrorText = result.content.some(item => 
      item.type === 'text' && item.text
    );
    if (!hasErrorText) {
      errors.push('Error responses must include error text in content');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

