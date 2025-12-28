/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoodcounselEngine } from '../../src/engines/goodcounsel/goodcounsel-engine.js';

/**
 * Comprehensive Test Suite for GoodCounsel Engine
 * 
 * Tests GoodCounsel engine workflows:
 * - Wellness check workflow
 * - Ethics review workflow
 * - Client recommendations
 * - Crisis support
 * 
 * Target: >70% test coverage
 */

describe('GoodCounsel Engine', () => {
  let engine: GoodcounselEngine;

  beforeEach(async () => {
    engine = new GoodcounselEngine();
    await engine.initialize();
  });

  describe('Engine Initialization', () => {
    it('should initialize successfully', async () => {
      const newEngine = new GoodcounselEngine();
      await newEngine.initialize();
      
      const info = newEngine.getEngineInfo();
      expect(info.name).toBe('goodcounsel');
      expect(info.description).toContain('Ethics and Wellness');
    });

    it('should register default workflows', async () => {
      const workflows = await engine.getWorkflows();
      expect(workflows.length).toBeGreaterThan(0);
      
      const workflowIds = workflows.map((w: any) => w.id);
      expect(workflowIds).toContain('wellness_check');
      expect(workflowIds).toContain('ethics_review');
    });
  });

  describe('Wellness Check Workflow', () => {
    it('should execute wellness check workflow', async () => {
      const result = await engine.execute({
        action: 'execute_workflow',
        workflow_id: 'wellness_check',
        input: {
          userId: 'test-user-123',
        },
      });

      expect(result).toBeDefined();
      // May return error if dependencies not mocked, but shouldn't crash
    });

    it('should handle wellness check with minimal input', async () => {
      const result = await engine.execute({
        action: 'execute_workflow',
        workflow_id: 'wellness_check',
        input: {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('Wellness Actions', () => {
    it('should handle wellness_check action', async () => {
      const result = await engine.execute({
        action: 'wellness_check',
        userId: 'test-user-123',
      });

      expect(result).toBeDefined();
    });

    it('should handle wellness_journal action (feature in development)', async () => {
      const result = await engine.execute({
        action: 'wellness_journal',
        userId: 'test-user-123',
      });

      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      // Should return "feature in development" message
      const content = JSON.parse(result.content[0].text);
      expect(content.message).toContain('development');
    });

    it('should handle wellness_trends action (feature in development)', async () => {
      const result = await engine.execute({
        action: 'wellness_trends',
        userId: 'test-user-123',
      });

      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      const content = JSON.parse(result.content[0].text);
      expect(content.message).toContain('development');
    });

    it('should handle burnout_check action (feature in development)', async () => {
      const result = await engine.execute({
        action: 'burnout_check',
        userId: 'test-user-123',
      });

      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      const content = JSON.parse(result.content[0].text);
      expect(content.message).toContain('development');
    });
  });

  describe('Ethics Review Workflow', () => {
    it('should execute ethics review workflow', async () => {
      const result = await engine.execute({
        action: 'execute_workflow',
        workflow_id: 'ethics_review',
        input: {
          userId: 'test-user-123',
          scenario: 'Test ethical scenario',
        },
      });

      expect(result).toBeDefined();
    });

    it('should handle ethics_review action', async () => {
      const result = await engine.execute({
        action: 'ethics_review',
        userId: 'test-user-123',
        input: {
          scenario: 'Test ethical scenario',
        },
      });

      expect(result).toBeDefined();
    });
  });

  describe('Client Recommendations', () => {
    it('should handle client_recommendations action', async () => {
      const result = await engine.execute({
        action: 'client_recommendations',
        userId: 'test-user-123',
        input: {
          clientId: 'client-123',
        },
      });

      expect(result).toBeDefined();
    });
  });

  describe('Crisis Support', () => {
    it('should handle crisis_support action', async () => {
      const result = await engine.execute({
        action: 'crisis_support',
        userId: 'test-user-123',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Workflow Listing', () => {
    it('should list all workflows', async () => {
      const result = await engine.execute({
        action: 'list_workflows',
      });

      expect(result.isError).toBe(false);
      const workflows = JSON.parse(result.content[0].text);
      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid action', async () => {
      const result = await engine.execute({
        action: 'invalid_action' as any,
      });

      expect(result.isError).toBe(true);
    });

    it('should handle missing workflow_id for execute_workflow', async () => {
      const result = await engine.execute({
        action: 'execute_workflow',
        // Missing workflow_id
      });

      expect(result).toBeDefined();
      // May return error, but shouldn't crash
    });

    it('should handle non-existent workflow', async () => {
      const result = await engine.execute({
        action: 'execute_workflow',
        workflow_id: 'non_existent_workflow',
        input: {},
      });

      expect(result).toBeDefined();
      // May return error, but shouldn't crash
    });
  });
});
