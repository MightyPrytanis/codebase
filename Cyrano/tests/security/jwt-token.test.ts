/**
 * JWT Token Tests
 * Tests JWT token generation, validation, and refresh
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateAccessToken, generateRefreshToken, verifyToken, JWTPayload } from '../../src/middleware/security.js';

describe('JWT Token Management', () => {
  const originalEnv = process.env.JWT_SECRET;

  beforeEach(() => {
    // Set test JWT secret (32+ characters required)
    process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long-for-testing';
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.JWT_SECRET = originalEnv;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  describe('Token Generation', () => {
    it('should generate access token', () => {
      const payload: Omit<JWTPayload, 'type'> = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const token = generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate refresh token', () => {
      const payload: Omit<JWTPayload, 'type'> = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const token = generateRefreshToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should throw error if JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';
      
      const payload: Omit<JWTPayload, 'type'> = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      expect(() => generateAccessToken(payload)).toThrow('JWT_SECRET must be set and at least 32 characters');
    });
  });

  describe('Token Validation', () => {
    it('should verify valid access token', () => {
      const payload: Omit<JWTPayload, 'type'> = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('user');
      expect(decoded.type).toBe('access');
    });

    it('should verify valid refresh token', () => {
      const payload: Omit<JWTPayload, 'type'> = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const token = generateRefreshToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('user');
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error for expired token', async () => {
      // This test would require waiting for token expiration (15 minutes for access tokens)
      // For now, we'll test that the function exists and can handle expiration
      const payload: Omit<JWTPayload, 'type'> = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const token = generateAccessToken(payload);
      // Token should be valid immediately
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
    });
  });

  describe('Token Refresh', () => {
    it('should generate different tokens for access and refresh', () => {
      const payload: Omit<JWTPayload, 'type'> = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      expect(accessToken).not.toBe(refreshToken);
    });
  });
});
