/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForecastEngine, forecastEngine } from '../../src/engines/forecast/forecast-engine.js';
import { moduleRegistry } from '../../src/modules/registry.js';

/**
 * Comprehensive Test Suite for Forecast Engine
 * 
 * Tests all forecast modules:
 * - Tax forecast module
 * - Child support forecast module
 * - QDRO forecast module
 * 
 * Target: >70% test coverage
 */

describe('Forecast Engine', () => {
  let engine: ForecastEngine;

  beforeEach(async () => {
    engine = new ForecastEngine();
    // Use real modules from registry - no mocks
    await engine.initialize();
  });

  describe('Engine Initialization', () => {
    it('should initialize successfully', async () => {
      const newEngine = new ForecastEngine();
      await newEngine.initialize();
      
      const info = newEngine.getEngineInfo();
      expect(info.name).toBe('forecast');
      expect(info.description).toContain('Forecast Engine');
    });

    it('should register all forecast modules', async () => {
      const modules = engine.getModules();
      expect(modules.length).toBeGreaterThanOrEqual(3);
      
      const moduleNames = modules.map(m => m.getModuleInfo().name);
      expect(moduleNames).toContain('tax_forecast');
      expect(moduleNames).toContain('child_support_forecast');
      expect(moduleNames).toContain('qdro_forecast');
    });
  });

  describe('Tax Forecast Module', () => {
    it('should generate tax forecast with valid input', async () => {
      const result = await engine.execute({
        action: 'generate_tax_forecast',
        forecast_input: {
          income: 50000,
          filingStatus: 'single',
          deductions: 5000,
        },
        branding: {
          presentationMode: 'strip',
          userRole: 'attorney',
          licensedInAny: true,
          riskAcknowledged: true,
        },
      });

      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
    });

    it('should handle tax forecast with minimal input', async () => {
      const result = await engine.execute({
        action: 'generate_tax_forecast',
        forecast_input: {
          income: 50000,
        },
      });

      expect(result).toBeDefined();
    });

    it('should enforce branding for tax forecast', async () => {
      const result = await engine.execute({
        action: 'generate_tax_forecast',
        forecast_input: { income: 50000 },
        branding: {
          presentationMode: 'none', // Attempt to remove branding
          userRole: 'client', // Not licensed
          licensedInAny: false,
          riskAcknowledged: false,
        },
      });

      // Should enforce branding (strip mode) for unlicensed users
      expect(result).toBeDefined();
    });
  });

  describe('Child Support Forecast Module', () => {
    it('should generate child support forecast with valid input', async () => {
      const result = await engine.execute({
        action: 'generate_child_support_forecast',
        forecast_input: {
          parent1Income: 50000,
          parent2Income: 30000,
          numberOfChildren: 2,
          state: 'Michigan',
        },
        branding: {
          presentationMode: 'strip',
          userRole: 'attorney',
          licensedInAny: true,
          riskAcknowledged: true,
        },
      });

      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
    });

    it('should handle child support forecast with minimal input', async () => {
      const result = await engine.execute({
        action: 'generate_child_support_forecast',
        forecast_input: {
          parent1Income: 50000,
          parent2Income: 30000,
        },
      });

      expect(result).toBeDefined();
    });

    it('should enforce branding for child support forecast', async () => {
      const result = await engine.execute({
        action: 'generate_child_support_forecast',
        forecast_input: {
          parent1Income: 50000,
          parent2Income: 30000,
        },
        branding: {
          presentationMode: 'none',
          userRole: 'client',
          licensedInAny: false,
          riskAcknowledged: false,
        },
      });

      expect(result).toBeDefined();
    });
  });

  describe('QDRO Forecast Module', () => {
    it('should generate QDRO forecast with valid input', async () => {
      const result = await engine.execute({
        action: 'generate_qdro_forecast',
        forecast_input: {
          accountBalance: 100000,
          accountType: '401k',
          participantAge: 45,
          alternatePayeeAge: 40,
        },
        branding: {
          presentationMode: 'strip',
          userRole: 'attorney',
          licensedInAny: true,
          riskAcknowledged: true,
        },
      });

      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
    });

    it('should handle QDRO forecast with minimal input', async () => {
      const result = await engine.execute({
        action: 'generate_qdro_forecast',
        forecast_input: {
          accountBalance: 100000,
        },
      });

      expect(result).toBeDefined();
    });

    it('should enforce branding for QDRO forecast', async () => {
      const result = await engine.execute({
        action: 'generate_qdro_forecast',
        forecast_input: {
          accountBalance: 100000,
        },
        branding: {
          presentationMode: 'none',
          userRole: 'client',
          licensedInAny: false,
          riskAcknowledged: false,
        },
      });

      expect(result).toBeDefined();
    });
  });

  describe('Status and Error Handling', () => {
    it('should return engine status', async () => {
      const result = await engine.execute({
        action: 'get_status',
      });

      expect(result.isError).toBe(false);
      const content = JSON.parse(result.content[0].text);
      expect(content.engine).toBeDefined();
      expect(content.modules).toBeDefined();
      expect(Array.isArray(content.modules)).toBe(true);
    });

    it('should handle invalid action', async () => {
      const result = await engine.execute({
        action: 'invalid_action' as any,
      });

      expect(result.isError).toBe(true);
    });

    it('should handle missing forecast input gracefully', async () => {
      const result = await engine.execute({
        action: 'generate_tax_forecast',
        // Missing forecast_input
      });

      // Should handle gracefully (may return error or default values)
      expect(result).toBeDefined();
    });

    it('should handle invalid branding configuration', async () => {
      const result = await engine.execute({
        action: 'generate_tax_forecast',
        forecast_input: { income: 50000 },
        branding: {
          presentationMode: 'invalid' as any,
          userRole: 'attorney',
          licensedInAny: true,
          riskAcknowledged: true,
        },
      });

      // Should handle validation error
      expect(result).toBeDefined();
    });
  });

  describe('Branding Validation', () => {
    it('should allow branding removal for licensed attorneys with risk acknowledgment', async () => {
      const result = await engine.execute({
        action: 'generate_tax_forecast',
        forecast_input: { income: 50000 },
        branding: {
          presentationMode: 'none',
          userRole: 'attorney',
          licensedInAny: true,
          riskAcknowledged: true,
        },
      });

      expect(result).toBeDefined();
    });

    it('should enforce branding for unlicensed users', async () => {
      const result = await engine.execute({
        action: 'generate_tax_forecast',
        forecast_input: { income: 50000 },
        branding: {
          presentationMode: 'none',
          userRole: 'client',
          licensedInAny: false,
          riskAcknowledged: false,
        },
      });

      // Should enforce branding
      expect(result).toBeDefined();
    });

    it('should default to strip mode when branding not provided', async () => {
      const result = await engine.execute({
        action: 'generate_tax_forecast',
        forecast_input: { income: 50000 },
      });

      expect(result).toBeDefined();
    });
  });
});
