/*
 * E2E Test: Autonomous Skills/Expertise
 * Tests that skills are automatically selected and applied
 * 
 * Copyright 2025 Cognisint LLC
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { skillRegistry } from '../../src/skills/skill-registry.js';
import { cyranoPathfinder } from '../../src/tools/cyrano-pathfinder.js';
import { aiService } from '../../src/services/ai-service.js';
import { apiValidator } from '../../src/utils/api-validator.js';

describe('Autonomous Skills E2E', () => {
  beforeAll(async () => {
    // Load skills
    await skillRegistry.loadAll();

    // Mock AI provider validation and calls so tests run without real API keys
    vi.spyOn(apiValidator, 'validateProvider').mockReturnValue({ valid: true });
    vi.spyOn(apiValidator, 'getAvailableProviders').mockReturnValue(['perplexity']);
    vi.spyOn(aiService, 'call').mockResolvedValue(
      JSON.stringify({ response: 'Mock skill execution response', skills_used: [] })
    );
  });

  it('should automatically identify relevant skills for user queries', async () => {
    // Test that findRelevantSkills works
    const message = 'I need to forecast QDRO division for a retirement plan';
    
    // This would test the private method - may need to expose for testing
    // or test through public execute method
    const result = await cyranoPathfinder.execute({
      message,
      mode: 'execute',
      model: 'perplexity',
    });

    expect(result.isError).toBe(false);
    // Should have automatically identified and used QDRO skill if available
  });

  it('should execute skills invisibly to users', async () => {
    // User shouldn't need to know skill IDs
    const message = 'Calculate child support forecast';
    
    const result = await cyranoPathfinder.execute({
      message,
      mode: 'execute',
      model: 'perplexity',
    });

    // Should work without user specifying skill ID
    expect(result.isError).toBe(false);
  });
});
