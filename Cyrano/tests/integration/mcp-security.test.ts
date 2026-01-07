/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * MCP Security Controls Integration Tests
 * Track Gamma: Tests token validation and scope minimization
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import {
  validateTokenAudience,
  validateTokenScopes,
  minimizeScopes,
  extractTokenScopes,
  MCP_SCOPES,
  MINIMAL_MCP_SCOPE,
} from '../../src/middleware/mcp-security.js';

describe('MCP Security Controls Integration (Track Gamma)', () => {
  const testSecret = 'test-secret-key-for-jwt-signing-minimum-32-chars';
  const expectedAudience = 'cyrano-mcp-server';

  describe('Token Audience Validation', () => {
    it('should validate token with correct audience', () => {
      const token = jwt.sign(
        {
          aud: expectedAudience,
          sub: 'user-123',
          scope: ['mcp:tools-basic'],
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        testSecret
      );

      const result = validateTokenAudience(token, expectedAudience);
      expect(result.valid).toBe(true);
      expect(result.payload?.aud).toBe(expectedAudience);
    });

    it('should reject token with wrong audience', () => {
      const token = jwt.sign(
        {
          aud: 'wrong-audience',
          sub: 'user-123',
          scope: ['mcp:tools-basic'],
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        testSecret
      );

      const result = validateTokenAudience(token, expectedAudience);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('audience mismatch');
    });

    it('should reject invalid token format', () => {
      const result = validateTokenAudience('invalid-token', expectedAudience);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid token format');
    });
  });

  describe('Token Scope Validation', () => {
    it('should validate token with required scopes', () => {
      const tokenScopes = ['mcp:tools-basic', 'mcp:tools-write'];
      const requiredScopes = ['mcp:tools-basic'];

      const result = validateTokenScopes(tokenScopes, requiredScopes);
      expect(result.valid).toBe(true);
    });

    it('should reject token missing required scopes', () => {
      const tokenScopes = ['mcp:tools-basic'];
      const requiredScopes = ['mcp:tools-basic', 'mcp:tools-write'];

      const result = validateTokenScopes(tokenScopes, requiredScopes);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('mcp:tools-write');
    });
  });

  describe('Scope Minimization', () => {
    it('should minimize scopes for read operation', () => {
      const requested = ['mcp:tools-basic', 'mcp:tools-write', 'mcp:tools-admin'];
      const minimized = minimizeScopes(requested, 'read');

      expect(minimized).toEqual(['mcp:tools-basic']);
    });

    it('should minimize scopes for write operation', () => {
      const requested = ['mcp:tools-basic', 'mcp:tools-write', 'mcp:tools-admin'];
      const minimized = minimizeScopes(requested, 'write');

      expect(minimized).toEqual(['mcp:tools-basic', 'mcp:tools-write']);
    });

    it('should return minimal scope for unknown operation', () => {
      const requested = ['mcp:tools-basic', 'mcp:tools-write'];
      const minimized = minimizeScopes(requested, 'unknown');

      expect(minimized).toEqual([MINIMAL_MCP_SCOPE]);
    });
  });

  describe('Scope Extraction', () => {
    it('should extract scopes from array', () => {
      const token = {
        scope: ['mcp:tools-basic', 'mcp:tools-write']
      } as any;

      const scopes = extractTokenScopes(token);
      expect(scopes).toEqual(['mcp:tools-basic', 'mcp:tools-write']);
    });

    it('should extract scopes from string', () => {
      const token = {
        scope: 'mcp:tools-basic mcp:tools-write'
      } as any;

      const scopes = extractTokenScopes(token);
      expect(scopes).toEqual(['mcp:tools-basic', 'mcp:tools-write']);
    });
  });

  describe('MCP Scopes Definition', () => {
    it('should define minimal scope', () => {
      expect(MINIMAL_MCP_SCOPE).toBe('mcp:tools-basic');
      expect(MCP_SCOPES[MINIMAL_MCP_SCOPE]).toBeDefined();
    });

    it('should define all required scopes', () => {
      expect(MCP_SCOPES['mcp:tools-basic']).toBeDefined();
      expect(MCP_SCOPES['mcp:tools-write']).toBeDefined();
      expect(MCP_SCOPES['mcp:tools-admin']).toBeDefined();
      expect(MCP_SCOPES['mcp:clio-read']).toBeDefined();
      expect(MCP_SCOPES['mcp:clio-write']).toBeDefined();
    });
  });
});
