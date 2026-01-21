/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Time Estimation Integration Tests
 * Track Epsilon: Tests time estimation engine (MRPC compliant)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeEstimationEngine, WorkEvent, TimeEstimationPolicy } from '../../src/services/time-estimation-engine.js';
import { AIService } from '../../src/services/ai-service.js';

describe('Time Estimation Integration (Track Epsilon)', () => {
  let engine: TimeEstimationEngine;
  let mockAIService: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAIService = {
      call: vi.fn()
    } as any;
    engine = new TimeEstimationEngine(mockAIService as any);
  });

  describe('Time Estimation', () => {
    it('should estimate time for work events', async () => {
      const events: WorkEvent[] = [
        {
          source: 'local',
          date: '2026-01-02',
          minutes: 30,
          description: 'Document review',
          matterId: 'matter-123'
        },
        {
          source: 'email',
          date: '2026-01-02',
          minutes: 15,
          description: 'Client communication',
          matterId: 'matter-123'
        }
      ];

      const policy: TimeEstimationPolicy = {
        mode: 'estimated',
        includeLexFiatTime: true,
        includeToolTime: true,
        includeReviewTime: true,
        reviewTimeMultiplier: 0.3
      };

      mockAIService.call.mockResolvedValue('[]');

      const estimates = await engine.estimate(events, policy);

      expect(estimates.length).toBeGreaterThan(0);
      expect(estimates[0].matterId).toBe('matter-123');
      expect(estimates[0].minutes).toBeGreaterThan(0);
      expect(estimates[0].complianceWarning).toContain('MRPC Compliance');
      expect(estimates[0].complianceWarning).toContain('TIME ESTIMATE');
    });

    it('should include time estimation components', async () => {
      const events: WorkEvent[] = [
        {
          source: 'local',
          date: '2026-01-02',
          minutes: 30,
          description: 'Document review',
          matterId: 'matter-123'
        }
      ];

      const policy: TimeEstimationPolicy = {
        mode: 'estimated',
        includeLexFiatTime: true,
        includeToolTime: true,
        includeReviewTime: true
      };

      mockAIService.call.mockResolvedValue('[]');

      const estimates = await engine.estimate(events, policy);

      expect(estimates[0].lexFiatMinutes).toBeGreaterThanOrEqual(0);
      expect(estimates[0].toolMinutes).toBeGreaterThanOrEqual(0);
      expect(estimates[0].reviewMinutes).toBeGreaterThanOrEqual(0);
    });

    it('should include MRPC compliance warning', async () => {
      const events: WorkEvent[] = [
        {
          source: 'local',
          date: '2026-01-02',
          minutes: 30,
          description: 'Document review',
          matterId: 'matter-123'
        }
      ];

      const policy: TimeEstimationPolicy = {
        mode: 'estimated'
      };

      mockAIService.call.mockResolvedValue('[]');

      const estimates = await engine.estimate(events, policy);

      expect(estimates[0].complianceWarning).toBeDefined();
      expect(estimates[0].complianceWarning).toContain('MRPC Compliance');
      expect(estimates[0].complianceWarning).toContain('TIME ESTIMATE');
      expect(estimates[0].complianceWarning).toContain('NOT compliant');
    });

    it('should support actual time mode', async () => {
      const events: WorkEvent[] = [
        {
          source: 'local',
          date: '2026-01-02',
          minutes: 30,
          description: 'Document review',
          matterId: 'matter-123'
        }
      ];

      const policy: TimeEstimationPolicy = {
        mode: 'actual'
      };

      const estimates = await engine.estimate(events, policy);

      expect(estimates[0].minutes).toBe(30); // Should use actual time
      expect(estimates[0].actualMinutes).toBe(30);
    });
  });

  describe('MRPC Compliance', () => {
    it('should not include value billing in estimates', async () => {
      const events: WorkEvent[] = [
        {
          source: 'local',
          date: '2026-01-02',
          minutes: 30,
          description: 'Document review',
          matterId: 'matter-123'
        }
      ];

      const policy: TimeEstimationPolicy = {
        mode: 'estimated'
      };

      mockAIService.call.mockResolvedValue('[]');

      const estimates = await engine.estimate(events, policy);

      // Verify no "value" concept in description
      expect(estimates[0].description).not.toContain('value');
      expect(estimates[0].description).toContain('Time estimate');
    });
  });
});
