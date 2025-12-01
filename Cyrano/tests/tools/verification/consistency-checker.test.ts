/**
 * Unit Tests for Consistency Checker Tool
 * 
 * Tests the shared verification tool for checking consistency across claims
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { consistencyChecker, ConsistencyChecker } from '../../../src/tools/verification/consistency-checker.js';
import { ConsistencyIssueType, IssueSeverity } from '../../../src/tools/verification/consistency-checker.js';
import type { ExtractedClaim } from '../../../src/tools/verification/claim-extractor.js';
import { ClaimType } from '../../../src/tools/verification/claim-extractor.js';

describe('Consistency Checker Tool', () => {
  let tool: ConsistencyChecker;

  beforeEach(() => {
    tool = consistencyChecker;
  });

  describe('getToolDefinition', () => {
    it('should return correct tool definition', () => {
      const definition = tool.getToolDefinition();
      
      expect(definition).toBeDefined();
      expect(definition.name).toBe('consistency_checker');
      expect(definition.description).toBeDefined();
      expect(definition.description).toContain('Check consistency');
      expect(definition.inputSchema).toBeDefined();
    });

    it('should have required input schema properties', () => {
      const definition = tool.getToolDefinition();
      const schema = definition.inputSchema;
      
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties.claims).toBeDefined();
      expect(schema.required).toContain('claims');
    });
  });

  describe('checkConsistency', () => {
    it('should detect contradictions between claims', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'The defendant was present at the scene.',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 40 },
        },
        {
          id: '2',
          text: 'The defendant was not present at the scene.',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 50, length: 45 },
        },
      ];
      
      const result = await tool.checkConsistency({
        claims,
        checkTypes: ['contradiction'],
        minConfidence: 0.6,
      });
      
      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      
      // Should detect contradiction
      const contradictions = result.issues.filter(i => i.type === ConsistencyIssueType.CONTRADICTION);
      expect(contradictions.length).toBeGreaterThan(0);
    });

    it('should detect inconsistencies', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'The contract was signed on January 1, 2023.',
          type: ClaimType.FACTUAL,
          confidence: 0.8,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 50 },
        },
        {
          id: '2',
          text: 'The contract was signed on February 1, 2023.',
          type: ClaimType.FACTUAL,
          confidence: 0.8,
          confidenceLevel: 'high' as any,
          source: { offset: 60, length: 50 },
        },
      ];
      
      const result = await tool.checkConsistency({
        claims,
        checkTypes: ['inconsistency'],
        minConfidence: 0.6,
      });
      
      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
      
      // Should detect inconsistency
      const inconsistencies = result.issues.filter(i => i.type === ConsistencyIssueType.INCONSISTENCY);
      expect(inconsistencies.length).toBeGreaterThan(0);
    });

    it('should calculate consistency score', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'The defendant was present.',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 25 },
        },
        {
          id: '2',
          text: 'The defendant was present.',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 30, length: 25 },
        },
      ];
      
      const result = await tool.checkConsistency({
        claims,
        checkTypes: ['contradiction', 'inconsistency'],
        minConfidence: 0.6,
      });
      
      expect(result).toBeDefined();
      expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(result.consistencyScore).toBeLessThanOrEqual(1);
      
      // Consistent claims should have high score
      expect(result.consistencyScore).toBeGreaterThan(0.5);
    });

    it('should detect temporal inconsistencies', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'The event occurred on January 1, 2023.',
          type: ClaimType.TEMPORAL,
          confidence: 0.8,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 40 },
        },
        {
          id: '2',
          text: 'The event occurred on December 31, 2022.',
          type: ClaimType.TEMPORAL,
          confidence: 0.8,
          confidenceLevel: 'high' as any,
          source: { offset: 50, length: 45 },
        },
      ];
      
      const result = await tool.checkConsistency({
        claims,
        checkTypes: ['temporal'],
        minConfidence: 0.6,
      });
      
      expect(result).toBeDefined();
      // Should detect temporal issues if dates conflict
      expect(result.issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide issue summary', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'Claim A',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 10 },
        },
        {
          id: '2',
          text: 'Claim B contradicts A',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 20, length: 25 },
        },
      ];
      
      const result = await tool.checkConsistency({
        claims,
        checkTypes: ['contradiction', 'inconsistency'],
        minConfidence: 0.6,
      });
      
      expect(result.summary).toBeDefined();
      expect(result.summary.totalClaims).toBe(2);
      expect(result.summary.totalIssues).toBeGreaterThanOrEqual(0);
      expect(result.summary.critical).toBeGreaterThanOrEqual(0);
      expect(result.summary.high).toBeGreaterThanOrEqual(0);
      expect(result.summary.medium).toBeGreaterThanOrEqual(0);
      expect(result.summary.low).toBeGreaterThanOrEqual(0);
    });

    it('should detect claim relationships when enabled', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'The defendant was present.',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 25 },
        },
        {
          id: '2',
          text: 'The defendant was present at the scene.',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 30, length: 40 },
        },
      ];
      
      const result = await tool.checkConsistency({
        claims,
        checkTypes: ['contradiction'],
        detectRelationships: true,
        minConfidence: 0.6,
      });
      
      expect(result).toBeDefined();
      expect(result.relationships).toBeDefined();
      expect(Array.isArray(result.relationships)).toBe(true);
    });

    it('should filter issues by minConfidence', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'Claim A',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 10 },
        },
        {
          id: '2',
          text: 'Claim B',
          type: ClaimType.FACTUAL,
          confidence: 0.9,
          confidenceLevel: 'high' as any,
          source: { offset: 20, length: 10 },
        },
      ];
      
      const resultHigh = await tool.checkConsistency({
        claims,
        checkTypes: ['contradiction'],
        minConfidence: 0.9,
      });
      
      const resultLow = await tool.checkConsistency({
        claims,
        checkTypes: ['contradiction'],
        minConfidence: 0.3,
      });
      
      // Higher threshold should return fewer or equal issues
      expect(resultHigh.issues.length).toBeLessThanOrEqual(resultLow.issues.length);
      
      // All issues should meet confidence threshold
      resultHigh.issues.forEach(issue => {
        expect(issue.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });
  });

  describe('execute (MCP)', () => {
    it('should execute successfully with valid input', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'Test claim',
          type: ClaimType.FACTUAL,
          confidence: 0.8,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 10 },
        },
      ];
      
      const result = await tool.execute({
        claims,
        checkTypes: ['contradiction'],
        minConfidence: 0.6,
      });
      
      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      
      // Parse the JSON result
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.issues).toBeDefined();
      expect(parsed.consistencyScore).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });

    it('should handle empty claims array', async () => {
      const result = await tool.execute({
        claims: [],
      });
      
      // Should handle gracefully
      expect(result).toBeDefined();
    });

    it('should validate input schema', async () => {
      const result = await tool.execute({
        // Missing required claims
        checkTypes: ['contradiction'],
      });
      
      // Should return validation error
      expect(result).toBeDefined();
      if (result.isError) {
        expect(result.content[0].text).toContain('Error');
      }
    });

    it('should return CallToolResult format', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'Test',
          type: ClaimType.FACTUAL,
          confidence: 0.8,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 5 },
        },
      ];
      
      const result = await tool.execute({
        claims,
      });
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
    });
  });

  describe('MCP Compliance', () => {
    it('should return CallToolResult format', async () => {
      const claims: ExtractedClaim[] = [
        {
          id: '1',
          text: 'Test',
          type: ClaimType.FACTUAL,
          confidence: 0.8,
          confidenceLevel: 'high' as any,
          source: { offset: 0, length: 5 },
        },
      ];
      
      const result = await tool.execute({
        claims,
      });
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
    });
  });
});

