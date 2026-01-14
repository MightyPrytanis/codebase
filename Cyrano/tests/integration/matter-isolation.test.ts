/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Matter Isolation Integration Tests
 * Track Beta: Tests matter-based data isolation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  matterIsolationStore,
  enforceMatterIsolation,
  tagWithMatterId,
  validateMatterAccess,
  extractMatterId,
} from '../../src/middleware/matter-isolation.js';

describe('Matter Isolation Integration (Track Beta)', () => {
  beforeEach(() => {
    // Clear stores before each test
    matterIsolationStore.clearMatterData = vi.fn();
    matterIsolationStore.clearAgentContext = vi.fn();
  });

  describe('Matter Data Storage', () => {
    it('should store data with matter ID', () => {
      const testData = { content: 'test data' };
      matterIsolationStore.storeData('matter-123', testData, {
        source: 'test',
        timestamp: Date.now(),
        userId: 'user-1'
      });

      const retrieved = matterIsolationStore.getData('matter-123');
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].matterId).toBe('matter-123');
      expect(retrieved[0].data).toEqual(testData);
    });

    it('should isolate data by matter ID', () => {
      matterIsolationStore.storeData('matter-123', { data: 'matter 123' });
      matterIsolationStore.storeData('matter-456', { data: 'matter 456' });

      const matter123Data = matterIsolationStore.getData('matter-123');
      const matter456Data = matterIsolationStore.getData('matter-456');

      expect(matter123Data.length).toBe(1);
      expect(matter456Data.length).toBe(1);
      expect(matter123Data[0].data.data).toBe('matter 123');
      expect(matter456Data[0].data.data).toBe('matter 456');
    });
  });

  describe('Agent Context Binding', () => {
    it('should bind agent to matter', () => {
      const context = {
        matterId: 'matter-123',
        userId: 'agent-1',
        timestamp: Date.now()
      };

      matterIsolationStore.setAgentContext('agent-1', context);
      const retrieved = matterIsolationStore.getAgentContext('agent-1');

      expect(retrieved).toEqual(context);
    });

    it('should enforce access control', () => {
      matterIsolationStore.setAgentContext('agent-1', {
        matterId: 'matter-123',
        userId: 'agent-1',
        timestamp: Date.now()
      });

      expect(matterIsolationStore.canAccess('agent-1', 'matter-123')).toBe(true);
      expect(matterIsolationStore.canAccess('agent-1', 'matter-456')).toBe(false);
    });
  });

  describe('Matter Isolation Enforcement', () => {
    it('should execute operation with matter isolation', async () => {
      let executed = false;
      const operation = async () => {
        executed = true;
        return { result: 'success' };
      };

      const result = await enforceMatterIsolation('agent-1', 'matter-123', operation);

      expect(executed).toBe(true);
      expect(result.result).toBe('success');
      
      // Context should be cleared after operation
      const context = matterIsolationStore.getAgentContext('agent-1');
      expect(context).toBeUndefined();
    });

    it('should detect conflicts', () => {
      matterIsolationStore.setAgentContext('agent-1', {
        matterId: 'matter-123',
        clientId: 'client-1',
        userId: 'agent-1',
        timestamp: Date.now()
      });

      const conflicts = matterIsolationStore.checkConflicts('matter-456', 'client-1');
      expect(conflicts).toContain('matter-123');
    });
  });

  describe('Matter ID Tagging', () => {
    it('should tag data with matter ID', () => {
      const data = { content: 'test' };
      const tagged = tagWithMatterId(data, 'matter-123');

      expect(tagged.matterId).toBe('matter-123');
      expect(tagged.data).toEqual(data);
      expect(tagged.metadata).toBeDefined();
    });
  });

  describe('Matter Access Validation', () => {
    it('should validate access for bound agent', () => {
      matterIsolationStore.setAgentContext('agent-1', {
        matterId: 'matter-123',
        userId: 'agent-1',
        timestamp: Date.now()
      });

      const result = validateMatterAccess('agent-1', 'matter-123');
      expect(result.valid).toBe(true);
    });

    it('should reject access for unbound agent', () => {
      const result = validateMatterAccess('agent-1', 'matter-123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no matter context');
    });

    it('should reject access to different matter', () => {
      matterIsolationStore.setAgentContext('agent-1', {
        matterId: 'matter-123',
        userId: 'agent-1',
        timestamp: Date.now()
      });

      const result = validateMatterAccess('agent-1', 'matter-456');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot access matter');
    });
  });

  describe('Matter ID Extraction', () => {
    it('should extract matter ID from object', () => {
      expect(extractMatterId({ matterId: 'matter-123' })).toBe('matter-123');
      expect(extractMatterId({ matter_id: 'matter-123' })).toBe('matter-123');
      expect(extractMatterId({ matter: { id: 'matter-123' } })).toBe('matter-123');
    });

    it('should return null when matter ID not found', () => {
      expect(extractMatterId({ other: 'data' })).toBeNull();
      expect(extractMatterId(null)).toBeNull();
    });
  });
});
