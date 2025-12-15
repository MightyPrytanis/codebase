/**
 * Security Middleware Tests
 * Tests JWT generation, validation, CSRF, and security utilities
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateCSRFToken,
  validateCSRFToken,
  sanitizeString,
  isValidEmail,
} from '../../src/middleware/security.js';

describe('Security Middleware', () => {
  const testJwtSecret = 'test-secret-key-minimum-32-characters-long-for-testing';
  
  beforeEach(() => {
    process.env.JWT_SECRET = testJwtSecret;
  });

  describe('JWT Token Generation', () => {
    it('should generate access token with correct expiry', () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const token = generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });

    it('should generate refresh token with correct expiry', () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const token = generateRefreshToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });

    it('should throw error if JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => {
        generateAccessToken({
          userId: 1,
          email: 'test@example.com',
          role: 'user',
        });
      }).toThrow('JWT_SECRET must be set and at least 32 characters');
    });

    it('should throw error if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        generateAccessToken({
          userId: 1,
          email: 'test@example.com',
          role: 'user',
        });
      }).toThrow('JWT_SECRET must be set and at least 32 characters');
    });
  });

  describe('JWT Token Verification', () => {
    it('should verify valid access token', () => {
      const payload = {
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
      const payload = {
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

    it('should reject invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here');
      }).toThrow('Invalid token');
    });

    it('should reject malformed token', () => {
      expect(() => {
        verifyToken('not-even-a-token');
      }).toThrow();
    });
  });

  describe('CSRF Token Management', () => {
    it('should generate CSRF token', () => {
      const sessionId = 'test-session-123';
      const token = generateCSRFToken(sessionId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should validate correct CSRF token', () => {
      const sessionId = 'test-session-123';
      const token = generateCSRFToken(sessionId);

      const isValid = validateCSRFToken(sessionId, token);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect CSRF token', () => {
      const sessionId = 'test-session-123';
      generateCSRFToken(sessionId);

      const isValid = validateCSRFToken(sessionId, 'wrong-token');
      expect(isValid).toBe(false);
    });

    it('should reject CSRF token for wrong session', () => {
      const sessionId1 = 'test-session-123';
      const sessionId2 = 'test-session-456';
      const token = generateCSRFToken(sessionId1);

      const isValid = validateCSRFToken(sessionId2, token);
      expect(isValid).toBe(false);
    });

    it('should reject CSRF token for non-existent session', () => {
      const isValid = validateCSRFToken('non-existent-session', 'some-token');
      expect(isValid).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('Hello');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const sanitized = sanitizeString(input);
      expect(sanitized.toLowerCase()).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")';
      const sanitized = sanitizeString(input);
      expect(sanitized.toLowerCase()).not.toContain('onclick=');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const sanitized = sanitizeString(input);
      expect(sanitized).toBe('hello world');
    });

    it('should preserve safe content', () => {
      const input = 'Hello World 123!';
      const sanitized = sanitizeString(input);
      expect(sanitized).toBe('Hello World 123!');
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
});
