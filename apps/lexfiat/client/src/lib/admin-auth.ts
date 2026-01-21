/*
 * Admin Authentication Utility (Frontend)
 * Checks if current user has admin privileges
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Check if current user is admin
 * Checks JWT token, localStorage, or environment variable
 */
export async function isAdmin(): Promise<boolean> {
  // Check JWT token from Authorization header or cookie
  if (typeof window !== 'undefined') {
    try {
      // Check for JWT in localStorage (set during login)
      const token = localStorage.getItem('auth_token') || localStorage.getItem('jwt_token');
      
      if (token) {
        // Decode JWT to check role (simple base64 decode, no verification needed for client-side check)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role === 'admin' || payload.role === 'administrator') {
            return true;
          }
        } catch {
          // If JWT decode fails, fall through to other checks
        }
      }
      
      // Check localStorage for admin flag (set during login)
      const adminFlag = localStorage.getItem('user_role');
      if (adminFlag === 'admin' || adminFlag === 'administrator') {
        return true;
      }
      
      // Check if user info is stored
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          if (user.role === 'admin' || user.role === 'administrator') {
            return true;
          }
        } catch {
          // If parse fails, continue
        }
      }
    } catch (error) {
      console.error('[Admin Auth] Error checking admin status:', error);
    }
  }

  // Check environment variable (for development)
  if (import.meta.env.VITE_ADMIN_MODE === 'true') {
    return true;
  }

  // Default: not admin (fail secure)
  return false;
}

/**
 * Synchronous version (for use in components that can't be async)
 * Checks localStorage and environment variable only
 */
export function isAdminSync(): boolean {
  if (typeof window !== 'undefined') {
    const adminFlag = localStorage.getItem('user_role');
    if (adminFlag === 'admin' || adminFlag === 'administrator') {
      return true;
    }
    
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        if (user.role === 'admin' || user.role === 'administrator') {
          return true;
        }
      } catch {
        // If parse fails, continue
      }
    }
  }

  if (import.meta.env.VITE_ADMIN_MODE === 'true') {
    return true;
  }

  return false;
}

/**
 * Get current user role
 */
export function getUserRole(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user_role');
  }
  return null;
