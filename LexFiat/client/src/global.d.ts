/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Global TypeScript declarations for LexFiat frontend environment.
 * 
 * This file augments the Vite ImportMetaEnv interface to add custom
 * environment variables used throughout the LexFiat client application.
 * Vite exposes environment variables via import.meta.env, and only
 * variables prefixed with VITE_ are exposed to the client code.
 * 
 * @see https://vitejs.dev/guide/env-and-mode.html
 */

interface ImportMetaEnv {
  /** Cyrano MCP Server API URL (default: http://localhost:5002) */
  readonly VITE_CYRANO_API_URL?: string;
  
  /** Cyrano API authentication key */
  readonly VITE_API_KEY?: string;
}

// Make this a module to ensure it's treated as an ambient declaration
export {};
