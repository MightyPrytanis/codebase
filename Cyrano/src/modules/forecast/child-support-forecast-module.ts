/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ResourceLoader } from '../../services/resource-loader.js';
import { calculateChildSupport, ChildSupportInput, ChildSupportCalculation } from './formulas/child-support-formulas.js';
import { pdfFormFiller } from '../../tools/pdf-form-filler.js';

const ChildSupportForecastInputSchema = z.object({
  action: z.enum(['calculate', 'calculate_scenarios', 'generate_pdf', 'get_status']).describe('Action to perform'),
  input: z.any().optional().describe('Child support forecast input data'),
  scenarios: z.array(z.object({
    overnightsPayer: z.number().optional(),
    overnightsPayee: z.number().optional(),
    payerIncome: z.number().optional(),
    payeeIncome: z.number().optional(),
    healthInsurance: z.number().optional(),
    childcare: z.number().optional(),
    label: z.string().optional(),
  })).optional().describe('Alternative scenarios to calculate (for calculate_scenarios action)'),
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

        case 'calculate_scenarios':
          return await this.calculateMultipleScenarios(parsed.input, parsed.scenarios || []);

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
                  features: ['calculate', 'calculate_scenarios', 'generate_pdf'],
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
   * Calculate multiple child support scenarios with alternative inputs
   * Useful for presenting clients with "what-if" scenarios (e.g., changing overnights)
   */
  private async calculateMultipleScenarios(
    baseInput: any,
    scenarios: Array<{
      overnightsPayer?: number;
      overnightsPayee?: number;
      payerIncome?: number;
      payeeIncome?: number;
      healthInsurance?: number;
      childcare?: number;
      label?: string;
    }>
  ): Promise<CallToolResult> {
    try {
      const results: Array<{
        label: string;
        input: ChildSupportInput;
        calculation: ChildSupportCalculation;
      }> = [];
      
      // Base scenario (current/default)
      const baseSupportInput: ChildSupportInput = {
        jurisdiction: baseInput.jurisdiction || 'michigan',
        payerIncome: baseInput.payerIncome || 0,
        payeeIncome: baseInput.payeeIncome || 0,
        numberOfChildren: baseInput.numberOfChildren || 1,
        overnightsPayer: baseInput.overnightsPayer || 0,
        overnightsPayee: baseInput.overnightsPayee || 365,
        healthInsurance: baseInput.healthInsurance || 0,
        childcare: baseInput.childcare || 0,
        otherChildren: baseInput.otherChildren || 0,
      };
      
      const baseCalculation = calculateChildSupport(baseSupportInput);
      results.push({
        label: baseInput.label || 'Current Scenario',
        input: baseSupportInput,
        calculation: baseCalculation,
      });
      
      // Calculate each alternative scenario
      for (const scenario of scenarios) {
        const scenarioInput: ChildSupportInput = {
          ...baseSupportInput,
          overnightsPayer: scenario.overnightsPayer !== undefined ? scenario.overnightsPayer : baseSupportInput.overnightsPayer,
          overnightsPayee: scenario.overnightsPayee !== undefined ? scenario.overnightsPayee : baseSupportInput.overnightsPayee,
          payerIncome: scenario.payerIncome !== undefined ? scenario.payerIncome : baseSupportInput.payerIncome,
          payeeIncome: scenario.payeeIncome !== undefined ? scenario.payeeIncome : baseSupportInput.payeeIncome,
          healthInsurance: scenario.healthInsurance !== undefined ? scenario.healthInsurance : baseSupportInput.healthInsurance,
          childcare: scenario.childcare !== undefined ? scenario.childcare : baseSupportInput.childcare,
        };
        
        // Ensure overnights add up to 365
        const totalOvernights = scenarioInput.overnightsPayer + scenarioInput.overnightsPayee;
        if (totalOvernights !== 365) {
          // Normalize to 365 days
          const scale = 365 / totalOvernights;
          scenarioInput.overnightsPayer = Math.round(scenarioInput.overnightsPayer * scale);
          scenarioInput.overnightsPayee = 365 - scenarioInput.overnightsPayer;
        }
        
        const scenarioCalculation = calculateChildSupport(scenarioInput);
        results.push({
          label: scenario.label || `Scenario ${results.length}`,
          input: scenarioInput,
          calculation: scenarioCalculation,
        });
      }
      
      // Calculate differences from base scenario
      const comparisons = results.map((result, index) => {
        if (index === 0) {
          return {
            label: result.label,
            finalSupportAmount: result.calculation.finalSupportAmount,
            difference: 0,
            differencePercent: 0,
          };
        }
        
        const difference = result.calculation.finalSupportAmount - baseCalculation.finalSupportAmount;
        const differencePercent = baseCalculation.finalSupportAmount > 0
          ? (difference / baseCalculation.finalSupportAmount) * 100
          : 0;
        
        return {
          label: result.label,
          finalSupportAmount: result.calculation.finalSupportAmount,
          difference,
          differencePercent: Math.round(differencePercent * 100) / 100,
          keyChanges: {
            overnightsPayer: result.input.overnightsPayer !== baseSupportInput.overnightsPayer
              ? `${baseSupportInput.overnightsPayer} → ${result.input.overnightsPayer}`
              : undefined,
            payerIncome: result.input.payerIncome !== baseSupportInput.payerIncome
              ? `$${baseSupportInput.payerIncome.toLocaleString()} → $${result.input.payerIncome.toLocaleString()}`
              : undefined,
            payeeIncome: result.input.payeeIncome !== baseSupportInput.payeeIncome
              ? `$${baseSupportInput.payeeIncome.toLocaleString()} → $${result.input.payeeIncome.toLocaleString()}`
              : undefined,
          },
        };
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              baseScenario: {
                label: results[0].label,
                calculation: baseCalculation,
              },
              scenarios: results.slice(1).map(r => ({
                label: r.label,
                calculation: r.calculation,
              })),
              comparisons,
              summary: {
                lowestSupport: Math.min(...results.map(r => r.calculation.finalSupportAmount)),
                highestSupport: Math.max(...results.map(r => r.calculation.finalSupportAmount)),
                averageSupport: results.reduce((sum, r) => sum + r.calculation.finalSupportAmount, 0) / results.length,
              },
            }, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error calculating scenarios: ${error instanceof Error ? error.message : String(error)}`,
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
    // Use PDF form filler tool (registered in module constructor)
    const pdfFiller = this.getTool('pdf_form_filler');
    if (!pdfFiller) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'PDF form filler tool not available in module',
            }, null, 2),
          },
        ],
        isError: true,
      } as CallToolResult;
    }

    // Execute PDF form filling
    return await pdfFiller.execute({
      action: 'fill_form',
      formType: 'child_support',
      formData: input,
    });
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}

// Export singleton instance
export const childSupportForecastModule = new ChildSupportForecastModule();


}
}
}
}
)
}
}
}
}
}
}
}
)
}
]
}
)
}