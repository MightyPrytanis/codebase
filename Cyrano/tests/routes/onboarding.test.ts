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

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Server } from 'http';

// Set environment variables before importing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-for-testing';
process.env.TRUST_PROXY_COUNT = '0';

// Import app after setting env vars
import { app } from '../../src/http-bridge.js';

describe('Onboarding API Integration Tests', () => {
  const testPort = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT) : 5003;
  const baseUrl = `http://localhost:${testPort}`;
  let server: Server | null = null;
  const testUserId = 'test-onboarding-user';

  beforeAll(async () => {
    // Start the HTTP bridge server for testing
    const http = await import('http');
    server = http.createServer(app);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Server startup timeout after 5 seconds`));
      }, 5000);
      
      server!.listen(testPort, () => {
        clearTimeout(timeout);
        console.log(`Test HTTP server started on port ${testPort}`);
        
        // Verify server is actually listening by making a test request
        const testReq = http.get(`http://localhost:${testPort}/health`, (res) => {
          resolve();
        });
        
        testReq.on('error', () => {
          // Server started but /health might not exist - wait a bit for app to initialize
          setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 200);
        });
      ;
      
      server!.on('error', (err: any) => {
        clearTimeout(timeout);
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${testPort} is already in use. Please stop the existing server or use a different TEST_PORT.`));
        } else {
          reject(err);
        }
      });
    });
    
    // Additional wait to ensure server is fully ready
    await new Promise(resolve => setTimeout(resolve, 200));
  };

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

      const response = await fetch(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(practiceProfile),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.profile).toBeDefined();
    });

    it('should handle partial profile data', async () => {
      const partialProfile = {
        userId: testUserId,
        primaryJurisdiction: 'New York',
        practiceAreas: ['Estate Planning'],
      };

      const response = await fetch(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialProfile),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
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

      const response = await fetch(`${baseUrl}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baselineData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.baseline).toBeDefined();
      expect(data.baseline.minimumHoursPerWeek).toBe(40);
    });

    it('should validate baseline hours range', async () => {
      const invalidBaseline = {
        userId: testUserId,
        minimumHoursPerWeek: 200, // Invalid: exceeds 168 hours/week
      };

      const response = await fetch(`${baseUrl}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const response = await fetch(`${baseUrl}/api/onboarding/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const response = await fetch(`${baseUrl}/api/onboarding/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      await fetch(`${baseUrl}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          minimumHoursPerWeek: 40,
          useBaselineUntilEnoughData: true,
        }),
      });

      await fetch(`${baseUrl}/api/onboarding/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          clio: { connected: true },
        }),
      });

      // Then check status
      const response = await fetch(`${baseUrl}/api/onboarding/status?userId=${testUserId}&appId=lexfiat`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('completed');
      expect(data).toHaveProperty('currentStep');
      expect(data).toHaveProperty('completedSteps');
      expect(Array.isArray(data.completedSteps)).toBe(true);
    });

    it('should return incomplete status for new user', async () => {
      const response = await fetch(`${baseUrl}/api/onboarding/status?userId=new-user&appId=lexfiat`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.completed).toBe(false);
      expect(data.currentStep).toBe(1);
      expect(data.completedSteps).toEqual([]);
    });
  });

  describe('POST /api/onboarding/complete', () => {
    it('should mark onboarding as complete (Step 8)', async () => {
      const response = await fetch(`${baseUrl}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const response = await fetch(`${baseUrl}/api/onboarding/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${baseUrl}/api/onboarding/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${baseUrl}/api/onboarding/load-progress?userId=${testUserId}`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('currentStep');
      expect(data).toHaveProperty('formData');
    });

    it('should return default values for new user', async () => {
      const response = await fetch(`${baseUrl}/api/onboarding/load-progress?userId=new-user-2`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.currentStep).toBe(1);
      expect(data.formData).toEqual({});
    });
  });

  describe('POST /api/onboarding/test-llm-provider', () => {
    it('should test LLM provider connection (Step 5)', async () => {
      const response = await fetch(`${baseUrl}/api/onboarding/test-llm-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${baseUrl}/api/onboarding/test-llm-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const step1Response = await fetch(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const step4Response = await fetch(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const step5Response = await fetch(`${baseUrl}/api/onboarding/practice-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: flowUserId,
          llmProvider: 'openai',
          researchProvider: 'westlaw',
        }),
      });
      expect(step5Response.ok).toBe(true);

      // Step 6: Chronometric Baseline
      const step6Response = await fetch(`${baseUrl}/api/onboarding/baseline-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: flowUserId,
          minimumHoursPerWeek: 40,
          useBaselineUntilEnoughData: true,
        }),
      });
      expect(step6Response.ok).toBe(true);

      // Step 7: Integrations
      const step7Response = await fetch(`${baseUrl}/api/onboarding/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: flowUserId,
          clio: { connected: true },
          email: { gmail: { connected: true } },
        }),
      });
      expect(step7Response.ok).toBe(true);

      // Step 8: Complete
      const step8Response = await fetch(`${baseUrl}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: flowUserId,
          appId: 'lexfiat',
        }),
      });
      expect(step8Response.ok).toBe(true);
      const completionData = await step8Response.json();
      expect(completionData.completed).toBe(true);

      // Verify final status
      const statusResponse = await fetch(`${baseUrl}/api/onboarding/status?userId=${flowUserId}&appId=lexfiat`);
      const statusData = await statusResponse.json();
      expect(statusData.completed).toBe(true);
      expect(statusData.completedSteps.length).toBeGreaterThanOrEqual(7);
    });

    it('should persist state across steps', async () => {
      // Use numeric userId since practice profiles require numeric user IDs
      const stateUserId = `999${Date.now() % 100000}`; // Ensure numeric

      // Save progress at step 3
      const saveResponse = await fetch(`${baseUrl}/api/onboarding/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const loadResponse = await fetch(`${baseUrl}/api/onboarding/load-progress?userId=${stateUserId}`);
      expect(loadResponse.ok).toBe(true);
      const loadData = await loadResponse.json();
      expect(loadData.currentStep).toBe(3);
      expect(loadData.formData).toHaveProperty('primaryJurisdiction', 'Texas');
    });
  });
});

)
}
)
}
)
}
)
}
)
}
)
}
)
}
)
}
)
}
)
}
)
}
)
}
)
}
)
}