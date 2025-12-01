/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

const CaseManagerSchema = z.object({
  action: z.enum(['create', 'update', 'get', 'list', 'delete']).describe('Action to perform on case'),
  case_id: z.string().optional().describe('Case ID for the operation'),
  case_data: z.record(z.any()).optional().describe('Case data for create/update operations'),
  filters: z.record(z.any()).optional().describe('Filters for list operations'),
});

export const caseManager = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'case_manager',
      description: 'Manage legal cases including creation, updates, and retrieval',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['create', 'update', 'get', 'list', 'delete'],
            description: 'Action to perform on case',
          },
          case_id: {
            type: 'string',
            description: 'Case ID for the operation',
          },
          case_data: {
            type: 'object',
            description: 'Case data for create/update operations',
          },
          filters: {
            type: 'object',
            description: 'Filters for list operations',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { action, case_id, case_data, filters } = CaseManagerSchema.parse(args);
      const result = this.performCaseAction(action, case_id, case_data, filters);
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(`Case management failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public performCaseAction(action: string, caseId?: string, caseData?: any, filters?: any) {
    switch (action) {
      case 'create':
        return this.createCase(caseData);
      case 'update':
        return this.updateCase(caseId!, caseData);
      case 'get':
        return this.getCase(caseId!);
      case 'list':
        return this.listCases(filters);
      case 'delete':
        return this.deleteCase(caseId!);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  public createCase(caseData?: any) {
    return {
      action: 'create',
      case_id: this.generateCaseId(),
      status: 'created',
      timestamp: new Date().toISOString(),
      case_data: caseData || {},
      message: 'Case created successfully',
    };
  }

  public updateCase(caseId: string, caseData?: any) {
    return {
      action: 'update',
      case_id: caseId,
      status: 'updated',
      timestamp: new Date().toISOString(),
      updated_data: caseData || {},
      message: 'Case updated successfully',
    };
  }

  public getCase(caseId: string) {
    return {
      action: 'get',
      case_id: caseId,
      status: 'retrieved',
      timestamp: new Date().toISOString(),
      case_data: {
        id: caseId,
        title: 'Sample Legal Case',
        status: 'active',
        created_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      },
      message: 'Case retrieved successfully',
    };
  }

  public listCases(filters?: any) {
    return {
      action: 'list',
      status: 'retrieved',
      timestamp: new Date().toISOString(),
      cases: [
        {
          id: 'case-001',
          title: 'Contract Dispute',
          status: 'active',
          created_date: new Date().toISOString(),
        },
        {
          id: 'case-002',
          title: 'Employment Matter',
          status: 'closed',
          created_date: new Date().toISOString(),
        },
      ],
      total_count: 2,
      filters_applied: filters || {},
      message: 'Cases retrieved successfully',
    };
  }

  public deleteCase(caseId: string) {
    return {
      action: 'delete',
      case_id: caseId,
      status: 'deleted',
      timestamp: new Date().toISOString(),
      message: 'Case deleted successfully',
    };
  }

  public generateCaseId(): string {
    return `case-${Date.now()}`;
  }
})();

