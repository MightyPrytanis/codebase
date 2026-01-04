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
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('jwt_token');
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role === 'admin' || payload.role === 'administrator') {
            return true;
          }
        } catch {
          // If JWT decode fails, fall through
        }
      }
      
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
          // Continue
        }
      }
    } catch (error) {
      console.error('[Admin Auth] Error checking admin status:', error);
    }
  }

  if (import.meta.env.VITE_ADMIN_MODE === 'true') {
    return true;
  }

  return false;
}

/**
 * Synchronous version
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
        // Continue
      }
    }
  }

  if (import.meta.env.VITE_ADMIN_MODE === 'true') {
    return true;
  }

  return false;
}
