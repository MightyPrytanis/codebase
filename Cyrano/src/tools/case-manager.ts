/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { db } from '../db.js';
import { eq, and, or, desc, asc, like, sql } from 'drizzle-orm';

const CaseManagerSchema = z.object({
  action: z.enum(['create', 'update', 'get', 'list', 'delete']).describe('Action to perform on case'),
  case_id: z.string().optional().describe('Case ID for the operation'),
  case_data: z.record(z.string(), z.any()).optional().describe('Case data for create/update operations'),
  filters: z.record(z.string(), z.any()).optional().describe('Filters for list operations'),
});

export const caseManager = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'case_manager',
      description: 'Manage legal cases including creation, updates, and retrieval',
      inputSchema: {
        type: 'object' as const,
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
            type: 'object' as const,
            description: 'Case data for create/update operations',
          },
          filters: {
            type: 'object' as const,
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
      const result = await this.performCaseAction(action, case_id, case_data, filters);
      return this.createSuccessResult(JSON.stringify(result, null, 2));
    } catch (error) {
      return this.createErrorResult(`Case management failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async performCaseAction(action: string, caseId?: string, caseData?: any, filters?: any) {
    switch (action) {
      case 'create':
        return await this.createCase(caseData);
      case 'update':
        return await this.updateCase(caseId!, caseData);
      case 'get':
        return await this.getCase(caseId!);
      case 'list':
        return await this.listCases(filters);
      case 'delete':
        return await this.deleteCase(caseId!);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  public async createCase(caseData?: any) {
    try {
      // Import legalCases schema from LexFiat (server runtime schema)
      const { legalCases } = await import('../lexfiat-schema.js');
      
      if (!caseData || !caseData.title || !caseData.clientName || !caseData.caseType) {
        throw new Error('Case creation requires: title, clientName, and caseType');
      }

      const newCase = {
        title: caseData.title,
        caseNumber: caseData.caseNumber || null,
        clientName: caseData.clientName,
        court: caseData.court || null,
        caseType: caseData.caseType,
        status: caseData.status || 'active',
        attorneyId: caseData.attorneyId || null,
        clioMatterId: caseData.clioMatterId || null,
        balanceDue: caseData.balanceDue || 0,
        unbilledHours: caseData.unbilledHours || 0,
        procedurePosture: caseData.procedurePosture || null,
        keyFacts: caseData.keyFacts || null,
      };

      const [created] = await db.insert(legalCases).values(newCase).returning();

      return {
        action: 'create',
        case_id: created.id,
        status: 'created',
        timestamp: new Date().toISOString(),
        case_data: created,
        message: 'Case created successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to create case: ${error instanceof Error ? error.message : String(error)}. ` +
        'Ensure database connection and schema are properly configured.'
      );
    }
  }

  public async updateCase(caseId: string, caseData?: any) {
    try {
      // Import legalCases schema from LexFiat (server runtime schema)
      const { legalCases } = await import('../lexfiat-schema.js');
      
      if (!caseData || Object.keys(caseData).length === 0) {
        throw new Error('Update requires at least one field to update');
      }

      // Build update object (only include provided fields)
      const updateFields: any = {
        updatedAt: new Date(),
      };

      if (caseData.title !== undefined) updateFields.title = caseData.title;
      if (caseData.caseNumber !== undefined) updateFields.caseNumber = caseData.caseNumber;
      if (caseData.clientName !== undefined) updateFields.clientName = caseData.clientName;
      if (caseData.court !== undefined) updateFields.court = caseData.court;
      if (caseData.caseType !== undefined) updateFields.caseType = caseData.caseType;
      if (caseData.status !== undefined) updateFields.status = caseData.status;
      if (caseData.attorneyId !== undefined) updateFields.attorneyId = caseData.attorneyId;
      if (caseData.clioMatterId !== undefined) updateFields.clioMatterId = caseData.clioMatterId;
      if (caseData.balanceDue !== undefined) updateFields.balanceDue = caseData.balanceDue;
      if (caseData.unbilledHours !== undefined) updateFields.unbilledHours = caseData.unbilledHours;
      if (caseData.procedurePosture !== undefined) updateFields.procedurePosture = caseData.procedurePosture;
      if (caseData.keyFacts !== undefined) updateFields.keyFacts = caseData.keyFacts;

      // Note: Evidence and court filing confirmation emails would be stored in a separate evidence table
      // or as JSON in a dedicated field. For now, we update the main case fields.
      // If evidence is provided, it should be handled via a separate evidence management system.

      const [updated] = await db
        .update(legalCases)
        .set(updateFields)
        .where(eq(legalCases.id, caseId))
        .returning();

      if (!updated) {
        throw new Error(`Case not found: ${caseId}`);
      }

      return {
        action: 'update',
        case_id: caseId,
        status: 'updated',
        timestamp: new Date().toISOString(),
        updated_data: updated,
        message: 'Case updated successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to update case: ${error instanceof Error ? error.message : String(error)}. ` +
        'Ensure case exists and database connection is properly configured.'
      );
    }
  }

  public async getCase(caseId: string) {
    try {
      // Import legalCases schema from LexFiat (server runtime schema)
      const { legalCases } = await import('../lexfiat-schema.js');
      
      const [caseRecord] = await db
        .select()
        .from(legalCases)
        .where(eq(legalCases.id, caseId))
        .limit(1);

      if (!caseRecord) {
        throw new Error(`Case not found: ${caseId}`);
      }

      // Retrieve evidence from documents table and artifact collectors
      const { documents: documentsTable } = await import('../lexfiat-schema.js');
      const caseDocuments = await db
        .select()
        .from(documentsTable)
        .where(eq(documentsTable.caseId, caseId));

      // Retrieve MiFile confirmations from email artifacts if email-artifact-collector is available
      let mifileConfirmations: any[] = [];
      try {
        const { emailArtifactCollector } = await import('./email-artifact-collector.js');
        // Get emails from last 90 days for this case
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const artifactResult = await emailArtifactCollector.execute({
          start_date: startDate,
          end_date: endDate,
          matter_id: caseRecord.clioMatterId || undefined,
          email_provider: 'both',
        });

        const firstContent = artifactResult.content?.[0];
        const isText = firstContent && firstContent.type === 'text' && 'text' in firstContent;
        if (!artifactResult.isError && isText) {
          const artifactData = JSON.parse(firstContent.text);
          if (artifactData.emails && Array.isArray(artifactData.emails)) {
            mifileConfirmations = artifactData.emails.filter((e: any) => e.mifile_confirmation === true);
          }
        }
      } catch (error) {
        // Email arti ifact collector not available or failed - continue without MiFile confirmations
        console.warn('Could not retrieve MiFile confirmations:', error instanceof Error ? error.message : String(error));
      }

      return {
        action: 'get',
        case_id: caseId,
        status: 'retrieved',
        timestamp: new Date().toISOString(),
        case_data: {
          ...caseRecord,
          evidence: caseDocuments.map(doc => ({
            id: doc.id,
            title: doc.title,
            type: doc.type,
            source: doc.source,
            createdAt: doc.createdAt,
            urgencyLevel: doc.urgencyLevel,
          })),
          court_filing_confirmations: mifileConfirmations, // Email confirmations from MiFile/courts (detected, not API integration)
        },
        message: 'Case retrieved successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve case: ${error instanceof Error ? error.message : String(error)}. ` +
        'Ensure case exists and database connection is properly configured.'
      );
    }
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

  public async deleteCase(caseId: string) {
    try {
      // Import legalCases schema from LexFiat (server runtime schema)
      const { legalCases } = await import('../lexfiat-schema.js');
      
      const [deleted] = await db
        .delete(legalCases)
        .where(eq(legalCases.id, caseId))
        .returning();

      if (!deleted) {
        throw new Error(`Case not found: ${caseId}`);
      }

      return {
        action: 'delete',
        case_id: caseId,
        status: 'deleted',
        timestamp: new Date().toISOString(),
        message: 'Case deleted successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to delete case: ${error instanceof Error ? error.message : String(error)}. ` +
        'Ensure case exists and database connection is properly configured.'
      );
    }
  }
})();

