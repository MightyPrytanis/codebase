/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseEngine } from '../base-engine.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { moduleRegistry } from '../../modules/registry.js';
import { z } from 'zod';

/**
 * Forecast Engine
 * Orchestrates tax, child support, and QDRO forecast modules
 * with mandatory LexFiat Forecast branding and disclaimers
 * 
 * "It's gonna have a Hemi" - powerful engine for complex forecast calculations
 */

export type ForecastType = 'tax_return' | 'child_support' | 'qdro';
export type PresentationMode = 'strip' | 'watermark' | 'none';

export interface ForecastBrandingConfig {
  presentationMode: PresentationMode;
  userRole: 'attorney' | 'staff' | 'client' | 'other';
  licensedInAny: boolean;
  riskAcknowledged: boolean;
}

const ForecastEngineInputSchema = z.object({
  action: z.enum([
    'generate_tax_forecast',
    'generate_child_support_forecast',
    'generate_qdro_forecast',
    'get_status',
  ]).describe('Action to perform'),
  forecast_input: z.any().optional().describe('Forecast-specific input data'),
  branding: z.object({
    presentationMode: z.enum(['strip', 'watermark', 'none']).default('strip'),
    userRole: z.enum(['attorney', 'staff', 'client', 'other']),
    licensedInAny: z.boolean(),
    riskAcknowledged: z.boolean(),
  }).optional().describe('Branding configuration'),
});

export class ForecastEngine extends BaseEngine {
  constructor() {
    super({
      name: 'forecast',
      description: 'Forecast Engine - Generates hypothetical forecasts (tax returns, child support, QDROs) with mandatory LexFiat Forecaster™ branding',
      version: '1.0.0',
      modules: ['tax_forecast', 'child_support_forecast', 'qdro_forecast'],
      aiProviders: ['openai', 'anthropic'],
    });
  }

  async initialize(): Promise<void> {
    // Ensure modules are loaded from registry
    const moduleNames = ['tax_forecast', 'child_support_forecast', 'qdro_forecast'];
    for (const moduleName of moduleNames) {
      const module = moduleRegistry.get(moduleName);
      if (module && !this.modules.has(moduleName)) {
        this.registerModule(module);
      }
    }

    // Initialize all forecast modules
    const modules = this.getModules();
    for (const module of modules) {
      await module.initialize();
    }
  }

  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = ForecastEngineInputSchema.parse(input);

      switch (parsed.action) {
        case 'generate_tax_forecast':
          return await this.generateTaxForecast(parsed.forecast_input, parsed.branding);

        case 'generate_child_support_forecast':
          return await this.generateChildSupportForecast(parsed.forecast_input, parsed.branding);

        case 'generate_qdro_forecast':
          return await this.generateQDR0Forecast(parsed.forecast_input, parsed.branding);

        case 'get_status':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  engine: this.getEngineInfo(),
                  modules: this.getModules().map(m => m.getModuleInfo()),
                }, null, 2),
              },
            ],
            isError: false,
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown action: ${parsed.action}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in Forecast Engine: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Generate tax return forecast
   */
  private async generateTaxForecast(
    input: any,
    branding?: ForecastBrandingConfig
  ): Promise<CallToolResult> {
    // Validate branding override permissions
    const brandingResult = this.validateBrandingOverride(branding);
    if (!brandingResult.allowed) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: brandingResult.error,
              presentationMode: 'strip', // Force default
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    // Get tax forecast module
    const taxModule = this.getModule('tax_forecast');
    if (!taxModule) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Tax Forecast Module not found',
          },
        ],
        isError: true,
      };
    }

    // Execute tax calculation
    const calculationResult = await taxModule.execute({
      action: 'calculate',
      input,
    });

    if (calculationResult.isError) {
      return calculationResult;
    }

    // Apply branding to PDF
    await this.applyBranding(
      'tax_return',
      calculationResult,
      brandingResult.presentationMode
    );

    // Log branding override if applicable
    if (brandingResult.presentationMode !== 'strip') {
      this.logBrandingOverride('tax_return', branding!);
    }

    // Extract text content safely
    const textContent = calculationResult.content.find(c => c.type === 'text');
    const calculatedValues = textContent && 'text' in textContent 
      ? JSON.parse(textContent.text || '{}')
      : {};

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            forecastType: 'tax_return',
            calculatedValues,
            brandingApplied: true,
            presentationMode: brandingResult.presentationMode,
          }, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Generate child support forecast
   */
  private async generateChildSupportForecast(
    input: any,
    branding?: ForecastBrandingConfig
  ): Promise<CallToolResult> {
    // Validate branding override permissions
    const brandingResult = this.validateBrandingOverride(branding);
    if (!brandingResult.allowed) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: brandingResult.error,
              presentationMode: 'strip',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    // Get child support forecast module
    const supportModule = this.getModule('child_support_forecast');
    if (!supportModule) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Child Support Forecast Module not found',
          },
        ],
        isError: true,
      };
    }

    // Execute support calculation
    const calculationResult = await supportModule.execute({
      action: 'calculate',
      input,
    });

    if (calculationResult.isError) {
      return calculationResult;
    }

    // Apply branding
    await this.applyBranding(
      'child_support',
      calculationResult,
      brandingResult.presentationMode
    );

    // Log branding override if applicable
    if (brandingResult.presentationMode !== 'strip') {
      this.logBrandingOverride('child_support', branding!);
    }

    // Extract text content safely
    const textContent = calculationResult.content.find(c => c.type === 'text');
    const calculatedValues = textContent && 'text' in textContent 
      ? JSON.parse(textContent.text || '{}')
      : {};

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            forecastType: 'child_support',
            calculatedValues,
            brandingApplied: true,
            presentationMode: brandingResult.presentationMode,
          }, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Generate QDRO forecast
   */
  private async generateQDR0Forecast(
    input: any,
    branding?: ForecastBrandingConfig
  ): Promise<CallToolResult> {
    // Validate branding override permissions
    const brandingResult = this.validateBrandingOverride(branding);
    if (!brandingResult.allowed) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: brandingResult.error,
              presentationMode: 'strip',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    // Get QDRO forecast module
    const qdroModule = this.getModule('qdro_forecast');
    if (!qdroModule) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: QDRO Forecast Module not found',
          },
        ],
        isError: true,
      };
    }

    // Execute QDRO calculation
    const calculationResult = await qdroModule.execute({
      action: 'calculate',
      input,
    });

    if (calculationResult.isError) {
      return calculationResult;
    }

    // Apply branding
    await this.applyBranding(
      'qdro',
      calculationResult,
      brandingResult.presentationMode
    );

    // Log branding override if applicable
    if (brandingResult.presentationMode !== 'strip') {
      this.logBrandingOverride('qdro', branding!);
    }

    // Extract text content safely
    const textContent = calculationResult.content.find(c => c.type === 'text');
    const calculatedValues = textContent && 'text' in textContent 
      ? JSON.parse(textContent.text || '{}')
      : {};

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            forecastType: 'qdro',
            calculatedValues,
            brandingApplied: true,
            presentationMode: brandingResult.presentationMode,
          }, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Validate branding override permissions
   * Licensed attorneys can override, others cannot
   */
  private validateBrandingOverride(
    branding?: ForecastBrandingConfig
  ): { allowed: boolean; error?: string; presentationMode: PresentationMode } {
    // Default: always use strip
    if (!branding || branding.presentationMode === 'strip') {
      return { allowed: true, presentationMode: 'strip' };
    }

    // Override requires: licensed attorney + risk acknowledgement
    if (branding.userRole === 'attorney' && branding.licensedInAny && branding.riskAcknowledged) {
      return { allowed: true, presentationMode: branding.presentationMode };
    }

    // Non-attorneys or unlicensed users cannot override
    if (branding.userRole !== 'attorney' || !branding.licensedInAny) {
      return {
        allowed: false,
        error: 'Only licensed attorneys can disable LexFiat Forecaster™ branding. Branding is required for non-attorney users.',
        presentationMode: 'strip',
      };
    }

    // Licensed attorney but risk not acknowledged
    if (!branding.riskAcknowledged) {
      return {
        allowed: false,
        error: 'Risk acknowledgement required to disable LexFiat Forecaster™ branding. You must acknowledge that forecast outputs may resemble official forms and are not filing-ready.',
        presentationMode: 'strip',
      };
    }

    return { allowed: true, presentationMode: branding.presentationMode };
  }

  /**
   * Apply branding to forecast PDF
   */
  private async applyBranding(
    forecastType: ForecastType,
    calculationResult: CallToolResult,
    presentationMode: PresentationMode
  ): Promise<void> {
    // Get PDF form filler tool from appropriate module
    const module = this.getModule(`${forecastType === 'tax_return' ? 'tax' : forecastType === 'child_support' ? 'child_support' : 'qdro'}_forecast`);
    if (!module) return;

    const pdfFiller = module.getTool('pdf_form_filler');
    if (pdfFiller) {
      await pdfFiller.execute({
        action: 'apply_branding',
        presentationMode,
        forecastType,
      });
    }
  }

  /**
   * Log branding override attempts
   */
  private logBrandingOverride(
    forecastType: ForecastType,
    branding: ForecastBrandingConfig
  ): void {
    // TODO: Implement actual logging
    console.log(`[FORECAST BRANDING OVERRIDE]`, {
      timestamp: new Date().toISOString(),
      forecastType,
      presentationMode: branding.presentationMode,
      userRole: branding.userRole,
      licensedInAny: branding.licensedInAny,
      riskAcknowledged: branding.riskAcknowledged,
    });
  }

  async cleanup(): Promise<void> {
    // Cleanup all modules
    for (const module of this.getModules()) {
      await module.cleanup();
    }
    this.state.clear();
  }
}

// Export singleton instance
export const forecastEngine = new ForecastEngine();

