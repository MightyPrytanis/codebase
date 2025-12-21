/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { createAIOfflineErrorHandler, getAIOfflineErrorMessage } from '../../../../Cyrano/shared-assets/ai-error-helper';
import { toast } from '@/hooks/use-toast';

/**
 * Show AI offline error with HAL-inspired message
 * 
 * @param firstName - Optional first name from user context
 */
export function showAIOfflineError(firstName?: string): void {
  const message = getAIOfflineErrorMessage(firstName);
  
  toast({
    description: message,
    variant: 'destructive',
  });
}

/**
 * Get the standardized AI offline error message
 * Re-exported for convenience
 */
export { getAIOfflineErrorMessage };

