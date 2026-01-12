/**
 * Error Sanitization Utility
 * 
 * Sanitizes error messages to prevent information disclosure in production.
 * Detailed errors are logged server-side, while user-facing messages are sanitized.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sanitize error message for user-facing responses
 * Removes internal implementation details, file paths, stack traces, etc.
 */
export function sanitizeErrorMessage(error: unknown, context?: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // In development, return full error for debugging
  if (!isProduction) {
    return errorMessage;
  }
  
  // In production, sanitize error messages
  let sanitized = errorMessage;
  
  // Remove file paths
  sanitized = sanitized.replace(/\/[^\s]+\.(ts|js|tsx|jsx):\d+:\d+/g, '[file]');
  
  // Remove stack traces
  sanitized = sanitized.split('\n')[0]; // Only first line
  
  // Remove internal implementation details
  sanitized = sanitized.replace(/at\s+[^\s]+\s+\([^)]+\)/g, '');
  sanitized = sanitized.replace(/Error:\s*/gi, '');
  
  // Remove sensitive patterns (API keys, tokens, etc.)
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9]+/g, '[api-key]');
  sanitized = sanitized.replace(/pplx-[a-zA-Z0-9]+/g, '[api-key]');
  sanitized = sanitized.replace(/xai-[a-zA-Z0-9]+/g, '[api-key]');
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9]+/g, '[token]');
  
  // Remove database connection strings
  sanitized = sanitized.replace(/postgres:\/\/[^\s]+/g, '[database]');
  sanitized = sanitized.replace(/mongodb:\/\/[^\s]+/g, '[database]');
  
  // Remove internal module paths
  sanitized = sanitized.replace(/node_modules\/[^\s]+/g, '[module]');
  sanitized = sanitized.replace(/src\/[^\s]+/g, '[source]');
  
  // Clean up whitespace
  sanitized = sanitized.trim();
  
  // If sanitization removed everything, provide generic message
  if (!sanitized || sanitized.length === 0) {
    return context 
      ? `An error occurred while ${context}. Please try again or contact support if the issue persists.`
      : 'An error occurred. Please try again or contact support if the issue persists.';
  }
  
  // Add context if provided
  if (context) {
    return `Error ${context}: ${sanitized}`;
  }
  
  return sanitized;

/**
 * Log detailed error for server-side debugging
 * Use this for logging while returning sanitized messages to users
 */
export function logDetailedError(error: unknown, context?: string): void {
  if (error instanceof Error) {
    console.error(`[ERROR] ${context || 'Unhandled error'}:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.error(`[ERROR] ${context || 'Unhandled error'}:`, {
      error: String(error),
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Create a user-friendly error message
 * Combines sanitization with logging
 */
export function createUserFriendlyError(
  error: unknown, 
  userContext: string,
  logContext?: string
): string {
  // Log detailed error server-side
  logDetailedError(error, logContext || userContext);
  
  // Return sanitized message for user
  return sanitizeErrorMessage(error, userContext);

}
}
}
}
}
)
}
}