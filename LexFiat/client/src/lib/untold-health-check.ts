/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Untold Integration Health Check
 * Verifies Untold API connectivity and configuration
 */

import { getUntoldEngineClient, UntoldEngineConfig } from './untold-engine-api';

export interface UntoldHealthStatus {
  configured: boolean;
  reachable: boolean;
  error?: string;
  apiUrl?: string;
  hasApiKey: boolean;
}

/**
 * Test connection to Untold API
 */
export async function testUntoldConnection(): Promise<UntoldHealthStatus> {
  const apiUrl = import.meta.env.VITE_UNTOLD_API_URL || 'https://api.untoldengine.com';
  const apiKey = import.meta.env.VITE_UNTOLD_API_KEY;

  const status: UntoldHealthStatus = {
    configured: !!apiKey,
    reachable: false,
    apiUrl,
    hasApiKey: !!apiKey,
  };

  if (!apiKey) {
    status.error = 'Untold API key not configured. Please set VITE_UNTOLD_API_KEY environment variable.';
    return status;
  }

  try {
    const client = getUntoldEngineClient({ apiUrl, apiKey });
    
    // Try a simple health check endpoint or a lightweight API call
    // For now, we'll attempt to get feedback with no entries (lightweight call)
    const response = await fetch(`${apiUrl}/journal/feedback`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok || response.status === 404) {
      // 404 is acceptable - means API is reachable but no entries yet
      status.reachable = true;
    } else if (response.status === 401) {
      status.reachable = true;
      status.error = 'Untold API key is invalid or expired.';
    } else {
      status.reachable = false;
      status.error = `Untold API returned status ${response.status}: ${response.statusText}`;
    }
  } catch (error) {
    status.reachable = false;
    status.error = error instanceof Error ? error.message : 'Failed to connect to Untold API.';
  }

  return status;
}

/**
 * Get health status synchronously (checks configuration only)
 */
export function getUntoldHealthStatus(): UntoldHealthStatus {
  const apiUrl = import.meta.env.VITE_UNTOLD_API_URL || 'https://api.untoldengine.com';
  const apiKey = import.meta.env.VITE_UNTOLD_API_KEY;

  return {
    configured: !!apiKey,
    reachable: false, // Will be updated by async test
    apiUrl,
    hasApiKey: !!apiKey,
    error: !apiKey ? 'Untold API key not configured' : undefined,
  };
}

