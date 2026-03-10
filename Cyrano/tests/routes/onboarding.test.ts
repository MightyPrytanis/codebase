/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Onboarding API Integration Tests
 * 
 * Tests the onboarding API endpoints for all 8 steps:
 * 1. Practice Profile (Steps 1-3)
 * 2. Storage Locations (Step 4)
 * 3. AI Provider (Step 5)
 * 4. Chronometric Baseline (Step 6)
 * 5. Integrations (Step 7)
 * 6. Review & Complete (Step 8)
 * 
 * Also tests state persistence and completion flow.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import type { Server } from 'http';
import { startAppServer, fetchWithRetry } from '../test-utils/test-server.js';
import { generateAccessToken } from '../../src/middleware/security.js';

// ---------------------------------------------------------------------------
// Mock library-service to avoid database dependency in unit/integration tests.
// Uses an in-memory store that is cleared before each test for isolation.
// ---------------------------------------------------------------------------

/** Returns true for plain (non-array) objects */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merge two plain objects, preferring source values over target values */
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = result[key];
    if (sv !== undefined && sv !== null) {
      if (isPlainObject(sv) && isPlainObject(tv)) {
        result[key] = deepMerge(tv, sv);
      } else {
        result[key] = sv;
      }
    }
  }
  return result;
}

// vi.hoisted ensures profileStore is created before module mocking occurs,
// allowing it to be shared across all mock implementations below.
const { profileStore } = vi.hoisted(() => ({ profileStore: new Map<string, Record<string, any>>() }));

vi.mock('../../src/services/library-service.js', () => ({
  upsertPracticeProfile: vi.fn(async (userId: string, data: Record<string, any>) => {
    const existing = profileStore.get(userId) ?? {};
    const merged = deepMerge({ userId: parseInt(userId, 10) || 1, practiceAreas: [], counties: [], courts: [], issueTags: [] }, existing);
    const updated = deepMerge(merged, data);
    profileStore.set(userId, updated);
    return updated;
  }),
  getPracticeProfile: vi.fn(async (userId: string) => profileStore.get(userId) ?? null),
}));

// Mock saveBaselineConfig to also update profileStore so the status route
// can detect step 6 (chronometric baseline) as complete without a real database.
vi.mock('../../src/engines/chronometric/services/baseline-config.js', () => ({
  saveBaselineConfig: vi.fn(async (config: Record<string, any>) => {
    const now = new Date().toISOString();
    const result = {
      ...config,
      minimumHoursPerDay: config.minimumHoursPerDay ?? config.minimumHoursPerWeek / 5,
      createdAt: now,
      updatedAt: now,
    };
    // Also persist to profileStore so onboarding/status route sees step 6 complete
    const existing = profileStore.get(config.userId) ?? {};
    const updated = deepMerge(existing, {
      integrations: { chronometric: { baseline: { minimumHoursPerWeek: config.minimumHoursPerWeek } } },
    });
    profileStore.set(config.userId, updated);
    return result;
  }),
  getBaselineConfig: vi.fn(async (_userId: string) => null),
}));

// Set environment variables before importing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-for-testing';
process.env.TRUST_PROXY_COUNT = '0';

// Import app after setting env vars
import { app } from '../../src/http-bridge.js';

// These are integration tests that require a database and authentication.
// Skip when DATABASE_URL is not configured (e.g., in standard unit test CI runs).
const describeIfDatabaseConfigured = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabaseConfigured('Onboarding API Integration Tests', () => {
  const testPort = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT) : 5003;
  let baseUrl = `http://localhost:${testPort}`;
  let server: Server | null = null;
  let authHeaders: Record<string, string> = {};
  const testUserId = 'test-onboarding-user';

  beforeAll(async () => {
    const started = await startAppServer(app, process.env.TEST_PORT);
    server = started.server;
    baseUrl = started.baseUrl;

    // Generate a test JWT token for authenticated requests.
    // All routes extract userId from the JWT (user.userId = 1) regardless of any
    // userId value sent in the request body or query string.
    const token = generateAccessToken({ userId: 1, email: 'test@example.com', role: 'admin' });
    authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, 20000);

  beforeEach(() => {
    // Reset in-memory profile store so each test starts with a clean slate
    profileStore.clear();
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => {
          console.log('Test HTTP server closed');
          resolve();
        });
      });
    }
  });

  describe('POST /api/onboarding/practice-profile', () => {
    it('should save practice profile successfully (Steps 1-3)', async () => {
      const practiceProfile = {
        userId: testUserId,
        primaryJurisdiction: 'California',
        practiceAreas: ['Family Law', 'Criminal Defense'],
        counties: ['Los Angeles', 'Orange'],
        courts: ['Superior Court', 'Appellate Court'],
        issueTags: ['divorce', 'custody'],
      };

      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(practiceProfile),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      // Library route returns the raw profile (not a success wrapper)
      expect(data.primaryJurisdiction).toBe('California');
    });

    it('should handle partial profile data', async () => {
      const partialProfile = {
        userId: testUserId,
        primaryJurisdiction: 'New York',
        practiceAreas: ['Estate Planning'],
      };

      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(partialProfile),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      // Library route returns the raw profile (not a success wrapper)
      expect(data.primaryJurisdiction).toBe('New York');
    });
  });

  describe('POST /api/onboarding/baseline-config', () => {
    it('should save Chronometric baseline configuration (Step 6)', async () => {
      const baselineData = {
        userId: testUserId,
        minimumHoursPerWeek: 40,
        minimumHoursPerDay: 8,
        useBaselineUntilEnoughData: true,
      };

      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(baselineData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      // Library route calls saveBaselineConfig which returns the config object directly
      expect(data.minimumHoursPerWeek).toBe(40);
    });

    it('should validate baseline hours range', async () => {
      const invalidBaseline = {
        userId: testUserId,
        minimumHoursPerWeek: 200, // Invalid: exceeds 168 hours/week
      };

      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(invalidBaseline),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/onboarding/integrations', () => {
    it('should save integration status (Step 7)', async () => {
      const integrationData = {
        userId: testUserId,
        clio: {
          connected: true,
          connectedAt: new Date().toISOString(),
        },
        email: {
          gmail: { connected: true },
          outlook: { connected: false },
        },
        calendar: {
          google: { connected: true },
          outlook: { connected: false },
        },
        researchProviders: {
          westlaw: { apiKey: 'test-key-123' },
          courtlistener: { apiKey: 'test-key-456' },
        },
      };

      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/integrations`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(integrationData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.integrations).toBeDefined();
    });

    it('should handle partial integrations (all skipped)', async () => {
      const partialIntegrations = {
        userId: testUserId,
        clio: { connected: false },
        // Other integrations skipped
      };

      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/integrations`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(partialIntegrations),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/onboarding/status', () => {
    it('should return onboarding status for LexFiat', async () => {
      // First, create a complete profile
      await fetchWithRetry(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: testUserId,
          primaryJurisdiction: 'California',
          practiceAreas: ['Family Law'],
          counties: ['Los Angeles'],
          courts: ['Superior Court'],
          issueTags: ['divorce'],
          storagePreferences: { localPath: '/documents' },
          llmProvider: 'openai',
        }),
      });

      await fetchWithRetry(`${baseUrl}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: testUserId,
          minimumHoursPerWeek: 40,
          useBaselineUntilEnoughData: true,
        }),
      });

      await fetchWithRetry(`${baseUrl}/api/onboarding/integrations`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: testUserId,
          clio: { connected: true },
        }),
      });

      // Then check status
      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/status?userId=${testUserId}&appId=lexfiat`, { headers: authHeaders });
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('completed');
      expect(data).toHaveProperty('currentStep');
      expect(data).toHaveProperty('completedSteps');
      expect(Array.isArray(data.completedSteps)).toBe(true);
    });

    it('should return incomplete status for new user', async () => {
      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/status?userId=new-user&appId=lexfiat`, { headers: authHeaders });
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.completed).toBe(false);
      expect(data.currentStep).toBe(1);
      expect(data.completedSteps).toEqual([]);
    });
  });

  describe('POST /api/onboarding/complete', () => {
    it('should mark onboarding as complete (Step 8)', async () => {
      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/complete`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: testUserId,
          appId: 'lexfiat',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.completed).toBe(true);
      expect(data.profile).toBeDefined();
    });
  });

  describe('POST /api/onboarding/save-progress', () => {
    it('should save partial onboarding progress', async () => {
      const progressData = {
        userId: testUserId,
        currentStep: 3,
        formData: {
          primaryJurisdiction: 'California',
          practiceAreas: ['Family Law'],
        },
      };

      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/save-progress`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(progressData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.currentStep).toBe(3);
    });
  });

  describe('GET /api/onboarding/load-progress', () => {
    it('should load saved onboarding progress', async () => {
      // First save progress
      await fetchWithRetry(`${baseUrl}/api/onboarding/save-progress`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: testUserId,
          currentStep: 4,
          formData: {
            primaryJurisdiction: 'California',
            practiceAreas: ['Family Law'],
          },
        }),
      });

      // Then load it
      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/load-progress?userId=${testUserId}`, { headers: authHeaders });
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('currentStep');
      expect(data).toHaveProperty('formData');
    });

    it('should return default values for new user', async () => {
      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/load-progress?userId=new-user-2`, { headers: authHeaders });
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.currentStep).toBe(1);
      expect(data.formData).toEqual({});
    });
  });

  describe('POST /api/onboarding/test-llm-provider', () => {
    it('should test LLM provider connection (Step 5)', async () => {
      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/test-llm-provider`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          provider: 'openai',
        }),
      });

      // May succeed or fail depending on API key configuration, but should return proper structure
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('provider', 'openai');
    });

    it('should validate provider enum', async () => {
      const response = await fetchWithRetry(`${baseUrl}/api/onboarding/test-llm-provider`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          provider: 'invalid-provider',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Complete 8-Step Onboarding Flow', () => {
    it('should support complete end-to-end onboarding flow', async () => {
      const flowUserId = `flow-test-${Date.now()}`;

      // Step 1-3: Practice Profile
      const step1Response = await fetchWithRetry(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: flowUserId,
          primaryJurisdiction: 'California',
          practiceAreas: ['Family Law'],
          counties: ['Los Angeles'],
          courts: ['Superior Court'],
          issueTags: ['divorce'],
        }),
      });
      expect(step1Response.ok).toBe(true);

      // Step 4: Storage Locations (optional)
      const step4Response = await fetchWithRetry(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: flowUserId,
          storagePreferences: {
            localPath: '/documents',
            gDriveEnabled: true,
          },
        }),
      });
      expect(step4Response.ok).toBe(true);

      // Step 5: AI Provider
      const step5Response = await fetchWithRetry(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: flowUserId,
          llmProvider: 'openai',
          researchProvider: 'westlaw',
        }),
      });
      expect(step5Response.ok).toBe(true);

      // Step 6: Chronometric Baseline
      const step6Response = await fetchWithRetry(`${baseUrl}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: flowUserId,
          minimumHoursPerWeek: 40,
          useBaselineUntilEnoughData: true,
        }),
      });
      expect(step6Response.ok).toBe(true);

      // Step 7: Integrations
      const step7Response = await fetchWithRetry(`${baseUrl}/api/onboarding/integrations`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: flowUserId,
          clio: { connected: true },
          email: { gmail: { connected: true } },
        }),
      });
      expect(step7Response.ok).toBe(true);

      // Step 8: Complete
      const step8Response = await fetchWithRetry(`${baseUrl}/api/onboarding/complete`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: flowUserId,
          appId: 'lexfiat',
        }),
      });
      expect(step8Response.ok).toBe(true);
      const completionData = await step8Response.json();
      expect(completionData.completed).toBe(true);

      // Verify final status
      const statusResponse = await fetchWithRetry(`${baseUrl}/api/onboarding/status?userId=${flowUserId}&appId=lexfiat`, { headers: authHeaders });
      const statusData = await statusResponse.json();
      expect(statusData.completed).toBe(true);
      expect(statusData.completedSteps.length).toBeGreaterThanOrEqual(7);
    });

    it('should persist state across steps', async () => {
      // Use numeric userId since practice profiles require numeric user IDs
      const stateUserId = `999${Date.now() % 100000}`; // Ensure numeric

      // Save progress at step 3
      const saveResponse = await fetchWithRetry(`${baseUrl}/api/onboarding/save-progress`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: stateUserId,
          currentStep: 3,
          formData: {
            primaryJurisdiction: 'Texas',
            practiceAreas: ['Criminal Defense'],
          },
        }),
      });
      expect(saveResponse.ok).toBe(true);

      // Load progress
      const loadResponse = await fetchWithRetry(`${baseUrl}/api/onboarding/load-progress?userId=${stateUserId}`, { headers: authHeaders });
      expect(loadResponse.ok).toBe(true);
      const loadData = await loadResponse.json();
      expect(loadData.currentStep).toBe(3);
      expect(loadData.formData).toHaveProperty('primaryJurisdiction', 'Texas');
    });
  });
});
