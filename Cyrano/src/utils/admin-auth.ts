/*
 * Admin Authentication Utility
 * Checks if a request/user has admin privileges
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { Request } from 'express';

/**
 * Check if request has admin role
 */
export function isAdminRequest(req: Request): boolean {
  const user = (req as any).user;
  if (!user) {
    return false;
  }
  
  // Check if user has admin role
  return user.role === 'admin' || user.role === 'administrator';
}

/**
 * Check if user ID is admin
 */
export function isAdminUser(userId?: string, role?: string): boolean {
  if (!userId || !role) {
    return false;
  }
  
  return role === 'admin' || role === 'administrator';
}

/**
 * Middleware to require admin access
 */
export function requireAdmin(req: Request, res: any, next: any): void {
  if (!isAdminRequest(req)) {
    res.status(403).json({
      error: 'Admin access required',
      message: 'This endpoint requires administrator privileges',
    });
    return;
  }
  next();
