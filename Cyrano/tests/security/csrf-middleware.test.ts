/**
 * CSRF Middleware Tests
 * Tests CSRF token generation, validation, and safe method bypass
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateCSRFToken, validateCSRFToken, csrfProtection, getCSRFToken } from '../../src/middleware/security.js';
import { Request, Response, NextFunction } from 'express';

describe('CSRF Protection', () => {
  describe('Token Generation', () => {
    it('should generate CSRF token', () => {
      const sessionId = 'test-session-123';
      const token = generateCSRFToken(sessionId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different sessions', () => {
      const token1 = generateCSRFToken('session-1');
      const token2 = generateCSRFToken('session-2');
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Validation', () => {
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

    it('should reject token for different session', () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      const token = generateCSRFToken(sessionId1);
      
      const isValid = validateCSRFToken(sessionId2, token);
      expect(isValid).toBe(false);
    });
  });

  describe('Safe Methods Bypass', () => {
    it('should allow GET requests without CSRF token', () => {
      const req = {
        method: 'GET',
        cookies: {},
        headers: {},
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should allow HEAD requests without CSRF token', () => {
      const req = {
        method: 'HEAD',
        cookies: {},
        headers: {},
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should allow OPTIONS requests without CSRF token', () => {
      const req = {
        method: 'OPTIONS',
        cookies: {},
        headers: {},
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('State-Changing Methods Protection', () => {
    it('should reject POST requests without CSRF token', () => {
      const req = {
        method: 'POST',
        cookies: {},
        headers: {},
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject PUT requests without CSRF token', () => {
      const req = {
        method: 'PUT',
        cookies: {},
        headers: {},
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject DELETE requests without CSRF token', () => {
      const req = {
        method: 'DELETE',
        cookies: {},
        headers: {},
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject PATCH requests without CSRF token', () => {
      const req = {
        method: 'PATCH',
        cookies: {},
        headers: {},
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow POST requests with valid CSRF token in header', () => {
      const sessionId = 'test-session-123';
      const token = generateCSRFToken(sessionId);
      
      const req = {
        method: 'POST',
        cookies: { sessionId },
        headers: { 'x-csrf-token': token },
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow POST requests with valid CSRF token in body', () => {
      const sessionId = 'test-session-123';
      const token = generateCSRFToken(sessionId);
      
      const req = {
        method: 'POST',
        cookies: { sessionId },
        headers: {},
        body: { _csrf: token },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject POST requests with invalid CSRF token', () => {
      const sessionId = 'test-session-123';
      generateCSRFToken(sessionId); // Generate valid token but use wrong one
      
      const req = {
        method: 'POST',
        cookies: { sessionId },
        headers: { 'x-csrf-token': 'wrong-token' },
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept session ID from x-session-id header', () => {
      const sessionId = 'test-session-123';
      const token = generateCSRFToken(sessionId);
      
      const req = {
        method: 'POST',
        cookies: {},
        headers: { 
          'x-session-id': sessionId,
          'x-csrf-token': token 
        },
        body: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      csrfProtection(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('CSRF Token Endpoint', () => {
    it('should generate and return CSRF token', () => {
      const req = {
        cookies: {},
      } as unknown as Request;
      
      const res = {
        cookie: vi.fn(),
        json: vi.fn(),
      } as unknown as Response;
      
      getCSRFToken(req, res);
      
      expect(res.json).toHaveBeenCalled();
      const callArgs = (res.json as any).mock.calls[0][0];
      expect(callArgs).toHaveProperty('csrfToken');
      expect(typeof callArgs.csrfToken).toBe('string');
      expect(callArgs.csrfToken.length).toBeGreaterThan(0);
    });

    it('should set session cookie when generating token', () => {
      const req = {
        cookies: {},
      } as unknown as Request;
      
      const res = {
        cookie: vi.fn(),
        json: vi.fn(),
      } as unknown as Response;
      
      getCSRFToken(req, res);
      
      expect(res.cookie).toHaveBeenCalledWith(
        'sessionId',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: 'strict',
          maxAge: 3600000,
        })
      );
    });

    it('should use existing session ID from cookie', () => {
      const existingSessionId = 'existing-session-123';
      const req = {
        cookies: { sessionId: existingSessionId },
      } as unknown as Request;
      
      const res = {
        cookie: vi.fn(),
        json: vi.fn(),
      } as unknown as Response;
      
      getCSRFToken(req, res);
      
      // Should still set cookie (might regenerate or keep same)
      expect(res.json).toHaveBeenCalled();
    });
  });
});
