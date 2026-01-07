/**
 * ReDoS (Regular Expression Denial of Service) Test for UriTemplate
 * 
 * Tests that the patched UriTemplate class in @modelcontextprotocol/sdk
 * is not vulnerable to catastrophic backtracking in exploded array patterns.
 * 
 * Vulnerability: CVE-TBD
 * Original Pattern: ([^/]+(?:,[^/]+)*)
 * Fixed Pattern: ([^/,]+(?:,[^/,]+)*)
 */

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the UriTemplate class from the patched SDK
const sdkPath = join(__dirname, '../../node_modules/@modelcontextprotocol/sdk/dist/esm/shared/uriTemplate.js');
const { UriTemplate } = await import(sdkPath);

describe('ReDoS Prevention in UriTemplate', () => {
  describe('Exploded Array Pattern Security', () => {
    it('should handle normal exploded array patterns quickly', () => {
      const template = new UriTemplate('/api/items/{id*}');
      const startTime = Date.now();
      
      // Normal case: should be fast
      const uri = '/api/items/item1,item2,item3';
      const result = template.match(uri);
      
      const elapsed = Date.now() - startTime;
      
      expect(result).not.toBeNull();
      expect(result?.id).toEqual(['item1', 'item2', 'item3']);
      expect(elapsed).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should handle malicious ReDoS payload without catastrophic backtracking', () => {
      const template = new UriTemplate('/api/items/{id*}');
      const startTime = Date.now();
      
      // Malicious payload: long string with pattern designed to cause backtracking
      // In the vulnerable version, this would cause exponential time complexity
      const maliciousPayload = '/api/items/' + 'a'.repeat(100) + '/////';
      
      try {
        const result = template.match(maliciousPayload);
        const elapsed = Date.now() - startTime;
        
        // Should either not match (null) or match quickly
        expect(elapsed).toBeLessThan(1000); // Should complete in < 1 second
        
        // If it matches, it should be valid
        if (result !== null) {
          expect(result).toHaveProperty('id');
        }
      } catch (error) {
        // If it throws, make sure it's not taking too long
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(1000);
      }
    });

    it('should handle edge case with many commas without exponential time', () => {
      const template = new UriTemplate('/api/items/{id*}');
      const startTime = Date.now();
      
      // Edge case: many commas that could trigger backtracking
      const edgeCasePayload = '/api/items/' + ','.repeat(50) + 'item';
      
      try {
        const result = template.match(edgeCasePayload);
        const elapsed = Date.now() - startTime;
        
        expect(elapsed).toBeLessThan(500); // Should be very fast
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(500);
      }
    });

    it('should handle alternating pattern without backtracking', () => {
      const template = new UriTemplate('/api/items/{id*}');
      const startTime = Date.now();
      
      // Pattern that could cause backtracking in vulnerable regex
      // Alternating characters that don't fit the expected pattern
      const payload = '/api/items/' + 'a/'.repeat(50) + 'aaaa';
      
      try {
        const result = template.match(payload);
        const elapsed = Date.now() - startTime;
        
        expect(elapsed).toBeLessThan(500);
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(500);
      }
    });

    it('should handle slash operator with exploded pattern securely', () => {
      const template = new UriTemplate('/api{/path*}');
      const startTime = Date.now();
      
      // Test with slash operator and exploded pattern
      const uri = '/api/path1/path2/path3';
      const result = template.match(uri);
      
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeLessThan(100);
      // The result might not match due to the specific pattern, but it should be fast
    });

    it('should prevent DoS with extremely long input', () => {
      const template = new UriTemplate('/api/items/{id*}');
      const startTime = Date.now();
      
      // Very long input that could cause issues if regex is poorly designed
      const longInput = '/api/items/' + 'x'.repeat(1000);
      
      try {
        const result = template.match(longInput);
        const elapsed = Date.now() - startTime;
        
        // Should handle long input efficiently
        expect(elapsed).toBeLessThan(2000); // 2 seconds max for very long input
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(2000);
      }
    });
  });

  describe('Pattern Matching Correctness', () => {
    it('should correctly match valid exploded array with commas', () => {
      const template = new UriTemplate('/users/{ids*}');
      const uri = '/users/1,2,3,4,5';
      const result = template.match(uri);
      
      expect(result).not.toBeNull();
      expect(result?.ids).toEqual(['1', '2', '3', '4', '5']);
    });

    it('should correctly match single value in exploded pattern', () => {
      const template = new UriTemplate('/users/{ids*}');
      const uri = '/users/123';
      const result = template.match(uri);
      
      expect(result).not.toBeNull();
      expect(result?.ids).toBe('123');
    });

    it('should not match URIs with forward slashes in exploded pattern', () => {
      const template = new UriTemplate('/users/{ids*}');
      const uri = '/users/1,2/3,4'; // Forward slash in the middle
      const result = template.match(uri);
      
      // Should not match because the pattern excludes forward slashes
      expect(result).toBeNull();
    });

    it('should handle non-exploded pattern correctly', () => {
      const template = new UriTemplate('/users/{id}');
      const uri = '/users/123';
      const result = template.match(uri);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('123');
    });

    it('should reject commas in non-exploded pattern', () => {
      const template = new UriTemplate('/users/{id}');
      const uri = '/users/1,2,3';
      const result = template.match(uri);
      
      // Non-exploded pattern should not match comma-separated values
      expect(result).toBeNull();
    });
  });

  describe('Template Expansion (no ReDoS in expansion)', () => {
    it('should expand exploded arrays correctly', () => {
      const template = new UriTemplate('/users/{ids*}');
      const expanded = template.expand({ ids: ['1', '2', '3'] });
      
      expect(expanded).toBe('/users/1,2,3');
    });

    it('should expand single value correctly', () => {
      const template = new UriTemplate('/users/{id}');
      const expanded = template.expand({ id: '123' });
      
      expect(expanded).toBe('/users/123');
    });

    it('should handle slash operator with exploded arrays', () => {
      const template = new UriTemplate('/api{/paths*}');
      const expanded = template.expand({ paths: ['v1', 'users', '123'] });
      
      expect(expanded).toBe('/api/v1/users/123');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain consistent performance across various input sizes', () => {
      const template = new UriTemplate('/api/items/{id*}');
      const sizes = [10, 50, 100, 200];
      const times: number[] = [];
      
      for (const size of sizes) {
        const uri = '/api/items/' + 'a'.repeat(size);
        const startTime = Date.now();
        
        try {
          template.match(uri);
        } catch (error) {
          // Ignore errors, we're just measuring time
        }
        
        const elapsed = Date.now() - startTime;
        times.push(elapsed);
      }
      
      // Time should scale linearly, not exponentially
      // Even for 200 characters, should be very fast
      expect(times[times.length - 1]).toBeLessThan(100);
      
      // Check that we don't have exponential growth
      // If vulnerable, time would double with each size doubling
      for (let i = 1; i < times.length; i++) {
        const ratio = times[i] / (times[i - 1] || 1);
        // Ratio should not be exponentially growing
        expect(ratio).toBeLessThan(10); // Very generous bound
      }
    });
  });
});
