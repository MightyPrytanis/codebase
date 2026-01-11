/**
 * Security Middleware for Cyrano MCP Server
 * Implements JWT authentication, CSRF protection, rate limiting, and secure headers
 * 
 * Created: 2025-12-15
 * Week 1 Security Hardening Implementation
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Lazy initialization of JSDOM to avoid blocking on import
let _window: any = null;
let _DOMPurify: ReturnType<typeof createDOMPurify> | null = null;

function getDOMPurify() {
  if (!_DOMPurify) {
    try {
      _window = new JSDOM('').window as any;
      _DOMPurify = createDOMPurify(_window as any);
    } catch (error) {
      console.error('[Security] Failed to initialize DOMPurify:', error);
      // Return a no-op function if DOMPurify fails to initialize
      _DOMPurify = {
        sanitize: (dirty: string) => dirty,
      } as any;
    }
  }
  return _DOMPurify;
}

// ============================================================================
// JWT Authentication
// ============================================================================

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Generate JWT access token (15 min expiry)
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }

  return jwt.sign(
    { ...payload, type: 'access' },
    jwtSecret,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

/**
 * Generate JWT refresh token (7 day expiry)
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }

  return jwt.sign(
    { ...payload, type: 'refresh' },
    jwtSecret,
    { expiresIn: '7d', algorithm: 'HS256' }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  try {
    return jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * JWT Authentication Middleware
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    
    if (payload.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Attach user info to request
    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// ============================================================================
// CSRF Protection
// ============================================================================

const csrfTokens = new Map<string, { token: string; expires: number }>();

/**
 * Generate CSRF token for a session
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour
  
  csrfTokens.set(sessionId, { token, expires });
  
  // Cleanup expired tokens
  for (const [id, data] of csrfTokens.entries()) {
    if (data.expires < Date.now()) {
      csrfTokens.delete(id);
    }
  }
  
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored) {
    return false;
  }
  
  if (stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
}

/**
 * CSRF Protection Middleware (double-submit cookie pattern)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;

  if (!sessionId) {
    return res.status(403).json({ error: 'Missing session ID' });
  }

  if (!csrfToken) {
    return res.status(403).json({ error: 'Missing CSRF token' });
  }

  if (!validateCSRFToken(sessionId as string, csrfToken as string)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

/**
 * Endpoint to get CSRF token
 */
export function getCSRFToken(req: Request, res: Response) {
  const sessionId = req.cookies?.sessionId || crypto.randomBytes(16).toString('hex');
  const token = generateCSRFToken(sessionId);
  
  // Set session cookie
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  });
  
  res.json({ csrfToken: token });
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Rate limiter for authenticated users (100 req/min)
 */
export const authenticatedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this user, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP with IPv6 support
    if ((req as any).user?.id) {
      return (req as any).user.id;
    }
    // Use ipKeyGenerator helper for proper IPv6 handling
    return ipKeyGenerator(req as any);
  },
  skip: (req) => {
    // Only apply to authenticated requests
    return !(req as any).user;
  },
});

/**
 * Rate limiter for unauthenticated users (20 req/min)
 */
export const unauthenticatedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address for unauthenticated users with IPv6 support
    return ipKeyGenerator(req as any);
  },
  skip: (req) => {
    // Only apply to unauthenticated requests
    return !!(req as any).user;
  },
});

/**
 * Strict rate limiter for auth endpoints (5 req/min)
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address for auth endpoints with IPv6 support
    return ipKeyGenerator(req as any);
  },
});

// ============================================================================
// Secure Headers (Helmet configuration)
// ============================================================================

export const secureHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

// ============================================================================
// Secure Cookie Configuration
// ============================================================================

export const secureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * Set authentication cookies
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  // Use dynamic secure flag based on current NODE_ENV
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    ...secureCookieOptions,
    secure: isProduction,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, {
    ...secureCookieOptions,
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('sessionId');
}

// ============================================================================
// Input Validation & Sanitization
// ============================================================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove javascript: protocol
  let sanitized = input.replace(/javascript:/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Use DOMPurify for additional sanitization
  const domPurify = getDOMPurify();
  if (domPurify) {
    sanitized = domPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }
  return sanitized.trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Input sanitization middleware
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeString(value);
      }
    }
  }

  // Sanitize body parameters (only strings)
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = sanitizeString(value);
      }
    }
  }

  next();
}

// ============================================================================
// Security Status Endpoint
// ============================================================================

export function securityStatus(req: Request, res: Response) {
  res.json({
    security: {
      jwtEnabled: !!process.env.JWT_SECRET,
      jwtSecretStrength: process.env.JWT_SECRET ? 
        (process.env.JWT_SECRET.length >= 32 ? 'strong' : 'weak') : 'missing',
      csrfProtection: 'enabled',
      rateLimiting: 'enabled',
      secureHeaders: 'enabled',
      secureCookies: process.env.NODE_ENV === 'production',
      https: req.protocol === 'https',
    },
    environment: process.env.NODE_ENV || 'development',
  });
}

// Export all middleware
export default {
  // Auth
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  authenticateJWT,
  requireRole,
  // CSRF
  csrfProtection,
  getCSRFToken,
  generateCSRFToken,
  validateCSRFToken,
  // Rate Limiting
  authenticatedLimiter,
  unauthenticatedLimiter,
  authLimiter,
  // Headers
  secureHeaders,
  // Cookies
  secureCookieOptions,
  setAuthCookies,
  clearAuthCookies,
  // Validation
  sanitizeInputs,
  sanitizeString,
  isValidEmail,
  // Status
  securityStatus,
};
