/**
 * Verification Mode Selector Component
 * 
 * UI component for selecting multi-model verification modes in Arkiver
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import React, { useState } from 'react';
import { Info, AlertCircle, CheckCircle } from 'lucide-react';

export type VerificationMode = 'simple' | 'standard' | 'comprehensive' | 'custom';

interface VerificationModeSelectorProps {
  value: VerificationMode;
  onChange: (mode: VerificationMode) => void;
  className?: string;
}

interface ModeInfo {
  name: string;
  description: string;
  recommendation: string;
  estimatedTime: string;
  estimatedCost: string;
  warnings?: string[];
}

const MODE_INFO: Record<VerificationMode, ModeInfo> = {
  simple: {
    name: 'Simple',
    description: 'Single model fact-checking for quick verification',
    recommendation: 'Use for routine fact-checks and low-stakes claims',
    estimatedTime: '~1-2s',
    estimatedCost: 'Low',
  },
  standard: {
    name: 'Standard',
    description: 'Balanced accuracy with trust chain analysis using two models',
    recommendation: 'Recommended for most legal fact-checking scenarios',
    estimatedTime: '~2-4s',
    estimatedCost: 'Medium',
  },
  comprehensive: {
    name: 'Comprehensive',
    description: 'Maximum accuracy with full analysis using three specialized models',
    recommendation: 'Use for critical legal claims requiring maximum verification',
    estimatedTime: '~3-6s',
    estimatedCost: 'High',
    warnings: [
      'Higher cost due to multiple model calls',
      'Longer processing time',
      'May be overkill for simple claims',
    ],
  },
  custom: {
    name: 'Custom',
    description: 'User-defined model combinations for specific requirements',
    recommendation: 'For advanced users with specific verification needs',
    estimatedTime: 'Varies',
    estimatedCost: 'Varies',
  },
};

export function VerificationModeSelector({
  value,
  onChange,
  className = '',
}: VerificationModeSelectorProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const modeInfo = MODE_INFO[value];
  const isRecommended = value === 'standard';
  const hasWarnings = modeInfo.warnings && modeInfo.warnings.length > 0;

  return (
    <div className={`verification-mode-selector ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <label htmlFor="verification-mode" className="text-sm font-medium">
          Verification Mode:
        </label>
        <div className="relative flex-1">
          <select
            id="verification-mode"
            value={value}
            onChange={(e) => {
              const newMode = e.target.value as VerificationMode;
              onChange(newMode);
              if (newMode === 'comprehensive') {
                setShowWarnings(true);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="simple">Simple</option>
            <option value="standard">Standard (Recommended)</option>
            <option value="comprehensive">Comprehensive</option>
            <option value="custom">Custom</option>
          </select>
          {isRecommended && (
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
              Recommended
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="p-1 text-gray-500 hover:text-gray-700"
          aria-label="Show mode information"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Details */}
      {showInfo && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
          <div className="font-semibold text-blue-900 mb-1">{modeInfo.name}</div>
          <div className="text-blue-800 mb-2">{modeInfo.description}</div>
          <div className="flex items-center gap-4 text-xs text-blue-700">
            <span>⏱️ {modeInfo.estimatedTime}</span>
            <span>💰 {modeInfo.estimatedCost} cost</span>
          </div>
          {isRecommended && (
            <div className="mt-2 flex items-center gap-1 text-green-700">
              <CheckCircle className="w-3 h-3" />
              <span className="text-xs">{modeInfo.recommendation}</span>
            </div>
          )}
        </div>
      )}

      {/* Warnings for Comprehensive Mode */}
      {hasWarnings && showWarnings && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-yellow-900 mb-1">Considerations:</div>
              <ul className="list-disc list-inside text-yellow-800 text-xs space-y-1">
                {modeInfo.warnings!.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowWarnings(false)}
              className="text-yellow-600 hover:text-yellow-800"
              aria-label="Dismiss warnings"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Recommendation Badge */}
      {!showInfo && isRecommended && (
        <div className="mt-1 text-xs text-gray-600">
          ✓ Recommended: {modeInfo.recommendation}
        </div>
      )}
    </div>
  );
