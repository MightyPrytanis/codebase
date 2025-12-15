/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cyranoPathfinder } from '../../src/tools/cyrano-pathfinder.js';

describe('CyranoPathfinder', () => {
  beforeEach(() => {
    // Mock environment variables for AI providers
    process.env.PERPLEXITY_API_KEY = 'test-key';
  });

  it('should have correct tool definition', () => {
    const definition = cyranoPathfinder.getToolDefinition();
    expect(definition.name).toBe('cyrano_pathfinder');
    expect(definition.description).toBeDefined();
    expect(definition.description).toContain('Cyrano Pathfinder');
    expect(definition.inputSchema).toBeDefined();
    expect(definition.inputSchema.properties.message).toBeDefined();
    expect(definition.inputSchema.properties.model).toBeDefined();
    expect(definition.inputSchema.properties.mode).toBeDefined();
  });

  it('should default to perplexity model', () => {
    const definition = cyranoPathfinder.getToolDefinition();
    expect(definition.inputSchema.properties.model.default).toBe('perplexity');
  });

  it('should default to guide mode', () => {
    const definition = cyranoPathfinder.getToolDefinition();
    expect(definition.inputSchema.properties.mode.default).toBe('guide');
  });

  it('should support all specified AI models', () => {
    const definition = cyranoPathfinder.getToolDefinition();
    const models = definition.inputSchema.properties.model.enum;
    expect(models).toContain('perplexity');
    expect(models).toContain('anthropic');
    expect(models).toContain('openai');
    expect(models).toContain('google');
    expect(models).toContain('xai');
    expect(models).toContain('deepseek');
  });

  it('should support both guide and execute modes', () => {
    const definition = cyranoPathfinder.getToolDefinition();
    const modes = definition.inputSchema.properties.mode.enum;
    expect(modes).toContain('guide');
    expect(modes).toContain('execute');
  });

  it('should build system prompt correctly for LexFiat', () => {
    const systemPrompt = cyranoPathfinder.buildSystemPrompt('lexfiat', 'guide', {});
    expect(systemPrompt).toContain('Cyrano Pathfinder');
    expect(systemPrompt).toContain('LexFiat');
    expect(systemPrompt).toContain('GUIDE');
  });

  it('should build system prompt correctly for Arkiver', () => {
    const systemPrompt = cyranoPathfinder.buildSystemPrompt('arkiver', 'execute', {});
    expect(systemPrompt).toContain('Cyrano Pathfinder');
    expect(systemPrompt).toContain('Arkiver');
    expect(systemPrompt).toContain('EXECUTE');
  });

  it('should include context in system prompt', () => {
    const context = {
      page: 'dashboard',
      matter: 'Case-123',
      userRole: 'attorney',
    };
    const systemPrompt = cyranoPathfinder.buildSystemPrompt('lexfiat', 'guide', context);
    expect(systemPrompt).toContain('dashboard');
    expect(systemPrompt).toContain('Case-123');
    expect(systemPrompt).toContain('attorney');
  });

  it('should detect action keywords for tool execution', () => {
    expect(cyranoPathfinder.shouldExecuteTools('search for documents')).toBe(true);
    expect(cyranoPathfinder.shouldExecuteTools('find all cases')).toBe(true);
    expect(cyranoPathfinder.shouldExecuteTools('analyze this document')).toBe(true);
    expect(cyranoPathfinder.shouldExecuteTools('run the workflow')).toBe(true);
    expect(cyranoPathfinder.shouldExecuteTools('what is the weather?')).toBe(false);
    expect(cyranoPathfinder.shouldExecuteTools('hello')).toBe(false);
  });

  it('should detect rate limit errors', () => {
    expect(cyranoPathfinder.isRateLimitError('rate limit exceeded')).toBe(true);
    expect(cyranoPathfinder.isRateLimitError('too many requests')).toBe(true);
    expect(cyranoPathfinder.isRateLimitError('429 error')).toBe(true);
    expect(cyranoPathfinder.isRateLimitError('quota_exceeded')).toBe(true);
    expect(cyranoPathfinder.isRateLimitError('network error')).toBe(false);
  });

  it('should return error when provider is not configured', async () => {
    // Clear API keys
    delete process.env.PERPLEXITY_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.XAI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;

    const result = await cyranoPathfinder.execute({
      message: 'Hello',
      model: 'perplexity',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not configured');
  });

  it('should log telemetry on execution', async () => {
    // Clear previous telemetry
    cyranoPathfinder.telemetryLog.length = 0;

    const initialLogLength = cyranoPathfinder.telemetryLog.length;

    // This will fail due to missing API key, but should still log telemetry
    await cyranoPathfinder.execute({
      message: 'Hello',
      model: 'perplexity',
      app: 'lexfiat',
      mode: 'guide',
    });

    expect(cyranoPathfinder.telemetryLog.length).toBeGreaterThan(initialLogLength);
    
    const lastEntry = cyranoPathfinder.telemetryLog[cyranoPathfinder.telemetryLog.length - 1];
    expect(lastEntry.provider).toBe('perplexity');
    expect(lastEntry.app).toBe('lexfiat');
    expect(lastEntry.mode).toBe('guide');
  });

  it('should provide telemetry statistics', () => {
    // Clear and add some test data
    cyranoPathfinder.telemetryLog.length = 0;
    cyranoPathfinder.telemetryLog.push({
      timestamp: new Date().toISOString(),
      provider: 'perplexity',
      app: 'lexfiat',
      mode: 'guide',
      success: true,
    });
    cyranoPathfinder.telemetryLog.push({
      timestamp: new Date().toISOString(),
      provider: 'anthropic',
      app: 'arkiver',
      mode: 'execute',
      toolsCalled: ['rag_query'],
      success: true,
    });

    const stats = cyranoPathfinder.getTelemetryStats();
    
    expect(stats.totalCalls).toBe(2);
    expect(stats.successRate).toBe(100);
    expect(stats.providerUsage.perplexity).toBe(1);
    expect(stats.providerUsage.anthropic).toBe(1);
    expect(stats.appUsage.lexfiat).toBe(1);
    expect(stats.appUsage.arkiver).toBe(1);
    expect(stats.modeUsage.guide).toBe(1);
    expect(stats.modeUsage.execute).toBe(1);
  });

  it('should create heuristic tool selection for search queries', () => {
    const result = cyranoPathfinder.heuristicToolSelection('search for documents about contracts', {});
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBeGreaterThan(0);
    expect(result.tools[0].name).toBe('rag_query');
  });

  it('should create heuristic tool selection for workflow queries', () => {
    const result = cyranoPathfinder.heuristicToolSelection('run the workflow', {});
    expect(result.tools).toBeDefined();
    const hasWorkflowTool = result.tools.some((t: any) => t.name === 'workflow_manager');
    expect(hasWorkflowTool).toBe(true);
  });

  it('should build prompt with context', () => {
    const message = 'What is my next task?';
    const context = { page: 'dashboard', matter: 'Case-123' };
    const prompt = cyranoPathfinder.buildPrompt(message, context, 'guide');
    
    expect(prompt).toContain(message);
    expect(prompt).toContain('Case-123');
  });

  it('should build prompt with execute mode note', () => {
    const message = 'Search documents';
    const prompt = cyranoPathfinder.buildPrompt(message, {}, 'execute');
    
    expect(prompt).toContain(message);
    expect(prompt).toContain('call MCP tools');
  });
});
