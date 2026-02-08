/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Gatekeeper Pattern Implementation
 * 
 * Implements gatekeeper pattern for confidential data handling (Track Kappa).
 * Designates specific agents as PII/confidential data handlers with strict output filters.
 * 
 * Security Features:
 * - Agent designation for confidential data handling
 * - Strict output filtering
 * - Data minimization (agents receive only minimum data necessary)
 * - Explicit consent for data sharing between agents
 */

import { logSecurityEvent, logAgentAction } from '../services/audit-logger.js';
import { enforceMatterIsolation } from './matter-isolation.js';

export type AgentRole = 'gatekeeper' | 'processor' | 'analyzer' | 'general';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export interface GatekeeperConfig {
  agentId: string;
  role: AgentRole;
  allowedDataClassifications: DataClassification[];
  outputFilters: string[]; // Patterns to filter from output
  requiresExplicitConsent: boolean;
}

export interface DataRequest {
  agentId: string;
  dataClassification: DataClassification;
  matterId?: string;
  data: any;
  purpose: string;
}

/**
 * Gatekeeper configuration store
 */
class GatekeeperStore {
  private configs: Map<string, GatekeeperConfig> = new Map();
  private consentLog: Map<string, { from: string; to: string; timestamp: number; matterId?: string }> = new Map();

  registerAgent(config: GatekeeperConfig): void {
    this.configs.set(config.agentId, config);
  }

  getConfig(agentId: string): GatekeeperConfig | undefined {
    return this.configs.get(agentId);
  }

  isGatekeeper(agentId: string): boolean {
    const config = this.configs.get(agentId);
    return config?.role === 'gatekeeper';
  }

  canAccessData(agentId: string, classification: DataClassification): boolean {
    const config = this.configs.get(agentId);
    if (!config) return false;
    return config.allowedDataClassifications.includes(classification);
  }

  logConsent(fromAgent: string, toAgent: string, matterId?: string): void {
    const consentId = `${fromAgent}-${toAgent}-${Date.now()}`;
    this.consentLog.set(consentId, {
      from: fromAgent,
      to: toAgent,
      timestamp: Date.now(),
      matterId
    });
  }

  hasConsent(fromAgent: string, toAgent: string, matterId?: string): boolean {
    // Check if consent was given recently (within last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const consent of this.consentLog.values()) {
      if (consent.from === fromAgent &&
          consent.to === toAgent &&
          consent.timestamp > oneHourAgo &&
          (!matterId || consent.matterId === matterId)) {
        return true;
      }
    }
    return false;
  }
}

export const gatekeeperStore = new GatekeeperStore();

/**
 * Filter output based on gatekeeper configuration
 */
export function filterOutput(
  output: string,
  agentId: string
): string {
  const config = gatekeeperStore.getConfig(agentId);
  if (!config || config.outputFilters.length === 0) {
    return output;
  }

  let filtered = output;
  for (const pattern of config.outputFilters) {
    // Remove patterns that might leak confidential data
    // Pattern from application config for data redaction - controlled by admin, not user input
    const regex = new RegExp(pattern, 'gi'); // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    filtered = filtered.replace(regex, '[REDACTED]');
  }

  return filtered;
}

/**
 * Minimize data - return only minimum necessary
 */
export function minimizeData(
  data: any,
  classification: DataClassification,
  purpose: string
): any {
  // For confidential/restricted data, minimize to only what's necessary
  if (classification === 'confidential' || classification === 'restricted') {
    // Return only essential fields based on purpose
    if (purpose === 'analysis') {
      return {
        id: data.id,
        type: data.type,
        // Only include non-sensitive metadata
      };
    }
    if (purpose === 'processing') {
      return {
        id: data.id,
        // Minimal data for processing
      };
    }
  }

  return data;
}

/**
 * Request data access through gatekeeper
 */
export async function requestDataAccess(
  request: DataRequest
): Promise<{ granted: boolean; data?: any; error?: string }> {
  try {
    // Check if agent can access this data classification
    if (!gatekeeperStore.canAccessData(request.agentId, request.dataClassification)) {
      logSecurityEvent(
        'warning',
        'gatekeeper_access_denied',
        `Agent ${request.agentId} denied access to ${request.dataClassification} data`,
        undefined,
        request.matterId,
        { agent_id: request.agentId, classification: request.dataClassification }
      );
      return {
        granted: false,
        error: `Agent ${request.agentId} is not authorized to access ${request.dataClassification} data`
      };
    }

    // If data is confidential/restricted, require gatekeeper approval
    if (request.dataClassification === 'confidential' || request.dataClassification === 'restricted') {
      // Find gatekeeper agent
      const gatekeepers = Array.from(gatekeeperStore['configs'].values())
        .filter(c => c.role === 'gatekeeper');
      
      if (gatekeepers.length === 0) {
        return {
          granted: false,
          error: 'No gatekeeper agent available for confidential data access'
        };
      }

      // In production, this would request approval from gatekeeper
      // For now, we'll log and grant access if agent is authorized
      logAgentAction(
        'gatekeeper',
        'data_access_requested',
        `Data access requested by ${request.agentId} for ${request.purpose}`,
        request.matterId,
        { agent_id: request.agentId, classification: request.dataClassification, purpose: request.purpose }
      );
    }

    // Minimize data before providing
    const minimizedData = minimizeData(request.data, request.dataClassification, request.purpose);

    // Enforce matter isolation if matter ID provided
    if (request.matterId) {
      return await enforceMatterIsolation(
        request.agentId,
        request.matterId,
        async () => {
          return { granted: true, data: minimizedData };
        }
      );
    }

    return { granted: true, data: minimizedData };
  } catch (error) {
    return {
      granted: false,
      error: `Data access error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Register gatekeeper agent
 */
export function registerGatekeeper(config: GatekeeperConfig): void {
  gatekeeperStore.registerAgent(config);
  logSecurityEvent(
    'info',
    'gatekeeper_registered',
    `Gatekeeper agent registered: ${config.agentId}`,
    undefined,
    undefined,
    { agent_id: config.agentId, role: config.role }
  );
}

}
}
}
}
}
}
)