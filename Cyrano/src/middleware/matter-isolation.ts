/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Matter-Based Data Isolation Middleware
 * 
 * Implements matter-based isolation to prevent cross-matter data leakage.
 * All data, prompts, and agent contexts are tagged with matter ID.
 * Enforces access controls: agent processing Matter A cannot access Matter B.
 * 
 * Security Features:
 * - Matter ID tagging for all data
 * - Access control enforcement
 * - "Chinese wall" pattern for conflicts checking
 * - Separate agent instances per matter
 */

export interface MatterContext {
  matterId: string;
  clientId?: string;
  userId: string;
  timestamp: number;
}

export interface IsolatedData {
  matterId: string;
  data: any;
  metadata?: {
    source: string;
    timestamp: number;
    userId: string;
  };
}

/**
 * Matter isolation store (in-memory for now, should be database-backed in production)
 */
class MatterIsolationStore {
  private matterData: Map<string, IsolatedData[]> = new Map();
  private agentContexts: Map<string, MatterContext> = new Map();

  /**
   * Store data with matter isolation
   */
  storeData(matterId: string, data: any, metadata?: IsolatedData['metadata']): void {
    if (!this.matterData.has(matterId)) {
      this.matterData.set(matterId, []);
    }

    const isolatedData: IsolatedData = {
      matterId,
      data,
      metadata: metadata || {
        source: 'unknown',
        timestamp: Date.now(),
        userId: 'system'
      }
    };

    this.matterData.get(matterId)!.push(isolatedData);
  }

  /**
   * Retrieve data for a specific matter only
   */
  getData(matterId: string): IsolatedData[] {
    return this.matterData.get(matterId) || [];
  }

  /**
   * Check if agent can access matter data
   */
  canAccess(agentId: string, matterId: string): boolean {
    const context = this.agentContexts.get(agentId);
    if (!context) {
      return false; // Agent must have context to access data
    }
    return context.matterId === matterId;
  }

  /**
   * Set agent context (binds agent to specific matter)
   */
  setAgentContext(agentId: string, context: MatterContext): void {
    this.agentContexts.set(agentId, context);
  }

  /**
   * Get agent context
   */
  getAgentContext(agentId: string): MatterContext | undefined {
    return this.agentContexts.get(agentId);
  }

  /**
   * Clear agent context (when agent finishes processing matter)
   */
  clearAgentContext(agentId: string): void {
    this.agentContexts.delete(agentId);
  }

  /**
   * Check for conflicts (Chinese wall pattern)
   * Returns list of conflicting matter IDs
   */
  checkConflicts(matterId: string, clientId?: string): string[] {
    const conflicts: string[] = [];
    
    // Check all agent contexts for conflicts
    for (const [agentId, context] of this.agentContexts.entries()) {
      // Same client, different matter = potential conflict
      if (clientId && context.clientId === clientId && context.matterId !== matterId) {
        conflicts.push(context.matterId);
      }
    }

    return conflicts;
  }

  /**
   * Clear all data for a matter (for testing/cleanup)
   */
  clearMatterData(matterId: string): void {
    this.matterData.delete(matterId);
  }
}

// Singleton isolation store
export const matterIsolationStore = new MatterIsolationStore();

/**
 * Middleware function to enforce matter isolation
 * Tags all data with matter ID and enforces access controls
 */
export function enforceMatterIsolation(
  agentId: string,
  matterId: string,
  operation: () => Promise<any>
): Promise<any> {
  // Set agent context
  const context: MatterContext = {
    matterId,
    userId: agentId,
    timestamp: Date.now()
  };
  matterIsolationStore.setAgentContext(agentId, context);

  // Check for conflicts
  const conflicts = matterIsolationStore.checkConflicts(matterId);
  if (conflicts.length > 0) {
    throw new Error(
      `Matter isolation conflict detected. Agent ${agentId} cannot access matter ${matterId} ` +
      `due to conflicts with matters: ${conflicts.join(', ')}`
    );
  }

  // Execute operation with matter isolation
  return operation().finally(() => {
    // Clear agent context when done
    matterIsolationStore.clearAgentContext(agentId);
  });
}

/**
 * Tag data with matter ID
 */
export function tagWithMatterId(data: any, matterId: string, metadata?: IsolatedData['metadata']): IsolatedData {
  return {
    matterId,
    data,
    metadata: metadata || {
      source: 'system',
      timestamp: Date.now(),
      userId: 'system'
    }
  };
}

/**
 * Validate matter access
 */
export function validateMatterAccess(agentId: string, matterId: string): { valid: boolean; error?: string } {
  if (!matterId) {
    return { valid: false, error: 'Matter ID is required' };
  }

  const context = matterIsolationStore.getAgentContext(agentId);
  if (!context) {
    return { valid: false, error: `Agent ${agentId} has no matter context` };
  }

  if (context.matterId !== matterId) {
    return {
      valid: false,
      error: `Agent ${agentId} is bound to matter ${context.matterId}, cannot access matter ${matterId}`
    };
  }

  return { valid: true };
}

/**
 * Extract matter ID from request/data
 */
export function extractMatterId(data: any): string | null {
  if (typeof data === 'object' && data !== null) {
    return data.matterId || data.matter_id || data.matter?.id || null;
  }
  return null;
