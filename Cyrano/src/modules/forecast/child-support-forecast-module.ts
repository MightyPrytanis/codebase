/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ResourceLoader } from '../../services/resource-loader.js';
import { calculateChildSupport, ChildSupportInput } from './formulas/child-support-formulas.js';
import { pdfFormFiller } from '../../tools/pdf-form-filler.js';

const ChildSupportForecastInputSchema = z.object({
  action: z.enum(['calculate', 'generate_pdf', 'get_status']).describe('Action to perform'),
  input: z.any().optional().describe('Child support forecast input data'),
});

/**
 * Child Support Forecast Module
 * Handles child support forecast calculations using state-specific formulas
 * 
 * Resources:
 * - Friend of the Court form templates
 * - State-specific child support formulas (e.g., Michigan FOC formula)
 * - Income shares model calculations
 * 
 * Tools:
 * - support_calculator: Performs state-specific child support calculations
 * - pdf_form_filler: Fills FOC forms with calculated values
 */
export class ChildSupportForecastModule extends BaseModule {
  private resourceLoader: ResourceLoader;
  private loadedResources: Map<string, Buffer> = new Map();

  constructor() {
    super({
      name: 'child_support_forecast',
      description: 'Child Support Forecast Module - Calculates hypothetical child support scenarios using state-specific formulas',
      version: '1.0.0',
      tools: [
        pdfFormFiller,
      ],
      resources: [
        {
          id: 'michigan_foc_form',
          type: 'template',
          url: 'https://courts.michigan.gov/-/media/Project/Websites/courts/Administration/SCAO/Forms/CC/CC_401_Child_Support_Finding_and_Order.pdf',
          version: 'current',
          cache: true,
          description: 'Michigan Friend of the Court Child Support Finding and Order form',
        },
        {
          id: 'michigan_formula',
          type: 'data',
          description: 'Michigan child support formula implementation (coded in TypeScript)',
        },
        {
          id: 'state_formulas',
          type: 'data',
          description: 'State-specific child support formulas (expandable - coded in TypeScript)',
        },
      ],
      prompts: [
        {
          id: 'support_calculation',
          template: 'Calculate child support for:\nJurisdiction: {{jurisdiction}}\nPayer Income: {{payerIncome}}\nPayee Income: {{payeeIncome}}\nOvernights Payer: {{overnightsPayer}}\nOvernights Payee: {{overnightsPayee}}\nHealth Insurance: {{healthInsurance}}\nChildcare: {{childcare}}\n\nGenerate comprehensive support calculation using state guidelines.',
          variables: ['jurisdiction', 'payerIncome', 'payeeIncome', 'overnightsPayer', 'overnightsPayee', 'healthInsurance', 'childcare'],
        },
        {
          id: 'scenario_generation',
          template: 'Generate multiple child support scenarios based on:\n{{baseInput}}\n\nVary: {{variables}}\n\nProvide what-if analysis showing impact of different income, parenting time, and expense assumptions.',
          variables: ['baseInput', 'variables'],
        },
      ],
    });
    this.resourceLoader = new ResourceLoader();
  }

  async initialize(): Promise<void> {
    // Load all resources asynchronously
    const loadPromises: Promise<void>[] = [];
    
    for (const resource of this.resources.values()) {
      if (resource.url || resource.path) {
        loadPromises.push(
          this.resourceLoader.loadResource(resource)
            .then(buffer => {
              this.loadedResources.set(resource.id, buffer as Buffer);
              // Update resource with cached path
              this.registerResource({
                ...resource,
                path: this.resourceLoader.getCachedPath(resource),
              });
            })
            .catch(error => {
              console.warn(`Failed to load resource ${resource.id}:`, error);
              // Continue loading other resources even if one fails
            })
        );
      }
    }

    await Promise.allSettled(loadPromises);
    console.log(`Child Support Forecast Module initialized: ${this.loadedResources.size} resources loaded`);
  }

  /**
   * Get a loaded resource buffer
   */
  getResourceBuffer(resourceId: string): Buffer | undefined {
    return this.loadedResources.get(resourceId);
  }

  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = ChildSupportForecastInputSchema.parse(input);

      switch (parsed.action) {
        case 'calculate':
          return await this.calculateSupportScenarios(parsed.input);

        case 'generate_pdf':
          return await this.generateSupportPDF(parsed.input);

        case 'get_status':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  module: this.getModuleInfo(),
                  tools: this.getTools().map(t => t.getToolDefinition().name),
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
            text: `Error in Child Support Forecast Module: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Calculate child support scenarios using state-specific formulas
   */
  private async calculateSupportScenarios(input: any): Promise<CallToolResult> {
    try {
      // Validate and convert input to ChildSupportInput format
      const supportInput: ChildSupportInput = {
        jurisdiction: input.jurisdiction || 'michigan',
        payerIncome: input.payerIncome || 0,
        payeeIncome: input.payeeIncome || 0,
        numberOfChildren: input.numberOfChildren || 1,
        overnightsPayer: input.overnightsPayer || 0,
        overnightsPayee: input.overnightsPayee || 365,
        healthInsurance: input.healthInsurance || 0,
        childcare: input.childcare || 0,
        otherChildren: input.otherChildren || 0,
      };

      // Calculate child support
      const calculation = calculateChildSupport(supportInput);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(calculation, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error calculating child support: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Generate child support PDF with form filling
   */
  private async generateSupportPDF(input: any): Promise<CallToolResult> {
    // Use PDF form filler tool if available
    const pdfFiller = this.getTool('pdf_form_filler');
    if (pdfFiller) {
      return await pdfFiller.execute({
        formType: 'child_support',
        formData: input,
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'PDF form filler tool not yet implemented',
          }, null, 2),
        },
      ],
      isError: true,
    };
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}

// Export singleton instance
export const childSupportForecastModule = new ChildSupportForecastModule();

