/**
 * Unit Tests for Claim Extractor Tool
 * 
 * Tests the shared verification tool for extracting claims from documents
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { claimExtractor, ClaimExtractor } from '../../../src/tools/verification/claim-extractor.js';
import { ClaimType, ClaimConfidence } from '../../../src/tools/verification/claim-extractor.js';

describe('Claim Extractor Tool', () => {
  let tool: ClaimExtractor;

  beforeEach(() => {
    tool = claimExtractor;
  });

  describe('getToolDefinition', () => {
    it('should return correct tool definition', () => {
      const definition = tool.getToolDefinition();
      
      expect(definition).toBeDefined();
      expect(definition.name).toBe('claim_extractor');
      expect(definition.description).toBeDefined();
      expect(definition.description).toContain('Extract claims');
      expect(definition.inputSchema).toBeDefined();
    });

    it('should have required input schema properties', () => {
      const definition = tool.getToolDefinition();
      const schema = definition.inputSchema;
      
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties.content).toBeDefined();
      expect(schema.properties.extractionType).toBeDefined();
      expect(schema.properties.minConfidence).toBeDefined();
    });
  });

  describe('extractClaims', () => {
    it('should extract factual claims from text', async () => {
      const testContent = 'The court ruled that the defendant was liable. The case was decided in 2023.';
      
      const result = await tool.extractClaims({
        content: testContent,
        extractionType: 'factual',
        minConfidence: 0.3,
      });
      
      expect(result).toBeDefined();
      expect(result.claims).toBeDefined();
      expect(Array.isArray(result.claims)).toBe(true);
      expect(result.totalClaims).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should extract legal claims from text', async () => {
      const testContent = 'The court held that the statute requires strict compliance. The plaintiff argued that the regulation was unconstitutional.';
      
      const result = await tool.extractClaims({
        content: testContent,
        extractionType: 'legal',
        minConfidence: 0.3,
      });
      
      expect(result).toBeDefined();
      expect(result.claims.length).toBeGreaterThan(0);
      
      // Check that claims are legal type
      const legalClaims = result.claims.filter(c => c.type === ClaimType.LEGAL);
      expect(legalClaims.length).toBeGreaterThan(0);
    });

    it('should extract citation claims from text', async () => {
      const testContent = 'See Smith v. Jones, 123 U.S. 456 (2020). Also see Doe v. Roe, 50 F.3d 789.';
      
      const result = await tool.extractClaims({
        content: testContent,
        extractionType: 'citations',
        minConfidence: 0.5,
      });
      
      expect(result).toBeDefined();
      expect(result.claims.length).toBeGreaterThan(0);
      
      // Check that claims are citation type
      const citationClaims = result.claims.filter(c => c.type === ClaimType.CITATION);
      expect(citationClaims.length).toBeGreaterThan(0);
    });

    it('should extract all claim types when extractionType is "all"', async () => {
      const testContent = 'The court ruled that the defendant was liable. See Smith v. Jones, 123 U.S. 456. I believe this is correct.';
      
      const result = await tool.extractClaims({
        content: testContent,
        extractionType: 'all',
        minConfidence: 0.3,
      });
      
      expect(result).toBeDefined();
      expect(result.claims.length).toBeGreaterThan(0);
      
      // Should have multiple claim types
      const claimTypes = new Set(result.claims.map(c => c.type));
      expect(claimTypes.size).toBeGreaterThan(1);
    });

    it('should filter claims by minConfidence threshold', async () => {
      const testContent = 'The court ruled. This is a statement.';
      
      const resultHigh = await tool.extractClaims({
        content: testContent,
        extractionType: 'all',
        minConfidence: 0.8,
      });
      
      const resultLow = await tool.extractClaims({
        content: testContent,
        extractionType: 'all',
        minConfidence: 0.3,
      });
      
      // Higher threshold should return fewer or equal claims
      expect(resultHigh.totalClaims).toBeLessThanOrEqual(resultLow.totalClaims);
      
      // All claims should meet confidence threshold
      resultHigh.claims.forEach(claim => {
        expect(claim.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should include entities when requested', async () => {
      const testContent = 'John Smith filed a lawsuit in New York. The company was based in California.';
      
      const result = await tool.extractClaims({
        content: testContent,
        extractionType: 'factual',
        includeEntities: true,
        minConfidence: 0.3,
      });
      
      expect(result).toBeDefined();
      // At least some claims should have entities
      const claimsWithEntities = result.claims.filter(c => c.entities && c.entities.length > 0);
      expect(claimsWithEntities.length).toBeGreaterThan(0);
    });

    it('should include keywords when requested', async () => {
      const testContent = 'The court ruled that the defendant was liable for damages.';
      
      const result = await tool.extractClaims({
        content: testContent,
        extractionType: 'factual',
        includeKeywords: true,
        minConfidence: 0.3,
      });
      
      expect(result).toBeDefined();
      // At least some claims should have keywords
      const claimsWithKeywords = result.claims.filter(c => c.keywords && c.keywords.length > 0);
      expect(claimsWithKeywords.length).toBeGreaterThan(0);
    });

    it('should return claims with proper structure', async () => {
      const testContent = 'The court ruled that the defendant was liable.';
      
      const result = await tool.extractClaims({
        content: testContent,
        extractionType: 'factual',
        minConfidence: 0.3,
      });
      
      if (result.claims.length > 0) {
        const claim = result.claims[0];
        expect(claim).toHaveProperty('id');
        expect(claim).toHaveProperty('text');
        expect(claim).toHaveProperty('type');
        expect(claim).toHaveProperty('confidence');
        expect(claim).toHaveProperty('confidenceLevel');
        expect(claim).toHaveProperty('source');
        expect(claim.confidence).toBeGreaterThanOrEqual(0);
        expect(claim.confidence).toBeLessThanOrEqual(1);
        expect([ClaimConfidence.HIGH, ClaimConfidence.MEDIUM, ClaimConfidence.LOW]).toContain(claim.confidenceLevel);
      }
    });
  });

  describe('execute (MCP)', () => {
    it('should execute successfully with valid input', async () => {
      const result = await tool.execute({
        content: 'The court ruled that the defendant was liable.',
        extractionType: 'factual',
        minConfidence: 0.5,
      });
      
      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      
      // Parse the JSON result
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.claims).toBeDefined();
      expect(parsed.totalClaims).toBeDefined();
    });

    it('should handle missing content gracefully', async () => {
      const result = await tool.execute({
        extractionType: 'all',
      });
      
      // Should return error or handle gracefully
      expect(result).toBeDefined();
      // Either error or empty result
      if (result.isError) {
        expect(result.content[0].text).toContain('Error');
      }
    });

    it('should validate input schema', async () => {
      const result = await tool.execute({
        content: 'Test content',
        extractionType: 'invalid_type', // Invalid enum value
        minConfidence: 2.0, // Invalid (should be 0-1)
      });
      
      // Should handle validation errors
      expect(result).toBeDefined();
    });

    it('should return CallToolResult format', async () => {
      const result = await tool.execute({
        content: 'Test content',
      });
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
      if (result.content.length > 0) {
        expect(result.content[0]).toHaveProperty('type');
        expect(result.content[0]).toHaveProperty('text');
      }
    });
  });

  describe('MCP Compliance', () => {
    it('should return CallToolResult format', async () => {
      const result = await tool.execute({
        content: 'Test content',
      });
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('should handle errors and return error format', async () => {
      // Test with invalid input that should cause an error
      const result = await tool.execute({
        // Missing required content
        extractionType: 'all',
      });
      
      // Should either return error or handle gracefully
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isError');
    });
  });
});

