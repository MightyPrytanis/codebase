/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from 'react';

interface ComplianceWarningProps {
  rule: string; // e.g., "MCR 2.113", "MRPC 1.1"
  description: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
  className?: string;
}

/**
 * Compliance Warning Component
 * 
 * Displays warnings about compliance issues (MCR, MRPC, etc.)
 * Used to alert users to potential compliance violations in generated content.
 */
export function ComplianceWarning({
  rule,
  description,
  severity = 'medium',
  recommendation,
  className = '',
}: ComplianceWarningProps) {
  const severityColors = {
    critical: 'bg-red-50 border-red-400 text-red-700',
    high: 'bg-orange-50 border-orange-400 text-orange-700',
    medium: 'bg-yellow-50 border-yellow-400 text-yellow-700',
    low: 'bg-blue-50 border-blue-400 text-blue-700',
  };

  const colorClass = severityColors[severity];

  return (
    <div className={`border-l-4 p-4 mb-3 ${colorClass} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            <strong>{rule}:</strong> {description}
          </p>
          {recommendation && (
            <p className="text-sm mt-1">
              <strong>Recommendation:</strong> {recommendation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComplianceWarning;
