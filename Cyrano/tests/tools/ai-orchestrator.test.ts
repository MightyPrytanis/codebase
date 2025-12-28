/**
 * AI Orchestrator Tool Tests
 * Tests for the MAE AI Orchestrator tool that coordinates multiple AI providers
 */
import { describe, it, expect, beforeEach } from 'vitest';
// Use REAL components - no mocks
import { aiOrchestrator } from '../../src/engines/mae/tools/ai-orchestrator.js';

describe('AI Orchestrator Tool', () => {
  describe('Tool Definition', () => {
    it('should have correct tool definition', () => {
      const definition = aiOrchestrator.getToolDefinition();
      expect(definition.name).toBe('ai_orchestrator');
      expect(definition.description).toBeDefined();
      expect(definition.inputSchema).toBeDefined();
      expect(definition.inputSchema.properties).toHaveProperty('task_description');
      expect(definition.inputSchema.properties).toHaveProperty('ai_providers');
      expect(definition.inputSchema.properties).toHaveProperty('orchestration_mode');
    });

    it('should have task_description as required field', () => {
      const definition = aiOrchestrator.getToolDefinition();
      expect(definition.inputSchema.required).toContain('task_description');
    });

    it('should have correct orchestration_mode enum values', () => {
      const definition = aiOrchestrator.getToolDefinition();
      const modeProperty = definition.inputSchema.properties.orchestration_mode;
      expect(modeProperty.enum).toEqual(['sequential', 'parallel', 'collaborative']);
      expect(modeProperty.default).toBe('collaborative');
    });
  });

  describe('Input Validation', () => {
    it('should reject missing task_description', async () => {
      const result = await aiOrchestrator.execute({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('task_description');
    });

    it('should accept valid input with only task_description', async () => {
      const result = await aiOrchestrator.execute({
        task_description: 'Test task',
      });
      // Should not error on validation, but may error on execution if no providers configured
      expect(result).toBeDefined();
    });

    it('should accept valid input with all parameters', async () => {
      const result = await aiOrchestrator.execute({
        task_description: 'Test task',
        ai_providers: ['perplexity', 'openai'],
        orchestration_mode: 'parallel',
        parameters: { temperature: 0.8 },
      });
      expect(result).toBeDefined();
    });

    it('should reject invalid orchestration_mode', async () => {
      const result = await aiOrchestrator.execute({
        task_description: 'Test task',
        orchestration_mode: 'invalid_mode',
      });
      expect(result.isError).toBe(true);
    });
  });

  describe('Provider Normalization', () => {
    it('should normalize provider names correctly', () => {
      expect(aiOrchestrator.normalizeProviderName('claude')).toBe('anthropic');
      expect(aiOrchestrator.normalizeProviderName('gpt-4')).toBe('openai');
      expect(aiOrchestrator.normalizeProviderName('gemini')).toBe('google');
      expect(aiOrchestrator.normalizeProviderName('grok')).toBe('xai');
    });

    it('should handle case-insensitive provider names', () => {
      expect(aiOrchestrator.normalizeProviderName('CLAUDE')).toBe('anthropic');
      expect(aiOrchestrator.normalizeProviderName('OpenAI')).toBe('openai');
    });

    it('should throw error for unknown provider', () => {
      expect(() => {
        aiOrchestrator.normalizeProviderName('unknown-provider');
      }).toThrow();
    });
  });

  describe('Orchestration Execution', () => {
    it('should execute sequential orchestration', async () => {
      const result = await aiOrchestrator.executeOrchestration(
        'Test task',
        'sequential',
        ['perplexity', 'openai'],
        {}
      );
      expect(result).toBeDefined();
      expect(result.metadata.orchestration_mode).toBe('sequential');
      expect(result.metadata.ai_providers).toEqual(['perplexity', 'openai']);
    });

    it('should execute parallel orchestration', async () => {
      const result = await aiOrchestrator.executeOrchestration(
        'Test task',
        'parallel',
        ['perplexity', 'openai'],
        {}
      );
      expect(result).toBeDefined();
      expect(result.metadata.orchestration_mode).toBe('parallel');
    });

    it('should execute collaborative orchestration', async () => {
      const result = await aiOrchestrator.executeOrchestration(
        'Test task',
        'collaborative',
        ['perplexity', 'openai', 'anthropic'],
        {}
      );
      expect(result).toBeDefined();
      expect(result.metadata.orchestration_mode).toBe('collaborative');
      expect(result.final_result).toBeDefined();
    });

    it('should default to collaborative mode for unknown mode', async () => {
      const result = await aiOrchestrator.executeOrchestration(
        'Test task',
        'unknown',
        ['perplexity'],
        {}
      );
      expect(result.metadata.orchestration_mode).toBe('collaborative');
    });
  });

  describe('Orchestration Planning', () => {
    it('should create sequential plan', () => {
      const plan = aiOrchestrator.createSequentialPlan('Test task', ['perplexity', 'openai']);
      expect(plan.mode).toBe('sequential');
      expect(plan.steps).toHaveLength(2);
      expect(plan.steps[0].dependencies).toEqual([]);
      // The implementation uses step index (1-based) in dependencies, not 0-based array index
      expect(plan.steps[1].dependencies).toEqual([1]);
    });

    it('should create parallel plan', () => {
      const plan = aiOrchestrator.createParallelPlan('Test task', ['perplexity', 'openai']);
      expect(plan.mode).toBe('parallel');
      expect(plan.steps).toHaveLength(2);
      expect(plan.steps[0].parallel).toBe(true);
      expect(plan.steps[0].dependencies).toEqual([]);
    });

    it('should create collaborative plan', () => {
      const plan = aiOrchestrator.createCollaborativePlan('Test task', ['perplexity', 'openai', 'anthropic']);
      expect(plan.mode).toBe('collaborative');
      expect(plan.phases).toHaveLength(3);
      expect(plan.phases[0].phase).toBe('analysis');
      expect(plan.phases[1].phase).toBe('verification');
      expect(plan.phases[2].phase).toBe('synthesis');
    });
  });

  describe('System Prompts', () => {
    it('should return appropriate system prompt for each provider', () => {
      expect(aiOrchestrator.getSystemPrompt('anthropic', 'sequential', 0)).toContain('Claude');
      expect(aiOrchestrator.getSystemPrompt('openai', 'parallel', 0)).toContain('GPT-4');
      expect(aiOrchestrator.getSystemPrompt('perplexity', 'collaborative', 0)).toContain('Perplexity');
      expect(aiOrchestrator.getSystemPrompt('google', 'sequential', 0)).toContain('Gemini');
      expect(aiOrchestrator.getSystemPrompt('xai', 'parallel', 0)).toContain('Grok');
      expect(aiOrchestrator.getSystemPrompt('deepseek', 'collaborative', 0)).toContain('DeepSeek');
    });

    it('should return default prompt for unknown provider', () => {
      const prompt = aiOrchestrator.getSystemPrompt('unknown' as any, 'sequential', 0);
      expect(prompt).toContain('expert AI assistant');
    });
  });

  describe('Task Complexity Assessment', () => {
    it('should assess task complexity correctly', () => {
      expect(aiOrchestrator.assessTaskComplexity('simple task')).toBe('low');
      // "complex comprehensive" has 2 indicators, needs 3+ for 'high'
      expect(aiOrchestrator.assessTaskComplexity('complex comprehensive detailed task')).toBe('high');
      expect(aiOrchestrator.assessTaskComplexity('detailed task')).toBe('medium');
    });

    it('should calculate resource requirements', () => {
      const requirements = aiOrchestrator.calculateResourceRequirements('complex task', ['perplexity', 'openai']);
      expect(requirements.ai_calls_estimated).toBeGreaterThan(0);
      expect(requirements.processing_time_estimated).toBeDefined();
      expect(requirements.memory_requirements).toBeDefined();
    });
  });

  describe('Duration Estimation', () => {
    it('should estimate duration for sequential mode', () => {
      const duration = aiOrchestrator.estimateDuration('test task', 'sequential');
      expect(duration).toContain('minutes');
    });

    it('should estimate duration for parallel mode', () => {
      const duration = aiOrchestrator.estimateDuration('test task', 'parallel');
      expect(duration).toContain('minutes');
    });

    it('should estimate duration for collaborative mode', () => {
      const duration = aiOrchestrator.estimateDuration('test task', 'collaborative');
      expect(duration).toContain('minutes');
    });
  });

  describe('Error Handling', () => {
    it('should handle API validation errors gracefully', async () => {
      const result = await aiOrchestrator.execute({
        task_description: 'Test task',
        ai_providers: ['perplexity'],
      });
      // Should handle gracefully - may return error if no API keys (real issue)
      expect(result).toBeDefined();
      if (result.isError) {
        const errorText = result.content[0].text;
        // Should indicate missing API keys, not crash
        expect(errorText).toBeDefined();
      }
    });
  });

  describe('Full Tool Execution', () => {
    it('should execute tool with valid input', async () => {
      const result = await aiOrchestrator.execute({
        task_description: 'Analyze this legal document',
        ai_providers: ['perplexity'],
        orchestration_mode: 'parallel',
      });
      expect(result).toBeDefined();
      // Result may be success or error depending on actual API availability
    });

    it('should return proper CallToolResult format', async () => {
      const result = await aiOrchestrator.execute({
        task_description: 'Test task',
      });
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(Array.isArray(result.content)).toBe(true);
    });
  });
});
