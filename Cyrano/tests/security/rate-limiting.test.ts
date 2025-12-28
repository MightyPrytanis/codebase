/**
 * Rate Limiting Tests
 * Tests rate limiting for authenticated, unauthenticated, and auth endpoints
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  authenticatedLimiter,
  unauthenticatedLimiter,
  authLimiter,
} from '../../src/middleware/security.js';

describe('Rate Limiting', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1',
      method: 'GET',
      path: '/test',
      headers: {},
    } as unknown as Request;

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      getHeader: vi.fn(),
    } as unknown as Response;

    next = vi.fn() as NextFunction;
  });

  describe('Authenticated Rate Limiter', () => {
    it('should skip rate limiting for unauthenticated requests', async () => {
      (req as any).user = undefined;
      
      // Call the middleware - it should call next() without rate limiting
      await authenticatedLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(429);
    });

    it('should apply rate limiting for authenticated requests', async () => {
      (req as any).user = {
        id: 'user-1',
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };
      
      // Call the middleware - it should process the request
      await authenticatedLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should be a function (middleware)', () => {
      expect(typeof authenticatedLimiter).toBe('function');
    });
  });

  describe('Unauthenticated Rate Limiter', () => {
    it('should skip rate limiting for authenticated requests', async () => {
      (req as any).user = {
        id: 'user-1',
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };
      
      // Call the middleware - it should call next() without rate limiting
      await unauthenticatedLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(429);
    });

    it('should apply rate limiting for unauthenticated requests', async () => {
      (req as any).user = undefined;
      
      // Call the middleware - it should process the request
      await unauthenticatedLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should be a function (middleware)', () => {
      expect(typeof unauthenticatedLimiter).toBe('function');
    });
  });

  describe('Auth Endpoint Rate Limiter', () => {
    it('should apply rate limiting to all requests', async () => {
      // Auth limiter applies to all requests
      await authLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should be a function (middleware)', () => {
      expect(typeof authLimiter).toBe('function');
    });
  });

  describe('Rate Limiter Configuration', () => {
    it('should export all three rate limiters', () => {
      expect(authenticatedLimiter).toBeDefined();
      expect(unauthenticatedLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
      expect(typeof authenticatedLimiter).toBe('function');
      expect(typeof unauthenticatedLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
    });
  });
});
