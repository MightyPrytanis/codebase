/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ResourceLoader } from '../../services/resource-loader.js';
import { calculateTax, TaxInput, TaxCalculation } from './formulas/tax-formulas.js';
import { pdfFormFiller } from '../../tools/pdf-form-filler.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const TaxForecastInputSchema = z.object({
  action: z.enum(['calculate', 'generate_pdf', 'get_status']).describe('Action to perform'),
  input: z.any().optional().describe('Tax forecast input data'),
});

/**
 * Tax Forecast Module
 * Handles tax return forecast calculations using IRS and state formulas
 * 
 * Resources:
 * - IRS Form 1040 templates
 * - State tax form templates
 * - Tax tables and brackets
 * 
 * Tools:
 * - tax_calculator: Performs IRS and state tax calculations
 * - pdf_form_filler: Fills PDF forms with calculated values
 */
export class TaxForecastModule extends BaseModule {
  private resourceLoader: ResourceLoader;
  private loadedResources: Map<string, Buffer> = new Map();
  private templatesDir: string;

  constructor() {
    super({
      name: 'tax_forecast',
      description: 'Tax Return Forecast Module - Calculates hypothetical tax scenarios using IRS and state formulas',
      version: '1.0.0',
      tools: [
        pdfFormFiller,
      ],
      resources: [
        // IRS Form 1040 (2018-2025)
        ...TaxForecastModule.generateYearlyResources('irs_1040', 'template', 'IRS Form 1040', 2018, 2025, 'f1040'),
        // IRS Form 1040 Schedule A (Itemized Deductions)
        ...TaxForecastModule.generateYearlyResources('irs_1040_schedule_a', 'template', 'IRS Form 1040 Schedule A - Itemized Deductions', 2018, 2025, 'f1040sa'),
        // IRS Form 1040 Schedule B (Interest and Ordinary Dividends)
        ...TaxForecastModule.generateYearlyResources('irs_1040_schedule_b', 'template', 'IRS Form 1040 Schedule B - Interest and Ordinary Dividends', 2018, 2025, 'f1040sb'),
        // IRS Form 1040 Schedule C (Profit or Loss from Business)
        ...TaxForecastModule.generateYearlyResources('irs_1040_schedule_c', 'template', 'IRS Form 1040 Schedule C - Profit or Loss from Business', 2018, 2025, 'f1040sc'),
        // IRS Form 1040 Schedule D (Capital Gains and Losses)
        ...TaxForecastModule.generateYearlyResources('irs_1040_schedule_d', 'template', 'IRS Form 1040 Schedule D - Capital Gains and Losses', 2018, 2025, 'f1040sd'),
        // IRS Form 1040 Schedule E (Supplemental Income and Loss)
        ...TaxForecastModule.generateYearlyResources('irs_1040_schedule_e', 'template', 'IRS Form 1040 Schedule E - Supplemental Income and Loss', 2018, 2025, 'f1040se'),
        // IRS Form 1040 Schedule SE (Self-Employment Tax)
        ...TaxForecastModule.generateYearlyResources('irs_1040_schedule_se', 'template', 'IRS Form 1040 Schedule SE - Self-Employment Tax', 2018, 2025, 'f1040sse'),
        // IRS Tax Tables (2018-2025)
        ...TaxForecastModule.generateYearlyResources('irs_tax_tables', 'data', 'IRS Tax Tables', 2018, 2025, 'i1040tt'),
        // State tax forms (Michigan as example - can be expanded)
        {
          id: 'michigan_1040_2024',
          type: 'template',
          url: 'https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/2024/2024-MI-1040.pdf',
          version: '2024',
          cache: true,
          description: 'Michigan Form 1040 (2024)',
        },
        {
          id: 'michigan_1040_2023',
          type: 'template',
          url: 'https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/2023/2023-MI-1040.pdf',
          version: '2023',
          cache: true,
          description: 'Michigan Form 1040 (2023)',
        },
      ],
      prompts: [
        {
          id: 'tax_calculation',
          template: 'Calculate tax liability for:\nYear: {{year}}\nFiling Status: {{filingStatus}}\nWages: {{wages}}\nSelf-Employment Income: {{selfEmploymentIncome}}\nDeductions: {{deductions}}\nCredits: {{credits}}\n\nGenerate comprehensive tax calculation with AGI, taxable income, tax liability, and refund/balance.',
          variables: ['year', 'filingStatus', 'wages', 'selfEmploymentIncome', 'deductions', 'credits'],
        },
        {
          id: 'scenario_generation',
          template: 'Generate multiple tax scenarios based on:\n{{baseInput}}\n\nVary: {{variables}}\n\nProvide what-if analysis showing impact of different assumptions.',
          variables: ['baseInput', 'variables'],
        },
      ],
    });
    this.resourceLoader = new ResourceLoader();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.templatesDir = path.resolve(__dirname, '../../templates/forms');
  }

  private async tryLoadBundledTemplate(formCode: string, year: number): Promise<Buffer | undefined> {
    const candidates = [`${formCode}--${year}.pdf`, `${formCode}.pdf`];
    for (const filename of candidates) {
      try {
        return await fs.readFile(path.join(this.templatesDir, filename));
      } catch {
        // ignore missing
      }
    }
    return undefined;
  }

  /**
   * Generate resource definitions for multiple years
   */
  private static generateYearlyResources(
    baseId: string,
    type: 'file' | 'data' | 'api' | 'template',
    description: string,
    startYear: number,
    endYear: number,
    irsFormCode: string
  ): Array<{ id: string; type: 'file' | 'data' | 'api' | 'template'; url: string; version: string; cache: boolean; description: string }> {
    const resources: Array<{ id: string; type: 'file' | 'data' | 'api' | 'template'; url: string; version: string; cache: boolean; description: string }> = [];
    for (let year = startYear; year <= endYear; year++) {
      // IRS URL pattern: current year uses f1040.pdf, prior years use f1040--YYYY.pdf
      const url = year === new Date().getFullYear()
        ? `https://www.irs.gov/pub/irs-pdf/${irsFormCode}.pdf`
        : `https://www.irs.gov/pub/irs-prior/${irsFormCode}--${year}.pdf`;
      
      resources.push({
        id: `${baseId}_${year}`,
        type: type as 'file' | 'data' | 'api' | 'template',
        url,
        version: year.toString(),
        cache: true,
        description: `${description} (${year})`,
      });
    }
    return resources;
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
    console.log(`Tax Forecast Module initialized: ${this.loadedResources.size} resources loaded`);
  }

  /**
   * Get a loaded resource buffer
   */
  getResourceBuffer(resourceId: string): Buffer | undefined {
    return this.loadedResources.get(resourceId);
  }

  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = TaxForecastInputSchema.parse(input);

      switch (parsed.action) {
        case 'calculate':
          return await this.calculateTaxScenarios(parsed.input);

        case 'generate_pdf':
          return await this.generateTaxPDF(parsed.input);

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
            text: `Error in Tax Forecast Module: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Calculate tax scenarios using IRS formulas
   */
  private async calculateTaxScenarios(input: any): Promise<CallToolResult> {
    try {
      // Validate and convert input to TaxInput format
      const taxInput: TaxInput = {
        year: input.year || new Date().getFullYear(),
        filingStatus: input.filingStatus || 'single',
        wages: input.wages || 0,
        selfEmploymentIncome: input.selfEmploymentIncome || 0,
        interestIncome: input.interestIncome || 0,
        dividendIncome: input.dividendIncome || 0,
        capitalGains: input.capitalGains || 0,
        rentalIncome: input.rentalIncome || 0,
        otherIncome: input.otherIncome || 0,
        standardDeduction: input.standardDeduction || 0,
        itemizedDeductions: input.itemizedDeductions || 0,
        dependents: input.dependents || 0,
        credits: {
          earnedIncomeCredit: input.credits?.earnedIncomeCredit || 0,
          childTaxCredit: input.credits?.childTaxCredit || 0,
          educationCredit: input.credits?.educationCredit || 0,
          otherCredits: input.credits?.otherCredits || 0,
        },
        estimatedWithholding: input.estimatedWithholding || 0,
      };

      // Calculate tax
      const calculation = calculateTax(taxInput);

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
            text: `Error calculating tax: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Generate tax PDF with form filling
   */
  private async generateTaxPDF(input: any): Promise<CallToolResult> {
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

    const year = input?.year || new Date().getFullYear();

    const templateBuffer =
      (await this.tryLoadBundledTemplate('f1040', year)) ||
      this.getResourceBuffer(`irs_1040_${year}`);

    if (!templateBuffer) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: `No Form 1040 template available for year ${year}`,
              year,
            }, null, 2),
          },
        ],
        isError: true,
      } as CallToolResult;
    }

    // Execute PDF form filling (include base64 PDF so clients can download)
    return await pdfFiller.execute({
      action: 'fill_form',
      formType: 'tax_return',
      formData: input,
      templateBuffer,
      returnPdfBase64: true,
    });
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}

// Export singleton instance
export const taxForecastModule = new TaxForecastModule();


}
}
]
}
}
}
}
)