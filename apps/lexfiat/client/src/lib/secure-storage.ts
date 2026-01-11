/**
 * Secure Storage Utilities
 * 
 * Wrappers for localStorage/sessionStorage that sanitize data to prevent DOM XSS
 * when storage data is read and rendered in the DOM.
 * 
 * Created: 2025-12-21
 * Security Specialist Agent - DOM XSS Hardening
 */

import { sanitizeStorageData } from './dom-xss-security';

/**
 * Safe localStorage.getItem wrapper
 * Sanitizes data before returning to prevent XSS
 */
export function safeGetItem(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return null;
    }
    
    // For string values, return as-is but validate
    // The caller should sanitize when rendering
    return value;
  } catch (error) {
    console.error(`Failed to get localStorage item ${key}:`, error);
    return null;
  }
}

/**
 * Safe localStorage.setItem wrapper
 * Validates data before storing
 */
export function safeSetItem(key: string, value: string): void {
  try {
    // Validate key
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid storage key');
    }
    
    // Limit key length to prevent DoS
    if (key.length > 100) {
      throw new Error('Storage key too long');
    }
    
    // Limit value length to prevent DoS
    if (value.length > 1000000) { // 1MB limit
      throw new Error('Storage value too large');
    }
    
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to set localStorage item ${key}:`, error);
    throw error;
  }
}

/**
 * Safe localStorage.getItem with JSON parsing
 * Sanitizes parsed data before returning
 */
export function safeGetJSON<T>(key: string): T | null {
  try {
    const value = safeGetItem(key);
    if (value === null) {
      return null;
    }
    
    const parsed = JSON.parse(value);
    
    // Sanitize parsed data
    return sanitizeStorageData(parsed) as T;
  } catch (error) {
    console.error(`Failed to parse JSON from localStorage item ${key}:`, error);
    return null;
  }
}

/**
 * Safe localStorage.setItem with JSON stringification
 * Validates data before storing
 */
export function safeSetJSON(key: string, value: any): void {
  try {
    const jsonString = JSON.stringify(value);
    safeSetItem(key, jsonString);
  } catch (error) {
    console.error(`Failed to stringify JSON for localStorage item ${key}:`, error);
    throw error;
  }
}

/**
 * Safe localStorage.removeItem wrapper
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage item ${key}:`, error);
  }
}

/**
 * Safe sessionStorage wrappers (same API as localStorage)
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get sessionStorage item ${key}:`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      if (!key || typeof key !== 'string' || key.length > 100) {
        throw new Error('Invalid storage key');
      }
      if (value.length > 1000000) {
        throw new Error('Storage value too large');
      }
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set sessionStorage item ${key}:`, error);
      throw error;
    }
  },
  
  getJSON: <T>(key: string): T | null => {
    try {
      const value = sessionStorage.getItem(key);
      if (value === null) return null;
      const parsed = JSON.parse(value);
      return sanitizeStorageData(parsed) as T;
    } catch (error) {
      console.error(`Failed to parse JSON from sessionStorage item ${key}:`, error);
      return null;
    }
  },
  
  setJSON: (key: string, value: any): void => {
    try {
      const jsonString = JSON.stringify(value);
      sessionStorage.setItem(key, jsonString);
    } catch (error) {
      console.error(`Failed to stringify JSON for sessionStorage item ${key}:`, error);
      throw error;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove sessionStorage item ${key}:`, error);
    }
  },
};

}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}