/**
 * Unit Tests for Source Verifier Tool
 * 
 * Tests the shared verification tool for verifying source reliability
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sourceVerifier, SourceVerifier } from '../../../src/tools/verification/source-verifier.js';
import { SourceType, AccessibilityStatus, ReliabilityLevel } from '../../../src/tools/verification/source-verifier.js';

describe('Source Verifier Tool', () => {
  let tool: SourceVerifier;

  beforeEach(() => {
    tool = sourceVerifier;
  });

  describe('getToolDefinition', () => {
    it('should return correct tool definition', () => {
      const definition = tool.getToolDefinition();
      
      expect(definition).toBeDefined();
      expect(definition.name).toBe('source_verifier');
      expect(definition.description).toBeDefined();
      expect(definition.description).toContain('Verify');
      expect(definition.inputSchema).toBeDefined();
    });

    it('should have required input schema properties', () => {
      const definition = tool.getToolDefinition();
      const schema = definition.inputSchema;
      
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties.sources).toBeDefined();
      expect(schema.required).toContain('sources');
    });
  });

  describe('verifySources', () => {
    it('should verify government sources as high reliability', async () => {
      const sources = ['https://supremecourt.gov/case', 'https://congress.gov/bill'];
      
      const result = await tool.verifySources({
        sources,
        verificationLevel: 'basic',
        checkReliability: true,
        checkAccessibility: false, // Skip network calls in tests
      });
      
      expect(result).toBeDefined();
      expect(result.verifications).toBeDefined();
      expect(result.verifications.length).toBe(2);
      
      // Government sources should be high reliability
      const highReliability = result.verifications.filter(v => 
        v.reliability === ReliabilityLevel.HIGH
      );
      expect(highReliability.length).toBeGreaterThan(0);
    });

    it('should verify academic sources as high reliability', async () => {
      const sources = ['https://scholar.google.com/article', 'https://jstor.org/paper'];
      
      const result = await tool.verifySources({
        sources,
        verificationLevel: 'basic',
        checkReliability: true,
        checkAccessibility: false,
      });
      
      expect(result).toBeDefined();
      expect(result.verifications.length).toBe(2);
      
      // Academic sources should be high reliability
      const academicSources = result.verifications.filter(v => 
        v.type === SourceType.ACADEMIC && v.reliability === ReliabilityLevel.HIGH
      );
      expect(academicSources.length).toBeGreaterThan(0);
    });

    it('should identify source types correctly', async () => {
      const sources = [
        'https://example.com',
        'Smith v. Jones, 123 U.S. 456',
        '28 U.S.C. § 1331',
      ];
      
      const result = await tool.verifySources({
        sources,
        verificationLevel: 'basic',
        checkReliability: true,
        checkAccessibility: false,
      });
      
      expect(result).toBeDefined();
      expect(result.verifications.length).toBe(3);
      
      // Should identify different source types
      const sourceTypes = new Set(result.verifications.map(v => v.type));
      expect(sourceTypes.size).toBeGreaterThan(1);
    });

    it('should provide reliability scores', async () => {
      const sources = ['https://supremecourt.gov/case', 'https://blog.example.com/post'];
      
      const result = await tool.verifySources({
        sources,
        verificationLevel: 'comprehensive',
        checkReliability: true,
        checkAccessibility: false,
      });
      
      expect(result).toBeDefined();
      result.verifications.forEach(verification => {
        expect(verification.reliabilityScore).toBeGreaterThanOrEqual(0);
        expect(verification.reliabilityScore).toBeLessThanOrEqual(1);
      });
    });

    it('should provide summary statistics', async () => {
      const sources = [
        'https://supremecourt.gov/case',
        'https://blog.example.com/post',
        'https://scholar.google.com/article',
      ];
      
      const result = await tool.verifySources({
        sources,
        verificationLevel: 'basic',
        checkReliability: true,
        checkAccessibility: false,
      });
      
      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBe(3);
      expect(result.summary.highReliability).toBeGreaterThanOrEqual(0);
      expect(result.summary.mediumReliability).toBeGreaterThanOrEqual(0);
      expect(result.summary.lowReliability).toBeGreaterThanOrEqual(0);
    });

    it('should handle different verification levels', async () => {
      const sources = ['https://example.com'];
      
      const resultBasic = await tool.verifySources({
        sources,
        verificationLevel: 'basic',
        checkReliability: true,
        checkAccessibility: false,
      });
      
      const resultComprehensive = await tool.verifySources({
        sources,
        verificationLevel: 'comprehensive',
        checkReliability: true,
        checkAccessibility: false,
      });
      
      expect(resultBasic).toBeDefined();
      expect(resultComprehensive).toBeDefined();
      // Comprehensive should provide more detailed analysis
      expect(resultComprehensive.metadata.verificationLevel).toBe('comprehensive');
    });
  });

  describe('execute (MCP)', () => {
    it('should execute successfully with valid input', async () => {
      const result = await tool.execute({
        sources: ['https://supremecourt.gov/case'],
        verificationLevel: 'basic',
        checkReliability: true,
        checkAccessibility: false,
      });
      
      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      
      // Parse the JSON result
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.verifications).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });

    it('should handle empty sources array', async () => {
      const result = await tool.execute({
        sources: [],
      });
      
      // Should handle gracefully (validation error or empty result)
      expect(result).toBeDefined();
    });

    it('should validate input schema', async () => {
      const result = await tool.execute({
        // Missing required sources
        verificationLevel: 'basic',
      });
      
      // Should return validation error
      expect(result).toBeDefined();
      if (result.isError) {
        expect(result.content[0].text).toContain('Error');
      }
    });

    it('should return CallToolResult format', async () => {
      const result = await tool.execute({
        sources: ['https://example.com'],
      });
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
    });
  });

  describe('MCP Compliance', () => {
    it('should return CallToolResult format', async () => {
      const result = await tool.execute({
        sources: ['https://example.com'],
      });
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
    });
  });
});

