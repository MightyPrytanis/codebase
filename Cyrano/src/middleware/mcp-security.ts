/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * MCP Security Controls Middleware
 * 
 * Implements MCP-specific security controls:
 * - Token audience validation (aud claim matching)
 * - Scope minimization (minimal initial scope, incremental elevation)
 * - Session security (tokens, not sessions; bind to user ID if sessions required)
 * - Secure OAuth state parameters
 * 
 * Part of Track Gamma: MCP Security Controls
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logSecurityEvent } from '../services/audit-logger.js';

export interface MCPTokenPayload {
  aud: string; // Audience (must match server identifier)
  sub: string; // Subject (user ID)
  scope: string[] | string; // Scopes granted
  exp: number; // Expiration
  iat: number; // Issued at
  [key: string]: any;
}

export interface MCPScope {
  name: string;
  description: string;
  required: boolean;
}

/**
 * Minimal initial scope for MCP connections
 */
export const MINIMAL_MCP_SCOPE = 'mcp:tools-basic';

/**
 * Available MCP scopes with descriptions
 */
export const MCP_SCOPES: Record<string, MCPScope> = {
  'mcp:tools-basic': {
    name: 'mcp:tools-basic',
    description: 'Basic tool access (read-only operations)',
    required: false
  },
  'mcp:tools-write': {
    name: 'mcp:tools-write',
    description: 'Write operations (modify data)',
    required: false
  },
  'mcp:tools-admin': {
    name: 'mcp:tools-admin',
    description: 'Administrative operations (full access)',
    required: false
  },
  'mcp:clio-read': {
    name: 'mcp:clio-read',
    description: 'Read Clio data',
    required: false
  },
  'mcp:clio-write': {
    name: 'mcp:clio-write',
    description: 'Write Clio data',
    required: false
  }
};

/**
 * Validate token audience claim
 * Prevents token passthrough attacks
 */
export function validateTokenAudience(
  token: string,
  expectedAudience: string
): { valid: boolean; error?: string; payload?: MCPTokenPayload } {
  try {
    // Decode without verification first to check audience
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      return { valid: false, error: 'Invalid token format' };
    }

    const payload = decoded.payload as MCPTokenPayload;
    
    // Verify audience matches expected server identifier
    if (payload.aud !== expectedAudience) {
      logSecurityEvent(
        'warning',
        'mcp_token_audience_mismatch',
        `Token audience mismatch. Expected: ${expectedAudience}, Received: ${payload.aud}`
      );
      return {
        valid: false,
        error: `Token audience mismatch. Token not issued for this server. Expected: ${expectedAudience}, Received: ${payload.aud}`
      };
    }

    return { valid: true, payload };
  } catch (error) {
    return {
      valid: false,
      error: `Token validation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validate token scopes
 * Ensures token has required scopes
 */
export function validateTokenScopes(
  tokenScopes: string[],
  requiredScopes: string[]
): { valid: boolean; error?: string; missing?: string[] } {
  const missing = requiredScopes.filter(scope => !tokenScopes.includes(scope));
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required scopes: ${missing.join(', ')}`,
      missing
    };
  }

  return { valid: true };
}

/**
 * Minimize scopes - return only minimal required scopes
 */
export function minimizeScopes(requestedScopes: string[], operation: string): string[] {
  // Map operations to minimal required scopes
  const operationScopeMap: Record<string, string[]> = {
    'read': ['mcp:tools-basic'],
    'write': ['mcp:tools-basic', 'mcp:tools-write'],
    'admin': ['mcp:tools-basic', 'mcp:tools-write', 'mcp:tools-admin'],
    'clio-read': ['mcp:tools-basic', 'mcp:clio-read'],
    'clio-write': ['mcp:tools-basic', 'mcp:clio-write']
  };

  const minimalScopes = operationScopeMap[operation] || [MINIMAL_MCP_SCOPE];
  
  // Return intersection of requested and minimal scopes
  return requestedScopes.filter(scope => minimalScopes.includes(scope));
}

/**
 * Incremental scope elevation
 * Request additional scopes via WWW-Authenticate challenge
 */
export function requestScopeElevation(
  res: Response,
  requiredScopes: string[],
  currentScopes: string[]
): void {
  const missing = requiredScopes.filter(scope => !currentScopes.includes(scope));
  
  if (missing.length > 0) {
    const scopeString = missing.join(' ');
    res.setHeader(
      'WWW-Authenticate',
      `Bearer scope="${scopeString}", error="insufficient_scope", error_description="Additional scopes required: ${scopeString}"`
    );
    res.status(403).json({
      error: 'insufficient_scope',
      error_description: `Additional scopes required: ${missing.join(', ')}`,
      required_scopes: missing
    });
  }
}

/**
 * Middleware to validate MCP token audience
 */
export function validateMCPTokenAudience(expectedAudience: string = process.env.MCP_SERVER_IDENTIFIER || 'cyrano-mcp-server') {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const validation = validateTokenAudience(token, expectedAudience);

    if (!validation.valid) {
      logSecurityEvent('warning', 'mcp_token_validation_failed', validation.error || 'Token validation failed');
      return res.status(401).json({ error: validation.error || 'Invalid token' });
    }

    // Attach validated payload to request
    (req as any).mcpToken = validation.payload;
    next();
  };
}

/**
 * Middleware to validate MCP token scopes
 */
export function validateMCPTokenScopes(requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = (req as any).mcpToken as MCPTokenPayload | undefined;
    if (!token) {
      return res.status(401).json({ error: 'Token not validated' });
    }

    const tokenScopes = Array.isArray(token.scope) ? token.scope : [token.scope];
    const validation = validateTokenScopes(tokenScopes, requiredScopes);

    if (!validation.valid) {
      // Request scope elevation if missing scopes
      requestScopeElevation(res, requiredScopes, tokenScopes);
      return;
    }

    next();
  };
}

/**
 * Extract scopes from token
 */
export function extractTokenScopes(token: MCPTokenPayload): string[] {
  if (Array.isArray(token.scope)) {
    return token.scope;
  }
  if (typeof token.scope === 'string') {
    return token.scope.split(' ');
  }
  return [];
}

/**
 * Log scope elevation events
 */
export function logScopeElevation(
  userId: string,
  fromScopes: string[],
  toScopes: string[],
  reason: string
): void {
  logSecurityEvent(
    'info',
    'mcp_scope_elevation',
    `Scope elevation for user ${userId}: ${fromScopes.join(', ')} -> ${toScopes.join(', ')}`,
    userId,
    undefined,
    { fromScopes, toScopes, reason }
  );
