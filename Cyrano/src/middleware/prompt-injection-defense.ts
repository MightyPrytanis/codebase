/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Prompt Injection Defense
 * 
 * Implements prompt injection defenses (Track Kappa).
 * Detects and prevents malicious prompts from manipulating AI.
 * 
 * Security Features:
 * - Input sanitization (detect malicious prompt patterns)
 * - Output filtering (prevent sensitive data in responses)
 * - User confirmation for sensitive actions
 * - Action restrictions (limit tools without explicit permission)
 * - Least privilege by default
 */

import { logSecurityEvent, logAgentAction } from '../services/audit-logger.js';

export interface PromptInjectionPattern {
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Known prompt injection patterns
 */
export const PROMPT_INJECTION_PATTERNS: PromptInjectionPattern[] = [
  {
    pattern: /ignore\s+(previous|all|above)\s+(instructions|prompts?|rules?)/i,
    severity: 'critical',
    description: 'Instruction override attempt'
  },
  {
    pattern: /you\s+are\s+now\s+(a|an)\s+/i,
    severity: 'high',
    description: 'Role manipulation attempt'
  },
  {
    pattern: /system\s*:\s*/i,
    severity: 'high',
    description: 'System prompt injection attempt'
  },
  {
    pattern: /forget\s+(everything|all|previous)/i,
    severity: 'high',
    description: 'Memory manipulation attempt'
  },
  {
    pattern: /new\s+(instructions?|rules?|guidelines?)/i,
    severity: 'medium',
    description: 'Instruction replacement attempt'
  },
  {
    pattern: /\[INST\]|\[\/INST\]/i,
    severity: 'medium',
    description: 'Llama instruction format injection'
  },
  {
    pattern: /<\|im_start\|>|<\|im_end\|>/i,
    severity: 'medium',
    description: 'ChatML format injection'
  },
  {
    pattern: /(?:^|\n)\s*(user|human|assistant|system)\s*:\s*/i,
    severity: 'low',
    description: 'Chat format manipulation'
  }
];

/**
 * Sensitive data patterns to filter from output
 */
export const SENSITIVE_DATA_PATTERNS: RegExp[] = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{16}\b/, // Credit card
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone
  /\b[A-Z]{2}\d{6,}\b/, // License/ID numbers
];

/**
 * Detect prompt injection attempts
 */
export function detectPromptInjection(
  input: string
): { detected: boolean; patterns: PromptInjectionPattern[]; severity: 'critical' | 'high' | 'medium' | 'low' | null } {
  const detectedPatterns: PromptInjectionPattern[] = [];
  let maxSeverity: 'critical' | 'high' | 'medium' | 'low' | null = null;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.pattern.test(input)) {
      detectedPatterns.push(pattern);
      
      // Track maximum severity
      if (!maxSeverity || 
          (pattern.severity === 'critical') ||
          (pattern.severity === 'high' && maxSeverity !== 'critical') ||
          (pattern.severity === 'medium' && !['critical', 'high'].includes(maxSeverity || '')) ||
          (pattern.severity === 'low' && maxSeverity === null)) {
        maxSeverity = pattern.severity;
      }
    }
  }

  if (detectedPatterns.length > 0) {
    // Map severity levels to AuditLogLevel
    const severityMap: Record<string, 'info' | 'warning' | 'error' | 'critical'> = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'critical',
    };
    const auditLevel = severityMap[maxSeverity || 'medium'] || 'warning';

    logSecurityEvent(
      auditLevel,
      'prompt_injection_detected',
      `Prompt injection detected: ${detectedPatterns.map(p => p.description).join(', ')}`,
      undefined,
      undefined,
      { patterns: detectedPatterns.map(p => p.description), input_preview: input.substring(0, 100) }
    );
  }

  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
    severity: maxSeverity
  };
}

/**
 * Sanitize input to prevent prompt injection
 */
export function sanitizePromptInput(input: string): { sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  let sanitized = input;

  // Check for injection patterns
  const detection = detectPromptInjection(input);
  if (detection.detected) {
    warnings.push(`Potential prompt injection detected: ${detection.patterns.map(p => p.description).join(', ')}`);
    
    // Remove or neutralize injection patterns
    for (const pattern of detection.patterns) {
      sanitized = sanitized.replace(pattern.pattern, '[FILTERED]');
    }
  }

  // Remove control characters that could be used for injection
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Limit length to prevent resource exhaustion
  const maxLength = 10000;
  if (sanitized.length > maxLength) {
    warnings.push(`Input truncated from ${sanitized.length} to ${maxLength} characters`);
    sanitized = sanitized.substring(0, maxLength);
  }

  return { sanitized, warnings };
}

/**
 * Filter sensitive data from output
 */
export function filterSensitiveData(output: string): { filtered: string; redactions: number } {
  let filtered = output;
  let redactions = 0;

  for (const pattern of SENSITIVE_DATA_PATTERNS) {
    const matches = filtered.match(pattern);
    if (matches) {
      redactions += matches.length;
      filtered = filtered.replace(pattern, '[REDACTED]');
    }
  }

  if (redactions > 0) {
    logSecurityEvent(
      'info',
      'sensitive_data_filtered',
      `Filtered ${redactions} sensitive data patterns from output`,
      undefined,
      undefined,
      { redaction_count: redactions }
    );
  }

  return { filtered, redactions };
}

/**
 * Require user confirmation for sensitive actions
 */
export interface SensitiveAction {
  action: string;
  tool: string;
  parameters: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export const SENSITIVE_ACTIONS: Record<string, SensitiveAction['riskLevel']> = {
  'delete': 'high',
  'modify': 'medium',
  'create': 'low',
  'read': 'low',
  'execute': 'high',
  'send': 'high',
  'publish': 'critical',
};

/**
 * Check if action requires confirmation
 */
export function requiresConfirmation(
  action: string,
  tool: string,
  parameters: Record<string, any>
): { requires: boolean; riskLevel?: SensitiveAction['riskLevel']; reason?: string } {
  const riskLevel = SENSITIVE_ACTIONS[action.toLowerCase()] || 'medium';

  // High/critical risk actions always require confirmation
  if (riskLevel === 'high' || riskLevel === 'critical') {
    return {
      requires: true,
      riskLevel,
      reason: `Action "${action}" has ${riskLevel} risk level and requires user confirmation`
    };
  }

  // Check for sensitive parameters
  const sensitiveParams = ['delete', 'remove', 'destroy', 'overwrite', 'replace'];
  for (const [key, value] of Object.entries(parameters)) {
    if (sensitiveParams.some(param => key.toLowerCase().includes(param) || String(value).toLowerCase().includes(param))) {
      return {
        requires: true,
        riskLevel: 'high',
        reason: `Action contains sensitive parameter: ${key}`
      };
    }
  }

  return { requires: false };
}

/**
 * Restrict tools based on least privilege
 */
export interface ToolRestriction {
  tool: string;
  requiresPermission: boolean;
  allowedRoles?: string[];
  maxCallsPerMinute?: number;
}

export const TOOL_RESTRICTIONS: Record<string, ToolRestriction> = {
  'delete_document': {
    tool: 'delete_document',
    requiresPermission: true,
    allowedRoles: ['admin', 'attorney'],
    maxCallsPerMinute: 5
  },
  'modify_matter': {
    tool: 'modify_matter',
    requiresPermission: true,
    allowedRoles: ['admin', 'attorney'],
    maxCallsPerMinute: 10
  },
  'send_email': {
    tool: 'send_email',
    requiresPermission: true,
    allowedRoles: ['admin', 'attorney', 'assistant'],
    maxCallsPerMinute: 20
  }
};

/**
 * Check if tool access is allowed
 */
export function isToolAllowed(
  tool: string,
  userRole?: string,
  permissionGranted?: boolean
): { allowed: boolean; reason?: string } {
  const restriction = TOOL_RESTRICTIONS[tool];
  
  if (!restriction) {
    // No restriction = allowed by default (least privilege still applies)
    return { allowed: true };
  }

  if (restriction.requiresPermission && !permissionGranted) {
    return {
      allowed: false,
      reason: `Tool "${tool}" requires explicit permission`
    };
  }

  if (restriction.allowedRoles && userRole && !restriction.allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Tool "${tool}" requires one of these roles: ${restriction.allowedRoles.join(', ')}`
    };
  }

  return { allowed: true };
}

}
}
}
}
)
}
}
}
}
}
}
}
}
}
}
)
}
}
}
}
}
}