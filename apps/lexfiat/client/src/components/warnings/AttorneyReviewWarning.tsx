/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from 'react';

interface AttorneyReviewWarningProps {
  className?: string;
  variant?: 'banner' | 'inline' | 'modal';
  showIcon?: boolean;
}

/**
 * Attorney Review Warning Component
 * 
 * Displays a standardized warning that AI-generated content requires attorney review.
 * Used throughout the application to ensure users understand that AI outputs must be
 * reviewed by a qualified attorney before use.
 */
export function AttorneyReviewWarning({
  className = '',
  variant = 'banner',
  showIcon = true,
}: AttorneyReviewWarningProps) {
  const warningText = '⚠️ ATTORNEY REVIEW REQUIRED: This AI-generated content has not been reviewed by a licensed attorney. All legal documents, calculations, and research results must be reviewed and verified by a qualified attorney before use. The system and its developers disclaim all liability for any errors, omissions, or inaccuracies in AI-generated content.';

  if (variant === 'banner') {
    return (
      <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 ${className}`}>
        <div className="flex">
          {showIcon && (
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              {warningText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`text-yellow-700 text-sm ${className}`}>
        {showIcon && '⚠️ '}
        {warningText}
      </span>
    );
  }

  // modal variant
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <div className={`ml-3 ${showIcon ? '' : ''}`}>
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Attorney Review Required
          </h3>
          <p className="text-sm text-yellow-700">
            {warningText}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AttorneyReviewWarning;
