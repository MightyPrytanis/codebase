/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Clio OAuth Integration Tests
 * Track Alpha: Tests OAuth infrastructure ready for credential drop-in
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  validateClioCredentials,
  generateOAuthState,
  validateOAuthState,
  generateClioAuthUrl,
  validateRedirectUri,
  oauthStateStore,
} from '../../src/integrations/clio-oauth.js';

describe('Clio OAuth Integration (Track Alpha)', () => {
  beforeEach(() => {
    // Clear state store before each test
    oauthStateStore.delete = jest.fn();
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
  });

  describe('Credential Validation', () => {
    it('should detect missing credentials gracefully', () => {
      delete process.env.CLIO_CLIENT_ID;
      delete process.env.CLIO_CLIENT_SECRET;

      const result = validateClioCredentials();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('CLIO_CLIENT_ID');
      expect(result.error).toContain('CLIO_CLIENT_SECRET');
      expect(result.error).toContain('ready - only credential configuration needed');
    });

    it('should validate credentials when present', () => {
      process.env.CLIO_CLIENT_ID = 'test_client_id';
      process.env.CLIO_CLIENT_SECRET = 'test_client_secret';

      const result = validateClioCredentials();
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('OAuth State Generation', () => {
    it('should generate secure OAuth state', () => {
      const state = generateOAuthState('https://example.com/callback', ['read', 'write'], 'user123');
      
      expect(state.state).toBeDefined();
      expect(state.state.length).toBeGreaterThan(32); // Hex string from 32 bytes
      expect(state.nonce).toBeDefined();
      expect(state.redirectUri).toBe('https://example.com/callback');
      expect(state.scopes).toEqual(['read', 'write']);
      expect(state.userId).toBe('user123');
      expect(state.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should generate unique states', () => {
      const state1 = generateOAuthState('https://example.com/callback');
      const state2 = generateOAuthState('https://example.com/callback');
      
      expect(state1.state).not.toBe(state2.state);
      expect(state1.nonce).not.toBe(state2.nonce);
    });
  });

  describe('OAuth State Validation', () => {
    it('should validate correct state', () => {
      const state = generateOAuthState('https://example.com/callback');
      const result = validateOAuthState(state.state, state);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject mismatched state', () => {
      const state = generateOAuthState('https://example.com/callback');
      const wrongState = generateOAuthState('https://example.com/callback');
      
      const result = validateOAuthState(wrongState.state, state);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid OAuth state parameter');
    });

    it('should reject expired state', () => {
      const state = generateOAuthState('https://example.com/callback');
      state.expiresAt = Date.now() - 1000; // Expired 1 second ago
      
      const result = validateOAuthState(state.state, state);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('Authorization URL Generation', () => {
    it('should generate URL when credentials available', () => {
      process.env.CLIO_CLIENT_ID = 'test_client_id';
      const state = generateOAuthState('https://example.com/callback', ['read', 'write']);
      
      const result = generateClioAuthUrl('https://example.com/callback', ['read', 'write'], state.state);
      
      expect(result.url).toBeDefined();
      expect(result.url).toContain('client_id=test_client_id');
      expect(result.url).toContain('redirect_uri=https://example.com/callback');
      expect(result.url).toContain('scope=read+write');
      expect(result.url).toContain(`state=${state.state}`);
      expect(result.error).toBeUndefined();
    });

    it('should fail gracefully when credentials missing', () => {
      delete process.env.CLIO_CLIENT_ID;
      const state = generateOAuthState('https://example.com/callback');
      
      const result = generateClioAuthUrl('https://example.com/callback', ['read'], state.state);
      
      expect(result.url).toBe('');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not configured');
    });
  });

  describe('Redirect URI Validation', () => {
    it('should validate exact match', () => {
      const result = validateRedirectUri(
        'https://example.com/callback',
        'https://example.com/callback'
      );
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject mismatched URIs', () => {
      const result = validateRedirectUri(
        'https://example.com/callback',
        'https://example.com/other'
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should require HTTPS in production', () => {
      process.env.NODE_ENV = 'production';
      
      const result = validateRedirectUri(
        'http://example.com/callback',
        'http://example.com/callback'
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HTTPS');
      
      process.env.NODE_ENV = 'test';
    });
  });
});
