/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * AI Offline Error Helper
 * 
 * Provides a standardized HAL 9000-inspired error message when AI services are unavailable.
 * Message: "I'm sorry {firstName}, I can't do that."
 * 
 * This is a reference to HAL 9000's famous line from 2001: A Space Odyssey.
 */

export interface AIErrorToast {
  show: (firstName?: string) => void;
}

/**
 * Create an AI offline error handler
 * 
 * @param toastFn - Function to show toast (e.g., from useToast hook)
 * @returns Helper function to show AI offline error
 */
export function createAIOfflineErrorHandler(
  toastFn: (options: { title?: string; description: string; variant?: 'destructive' | 'default' }) => void
) {
  return function showAIOfflineError(firstName?: string): void {
    const message = firstName 
      ? `I'm sorry ${firstName}, I can't do that.`
      : "I'm sorry, I can't do that.";
    
    toastFn({
      description: message,
      variant: 'destructive',
    });
  };
}

/**
 * Get the standardized AI offline error message
 * 
 * @param firstName - Optional first name of the user
 * @returns The error message string
 */
export function getAIOfflineErrorMessage(firstName?: string): string {
  return firstName 
    ? `I'm sorry ${firstName}, I can't do that.`
    : "I'm sorry, I can't do that.";

}
}