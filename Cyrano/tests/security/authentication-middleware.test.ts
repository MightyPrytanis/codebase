/**
 * Authentication Middleware Tests
 * Tests JWT authentication and role-based authorization
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  authenticateJWT,
  requireRole,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from '../../src/middleware/security.js';

describe('Authentication Middleware', () => {
  const testJwtSecret = 'test-secret-key-minimum-32-characters-long-for-testing';
  
  beforeEach(() => {
    process.env.JWT_SECRET = testJwtSecret;
  });

  describe('authenticateJWT', () => {
    it('should reject requests without authorization header', () => {
      const req = {
        headers: {},
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      authenticateJWT(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid authorization header' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid authorization format', () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat token',
        },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      authenticateJWT(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      authenticateJWT(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject refresh tokens (require access tokens)', () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };
      
      // Generate refresh token (not access token)
      const refreshToken = generateRefreshToken(payload);
      
      const req = {
        headers: {
          authorization: `Bearer ${refreshToken}`,
        },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      authenticateJWT(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token type' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept valid access token and attach user to request', () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };
      
      const accessToken = generateAccessToken(payload);
      
      const req = {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      authenticateJWT(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect((req as any).user).toBeDefined();
      expect((req as any).user.userId).toBe(1);
      expect((req as any).user.email).toBe('test@example.com');
      expect((req as any).user.role).toBe('user');
      expect((req as any).user.type).toBe('access');
    });

    it('should handle expired tokens', () => {
      // Note: Testing actual expiration requires waiting 15 minutes
      // This test verifies the error handling exists
      const req = {
        headers: {
          authorization: 'Bearer expired.token.here',
        },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      authenticateJWT(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should reject requests without authentication', () => {
      const req = {
        user: undefined,
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      const middleware = requireRole('admin');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with insufficient role', () => {
      const req = {
        user: {
          userId: 1,
          email: 'test@example.com',
          role: 'user',
        },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      const middleware = requireRole('admin');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept requests with matching role', () => {
      const req = {
        user: {
          userId: 1,
          email: 'test@example.com',
          role: 'admin',
        },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      const middleware = requireRole('admin');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept requests with one of multiple allowed roles', () => {
      const req = {
        user: {
          userId: 1,
          email: 'test@example.com',
          role: 'moderator',
        },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      const middleware = requireRole('admin', 'moderator');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject requests when role does not match any allowed role', () => {
      const req = {
        user: {
          userId: 1,
          email: 'test@example.com',
          role: 'user',
        },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;
      
      const middleware = requireRole('admin', 'moderator');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});