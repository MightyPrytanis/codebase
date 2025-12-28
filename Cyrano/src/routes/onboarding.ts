/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Onboarding API Routes
 * 
 * REST API endpoints for onboarding wizard:
 * - Practice profile management
 * - Chronometric baseline configuration
 * - Integration status
 * - Onboarding completion status
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  upsertPracticeProfile,
  getPracticeProfile,
} from '../services/library-service.js';
import { encryptApiKey } from '../services/sensitive-data-encryption.js';
import { AIService, type AIProvider } from '../services/ai-service.js';

const router = Router();
const aiService = new AIService();

// Validation schemas
const PracticeProfileSchema = z.object({
  userId: z.string().optional(),
  primaryJurisdiction: z.string().optional(),
  additionalJurisdictions: z.array(z.string()).optional(),
  practiceAreas: z.array(z.string()).optional(),
  counties: z.array(z.string()).optional(),
  courts: z.array(z.string()).optional(),
  issueTags: z.array(z.string()).optional(),
  storagePreferences: z.object({
    localPath: z.string().optional(),
    oneDriveEnabled: z.boolean().optional(),
    gDriveEnabled: z.boolean().optional(),
    s3Enabled: z.boolean().optional(),
    s3Bucket: z.string().optional(),
    cacheSize: z.number().optional(),
  }).optional(),
  researchProvider: z.enum(['westlaw', 'courtlistener', 'other']).optional(),
  llmProvider: z.enum(['openai', 'anthropic', 'perplexity']).optional(),
  llmProviderTested: z.boolean().optional(),
});

const BaselineConfigSchema = z.object({
  userId: z.string(),
  minimumHoursPerWeek: z.number().min(0).max(168),
  minimumHoursPerDay: z.number().min(0).max(24).optional(),
  useBaselineUntilEnoughData: z.boolean().default(true),
  typicalSchedule: z.record(z.number()).optional(), // day-of-week hours
  offDays: z.array(z.string()).optional(), // ISO date strings
});

const IntegrationStatusSchema = z.object({
  userId: z.string(),
  clio: z.object({
    connected: z.boolean(),
    connectedAt: z.string().optional(),
  }).optional(),
  email: z.object({
    gmail: z.object({ connected: z.boolean() }).optional(),
    outlook: z.object({ connected: z.boolean() }).optional(),
  }).optional(),
  calendar: z.object({
    google: z.object({ connected: z.boolean() }).optional(),
    outlook: z.object({ connected: z.boolean() }).optional(),
  }).optional(),
  researchProviders: z.object({
    westlaw: z.object({ apiKey: z.string().optional() }).optional(),
    courtlistener: z.object({ apiKey: z.string().optional() }).optional(),
  }).optional(),
});

const OnboardingStatusSchema = z.object({
  userId: z.string(),
  completed: z.boolean(),
  currentStep: z.number().min(1).max(8).optional(),
  completedSteps: z.array(z.number()).optional(),
  lastUpdated: z.string().optional(),
  appId: z.string().optional(),
});

const LLMTestSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'openrouter']),
});

/**
 * POST /api/onboarding/practice-profile
 * Save practice profile (Step 1-3 data)
 */
router.post('/onboarding/practice-profile', async (req: Request, res: Response) => {
  try {
    const data = PracticeProfileSchema.parse(req.body);
    const userId = data.userId || 'default-user'; // TODO: Get from auth session
    
    const profile = await upsertPracticeProfile(userId, data);
    
    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Error saving practice profile:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request data',
    });
  }
});

/**
 * POST /api/onboarding/test-llm-provider
 * Test connectivity to a configured LLM provider using server-side API keys
 */
router.post('/onboarding/test-llm-provider', async (req: Request, res: Response) => {
  try {
    const { provider } = LLMTestSchema.parse(req.body);

    const testPrompt = 'Connection test. Reply with a short confirmation.';

    const result = await aiService.call(provider as AIProvider, testPrompt, {
      maxTokens: 16,
      temperature: 0,
    });

    res.json({
      success: true,
      provider,
      message: typeof result === 'string' ? result.slice(0, 200) : 'LLM provider test succeeded.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error testing LLM provider:', error);
    res.status(400).json({
      success: false,
      provider: req.body?.provider,
      error: message,
    });
  }
});

/**
 * POST /api/onboarding/baseline-config
 * Save Chronometric baseline configuration (Step 6)
 */
router.post('/onboarding/baseline-config', async (req: Request, res: Response) => {
  try {
    const data = BaselineConfigSchema.parse(req.body);
    
    // TODO: Save to Chronometric service/database
    // For now, store in practice profile integrations
    const profile = await upsertPracticeProfile(data.userId, {
      integrations: {
        chronometric: {
          baseline: {
            minimumHoursPerWeek: data.minimumHoursPerWeek,
            minimumHoursPerDay: data.minimumHoursPerDay,
            useBaselineUntilEnoughData: data.useBaselineUntilEnoughData,
            typicalSchedule: data.typicalSchedule,
            offDays: data.offDays,
            configuredAt: new Date().toISOString(),
          },
        },
      },
    });
    
    res.json({
      success: true,
      baseline: data,
      profile,
    });
  } catch (error) {
    console.error('Error saving baseline config:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request data',
    });
  }
});

/**
 * POST /api/onboarding/integrations
 * Save integration status (Step 7)
 */
router.post('/onboarding/integrations', async (req: Request, res: Response) => {
  try {
    const data = IntegrationStatusSchema.parse(req.body);
    
    // Save integration status to practice profile
    const profile = await upsertPracticeProfile(data.userId, {
      integrations: {
        clio: data.clio ? { enabled: data.clio.connected, clientId: undefined } : undefined,
        gmail: data.email?.gmail ? { enabled: data.email.gmail.connected, authenticated: data.email.gmail.connected } : undefined,
        outlook: data.email?.outlook ? { enabled: data.email.outlook.connected, authenticated: data.email.outlook.connected } : undefined,
      },
    });
    
    res.json({
      success: true,
      integrations: data,
      profile,
    });
  } catch (error) {
    console.error('Error saving integrations:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request data',
    });
  }
});

/**
 * GET /api/onboarding/status
 * Get onboarding completion status
 */
router.get('/onboarding/status', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const StatusQuerySchema = z.object({
      userId: z.string().optional(),
      appId: z.string().optional(),
    });
    
    const validationResult = StatusQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.errors,
      });
    }
    
    const userId = validationResult.data.userId || 'default-user'; // TODO: Get from auth session
    const appId = validationResult.data.appId || 'lexfiat';
    
    const profile = await getPracticeProfile(userId);
    
    if (!profile) {
      return res.json({
        completed: false,
        currentStep: 1,
        completedSteps: [],
      });
    }
    
    // Check app-specific onboarding completion
    if (appId === 'arkiver') {
      const arkiverConfig = profile.integrations?.arkiver?.config;
      const onboardingStatus = profile.integrations?.onboarding;
      
      if (onboardingStatus?.completed && onboardingStatus.appId === 'arkiver') {
        return res.json({
          completed: true,
          currentStep: 5,
          completedSteps: [1, 2, 3, 4, 5],
          lastUpdated: profile.updatedAt?.toISOString(),
        });
      }
      
      // Check if Arkiver config exists
      if (arkiverConfig) {
        const completedSteps: number[] = [];
        if (arkiverConfig.userProfile?.email && arkiverConfig.userProfile?.displayName) {
          completedSteps.push(1);
        }
        if (arkiverConfig.llmProvider) {
          completedSteps.push(2);
        }
        if (arkiverConfig.extractionSettings) {
          completedSteps.push(3);
        }
        if (arkiverConfig.aiIntegrity) {
          completedSteps.push(4);
        }
        if (arkiverConfig.preferences) {
          completedSteps.push(5);
        }
        
        return res.json({
          completed: completedSteps.length >= 3, // At least required steps
          currentStep: completedSteps.length > 0 ? Math.max(...completedSteps) + 1 : 1,
          completedSteps,
          lastUpdated: profile.updatedAt?.toISOString(),
        });
      }
      
      return res.json({
        completed: false,
        currentStep: 1,
        completedSteps: [],
      });
    }
    
    // LexFiat onboarding logic (existing)
    const completedSteps: number[] = [];
    
    if (profile.primaryJurisdiction && profile.practiceAreas.length > 0) {
      completedSteps.push(1);
    }
    if (profile.counties.length > 0) {
      completedSteps.push(2);
    }
    if (profile.issueTags.length > 0) {
      completedSteps.push(3);
    }
    if (profile.storagePreferences) {
      completedSteps.push(4);
    }
    if (profile.llmProvider) {
      completedSteps.push(5);
    }
    if (profile.integrations?.chronometric?.baseline) {
      completedSteps.push(6);
    }
    if (profile.integrations?.clio || profile.integrations?.email || profile.integrations?.calendar) {
      completedSteps.push(7);
    }
    
    const currentStep = completedSteps.length > 0 
      ? Math.max(...completedSteps) + 1 
      : 1;
    
    const completed = completedSteps.length >= 7; // All 7 steps complete
    
    res.json({
      completed,
      currentStep: Math.min(currentStep, 8),
      completedSteps,
      lastUpdated: profile.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get onboarding status',
    });
  }
});

/**
 * POST /api/onboarding/complete
 * Mark onboarding as complete
 */
router.post('/onboarding/complete', async (req: Request, res: Response) => {
  try {
    const { userId, appId } = z.object({
      userId: z.string(),
      appId: z.string().optional(),
    }).parse(req.body);
    
    const targetAppId = appId || 'lexfiat';
    
    // Mark onboarding complete in practice profile
    const profile = await upsertPracticeProfile(userId, {
      integrations: {
        onboarding: {
          completed: true,
          appId: targetAppId,
          currentStep: targetAppId === 'arkiver' ? 5 : 8,
          completedSteps: targetAppId === 'arkiver' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7, 8],
        },
      },
    });
    
    // TODO: Trigger initial Library scan/ingest if enabled
    // TODO: Set up initial Chronometric baseline if configured
    
    res.json({
      success: true,
      completed: true,
      profile,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request data',
    });
  }
});

/**
 * POST /api/onboarding/save-progress
 * Save partial onboarding progress (state management)
 */
router.post('/onboarding/save-progress', async (req: Request, res: Response) => {
  try {
    const data = z.object({
      userId: z.string(),
      currentStep: z.number().min(1).max(8),
      formData: z.any(), // Flexible form data structure
    }).parse(req.body);
    
    // Save progress to practice profile
    const profile = await upsertPracticeProfile(data.userId, {
      integrations: {
        onboarding: {
          completed: false,
          currentStep: data.currentStep,
          completedSteps: [],
          formData: data.formData || {},
          lastSaved: new Date().toISOString(),
        },
      },
    });
    
    res.json({
      success: true,
      currentStep: data.currentStep,
      profile,
    });
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request data',
    });
  }
});

/**
 * GET /api/onboarding/load-progress
 * Load saved onboarding progress
 */
router.get('/onboarding/load-progress', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const LoadProgressQuerySchema = z.object({
      userId: z.string().optional(),
    });
    
    const validationResult = LoadProgressQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.errors,
      });
    }
    
    const userId = validationResult.data.userId || 'default-user'; // TODO: Get from auth session
    
    const profile = await getPracticeProfile(userId);
    
    if (!profile || !profile.integrations?.onboarding) {
      return res.json({
        currentStep: 1,
        formData: {},
      });
    }
    
    const onboarding = profile.integrations.onboarding as any;
    
    res.json({
      currentStep: onboarding.currentStep || 1,
      formData: onboarding.formData || {},
      lastSaved: onboarding.lastSaved,
    });
  } catch (error) {
    console.error('Error loading onboarding progress:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load onboarding progress',
    });
  }
});

/**
 * POST /api/onboarding/arkiver-config
 * Save Arkiver onboarding configuration
 */
const ArkiverConfigSchema = z.object({
  userId: z.string().optional(),
  userProfile: z.object({
    email: z.string().email(),
    displayName: z.string().min(1),
  }),
  llmProvider: z.string(),
  llmProviderTested: z.boolean().optional(),
  extractionSettings: z.object({
    defaultMode: z.enum(['standard', 'deep', 'fast']),
    enableOCR: z.boolean(),
    extractCitations: z.boolean(),
    extractEntities: z.boolean(),
    extractTimeline: z.boolean(),
    defaultInsightType: z.enum(['general', 'legal', 'medical', 'business']),
  }),
  aiIntegrity: z.object({
    enabled: z.boolean(),
    driftThreshold: z.number().min(0).max(100),
    biasThreshold: z.number().min(0).max(100),
    notificationMethod: z.enum(['in_app', 'email', 'both']),
  }),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    notifications: z.boolean(),
  }),
});

router.post('/onboarding/arkiver-config', async (req: Request, res: Response) => {
  try {
    const data = ArkiverConfigSchema.parse(req.body);
    const userId = data.userId || 'default-user';
    
    // Save Arkiver configuration to practice profile
    const profile = await upsertPracticeProfile(userId, {
      integrations: {
        arkiver: {
          config: data,
          configuredAt: new Date().toISOString(),
        },
      },
    });
    
    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Error saving Arkiver config:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request data',
    });
  }
});

export default router;
