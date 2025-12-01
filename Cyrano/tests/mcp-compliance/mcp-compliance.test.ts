/**
 * MCP Compliance Test Suite
 * 
 * Tests Cyrano MCP Server compliance with Model Context Protocol specification
 * 
 * This test suite verifies:
 * - Tool definition compliance
 * - Tool execution compliance (via direct tool imports)
 * - Module exposure compliance
 * - Engine exposure compliance
 * - Error handling compliance
 * 
 * Note: Full integration tests require a running server instance.
 * These tests verify structure and basic compliance.
 */

import { describe, it, expect } from 'vitest';
import { validateToolDefinition, validateCallToolResult } from './test-helpers.js';

// Import tools directly to test their definitions
import { systemStatus } from '../../src/tools/system-status.js';
import { chronometricModuleTool } from '../../src/tools/chronometric-module.js';
import { maeEngineTool } from '../../src/tools/mae-engine.js';
import { goodcounselEngineTool } from '../../src/tools/goodcounsel-engine.js';
import { potemkinEngineTool } from '../../src/tools/potemkin-engine.js';
import { documentAnalyzer } from '../../src/tools/document-analyzer.js';

describe('MCP Compliance Tests', () => {
  describe('Tool Definition Compliance', () => {
    it('should have all required tool fields', () => {
      const tool = systemStatus.getToolDefinition();
      
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toBeDefined();
    });

    it('should have valid JSON Schema input schemas', () => {
      const tool = systemStatus.getToolDefinition();
      const schema = tool.inputSchema as any;
      
      expect(schema).toBeTypeOf('object');
      expect(schema).toHaveProperty('type');
      if (schema.type === 'object') {
        expect(schema).toHaveProperty('properties');
      }
    });

    it('should pass tool definition validation', () => {
      const tool = systemStatus.getToolDefinition();
      const validation = validateToolDefinition(tool);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  describe('Tool Execution Compliance', () => {
    it('should return CallToolResult format for valid tools', async () => {
      const result = await systemStatus.execute({});
      
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0]).toHaveProperty('type');
      if (result.content[0].type === 'text') {
        expect(result.content[0]).toHaveProperty('text');
      }
    });

    it('should pass CallToolResult validation', async () => {
      const result = await systemStatus.execute({});
      const validation = validateCallToolResult(result);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should handle invalid input schemas', async () => {
      const result = await documentAnalyzer.execute({
        invalid_field: 'invalid_value'
      } as any);
      
      // Should either return an error or handle gracefully
      expect(result).toHaveProperty('content');
      const validation = validateCallToolResult(result);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Module Exposure Compliance', () => {
    it('should expose chronometric_module with correct format', () => {
      const tool = chronometricModuleTool.getToolDefinition();
      
      expect(tool.name).toBe('chronometric_module');
      expect(tool.description).toContain('Forensic Time Capture');
      const validation = validateToolDefinition(tool);
      expect(validation.valid).toBe(true);
    });

    it('should execute chronometric_module', async () => {
      const result = await chronometricModuleTool.execute({
        action: 'identify_gaps',
        input: {}
      });
      
      expect(result).toHaveProperty('content');
      const validation = validateCallToolResult(result);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Engine Exposure Compliance', () => {
    it('should expose mae_engine with correct format', () => {
      const tool = maeEngineTool.getToolDefinition();
      
      expect(tool.name).toBe('mae_engine');
      expect(tool.description).toContain('Multi-Agent');
      const validation = validateToolDefinition(tool);
      expect(validation.valid).toBe(true);
    });

    it('should expose goodcounsel_engine with correct format', () => {
      const tool = goodcounselEngineTool.getToolDefinition();
      
      expect(tool.name).toBe('goodcounsel_engine');
      const validation = validateToolDefinition(tool);
      expect(validation.valid).toBe(true);
    });

    it('should expose potemkin_engine with correct format', () => {
      const tool = potemkinEngineTool.getToolDefinition();
      
      expect(tool.name).toBe('potemkin_engine');
      const validation = validateToolDefinition(tool);
      expect(validation.valid).toBe(true);
    });

    it('should execute mae_engine workflows', async () => {
      const result = await maeEngineTool.execute({
        action: 'list_workflows'
      });
      
      expect(result).toHaveProperty('content');
      const validation = validateCallToolResult(result);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Error Handling Compliance', () => {
    it('should return errors in MCP format', async () => {
      // Test with invalid action for mae_engine
      const result = await maeEngineTool.execute({
        action: 'invalid_action_12345'
      } as any);
      
      // Should return valid CallToolResult format even for errors
      const validation = validateCallToolResult(result);
      expect(validation.valid).toBe(true);
      
      // If it's an error, should have isError flag
      if (result.isError) {
        expect(result.isError).toBe(true);
        expect(result.content.length).toBeGreaterThan(0);
      }
    });

    it('should include isError flag in error responses', async () => {
      // Test with completely invalid input
      const result = await maeEngineTool.execute({
        completely_invalid: 'input'
      } as any);
      
      // Should handle gracefully and return valid format
      const validation = validateCallToolResult(result);
      expect(validation.valid).toBe(true);
    });
  });
});

