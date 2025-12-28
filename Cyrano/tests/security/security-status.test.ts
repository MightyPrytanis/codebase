/**
 * Security Status Endpoint Tests
 * Tests security status endpoint and configuration reporting
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { securityStatus } from '../../src/middleware/security.js';

describe('Security Status Endpoint', () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = {
      protocol: 'https',
    } as unknown as Request;

    res = {
      json: vi.fn(),
    } as unknown as Response;
  });

  describe('securityStatus', () => {
    it('should return security configuration status', () => {
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
      process.env.NODE_ENV = 'production';

      securityStatus(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = (res.json as any).mock.calls[0][0];
      expect(response).toHaveProperty('security');
      expect(response).toHaveProperty('environment');
    });

    it('should report JWT status when secret is set', () => {
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';

      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.jwtEnabled).toBe(true);
      expect(response.security.jwtSecretStrength).toBe('strong');
    });

    it('should report JWT status when secret is missing', () => {
      delete process.env.JWT_SECRET;

      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.jwtEnabled).toBe(false);
      expect(response.security.jwtSecretStrength).toBe('missing');
    });

    it('should report weak JWT secret when too short', () => {
      process.env.JWT_SECRET = 'short';

      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.jwtEnabled).toBe(true);
      expect(response.security.jwtSecretStrength).toBe('weak');
    });

    it('should report CSRF protection status', () => {
      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.csrfProtection).toBe('enabled');
    });

    it('should report rate limiting status', () => {
      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.rateLimiting).toBe('enabled');
    });

    it('should report secure headers status', () => {
      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.secureHeaders).toBe('enabled');
    });

    it('should report secure cookies status in production', () => {
      process.env.NODE_ENV = 'production';

      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.secureCookies).toBe(true);
    });

    it('should report secure cookies status in development', () => {
      process.env.NODE_ENV = 'development';

      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.secureCookies).toBe(false);
    });

    it('should report HTTPS status', () => {
      req.protocol = 'https';
      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.https).toBe(true);
    });

    it('should report HTTP status when not using HTTPS', () => {
      req.protocol = 'http';
      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security.https).toBe(false);
    });

    it('should report environment', () => {
      process.env.NODE_ENV = 'test';
      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.environment).toBe('test');
    });

    it('should include all security features in response', () => {
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
      process.env.NODE_ENV = 'production';
      req.protocol = 'https';

      securityStatus(req, res);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.security).toHaveProperty('jwtEnabled');
      expect(response.security).toHaveProperty('jwtSecretStrength');
      expect(response.security).toHaveProperty('csrfProtection');
      expect(response.security).toHaveProperty('rateLimiting');
      expect(response.security).toHaveProperty('secureHeaders');
      expect(response.security).toHaveProperty('secureCookies');
      expect(response.security).toHaveProperty('https');
    });
  });
});
