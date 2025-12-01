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
      custom: '5-20 minutes',
    };

    return estimates[type] || '5-10 minutes';
  }
})();

