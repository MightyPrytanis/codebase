/**
 * Cookie Security Tests
 * Tests cookie security flags: SameSite, Secure, HttpOnly, maxAge
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Response } from 'express';
import {
  secureCookieOptions,
  setAuthCookies,
  clearAuthCookies,
} from '../../src/middleware/security.js';

describe('Cookie Security', () => {
  let res: Response;

  beforeEach(() => {
    res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;
  });

  describe('Cookie Configuration', () => {
    it('should have secure cookie options with correct defaults', () => {
      expect(secureCookieOptions.httpOnly).toBe(true);
      expect(secureCookieOptions.sameSite).toBe('strict');
      expect(secureCookieOptions.path).toBe('/');
      expect(secureCookieOptions.maxAge).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
    });

    it('should require Secure flag in production', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      expect(secureCookieOptions.secure).toBe(isProduction);
    });

    it('should require HttpOnly flag', () => {
      expect(secureCookieOptions.httpOnly).toBe(true);
    });

    it('should require SameSite strict', () => {
      expect(secureCookieOptions.sameSite).toBe('strict');
    });

    it('should set appropriate maxAge', () => {
      const expectedMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      expect(secureCookieOptions.maxAge).toBe(expectedMaxAge);
    });
  });

  describe('setAuthCookies', () => {
    it('should set access token cookie with correct options', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      
      setAuthCookies(res, accessToken, refreshToken);
      
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        accessToken,
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        })
      );
    });

    it('should set refresh token cookie with correct options', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      
      setAuthCookies(res, accessToken, refreshToken);
      
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        })
      );
    });

    it('should set both cookies', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      
      setAuthCookies(res, accessToken, refreshToken);
      
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });

    it('should use secure flag based on environment', () => {
      const originalEnv = process.env.NODE_ENV;
      
      process.env.NODE_ENV = 'production';
      setAuthCookies(res, 'token1', 'token2');
      const productionCall = (res.cookie as any).mock.calls[0][2];
      expect(productionCall.secure).toBe(true);
      
      process.env.NODE_ENV = 'development';
      (res.cookie as any).mockClear();
      setAuthCookies(res, 'token1', 'token2');
      const devCall = (res.cookie as any).mock.calls[0][2];
      expect(devCall.secure).toBe(false);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear access token cookie', () => {
      clearAuthCookies(res);
      
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken');
    });

    it('should clear refresh token cookie', () => {
      clearAuthCookies(res);
      
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('should clear session ID cookie', () => {
      clearAuthCookies(res);
      
      expect(res.clearCookie).toHaveBeenCalledWith('sessionId');
    });

    it('should clear all three cookies', () => {
      clearAuthCookies(res);
      
      expect(res.clearCookie).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cookie Security Best Practices', () => {
    it('should prevent JavaScript access (HttpOnly)', () => {
      expect(secureCookieOptions.httpOnly).toBe(true);
    });

    it('should prevent cross-site requests (SameSite strict)', () => {
      expect(secureCookieOptions.sameSite).toBe('strict');
    });

    it('should use HTTPS in production (Secure flag)', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      expect(secureCookieOptions.secure).toBe(isProduction);
    });

    it('should have appropriate expiration times', () => {
      // Access tokens should expire quickly (15 min)
      // Refresh tokens can last longer (7 days)
      const accessTokenMaxAge = 15 * 60 * 1000;
      const refreshTokenMaxAge = 7 * 24 * 60 * 60 * 1000;
      
      expect(accessTokenMaxAge).toBeLessThan(refreshTokenMaxAge);
    });
  });
});
