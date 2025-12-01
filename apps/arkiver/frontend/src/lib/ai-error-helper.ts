/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

// @ts-ignore - Vite alias resolves this at build time
import { createAIOfflineErrorHandler, getAIOfflineErrorMessage } from '@cyrano/shared-assets/ai-error-helper';
import { useToast } from '../components/ui/toast';

/**
 * Hook to get AI offline error handler for Arkiver
 * 
 * @param firstName - Optional first name from user context
 * @returns Function to show AI offline error
 */
export function useAIOfflineError() {
  const { addToast } = useToast();
  
  const showError = createAIOfflineErrorHandler((options: any) => {
    addToast({
      description: options.description,
      title: options.title,
      variant: options.variant || 'destructive',
    });
  });

  return (firstName?: string) => showError(firstName);
}

/**
 * Get the standardized AI offline error message
 * Re-exported for convenience
 */
export { getAIOfflineErrorMessage };

