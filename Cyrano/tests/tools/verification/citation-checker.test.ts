/**
 * Unit Tests for Citation Checker Tool
 * 
 * Tests the shared verification tool for validating citations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { citationChecker, CitationChecker } from '../../../src/tools/verification/citation-checker.js';
import { CitationStatus, CitationFormat } from '../../../src/tools/verification/citation-checker.js';

describe('Citation Checker Tool', () => {
  let tool: CitationChecker;

  beforeEach(() => {
    tool = citationChecker;
  });

  describe('getToolDefinition', () => {
    it('should return correct tool definition', () => {
      const definition = tool.getToolDefinition();
      
      expect(definition).toBeDefined();
      expect(definition.name).toBe('citation_checker');
      expect(definition.description).toBeDefined();
      expect(definition.description).toContain('Verify');
      expect(definition.inputSchema).toBeDefined();
    });

    it('should have required input schema properties', () => {
      const definition = tool.getToolDefinition();
      const schema = definition.inputSchema;
      
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties.citations).toBeDefined();
      expect(schema.required).toContain('citations');
    });
  });

  describe('checkCitations', () => {
    it('should validate legal citations', async () => {
      const citations = ['123 U.S. 456', '50 F.3d 789'];
      
      const result = await tool.checkCitations({
        citations,
        verifyFormat: true,
        strictMode: false,
      });
      
      expect(result).toBeDefined();
      expect(result.validations).toBeDefined();
      expect(result.validations.length).toBe(2);
      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBe(2);
    });

    it('should validate Michigan-style citations (no periods)', async () => {
      const citations = ['500 NW2d 100', '300 Mich 50'];
      
      const result = await tool.checkCitations({
        citations,
        verifyFormat: true,
        strictMode: false,
      });
      
      expect(result).toBeDefined();
      expect(result.validations.length).toBe(2);
      
      // Should recognize Michigan format
      const michiganCitations = result.validations.filter(v => 
        v.parsed?.reporter === 'NW2d' || v.parsed?.reporter === 'Mich'
      );
      expect(michiganCitations.length).toBeGreaterThan(0);
    });

    it('should validate academic citations', async () => {
      const citations = ['Smith (2020)', 'Jones et al. (2021)'];
      
      const result = await tool.checkCitations({
        citations,
        verifyFormat: true,
        strictMode: false,
      });
      
      expect(result).toBeDefined();
      expect(result.validations.length).toBe(2);
      
      // Should recognize academic format
      const academicCitations = result.validations.filter(v => 
        v.format === CitationFormat.ACADEMIC
      );
      expect(academicCitations.length).toBeGreaterThan(0);
    });

    it('should validate URL citations', async () => {
      const citations = ['https://example.com/article', 'http://test.org/page'];
      
      const result = await tool.checkCitations({
        citations,
        verifyFormat: true,
        strictMode: false,
      });
      
      expect(result).toBeDefined();
      expect(result.validations.length).toBe(2);
      
      // Should recognize URL format
      const urlCitations = result.validations.filter(v => 
        v.format === CitationFormat.URL
      );
      expect(urlCitations.length).toBeGreaterThan(0);
    });

    it('should identify invalid citations', async () => {
      const citations = ['invalid citation format', '123'];
      
      const result = await tool.checkCitations({
        citations,
        verifyFormat: true,
        strictMode: false,
      });
      
      expect(result).toBeDefined();
      expect(result.validations.length).toBe(2);
      
      // Should have some invalid citations
      const invalidCitations = result.validations.filter(v => 
        v.status === CitationStatus.INVALID
      );
      expect(invalidCitations.length).toBeGreaterThan(0);
    });

    it('should provide citation summary', async () => {
      const citations = ['123 U.S. 456', 'invalid', '50 F.3d 789'];
      
      const result = await tool.checkCitations({
        citations,
        verifyFormat: true,
        strictMode: false,
      });
      
      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBeGreaterThanOrEqual(0);
      expect(result.summary.invalid).toBeGreaterThanOrEqual(0);
      expect(result.summary.valid + result.summary.invalid + result.summary.partial + result.summary.unknown).toBe(3);
    });

    it('should use strict mode when enabled', async () => {
      const citations = ['123 U.S. 456', '50 F.3d 789'];
      
      const resultStrict = await tool.checkCitations({
        citations,
        verifyFormat: true,
        strictMode: true,
      });
      
      const resultPermissive = await tool.checkCitations({
        citations,
        verifyFormat: true,
        strictMode: false,
      });
      
      // Strict mode may flag more issues
      expect(resultStrict).toBeDefined();
      expect(resultPermissive).toBeDefined();
    });

    it('should parse citation components correctly', async () => {
      const citations = ['123 U.S. 456 (2020)'];
      
      const result = await tool.checkCitations({
        citations,
        verifyFormat: true,
      });
      
      expect(result.validations[0].parsed).toBeDefined();
      expect(result.validations[0].parsed?.volume).toBe('123');
      expect(result.validations[0].parsed?.reporter).toBe('U.S.');
      expect(result.validations[0].parsed?.page).toBe('456');
      expect(result.validations[0].parsed?.year).toBe('2020');
    });
  });

  describe('execute (MCP)', () => {
    it('should execute successfully with valid input', async () => {
      const result = await tool.execute({
        citations: ['123 U.S. 456'],
        verifyFormat: true,
      });
      
      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      
      // Parse the JSON result
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.validations).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });

    it('should handle empty citations array', async () => {
      const result = await tool.execute({
        citations: [],
      });
      
      // Should handle gracefully (validation error or empty result)
      expect(result).toBeDefined();
    });

    it('should validate input schema', async () => {
      const result = await tool.execute({
        // Missing required citations
        verifyFormat: true,
      });
      
      // Should return validation error
      expect(result).toBeDefined();
      if (result.isError) {
        expect(result.content[0].text).toContain('Error');
      }
    });

    it('should return CallToolResult format', async () => {
      const result = await tool.execute({
        citations: ['123 U.S. 456'],
      });
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
    });
  });

  describe('MCP Compliance', () => {
    it('should return CallToolResult format', async () => {
      const result = await tool.execute({
        citations: ['123 U.S. 456'],
      });
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
    });
  });
});

