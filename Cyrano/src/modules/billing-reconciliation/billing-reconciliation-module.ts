/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from '../base-module.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { gapIdentifier } from '../../tools/gap-identifier.js';
import { emailArtifactCollector } from '../../tools/email-artifact-collector.js';
import { calendarArtifactCollector } from '../../tools/calendar-artifact-collector.js';
import { documentArtifactCollector } from '../../tools/document-artifact-collector.js';
import { clioIntegration } from '../../tools/clio-integration.js';
import { engineRegistry } from '../../engines/registry.js';
import { checkGeneratedContent } from '../../services/ethics-check-helper.js';

const BillingReconciliationInputSchema = z.object({
  action: z.enum([
    'generate_reconciliation_report',
    'compare_with_clio',
    'identify_discrepancies',
  ]).describe('Action to perform'),
  start_date: z.string().describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().describe('End date (YYYY-MM-DD)'),
  matter_id: z.string().optional().describe('Optional matter ID'),
  include_artifacts: z.array(z.enum(['email', 'calendar', 'documents', 'calls'])).optional(),
  clio_matter_id: z.string().optional().describe('Clio matter ID for comparison'),
});

/**
 * Billing Reconciliation Module
 * 
 * Generates comprehensive reconciliation reports for billing discrepancies.
 * Useful for reconciling time entries with Clio or other billing systems.
 * 
 * Key Features:
 * - Generate comprehensive reconciliation reports combining gaps and artifacts
 * - Compare time entries with Clio billing records
 * - Identify discrepancies between recorded time and billing system data
 * 
 * This module preserves the report generation functionality from the legacy
 * ChronometricModule, repurposed specifically for billing reconciliation.
 */
export class BillingReconciliationModule extends BaseModule {
  constructor() {
    super({
      name: 'billing_reconciliation',
      description: 'Billing Reconciliation Module - Generates comprehensive reports for reconciling billing discrepancies with Clio or other sources',
      version: '1.0.0',
      tools: [
        gapIdentifier,
        emailArtifactCollector,
        calendarArtifactCollector,
        documentArtifactCollector,
        clioIntegration,
      ],
      resources: [
        {
          id: 'clio_config',
          type: 'api',
          description: 'Clio API configuration',
        },
      ],
    });
  }

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    // Module is initialized with tools and resources in constructor
  }

  /**
   * Execute module functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = BillingReconciliationInputSchema.parse(input);
      
      switch (parsed.action) {
        case 'generate_reconciliation_report':
          return await this.generateReconciliationReport(parsed);
        
        case 'compare_with_clio':
          return await this.compareWithClio(parsed);
        
        case 'identify_discrepancies':
          return await this.identifyDiscrepancies(parsed);
        
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
            text: `Error in billing reconciliation module: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Generate comprehensive reconciliation report
   * 
   * Combines gap identification and artifact collection into a single
   * comprehensive report useful for reconciling billing issues.
   */
  private async generateReconciliationReport(input: any): Promise<CallToolResult> {
    if (!input.start_date || !input.end_date) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: start_date and end_date are required for reconciliation report',
          },
        ],
        isError: true,
      };
    }

    // Identify gaps
    const gapsResult = await this.executeTool('gap_identifier', {
      start_date: input.start_date,
      end_date: input.end_date,
      billing_source: 'both',
      matter_id: input.matter_id,
    });

    // Collect artifacts
    const artifactsResult = await this.collectArtifacts(input);

    // Parse results
    let gaps: any = null;
    if (!gapsResult.isError && gapsResult.content[0]?.type === 'text' && 'text' in gapsResult.content[0]) {
      try {
        gaps = JSON.parse(gapsResult.content[0].text);
      } catch {
        gaps = { error: 'Failed to parse gaps data' };
      }
    }

    let artifacts: any = null;
    if (!artifactsResult.isError && artifactsResult.content[0]?.type === 'text' && 'text' in artifactsResult.content[0]) {
      try {
        artifacts = JSON.parse(artifactsResult.content[0].text);
      } catch {
        artifacts = { error: 'Failed to parse artifacts data' };
      }
    }

    // Build report
    const report = {
      report_type: 'billing_reconciliation',
      period: { start_date: input.start_date, end_date: input.end_date },
      matter_id: input.matter_id || null,
      gaps: gaps as any,
      artifacts: artifacts as any,
      summary: {
        total_gaps: (gaps && typeof gaps === 'object' && 'gaps' in gaps && Array.isArray(gaps.gaps)) ? gaps.gaps.length : 0,
        total_emails: (artifacts && typeof artifacts === 'object' && 'artifacts' in artifacts && typeof artifacts.artifacts === 'object' && 'emails' in artifacts.artifacts && Array.isArray(artifacts.artifacts.emails)) ? artifacts.artifacts.emails.length : 0,
        total_calendar_events: (artifacts && typeof artifacts === 'object' && 'artifacts' in artifacts && typeof artifacts.artifacts === 'object' && 'calendar' in artifacts.artifacts && Array.isArray(artifacts.artifacts.calendar)) ? artifacts.artifacts.calendar.length : 0,
        total_documents: (artifacts && typeof artifacts === 'object' && 'artifacts' in artifacts && typeof artifacts.artifacts === 'object' && 'documents' in artifacts.artifacts && Array.isArray(artifacts.artifacts.documents)) ? artifacts.artifacts.documents.length : 0,
      },
      recommendations: [
        'Review identified gaps in time recording',
        'Examine collected artifacts for evidence of billable work',
        'Reconstruct time entries using Chronometric Engine if needed',
        'Compare with Clio billing records using compare_with_clio action',
        'Check for duplicates before finalizing entries',
      ],
      next_steps: [
        {
          action: 'compare_with_clio',
          description: 'Compare time entries with Clio billing records',
          requires: ['clio_matter_id'],
        },
        {
          action: 'identify_discrepancies',
          description: 'Identify discrepancies between recorded time and artifacts',
          requires: [],
        },
      ],
    };

    // Ethics check: Ensure report complies with Ten Rules (especially Rule 1: Truth Standard)
    const reportText = JSON.stringify(report, null, 2);
    const ethicsCheck = await checkGeneratedContent(reportText, {
      toolName: 'billing_reconciliation',
      contentType: 'report',
      strictMode: true, // Strict for billing accuracy
    });

    // If blocked, return error
    if (ethicsCheck.ethicsCheck.blocked) {
      return {
        content: [
          {
            type: 'text',
            text: 'Reconciliation report blocked by ethics check. Report does not meet Ten Rules compliance standards.',
          },
        ],
        isError: true,
      };
    }

    // Add ethics metadata if warnings
    const finalReport = {
      ...report,
      ...(ethicsCheck.ethicsCheck.warnings.length > 0 && {
        _ethicsMetadata: {
          reviewed: true,
          warnings: ethicsCheck.ethicsCheck.warnings,
          complianceScore: ethicsCheck.ethicsCheck.complianceScore,
          auditId: ethicsCheck.ethicsCheck.auditId,
        },
      }),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(finalReport, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Compare time entries with Clio billing records
   */
  private async compareWithClio(input: any): Promise<CallToolResult> {
    if (!input.clio_matter_id) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: clio_matter_id is required for Clio comparison',
          },
        ],
        isError: true,
      };
    }

    // Get gaps
    const gapsResult = await this.executeTool('gap_identifier', {
      start_date: input.start_date,
      end_date: input.end_date,
      billing_source: 'both',
      matter_id: input.matter_id,
    });

    // Get Clio time entries
    const clioResult = await this.executeTool('clio_integration', {
      action: 'get_time_entries',
      matter_id: input.clio_matter_id,
      start_date: input.start_date,
      end_date: input.end_date,
    });

    let gaps: any = null;
    if (!gapsResult.isError && gapsResult.content[0]?.type === 'text' && 'text' in gapsResult.content[0]) {
      try {
        gaps = JSON.parse(gapsResult.content[0].text);
      } catch {
        gaps = { error: 'Failed to parse gaps data' };
      }
    }

    let clioEntries: any = null;
    if (!clioResult.isError && clioResult.content[0]?.type === 'text' && 'text' in clioResult.content[0]) {
      try {
        clioEntries = JSON.parse(clioResult.content[0].text);
      } catch {
        clioEntries = { error: 'Failed to parse Clio data' };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            report_type: 'clio_comparison',
            period: { start_date: input.start_date, end_date: input.end_date },
            clio_matter_id: input.clio_matter_id,
            gaps,
            clio_entries: clioEntries,
            discrepancies: this.calculateDiscrepancies(gaps, clioEntries),
          }, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Identify discrepancies between recorded time and artifacts
   */
  private async identifyDiscrepancies(input: any): Promise<CallToolResult> {
    const gapsResult = await this.executeTool('gap_identifier', {
      start_date: input.start_date,
      end_date: input.end_date,
      billing_source: 'both',
      matter_id: input.matter_id,
    });

    const artifactsResult = await this.collectArtifacts(input);

    let gaps: any = null;
    if (!gapsResult.isError && gapsResult.content[0]?.type === 'text' && 'text' in gapsResult.content[0]) {
      try {
        gaps = JSON.parse(gapsResult.content[0].text);
      } catch {
        gaps = { error: 'Failed to parse gaps data' };
      }
    }

    let artifacts: any = null;
    if (!artifactsResult.isError && artifactsResult.content[0]?.type === 'text' && 'text' in artifactsResult.content[0]) {
      try {
        artifacts = JSON.parse(artifactsResult.content[0].text);
      } catch {
        artifacts = { error: 'Failed to parse artifacts data' };
      }
    }

    const discrepancies = this.analyzeDiscrepancies(gaps, artifacts);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            report_type: 'discrepancy_analysis',
            period: { start_date: input.start_date, end_date: input.end_date },
            gaps,
            artifacts,
            discrepancies,
            severity: discrepancies.length > 0 ? 'high' : 'low',
          }, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Collect artifacts (emails, calendar, documents)
   */
  private async collectArtifacts(input: any): Promise<CallToolResult> {
    const artifacts: any = {
      emails: [],
      calendar: [],
      documents: [],
      calls: [],
    };

    const include = input.include_artifacts || ['email', 'calendar', 'documents'];

    // Collect email artifacts
    if (include.includes('email')) {
      const emailTool = this.getTool('email_artifact_collector');
      if (emailTool) {
        const emailResult = await emailTool.execute({
          start_date: input.start_date,
          end_date: input.end_date,
          matter_id: input.matter_id,
        });
        if (!emailResult.isError && emailResult.content[0]?.type === 'text' && 'text' in emailResult.content[0] && emailResult.content[0].text) {
          try {
            const parsed = JSON.parse(emailResult.content[0].text);
            artifacts.emails = parsed.emails || parsed || [];
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    // Collect calendar artifacts
    if (include.includes('calendar')) {
      const calendarTool = this.getTool('calendar_artifact_collector');
      if (calendarTool) {
        const calendarResult = await calendarTool.execute({
          start_date: input.start_date,
          end_date: input.end_date,
        });
        if (!calendarResult.isError && calendarResult.content[0]?.type === 'text' && 'text' in calendarResult.content[0] && calendarResult.content[0].text) {
          try {
            const parsed = JSON.parse(calendarResult.content[0].text);
            artifacts.calendar = parsed.events || parsed || [];
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    // Collect document artifacts
    if (include.includes('documents')) {
      const docTool = this.getTool('document_artifact_collector');
      if (docTool) {
        const docResult = await docTool.execute({
          start_date: input.start_date,
          end_date: input.end_date,
          matter_id: input.matter_id,
        });
        if (!docResult.isError && docResult.content[0]?.type === 'text' && 'text' in docResult.content[0] && docResult.content[0].text) {
          try {
            const parsed = JSON.parse(docResult.content[0].text);
            artifacts.documents = parsed.documents || parsed || [];
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            period: { start_date: input.start_date, end_date: input.end_date },
            artifacts,
            summary: {
              total_emails: artifacts.emails.length,
              total_calendar_events: artifacts.calendar.length,
              total_documents: artifacts.documents.length,
            },
          }, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Calculate discrepancies between gaps and Clio entries
   */
  private calculateDiscrepancies(gaps: any, clioEntries: any): any[] {
    const discrepancies: any[] = [];
    
    if (!gaps || !clioEntries) {
      return discrepancies;
    }

    // Compare gap periods with Clio entries
    const gapPeriods = gaps.gaps || [];
    const clioTimeEntries = clioEntries.time_entries || clioEntries.entries || [];

    // Find gaps that don't have corresponding Clio entries
    for (const gap of gapPeriods) {
      const hasClioEntry = clioTimeEntries.some((entry: any) => {
        const entryDate = new Date(entry.date || entry.created_at);
        const gapStart = new Date(gap.start_date);
        const gapEnd = new Date(gap.end_date);
        return entryDate >= gapStart && entryDate <= gapEnd;
      });

      if (!hasClioEntry) {
        discrepancies.push({
          type: 'missing_clio_entry',
          gap,
          severity: 'high',
          description: `Gap period ${gap.start_date} to ${gap.end_date} has no corresponding Clio entry`,
        });
      }
    }

    return discrepancies;
  }

  /**
   * Analyze discrepancies between gaps and artifacts
   */
  private analyzeDiscrepancies(gaps: any, artifacts: any): any[] {
    const discrepancies: any[] = [];
    
    if (!gaps || !artifacts) {
      return discrepancies;
    }

    const gapPeriods = gaps.gaps || [];
    const artifactCount = (artifacts.artifacts?.emails?.length || 0) + 
                         (artifacts.artifacts?.calendar?.length || 0) + 
                         (artifacts.artifacts?.documents?.length || 0);

    // Find gaps with high artifact activity but no time entries
    for (const gap of gapPeriods) {
      const gapStart = new Date(gap.start_date);
      const gapEnd = new Date(gap.end_date);
      
      // Count artifacts in gap period
      let artifactsInGap = 0;
      if (artifacts.artifacts?.emails) {
        artifactsInGap += artifacts.artifacts.emails.filter((email: any) => {
          const emailDate = new Date(email.date || email.sent_at || email.received_at);
          return emailDate >= gapStart && emailDate <= gapEnd;
        }).length;
      }

      if (artifactsInGap > 5 && gap.hours_missing > 0) {
        discrepancies.push({
          type: 'high_activity_no_time',
          gap,
          artifact_count: artifactsInGap,
          severity: 'high',
          description: `Gap period ${gap.start_date} to ${gap.end_date} has ${artifactsInGap} artifacts but no time entries`,
        });
      }
    }

    return discrepancies;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup any resources, connections, etc.
  }
}

// Export singleton instance
export const billingReconciliationModule = new BillingReconciliationModule();
