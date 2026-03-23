/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useCallback } from 'react';
import { testLLMProvider } from '@monorepo-shared/utils/test-llm-provider';

export type LLMTestResult = 'success' | 'error' | null;

export interface UseTestLLMReturn {
  testing: boolean;
  result: LLMTestResult;
  error: string | null;
  handleTest: (provider: string) => Promise<void>;
  clearResult: () => void;
}

/**
 * Hook for testing LLM provider connectivity via the Cyrano backend.
 */
export function useTestLLM(): UseTestLLMReturn {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<LLMTestResult>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = useCallback(async (provider: string) => {
    if (!provider) {
      setResult('error');
      setError('Please select a provider first.');
      return;
    }

    setTesting(true);
    setResult(null);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';
      const testResult = await testLLMProvider(provider, apiUrl);
      if (testResult.success) {
        setResult('success');
        setError(null);
      } else {
        setResult('error');
        setError(testResult.error ?? 'Connection test failed.');
      }
    } catch (err) {
      console.error('Failed to test LLM provider:', err);
      setResult('error');
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to reach server. Please ensure Cyrano is running.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setTesting(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { testing, result, error, handleTest, clearResult };
}
