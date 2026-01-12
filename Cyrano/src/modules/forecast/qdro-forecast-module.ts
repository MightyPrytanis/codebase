/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ResourceLoader } from '../../services/resource-loader.js';
import { calculateQDRO, QDROInput } from './formulas/qdro-formulas.js';
import { pdfFormFiller } from '../../tools/pdf-form-filler.js';

const QDROForecastInputSchema = z.object({
  action: z.enum(['calculate', 'generate_pdf', 'verify_erisa', 'get_status']).describe('Action to perform'),
  input: z.any().optional().describe('QDRO forecast input data'),
});

/**
 * QDRO Forecast Module
 * Handles QDRO forecast calculations with ERISA compliance
 * 
 * Resources:
 * - ERISA-compliant QDRO templates
 * - Defined Benefit vs Defined Contribution calculation logic
 * - Marital service period calculation rules
 * 
 * Tools:
 * - qdro_calculator: Performs QDRO division calculations
 * - pdf_form_filler: Fills ERISA-compliant QDRO forms
 */
export class QDROForecastModule extends BaseModule {
  private resourceLoader: ResourceLoader;
  private loadedResources: Map<string, Buffer> = new Map();

  constructor() {
    super({
      name: 'qdro_forecast',
      description: 'QDRO Forecast Module - Calculates hypothetical QDRO division scenarios with ERISA compliance',
      version: '1.0.0',
      tools: [
        pdfFormFiller,
      ],
      resources: [
        {
          id: 'erisa_qdro_template',
          type: 'template',
          url: 'https://www.dol.gov/sites/dolgov/files/ebsa/about-ebsa/our-activities/resource-center/publications/qdro-sample-language.pdf',
          version: 'current',
          cache: true,
          description: 'ERISA-compliant QDRO template (DOL sample language)',
        },
        {
          id: 'db_calculation_rules',
          type: 'data',
          description: 'Defined Benefit plan calculation rules (coded in TypeScript)',
        },
        {
          id: 'dc_calculation_rules',
          type: 'data',
          description: 'Defined Contribution plan calculation rules (coded in TypeScript)',
        },
      ],
      prompts: [
        {
          id: 'qdro_calculation',
          template: 'Calculate QDRO division for:\nPlan Type: {{planType}}\nBalance/Benefit: {{balance}}\nMarital Service Start: {{maritalStart}}\nMarital Service End: {{maritalEnd}}\nDivision Percentage: {{percentage}}\n\nGenerate ERISA-compliant division calculation.',
          variables: ['planType', 'balance', 'maritalStart', 'maritalEnd', 'percentage'],
        },
        {
          id: 'erisa_compliance',
          template: 'Verify ERISA compliance for QDRO:\n{{qdroData}}\n\nCheck against ERISA requirements and plan-specific rules.',
          variables: ['qdroData'],
        },
        {
          id: 'scenario_generation',
          template: 'Generate multiple QDRO scenarios based on:\n{{baseInput}}\n\nVary: {{variables}}\n\nProvide what-if analysis showing impact of different division percentages and retirement age assumptions.',
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
    console.log(`QDRO Forecast Module initialized: ${this.loadedResources.size} resources loaded`);
  }

  /**
   * Get a loaded resource buffer
   */
  getResourceBuffer(resourceId: string): Buffer | undefined {
    return this.loadedResources.get(resourceId);
  }

  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = QDROForecastInputSchema.parse(input);

      switch (parsed.action) {
        case 'calculate':
          return await this.calculateQDROScenarios(parsed.input);

        case 'generate_pdf':
          return await this.generateQDROPDF(parsed.input);

        case 'verify_erisa':
          return await this.verifyERISACompliance(parsed.input);

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
            text: `Error in QDRO Forecast Module: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Calculate QDRO scenarios using ERISA-compliant formulas
   */
  private async calculateQDROScenarios(input: any): Promise<CallToolResult> {
    try {
      // Validate and convert input to QDROInput format
      const qdroInput: QDROInput = {
        planType: input.planType || 'defined_contribution',
        accountBalance: input.accountBalance,
        monthlyBenefit: input.monthlyBenefit,
        maritalServiceStart: input.maritalServiceStart
          ? new Date(input.maritalServiceStart)
          : new Date(),
        maritalServiceEnd: input.maritalServiceEnd
          ? new Date(input.maritalServiceEnd)
          : new Date(),
        retirementAge: input.retirementAge,
        divisionPercentage: input.divisionPercentage || 50,
        participantDOB: input.participantDOB ? new Date(input.participantDOB) : undefined,
        alternatePayeeDOB: input.alternatePayeeDOB ? new Date(input.alternatePayeeDOB) : undefined,
      };

      // Calculate QDRO
      const calculation = calculateQDRO(qdroInput);

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
            text: `Error calculating QDRO: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Generate QDRO PDF with form filling
   */
  private async generateQDROPDF(input: any): Promise<CallToolResult> {
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
      formType: 'qdro',
      formData: input,
    });
  }

  /**
   * Verify ERISA compliance
   * Basic ERISA compliance checks for QDRO requirements
   */
  private async verifyERISACompliance(input: any): Promise<CallToolResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Basic ERISA QDRO requirements
    if (!input.planName || !input.planName.trim()) {
      issues.push('Plan name is required for ERISA compliance');
    }
    
    if (!input.participantName || !input.participantName.trim()) {
      issues.push('Participant name is required for ERISA compliance');
    }
    
    if (!input.alternatePayeeName || !input.alternatePayeeName.trim()) {
      issues.push('Alternate payee name is required for ERISA compliance');
    }
    
    if (!input.amount || input.amount <= 0) {
      issues.push('Valid payment amount is required for ERISA compliance');
    }
    
    // Check for required QDRO language
    const hasQDROLang = input.qdroLanguage || input.containsQDROLang;
    if (!hasQDROLang) {
      warnings.push('QDRO should contain standard ERISA language');
    }
    
    const compliant = issues.length === 0;
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            compliant,
            issues: issues.length > 0 ? issues : undefined,
            warnings: warnings.length > 0 ? warnings : undefined,
            note: compliant 
              ? 'Basic ERISA compliance checks passed. Full legal review recommended.'
              : 'ERISA compliance issues found. Address before filing.',
          }, null, 2),
        },
      ],
      isError: false,
    } as CallToolResult;
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}

// Export singleton instance
export const qdroForecastModule = new QDROForecastModule();

}
}
}
}
)
}
}