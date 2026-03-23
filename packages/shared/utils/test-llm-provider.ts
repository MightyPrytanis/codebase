/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface LLMTestProviderResult {
  success: boolean;
  error?: string;
}

/**
 * Pure utility function that tests LLM provider connectivity via the Cyrano backend.
 * Framework-agnostic — no React imports. Used by both LexFiat and Arkiver.
 */
export async function testLLMProvider(
  provider: string,
  apiUrl = 'http://localhost:5002',
): Promise<LLMTestProviderResult> {
  const response = await fetch(`${apiUrl}/api/onboarding/test-llm-provider`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.error || 'Connection failed. Please check server configuration.',
    };
  }

  const data = await response.json();
  return data.success
    ? { success: true }
    : { success: false, error: data.error || 'Connection test failed.' };
}
