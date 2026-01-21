/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { isDemoModeEnabled, getDemoModeWarning, markAsDemo } from '../utils/demo-mode.js';

const ClioIntegrationSchema = z.object({
  action: z.enum([
    'get_item_tracking',
    'get_matter_info', 
    'get_workflow_status',
    'get_client_info',
    'get_document_info',
    'get_calendar_events',
    'search_matters',
    'get_red_flags',
    'get_tasks',
    'get_contacts',
    'get_case_status',
    'search_documents'
  ]).describe('Action to perform'),
  item_id: z.string().optional().describe('Item ID for tracking'),
  matter_id: z.string().optional().describe('Matter ID'),
  client_id: z.string().optional().describe('Client ID'),
  document_id: z.string().optional().describe('Document ID'),
  parameters: z.record(z.string(), z.any()).optional().describe('Additional parameters'),
});

export const clioIntegration: BaseTool = new (class extends BaseTool {
  public clioApiKey: string;
  public clioBaseUrl: string = 'https://app.clio.com/api/v4';

  constructor() {
    super();
    this.clioApiKey = process.env.CLIO_API_KEY || '';
    // Note: Clio API key not available until approval from Clio developers program
    // When not available, integration returns errors or N/A status
    // Demo mode is opt-in only via DEMO_MODE=true
  }

  /**
   * Get error message for missing Clio API key
   */
  private getClioApiKeyError(): string {
    return 'Clio API key not configured. CLIO_API_KEY environment variable required. ' +
      'Clio API access pending approval from Clio developers program. ' +
      'Set DEMO_MODE=true to enable demo mode with simulated data.';
  }

  getToolDefinition() {
    return {
      name: 'clio_integration',
      description: 'Integration with Clio practice management software for matter tracking, client info, and workflow status. ' +
        'Requires CLIO_API_KEY environment variable. Returns errors when not configured. ' +
        'Demo mode available via DEMO_MODE=true (opt-in only, clearly marked in responses).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: [
              'get_item_tracking',
              'get_matter_info',
              'get_workflow_status', 
              'get_client_info',
              'get_document_info',
              'get_calendar_events',
              'search_matters',
              'get_red_flags',
              'get_tasks',
              'get_contacts',
              'get_case_status',
              'search_documents'
            ],
            description: 'Action to perform with Clio',
          },
          item_id: {
            type: 'string',
            description: 'Item ID for tracking',
          },
          matter_id: {
            type: 'string', 
            description: 'Matter ID',
          },
          client_id: {
            type: 'string',
            description: 'Client ID',
          },
          document_id: {
            type: 'string',
            description: 'Document ID',
          },
          parameters: {
            type: 'object' as const,
            description: 'Additional parameters',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { action, item_id, matter_id, client_id, document_id, parameters } = ClioIntegrationSchema.parse(args);

      switch (action) {
        case 'get_item_tracking':
          if (!item_id) throw new Error('item_id is required for get_item_tracking');
          return await this.getItemTracking(item_id);
        case 'get_matter_info':
          if (!matter_id) throw new Error('matter_id is required for get_matter_info');
          return await this.getMatterInfo(matter_id);
        case 'get_workflow_status':
          if (!item_id) throw new Error('item_id is required for get_workflow_status');
          return await this.getWorkflowStatus(item_id);
        case 'get_client_info':
          if (!client_id) throw new Error('client_id is required for get_client_info');
          return await this.getClientInfo(client_id);
        case 'get_document_info':
          if (!document_id) throw new Error('document_id is required for get_document_info');
          return await this.getDocumentInfo(document_id);
        case 'get_calendar_events':
          return await this.getCalendarEvents(parameters);
        case 'search_matters':
          return await this.searchMatters(parameters);
        case 'get_red_flags':
          return await this.getRedFlags(parameters);
        case 'get_tasks':
          return await this.getTasks(parameters);
        case 'get_contacts':
          return await this.getContacts(parameters);
        case 'get_case_status':
          if (!matter_id) throw new Error('matter_id is required for get_case_status');
          return await this.getCaseStatus(matter_id);
        case 'search_documents':
          return await this.searchDocuments(parameters);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      return this.createErrorResult(`Clio integration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getItemTracking(itemId: string) {
    // Demo mode is opt-in only
    if (isDemoModeEnabled()) {
      return this.getDemoItemTracking(itemId);
    }
    
    if (!this.clioApiKey) {
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      // Real Clio API call using ClioAPIService
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      // Use ClioAPIService to get matter info
      const matterData = await clioService.getMatter(parseInt(itemId, 10));
      const formatted = this.formatTrackingData(matterData.data);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  public async getMatterInfo(matterId: string) {
    if (isDemoModeEnabled()) {
      return this.getDemoMatterInfo(matterId);
    }
    
    if (!this.clioApiKey) {
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      const matterData = await clioService.getMatter(parseInt(matterId, 10));
      const formatted = this.formatMatterInfo(matterData.data);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  public async getWorkflowStatus(itemId: string) {
    if (isDemoModeEnabled()) {
      return this.getDemoWorkflowStatus(itemId);
    }
    
    if (!this.clioApiKey) {
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      // Use Clio's activities endpoint to determine workflow status
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      const activities = await clioService.listActivities({
        matter_id: parseInt(itemId, 10),
        limit: 10,
      });
      
      const formatted = this.formatWorkflowStatus(activities);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  public async getClientInfo(clientId: string) {
    if (!this.clioApiKey) {
      if (isDemoModeEnabled()) {
        return this.getDemoClientInfo(clientId);
      }
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      const contacts = await clioService.listContacts({
        query: clientId,
        limit: 1,
      });
      
      if (contacts.data.length === 0) {
        return this.createErrorResult(`Client not found: ${clientId}`);
      }
      
      const formatted = this.formatClientInfo(contacts.data[0]);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  public async getDocumentInfo(documentId: string) {
    if (isDemoModeEnabled()) {
      return this.getDemoDocumentInfo(documentId);
    }
    
    if (!this.clioApiKey) {
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      const documents = await clioService.listDocuments({
        query: documentId,
        limit: 1,
      });
      
      if (documents.data.length === 0) {
        return this.createErrorResult(`Document not found: ${documentId}`);
      }
      
      const formatted = this.formatDocumentInfo(documents.data[0]);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  public async getCalendarEvents(parameters: any) {
    if (!this.clioApiKey) {
      if (isDemoModeEnabled()) {
        return this.getDemoCalendarEvents();
      }
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      // Note: Clio API v4 may not have direct calendar_entries endpoint
      // This may need to use activities or a different endpoint
      // For now, return error indicating this needs Clio API documentation
      return this.createErrorResult(
        'Calendar events endpoint requires Clio API v4 documentation. ' +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  public async searchMatters(parameters: any) {
    if (isDemoModeEnabled()) {
      return this.getDemoMatters();
    }
    
    if (!this.clioApiKey) {
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      const matters = await clioService.listMatters({
        status: parameters?.status,
        query: parameters?.query,
        limit: parameters?.limit || 20,
        fields: parameters?.fields,
        cursor: parameters?.cursor,
      });
      
      const formatted = this.formatMatters(matters);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  public async getRedFlags(parameters: any) {
    if (!this.clioApiKey) {
      if (isDemoModeEnabled()) {
        return this.getDemoRedFlags();
      }
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      // Search for urgent activities/tasks
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      // Get tasks with pending status and due soon
      const tasks = await clioService.listTasks({
        status: 'pending',
        limit: 50,
      });
      
      const formatted = this.formatRedFlags(tasks);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  /**
   * Get tasks from Clio
   */
  public async getTasks(parameters: any) {
    if (isDemoModeEnabled()) {
      return this.getDemoTasks();
    }
    
    if (!this.clioApiKey) {
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      const tasks = await clioService.listTasks({
        matter_id: parameters?.matter_id ? parseInt(parameters.matter_id, 10) : undefined,
        status: parameters?.status,
        limit: parameters?.limit || 20,
        cursor: parameters?.cursor,
      });
      
      const formatted = this.formatTasks(tasks);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  /**
   * Get contacts from Clio
   */
  public async getContacts(parameters: any) {
    if (!this.clioApiKey) {
      if (isDemoModeEnabled()) {
        return this.getDemoContacts();
      }
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      const contacts = await clioService.listContacts({
        type: parameters?.type,
        query: parameters?.query,
        limit: parameters?.limit || 20,
        cursor: parameters?.cursor,
      });
      
      const formatted = this.formatContacts(contacts);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  /**
   * Get case status (enhanced matter status)
   */
  public async getCaseStatus(matterId: string) {
    if (isDemoModeEnabled()) {
      return this.getDemoCaseStatus(matterId);
    }
    
    if (!this.clioApiKey) {
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      const matterData = await clioService.getMatter(parseInt(matterId, 10));
      const formatted = this.formatCaseStatus(matterData.data);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  /**
   * Search documents in Clio
   */
  public async searchDocuments(parameters: any) {
    if (isDemoModeEnabled()) {
      return this.getDemoDocuments();
    }
    
    if (!this.clioApiKey) {
      return this.createErrorResult(this.getClioApiKeyError());
    }

    try {
      const { ClioAPIService } = await import('../services/clio-api.js');
      const clioService = new ClioAPIService({
        apiKey: this.clioApiKey,
        region: (process.env.CLIO_REGION as any) || 'US',
      });
      
      const documents = await clioService.listDocuments({
        matter_id: parameters?.matter_id ? parseInt(parameters.matter_id, 10) : undefined,
        query: parameters?.query,
        limit: parameters?.limit || 20,
        cursor: parameters?.cursor,
      });
      
      const formatted = this.formatDocuments(documents);
      return this.createSuccessResult(JSON.stringify(formatted, null, 2));
    } catch (error) {
      return this.createErrorResult(
        `Clio API error: ${error instanceof Error ? error.message : String(error)}. ` +
        'Set DEMO_MODE=true to enable demo mode with simulated data.'
      );
    }
  }

  // Demo data methods - ONLY used when DEMO_MODE=true (opt-in)
  // These provide simulated data for demonstration/onboarding purposes only
  public getDemoItemTracking(itemId: string) {
    const baseData = {
      id: itemId,
      type: 'Emergency Motion',
      name: 'Motion for Temporary Restraining Order - Smith v. Jones',
      client: 'Smith, John',
      matter: 'Smith v. Jones - Contract Dispute',
      status: 'In Review',
      current_stage: 'Attorney Review',
      next_due: '2025-01-15T17:00:00Z',
      priority: 'Critical',
      workflow_progress: [
        { stage: 'AI Analysis', status: 'completed', timestamp: '2025-01-14T10:00:00Z' },
        { stage: 'Draft Preparation', status: 'completed', timestamp: '2025-01-14T14:30:00Z' },
        { stage: 'Attorney Review', status: 'in_progress', timestamp: '2025-01-14T16:00:00Z' },
        { stage: 'Final Review', status: 'pending', timestamp: null },
        { stage: 'File and Serve', status: 'pending', timestamp: null }
      ],
      last_activity: '2025-01-14T16:00:00Z',
      assigned_to: 'Mekel S. Miller',
      notes: 'Urgent motion requiring immediate attention. Client facing potential irreparable harm.',
      next_action: 'File motion with court',
      urgency: 'high'
    };
    const mockData = markAsDemo(baseData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(mockData, null, 2));
  }

  public getDemoMatterInfo(matterId: string) {
    const mockData = {
      id: matterId,
      name: 'Smith v. Jones - Contract Dispute',
      client: 'Smith, John',
      status: 'Active',
      open_date: '2024-12-01T00:00:00Z',
      practice_area: 'Commercial Litigation',
      billing_rate: 350,
      description: 'Breach of contract dispute involving software licensing agreement'
    };
    const markedData = markAsDemo({ ...mockData }, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(markedData, null, 2));
  }

  public getDemoWorkflowStatus(itemId: string) {
    const demoData = {
      item_id: itemId,
      current_stage: 'Attorney Review',
      progress_percentage: 60,
      estimated_completion: '2025-01-15T17:00:00Z',
      blockers: [],
      next_actions: ['Review AI-generated draft', 'Add case law citations', 'Prepare for filing']
    };
    const markedData = markAsDemo(demoData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(markedData, null, 2));
  }

  public getDemoClientInfo(clientId: string) {
    const demoData = {
      id: clientId,
      name: 'Smith, John',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Anytown, ST 12345',
      matter_count: 3,
      total_billed: 15750.00
    };
    const markedData = markAsDemo(demoData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(markedData, null, 2));
  }

  public getDemoDocumentInfo(documentId: string) {
    const baseData = {
      id: documentId,
      name: 'Motion for TRO - Smith v Jones.pdf',
      matter_id: 'matter_123',
      created_date: '2025-01-14T10:00:00Z',
      modified_date: '2025-01-14T16:00:00Z',
      file_size: '2.3 MB',
      document_type: 'Motion',
      status: 'Draft'
    };
    const demoData = markAsDemo(baseData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(demoData, null, 2));
  }

  public getDemoCalendarEvents() {
    const demoData = {
      events: [
        {
          id: 'cal_001',
          title: 'Court Hearing - Smith v. Jones',
          date: '2025-01-20T10:00:00Z',
          duration: 120,
          matter_id: 'matter_123',
          location: 'Circuit Court Room 3A'
        }
      ]
    };
    const markedData = markAsDemo(demoData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(markedData, null, 2));
  }

  public getDemoMatters() {
    const baseData = {
      matters: [
        {
          id: 'matter_123',
          name: 'Smith v. Jones - Contract Dispute',
          client: 'Smith, John',
          status: 'Active',
          open_date: '2024-12-01T00:00:00Z'
        }
      ]
    };
    const demoData = markAsDemo(baseData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(demoData, null, 2));
  }

  public getDemoRedFlags() {
    const demoData = {
      red_flags: [
        {
          id: 'rf_001',
          type: 'Emergency Motion',
          description: 'Motion for TRO - Response Due in 24 Hours',
          matter: 'Smith v. Jones',
          client: 'Smith, John',
          due_date: '2025-01-15T17:00:00Z',
          priority: 'Critical'
        }
      ]
    };
    const markedData = markAsDemo(demoData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(markedData, null, 2));
  }

  // Demo data methods for new actions
  public getDemoTasks() {
    const baseData = {
      tasks: [
        {
          id: 'task_001',
          title: 'Review motion draft',
          matter_id: 'matter_123',
          due_date: '2025-01-16T17:00:00Z',
          status: 'pending',
          priority: 'high',
          assigned_to: 'Attorney Name'
        }
      ]
    };
    const demoData = markAsDemo(baseData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(demoData, null, 2));
  }

  public getDemoContacts() {
    const demoData = {
      contacts: [
        {
          id: 'contact_001',
          name: 'Smith, John',
          email: 'john.smith@email.com',
          phone: '(555) 123-4567',
          type: 'client',
          matter_count: 3
        }
      ]
    };
    const markedData = markAsDemo(demoData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(markedData, null, 2));
  }

  public getDemoCaseStatus(matterId: string) {
    const baseData = {
      matter_id: matterId,
      status: 'Active',
      last_activity: '2025-01-14T16:00:00Z',
      open_tasks: 2,
      pending_documents: 1,
      next_hearing: '2025-01-20T10:00:00Z',
      billing_status: 'current'
    };
    const demoData = markAsDemo(baseData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(demoData, null, 2));
  }

  public getDemoDocuments() {
    const baseData = {
      documents: [
        {
          id: 'doc_001',
          name: 'Motion for TRO.pdf',
          matter_id: 'matter_123',
          document_type: 'Motion',
          created_date: '2025-01-14T10:00:00Z',
          status: 'Draft'
        }
      ]
    };
    const demoData = markAsDemo(baseData, 'Clio Integration');
    return this.createSuccessResult(JSON.stringify(demoData, null, 2));
  }

  // Data formatting methods
  public formatTrackingData(data: any) {
    return {
      id: data.id,
      type: data.type || 'Legal Matter',
      name: data.display_name || data.name,
      client: data.client?.name || 'Unknown Client',
      matter: data.display_name || data.name,
      status: data.status || 'Active',
      current_stage: this.determineCurrentStage(data),
      next_due: data.due_date || data.next_due,
      priority: this.determinePriority(data),
      workflow_progress: this.formatWorkflowProgress(data),
      last_activity: data.updated_at || data.created_at,
      assigned_to: data.assigned_to || 'Unassigned',
      notes: data.description || data.notes || ''
    };
  }

  public formatMatterInfo(data: any) {
    return {
      id: data.id,
      name: data.display_name || data.name,
      client: data.client?.name || 'Unknown Client',
      status: data.status || 'Active',
      open_date: data.created_at,
      practice_area: data.practice_area || 'General Practice',
      billing_rate: data.billing_rate || 0,
      description: data.description || ''
    };
  }

  public formatWorkflowStatus(data: any) {
    return {
      item_id: data.matter_id || data.id,
      current_stage: this.determineCurrentStage(data),
      progress_percentage: this.calculateProgress(data),
      estimated_completion: data.due_date || data.estimated_completion,
      blockers: data.blockers || [],
      next_actions: this.generateNextActions(data)
    };
  }

  public formatClientInfo(data: any) {
    return {
      id: data.id,
      name: data.name || `${data.first_name} ${data.last_name}`,
      email: data.email,
      phone: data.phone,
      address: this.formatAddress(data),
      matter_count: data.matter_count || 0,
      total_billed: data.total_billed || 0
    };
  }

  public formatDocumentInfo(data: any) {
    return {
      id: data.id,
      name: data.name || data.filename,
      matter_id: data.matter_id,
      created_date: data.created_at,
      modified_date: data.updated_at,
      file_size: data.file_size,
      document_type: data.document_type || 'Document',
      status: data.status || 'Active'
    };
  }

  public formatCalendarEvents(data: any) {
    return {
      events: data.data?.map((event: any) => ({
        id: event.id,
        title: event.title,
        date: event.start,
        duration: this.calculateDuration(event.start, event.end),
        matter_id: event.matter_id,
        location: event.location
      })) || []
    };
  }

  public formatMatters(data: any) {
    return {
      matters: data.data?.map((matter: any) => ({
        id: matter.id,
        name: matter.display_name || matter.name,
        client: matter.client?.name || 'Unknown Client',
        status: matter.status,
        open_date: matter.created_at
      })) || []
    };
  }

  public formatRedFlags(data: any) {
    return {
      red_flags: data.data?.map((item: any) => ({
        id: item.id,
        type: item.type || 'Activity',
        description: item.description || item.title,
        matter: item.matter?.display_name || 'Unknown Matter',
        client: item.matter?.client?.name || 'Unknown Client',
        due_date: item.due_date || item.start,
        priority: this.determinePriority(item)
      })) || []
    };
  }

  // Helper methods
  public determineCurrentStage(data: any): string {
    // Logic to determine current workflow stage based on Clio data
    if (data.status === 'draft') return 'Draft Preparation';
    if (data.status === 'review') return 'Attorney Review';
    if (data.status === 'filed') return 'File and Serve';
    return 'AI Analysis';
  }

  public determinePriority(data: any): string {
    if (data.urgent || data.priority === 'urgent') return 'Critical';
    if (data.due_date && this.isDueSoon(data.due_date)) return 'High';
    return 'Medium';
  }

  public isDueSoon(dueDate: string): boolean {
    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue <= 24;
  }

  public formatWorkflowProgress(data: any): any[] {
    // Generate workflow progress based on Clio activities/tasks
    return [
      { stage: 'AI Analysis', status: 'completed', timestamp: data.created_at },
      { stage: 'Draft Preparation', status: data.status === 'draft' ? 'in_progress' : 'completed', timestamp: data.updated_at },
      { stage: 'Attorney Review', status: data.status === 'review' ? 'in_progress' : 'pending', timestamp: null },
      { stage: 'Final Review', status: 'pending', timestamp: null },
      { stage: 'File and Serve', status: 'pending', timestamp: null }
    ];
  }

  public calculateProgress(data: any): number {
    // Calculate progress percentage based on workflow stages
    const stages = this.formatWorkflowProgress(data);
    const completedStages = stages.filter(stage => stage.status === 'completed').length;
    return Math.round((completedStages / stages.length) * 100);
  }

  public generateNextActions(data: any): string[] {
    const actions: string[] = [];
    if (data.status === 'draft') actions.push('Review AI-generated draft');
    if (data.status === 'review') actions.push('Complete attorney review');
    if (data.due_date && this.isDueSoon(data.due_date)) actions.push('Prepare for immediate filing');
    return actions;
  }

  public formatAddress(data: any): string {
    const parts = [data.address1, data.address2, data.city, data.state, data.zip];
    return parts.filter(part => part).join(', ');
  }

  public calculateDuration(start: string, end: string): number {
    const startTime = new Date(start);
    const endTime = new Date(end);
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
  }

  // Formatting methods for new actions
  public formatTasks(data: any) {
    return {
      tasks: data.data?.map((task: any) => ({
        id: task.id,
        title: task.name || task.title,
        matter_id: task.matter_id,
        due_date: task.due_date || task.due_at,
        status: task.status || 'pending',
        priority: task.priority || 'normal',
        assigned_to: task.assigned_to?.name || 'Unassigned'
      })) || []
    };
  }

  public formatContacts(data: any) {
    return {
      contacts: data.data?.map((contact: any) => ({
        id: contact.id,
        name: contact.name || `${contact.first_name} ${contact.last_name}`,
        email: contact.email,
        phone: contact.phone,
        type: contact.type || 'contact',
        matter_count: contact.matter_count || 0
      })) || []
    };
  }

  public formatCaseStatus(data: any) {
    return {
      matter_id: data.id,
      status: data.status || 'Active',
      last_activity: data.updated_at || data.created_at,
      open_tasks: data.open_tasks_count || 0,
      pending_documents: data.pending_documents_count || 0,
      next_hearing: data.next_calendar_entry?.start,
      billing_status: data.billing_status || 'current'
    };
  }

  public formatDocuments(data: any) {
    return {
      documents: data.data?.map((doc: any) => ({
        id: doc.id,
        name: doc.name || doc.filename,
        matter_id: doc.matter_id,
        document_type: doc.document_type || 'Document',
        created_date: doc.created_at,
        status: doc.status || 'Active'
      })) || []
    };
  }
})();
