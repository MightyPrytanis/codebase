/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const WorkflowManagerSchema = z.object({
  action: z.enum(['execute', 'customize', 'get_config']).default('execute').describe('Action to perform'),
  workflow_type: z.enum(['compare', 'critique', 'collaborate', 'custom']).optional().describe('Type of workflow to manage'),
  case_id: z.string().optional().describe('Case ID for the workflow'),
  documents: z.array(z.string()).optional().describe('Document IDs to process'),
  parameters: z.record(z.any()).optional().describe('Workflow parameters'),
  custom_stages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    agent: z.string(),
    description: z.string(),
    order: z.number(),
  })).optional().describe('Custom workflow stages configuration'),
});

export const workflowManager = new (class extends BaseTool {
  public workflowConfigs: Map<string, any> = new Map();

  getToolDefinition() {
    return {
      name: 'workflow_manager',
      description: 'Manage and execute multi-agent workflows for legal document processing, including workflow customization',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['execute', 'customize', 'get_config'],
            default: 'execute',
            description: 'Action to perform (execute workflow, customize stages, or get configuration)',
          },
          workflow_type: {
            type: 'string',
            enum: ['compare', 'critique', 'collaborate', 'custom'],
            description: 'Type of workflow to manage',
          },
          case_id: {
            type: 'string',
            description: 'Case ID for the workflow',
          },
          documents: {
            type: 'array',
            items: { type: 'string' },
            description: 'Document IDs to process',
          },
          parameters: {
            type: 'object',
            description: 'Workflow parameters',
          },
          custom_stages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                agent: { type: 'string' },
                description: { type: 'string' },
                order: { type: 'number' },
              },
            },
            description: 'Custom workflow stages configuration',
          },
        },
        required: [],
      },
    };
  }

  async execute(args: any) {
    try {
      const { action, workflow_type, case_id, documents, parameters, custom_stages } = WorkflowManagerSchema.parse(args);
      
      switch (action) {
        case 'customize':
          const customized = this.customizeWorkflow(workflow_type || 'custom', custom_stages);
          return this.createSuccessResult(JSON.stringify(customized, null, 2));
        
        case 'get_config':
          const config = this.getWorkflowConfig(workflow_type || 'custom');
          return this.createSuccessResult(JSON.stringify(config, null, 2));
        
        case 'execute':
        default:
          const workflow = this.executeWorkflow(workflow_type || 'custom', case_id, documents, parameters);
          return this.createSuccessResult(JSON.stringify(workflow, null, 2));
      }
    } catch (error) {
      return this.createErrorResult(`Workflow management failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public customizeWorkflow(workflowType: string, stages?: any[]): any {
    if (!stages || stages.length === 0) {
      return { error: 'No stages provided for customization' };
    }

    // Sort stages by order
    const sortedStages = stages.sort((a, b) => a.order - b.order);

    // Store the configuration
    this.workflowConfigs.set(workflowType, {
      type: workflowType,
      stages: sortedStages,
      customized_at: new Date().toISOString(),
    });

    return {
      workflow_type: workflowType,
      status: 'customized',
      stages: sortedStages,
      message: `Workflow customized with ${stages.length} stages`,
    };
  }

  public getWorkflowConfig(workflowType: string): any {
    const config = this.workflowConfigs.get(workflowType);
    if (config) {
      return config;
    }

    // Return default configuration
    return {
      type: workflowType,
      stages: this.getWorkflowSteps(workflowType),
      is_default: true,
    };
  }

  public executeWorkflow(type: string, caseId?: string, documents?: string[], parameters?: any) {
    return {
      metadata: {
        workflow_type: type,
        case_id: caseId || 'not specified',
        timestamp: new Date().toISOString(),
        documents_count: documents?.length || 0,
      },
      workflow_status: 'executing',
      steps: this.getWorkflowSteps(type),
      progress: 0,
      estimated_completion: this.estimateCompletion(type),
    };
  }

  public getWorkflowSteps(type: string): any[] {
    const stepTemplates: Record<string, any[]> = {
      compare: [
        { step: 1, agent: 'document_analyzer', description: 'Analyze documents' },
        { step: 2, agent: 'contract_comparator', description: 'Compare contract/agreement elements' },
        { step: 3, agent: 'fact_checker', description: 'Verify facts' },
      ],
      critique: [
        { step: 1, agent: 'document_analyzer', description: 'Analyze document' },
        { step: 2, agent: 'legal_reviewer', description: 'Review legal compliance' },
        { step: 3, agent: 'quality_assessor', description: 'Assess quality' },
      ],
      collaborate: [
        { step: 1, agent: 'document_analyzer', description: 'Initial analysis' },
        { step: 2, agent: 'legal_reviewer', description: 'Legal review' },
        { step: 3, agent: 'compliance_checker', description: 'Compliance check' },
        { step: 4, agent: 'quality_assessor', description: 'Final assessment' },
      ],
      // C-Suite Workflows
      'csuite-case-overview': [
        { step: 1, tool: 'case_data_collector', description: 'Collect case data' },
        { step: 2, agent: 'risk_analyst', description: 'Risk analysis' },
        { step: 3, tool: 'financial_aggregator', description: 'Financial summary' },
        { step: 4, tool: 'executive_dashboard_generator', description: 'Executive dashboard' },
      ],
      'csuite-portfolio-analysis': [
        { step: 1, tool: 'portfolio_collector', description: 'Portfolio collection' },
        { step: 2, agent: 'trend_analyst', description: 'Trend analysis' },
        { step: 3, agent: 'resource_optimizer', description: 'Resource allocation analysis' },
        { step: 4, agent: 'strategic_advisor', description: 'Strategic recommendations' },
      ],
      'csuite-client-relationship': [
        { step: 1, tool: 'client_data_aggregator', description: 'Client data aggregation' },
        { step: 2, agent: 'relationship_analyst', description: 'Relationship analysis' },
        { step: 3, agent: 'retention_advisor', description: 'Retention strategy' },
        { step: 4, tool: 'briefing_generator', description: 'Executive briefing' },
      ],
      // Document Review Workflows
      'document-review-standard': [
        { step: 1, tool: 'document_processor', description: 'Document ingestion' },
        { step: 2, agent: 'document_analyzer', description: 'Initial analysis' },
        { step: 3, agent: 'red_flag_finder', description: 'Red flag detection' },
        { step: 4, agent: 'legal_reviewer', description: 'Legal review' },
        { step: 5, agent: 'summary_generator', description: 'Summary generation' },
      ],
      'contract-analysis': [
        { step: 1, tool: 'contract_parser', description: 'Contract parsing' },
        { step: 2, agent: 'contract_analyzer', description: 'Clause analysis' },
        { step: 3, agent: 'term_extractor', description: 'Term extraction' },
        { step: 4, agent: 'benchmark_comparator', description: 'Benchmark comparison' },
        { step: 5, agent: 'risk_assessor', description: 'Risk assessment' },
      ],
      // Litigation Workflows
      'motion-drafting': [
        { step: 1, tool: 'case_context_collector', description: 'Gather case context' },
        { step: 2, agent: 'legal_researcher', description: 'Legal research' },
        { step: 3, agent: 'motion_drafter', description: 'Draft motion' },
        { step: 4, agent: 'citation_checker', description: 'Citation verification' },
        { step: 5, agent: 'quality_checker', description: 'Quality review' },
        { step: 6, type: 'approval', description: 'Attorney review', requiresApproval: true },
      ],
      'discovery-management': [
        { step: 1, tool: 'discovery_processor', description: 'Discovery intake' },
        { step: 2, agent: 'document_identifier', description: 'Document identification' },
        { step: 3, agent: 'privilege_reviewer', description: 'Privilege review' },
        { step: 4, agent: 'response_drafter', description: 'Response drafting' },
        { step: 5, tool: 'deadline_tracker', description: 'Deadline tracking' },
      ],
      // Transactional Workflows
      'due-diligence': [
        { step: 1, tool: 'document_collector', description: 'Document collection' },
        { step: 2, agent: 'document_reviewer', description: 'Document review' },
        { step: 3, agent: 'issue_finder', description: 'Issue identification' },
        { step: 4, agent: 'risk_assessor', description: 'Risk assessment' },
        { step: 5, agent: 'report_generator', description: 'Due diligence report' },
      ],
      // Compliance Workflows
      'compliance-check': [
        { step: 1, agent: 'document_analyzer', description: 'Document analysis' },
        { step: 2, agent: 'compliance_checker', description: 'Regulation check' },
        { step: 3, agent: 'violation_detector', description: 'Violation detection' },
        { step: 4, agent: 'remediation_advisor', description: 'Remediation recommendations' },
      ],
      // Client Intake Workflows
      'client-intake': [
        { step: 1, tool: 'intake_processor', description: 'Intake form processing' },
        { step: 2, agent: 'conflict_checker', description: 'Conflict check' },
        { step: 3, tool: 'matter_creator', description: 'Matter setup' },
        { step: 4, agent: 'case_assessor', description: 'Initial assessment' },
        { step: 5, agent: 'document_generator', description: 'Engagement letter generation' },
      ],
      // Research Workflows
      'legal-research': [
        { step: 1, agent: 'query_analyzer', description: 'Research query analysis' },
        { step: 2, agent: 'case_researcher', description: 'Case law research' },
        { step: 3, agent: 'statute_researcher', description: 'Statute research' },
        { step: 4, agent: 'secondary_researcher', description: 'Secondary sources' },
        { step: 5, agent: 'memo_generator', description: 'Research memo generation' },
      ],
      // Drafting Workflows
      'document-drafting': [
        { step: 1, tool: 'template_selector', description: 'Template selection' },
        { step: 2, agent: 'draft_generator', description: 'Content generation' },
        { step: 3, agent: 'legal_reviewer', description: 'Legal review' },
        { step: 4, tool: 'document_formatter', description: 'Formatting' },
        { step: 5, agent: 'quality_checker', description: 'Quality check' },
      ],
      custom: [
        { step: 1, agent: 'ai_orchestrator', description: 'Custom workflow execution' },
      ],
    };

    return stepTemplates[type] || stepTemplates.custom;
  }

  public estimateCompletion(type: string): string {
    const estimates: Record<string, string> = {
      compare: '5-10 minutes',
      critique: '3-7 minutes',
      collaborate: '10-15 minutes',
      'csuite-case-overview': '3-5 minutes',
      'csuite-portfolio-analysis': '10-15 minutes',
      'csuite-client-relationship': '5-8 minutes',
      'document-review-standard': '5-10 minutes',
      'contract-analysis': '8-12 minutes',
      'motion-drafting': '15-25 minutes',
      'discovery-management': '10-15 minutes',
      'due-diligence': '20-30 minutes',
      'compliance-check': '5-8 minutes',
      'client-intake': '8-12 minutes',
      'legal-research': '15-20 minutes',
      'document-drafting': '10-15 minutes',
      custom: '5-20 minutes',
    };

    return estimates[type] || '5-10 minutes';
  }
})();

