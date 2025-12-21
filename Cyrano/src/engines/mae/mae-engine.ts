/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseEngine } from '../base-engine.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Workflow, WorkflowStep } from '../base-engine.js';
import { z } from 'zod';
import { chronometricModule } from '../../modules/chronometric/index.js';
import {
  buildExecutionPlan,
  workflowToNodes,
  validateWorkflowStructure,
  groupStepsByLevel,
  ExecutionPlan,
} from './workflow-utils.js';
import { aiProviderSelector } from '../../services/ai-provider-selector.js';
import { AIProvider } from '../../services/ai-service.js';
import { aiOrchestrator } from './services/ai-orchestrator.js';
import { multiModelService } from './services/multi-model-service.js';
// Import common tools for MAE workflows
import { documentAnalyzer } from '../../tools/document-analyzer.js';
import { factChecker } from '../../tools/fact-checker.js';
import { workflowManager } from '../../tools/workflow-manager.js';
import { caseManager } from '../../tools/case-manager.js';
import { documentProcessor } from '../../tools/document-processor.js';
import { DocumentDrafterTool } from '../../tools/document-drafter.js';
import { clioIntegration } from '../../tools/clio-integration.js';
import { syncManager } from '../../tools/sync-manager.js';

const MaeInputSchema = z.object({
  action: z.enum([
    'execute_workflow',
    'list_workflows',
    'create_workflow',
    'get_status',
  ]).describe('Action to perform'),
  workflow_id: z.string().optional().describe('Workflow ID for execution'),
  workflow: z.any().optional().describe('Workflow definition for creation'),
  input: z.any().optional().describe('Input data for workflow execution'),
});

/**
 * MAE Engine
 * Multi-Agent Engine - Orchestrates multiple AI assistants/agents and modules
 * 
 * This engine coordinates workflows that may involve:
 * - Multiple AI providers (OpenAI, Anthropic, etc.)
 * - Multiple modules (Chronometric, etc.)
 * - Complex multi-step processes
 * 
 * MAE Tools:
 * - AI Orchestrator: Generic multi-provider orchestration (sequential, parallel, collaborative)
 * 
 * MAE Services:
 * - Multi-Model Service: Role-based parallel multi-model verification with weighted confidence scoring
 */
export class MaeEngine extends BaseEngine {
  constructor() {
    super({
      name: 'mae',
      description: 'Multi-Agent Engine - Orchestrates multiple AI assistants/agents and modules for complex workflows',
      version: '1.0.0',
      modules: [
        'chronometric',
        'ark_extractor',
        'ark_processor',
        'ark_analyst',
        'rag',
        'verification',
        'legal_analysis',
      ], // Modules this engine orchestrates
      tools: [
        aiOrchestrator,
        // Commonly used tools accessible via MAE
        documentAnalyzer,
        factChecker,
        workflowManager,
        caseManager,
        documentProcessor,
        new DocumentDrafterTool(),
        clioIntegration,
        syncManager,
        // Note: Engine-specific tools (Potemkin, GoodCounsel) are accessed via engines
      ],
      // Remove hard-coded aiProviders - default to 'auto' (all providers available)
      // User sovereignty: users can select any provider via UI
    });
  }

  /**
   * Get AI Orchestrator Service
   * Utility service for generic multi-provider orchestration
   */
  getAIOrchestrator() {
    return aiOrchestrator;
  }

  /**
   * Get Multi-Model Service
   * Utility service for role-based parallel multi-model verification
   */
  getMultiModelService() {
    return multiModelService;
  }

  /**
   * Get the default provider for MAE orchestrator (user sovereignty - can be changed)
   */
  getDefaultProvider(): AIProvider {
    return aiProviderSelector.getMAEDefaultProvider();
  }

  /**
   * Set the default provider for MAE orchestrator (user sovereignty)
   */
  setDefaultProvider(provider: AIProvider): void {
    aiProviderSelector.setMAEDefaultProvider(provider);
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    // Register default workflows
    this.registerDefaultWorkflows();
    
    // Initialize all modules
    for (const module of this.getModules()) {
      await module.initialize();
    }
  }

  /**
   * Execute engine functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = MaeInputSchema.parse(input);
      
      switch (parsed.action) {
        case 'execute_workflow':
          if (!parsed.workflow_id) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: workflow_id is required for execute_workflow action',
                },
              ],
              isError: true,
            };
          }
          
          // First try to execute from MAE's own workflows
          const maeWorkflow = this.getWorkflow(parsed.workflow_id);
          if (maeWorkflow) {
            return await this.executeWorkflow(parsed.workflow_id, parsed.input || {});
          }
          
          // If not found in MAE, search other engines
          const { engineRegistry: registry } = await import('../registry.js');
          const allEngines = registry.getAll();
          
          for (const engine of allEngines) {
            if (engine.getEngineInfo().name !== 'mae') {
              const workflow = engine.getWorkflow(parsed.workflow_id);
              if (workflow) {
                // Execute workflow from the engine that owns it
                return await engine.executeWorkflow(parsed.workflow_id, parsed.input || {});
              }
            }
          }
          
          // Workflow not found in any engine
          return {
            content: [
              {
                type: 'text',
                text: `Error: Workflow ${parsed.workflow_id} not found in any engine`,
              },
            ],
            isError: true,
          };
        
        case 'list_workflows':
          // Aggregate workflows from all engines (MAE, Potemkin, GoodCounsel, etc.)
          const maeWorkflows = await this.getWorkflows();
          const allWorkflows: Array<{ id: string; name: string; description: string; step_count: number; engine: string }> = [];
          
          // Add MAE workflows
          maeWorkflows.forEach(w => {
            allWorkflows.push({
              id: w.id,
              name: w.name,
              description: w.description,
              step_count: w.steps.length,
              engine: 'mae',
            });
          });
          
          // Get workflows from all other engines via registry
          const { engineRegistry: registry } = await import('../registry.js');
          const allEngines = registry.getAll();
          
          for (const engine of allEngines) {
            if (engine.getEngineInfo().name !== 'mae') {
              const engineWorkflows = await engine.getWorkflows();
              engineWorkflows.forEach(w => {
                allWorkflows.push({
                  id: w.id,
                  name: w.name,
                  description: w.description,
                  step_count: w.steps.length,
                  engine: engine.getEngineInfo().name,
                });
              });
            }
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  workflows: allWorkflows,
                  total: allWorkflows.length,
                  by_engine: allWorkflows.reduce((acc, w) => {
                    acc[w.engine] = (acc[w.engine] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>),
                }, null, 2),
              },
            ],
            isError: false,
          };
        
        case 'create_workflow':
          if (!parsed.workflow) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: workflow definition is required for create_workflow action',
                },
              ],
              isError: true,
            };
          }
          this.registerWorkflow(parsed.workflow as Workflow);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  workflow_id: parsed.workflow.id,
                  message: 'Workflow registered successfully',
                }, null, 2),
              },
            ],
            isError: false,
          };
        
        case 'get_status':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  engine: this.getEngineInfo(),
                  active_workflows: this.workflows.size,
                  modules: this.getModules().map(m => m.getModuleInfo()),
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
            text: `Error in MAE engine: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Execute workflow with topological sort for complex dependency graphs
   * 
   * This method uses the topological sort algorithm from SwimMeet to handle
   * workflows with complex dependencies. It's an enhanced version of the
   * base executeWorkflow that can handle parallel execution opportunities.
   * 
   * @param workflowId Workflow ID to execute
   * @param input Input data for workflow
   * @param useTopologicalSort Whether to use topological sort (default: true for complex workflows)
   */
  async executeWorkflowWithTopologicalSort(
    workflowId: string,
    input: any,
    useTopologicalSort: boolean = true
  ): Promise<CallToolResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Workflow ${workflowId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Convert workflow to node-based format for topological sort
    const { nodes, connections } = workflowToNodes(workflow);

    // Validate workflow structure
    if (useTopologicalSort) {
      const validation = validateWorkflowStructure(nodes, connections);
      if (!validation.valid) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Workflow validation failed',
                errors: validation.errors,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }

    // Build execution plan with topological sort
    const executionPlan = useTopologicalSort
      ? buildExecutionPlan(nodes, connections)
      : workflow.steps.map((step, index) => ({
          step: index,
          nodeId: step.id,
          dependencies: [],
        }));

    // Group steps by level for potential parallel execution
    const levelMap = groupStepsByLevel(executionPlan);

    // Initialize context
    const context = {
      ...workflow.initialState,
      ...input,
      stepResults: {} as Record<string, any>,
    };

    const executionResults: Array<{
      stepId: string;
      status: 'completed' | 'failed';
      result?: any;
      error?: string;
    }> = [];

    // Execute steps level by level (steps at same level can run in parallel)
    const levels = Array.from(levelMap.keys()).sort((a, b) => a - b);

    for (const level of levels) {
      const stepIds = levelMap.get(level) || [];
      
      // For now, execute sequentially (parallel execution can be added later)
      for (const stepId of stepIds) {
        const step = workflow.steps.find(s => s.id === stepId);
        if (!step) {
          continue;
        }

        // Check if dependencies are satisfied
        const planItem = executionPlan.find(p => p.nodeId === stepId);
        if (planItem) {
          const allDependenciesMet = planItem.dependencies.every(depId =>
            executionResults.some(r => r.stepId === depId && r.status === 'completed')
          );

          if (!allDependenciesMet) {
            executionResults.push({
              stepId,
              status: 'failed',
              error: 'Dependencies not satisfied',
            });
            continue;
          }
        }

        try {
          const result = await this.executeStep(step, context);
          context.stepResults[step.id] = result;

          executionResults.push({
            stepId,
            status: result.isError ? 'failed' : 'completed',
            result: result.isError ? undefined : result,
            error: result.isError ? ((result.content[0] && result.content[0].type === 'text' && 'text' in result.content[0]) ? result.content[0].text : 'Unknown error') : undefined,
          });

          // If step failed and has onFailure, continue to failure path
          if (result.isError && step.onFailure) {
            // Failure path will be handled in next level
            continue;
          }

          // If step succeeded and has onSuccess, continue to success path
          if (!result.isError && step.onSuccess) {
            // Success path will be handled in next level
            continue;
          }
        } catch (error) {
          executionResults.push({
            stepId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            workflowId,
            executionPlan: executionPlan.map(p => ({
              step: p.step,
              nodeId: p.nodeId,
              dependencies: p.dependencies,
            })),
            results: executionResults,
            finalContext: context.stepResults,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Override executeWorkflow to use topological sort for complex workflows
   */
  async executeWorkflow(workflowId: string, input: any): Promise<CallToolResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Workflow ${workflowId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Use topological sort for workflows with complex dependencies
    // Simple linear workflows can use base implementation
    const hasComplexDependencies = workflow.steps.some(step =>
      step.onSuccess && step.onFailure && step.onSuccess !== step.onFailure
    ) || workflow.steps.length > 5; // Heuristic: complex if > 5 steps

    if (hasComplexDependencies) {
      return await this.executeWorkflowWithTopologicalSort(workflowId, input, true);
    } else {
      // Use base implementation for simple workflows
      return await super.executeWorkflow(workflowId, input);
    }
  }

  /**
   * Register default workflows
   */
  private registerDefaultWorkflows(): void {
    // Time reconstruction workflow using Chronometric module
    this.registerWorkflow({
      id: 'time_reconstruction',
      name: 'Time Reconstruction Workflow',
      description: 'Complete workflow for reconstructing billable time using Chronometric module',
      steps: [
        {
          id: 'identify_gaps',
          type: 'module',
          target: 'chronometric',
          input: { action: 'identify_gaps' },
          onSuccess: 'collect_artifacts',
          onFailure: 'end',
        },
        {
          id: 'collect_artifacts',
          type: 'module',
          target: 'chronometric',
          input: { action: 'collect_artifacts' },
          onSuccess: 'recollection_support',
          onFailure: 'end',
        },
        {
          id: 'recollection_support',
          type: 'module',
          target: 'chronometric',
          input: { action: 'recollection_support' },
          onSuccess: 'pre_fill',
          onFailure: 'end',
        },
        {
          id: 'pre_fill',
          type: 'module',
          target: 'chronometric',
          input: { action: 'pre_fill' },
          onSuccess: 'check_duplicates',
          onFailure: 'end',
        },
        {
          id: 'check_duplicates',
          type: 'module',
          target: 'chronometric',
          input: { action: 'check_duplicates' },
          onSuccess: 'generate_report',
          onFailure: 'end',
        },
        {
          id: 'generate_report',
          type: 'module',
          target: 'chronometric',
          input: { action: 'generate_report' },
        },
      ],
    });

    // Motion Response Workflow - End-to-end orchestration for responding to served motions
    this.registerWorkflow({
      id: 'motion_response',
      name: 'Motion Response Workflow',
      description: 'Complete end-to-end workflow for ingesting, analyzing, and responding to served motions and briefs',
      steps: [
        {
          id: 'ingest_email',
          type: 'tool',
          target: 'email_artifact_collector',
          input: { 
            email_provider: 'outlook',
            keywords: ['motion', 'brief', 'notice'],
          },
          onSuccess: 'extract_attachments',
          onFailure: 'end',
        },
        {
          id: 'extract_attachments',
          type: 'tool',
          target: 'arkiver_process_email',
          input: { 
            extractAttachments: true,
            parseThreads: true,
          },
          onSuccess: 'ingest_documents',
          onFailure: 'end',
        },
        {
          id: 'ingest_documents',
          type: 'tool',
          target: 'rag_query',
          input: { 
            action: 'ingest_batch',
            documents: '{{extracted_documents}}',
            sourceType: 'email',
          },
          onSuccess: 'red_flag_scan',
          onFailure: 'end',
        },
        {
          id: 'red_flag_scan',
          type: 'tool',
          target: 'red_flag_finder',
          input: { 
            action: 'scan_documents',
            document_type: 'motion',
            urgency_threshold: 'medium',
          },
          onSuccess: 'generate_alerts',
          onFailure: 'analyze_documents',
        },
        {
          id: 'generate_alerts',
          type: 'tool',
          target: 'alert_generator',
          input: { 
            alert: {
              type: 'red_flag',
              severity: '{{red_flag_severity}}',
              title: '{{red_flag_title}}',
              description: '{{red_flag_description}}',
            },
            userConfig: { notification_method: 'both' },
          },
          onSuccess: 'analyze_documents',
        },
        {
          id: 'analyze_documents',
          type: 'tool',
          target: 'document_analyzer',
          input: { 
            document: '{{motion_content}}',
            analysis_type: 'comprehensive',
          },
          onSuccess: 'legal_review',
          onFailure: 'end',
        },
        {
          id: 'legal_review',
          type: 'tool',
          target: 'legal_reviewer',
          input: { 
            document: '{{analyzed_document}}',
            review_type: 'motion_response',
          },
          onSuccess: 'map_response',
          onFailure: 'end',
        },
        {
          id: 'map_response',
          type: 'tool',
          target: 'workflow_manager',
          input: { 
            action: 'create_workflow',
            workflow_type: 'motion_response',
            case_context: '{{case_id}}',
          },
          onSuccess: 'fact_check',
          onFailure: 'end',
        },
        {
          id: 'fact_check',
          type: 'tool',
          target: 'fact_checker',
          input: { 
            claim_text: '{{opposing_claims}}',
            verification_mode: 'comprehensive',
            verification_level: 'exhaustive',
          },
          onSuccess: 'verify_citations',
          onFailure: 'draft_response',
        },
        {
          id: 'verify_citations',
          type: 'tool',
          target: 'citation_checker',
          input: { 
            citations: '{{extracted_citations}}',
            verifyFormat: true,
            verifySource: true,
            strictMode: true,
          },
          onSuccess: 'potemkin_verification',
          onFailure: 'draft_response',
        },
        {
          id: 'potemkin_verification',
          type: 'tool',
          target: 'potemkin_engine',
          input: { 
            action: 'verify_document',
            content: '{{motion_content}}',
          },
          onSuccess: 'draft_response',
          onFailure: 'draft_response',
        },
        {
          id: 'draft_response',
          type: 'tool',
          target: 'document_drafter',
          input: { 
            prompt: 'Draft response brief in opposition to {{motion_type}}',
            documentType: 'brief',
            caseContext: '{{case_id}}',
            format: 'docx',
          },
          onSuccess: 'final_citation_check',
          onFailure: 'end',
        },
        {
          id: 'final_citation_check',
          type: 'tool',
          target: 'citation_checker',
          input: { 
            citations: '{{response_citations}}',
            verifyFormat: true,
            verifySource: true,
            strictMode: true,
          },
          onSuccess: 'final_verification',
          onFailure: 'draft_client_email',
        },
        {
          id: 'final_verification',
          type: 'tool',
          target: 'potemkin_engine',
          input: { 
            action: 'verify_document',
            content: '{{response_draft}}',
          },
          onSuccess: 'draft_client_email',
          onFailure: 'draft_client_email',
        },
        {
          id: 'draft_client_email',
          type: 'tool',
          target: 'draft_legal_email',
          input: { 
            recipientType: 'client',
            subject: 'Update: Response to {{motion_type}}',
            purpose: 'Inform client of motion response status and next steps',
            caseDetails: '{{case_id}}',
            tone: 'professional',
          },
          onSuccess: 'capture_time',
          onFailure: 'end',
        },
        {
          id: 'capture_time',
          type: 'module',
          target: 'chronometric',
          input: { 
            action: 'pre_fill',
            artifacts: '{{workflow_artifacts}}',
          },
          onSuccess: 'end',
        },
      ],
    });

    // Document Comparison Workflow - Uses multi-model verification
    this.registerWorkflow({
      id: 'document_comparison',
      name: 'Document Comparison',
      description: 'Compare two or more documents with multi-model verification',
      steps: [
        {
          id: 'ingest_documents',
          type: 'tool',
          target: 'document_processor',
          input: { documents: '{{documents}}' },
          onSuccess: 'analyze_documents',
          onFailure: 'end',
        },
        {
          id: 'analyze_documents',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'comprehensive' },
          onSuccess: 'compare_content',
          onFailure: 'end',
        },
        {
          id: 'compare_content',
          type: 'tool',
          target: 'contract_comparator',
          input: { comparison_type: 'detailed' },
          onSuccess: 'multi_model_verify',
          onFailure: 'end',
        },
        {
          id: 'multi_model_verify',
          type: 'tool',
          target: 'fact_checker',
          input: {
            verification_mode: 'comprehensive',
            verification_level: 'exhaustive',
            claim_text: '{{key_differences}}',
          },
          onSuccess: 'generate_comparison_report',
          onFailure: 'generate_comparison_report',
        },
        {
          id: 'generate_comparison_report',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate comprehensive document comparison report with verified differences' },
        },
      ],
    });

    // Contract Analysis Workflow - Deep analysis with multi-model verification
    this.registerWorkflow({
      id: 'contract_analysis',
      name: 'Contract Analysis',
      description: 'Deep contract analysis with risk assessment and multi-model verification',
      steps: [
        {
          id: 'extract_clauses',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'contract', extract_clauses: true },
          onSuccess: 'identify_risks',
          onFailure: 'end',
        },
        {
          id: 'identify_risks',
          type: 'tool',
          target: 'red_flag_finder',
          input: { action: 'scan_documents', document_type: 'contract' },
          onSuccess: 'verify_claims',
          onFailure: 'legal_review',
        },
        {
          id: 'verify_claims',
          type: 'tool',
          target: 'fact_checker',
          input: {
            verification_mode: 'comprehensive',
            claim_text: '{{contractual_claims}}',
            verification_level: 'exhaustive',
          },
          onSuccess: 'legal_review',
          onFailure: 'legal_review',
        },
        {
          id: 'legal_review',
          type: 'tool',
          target: 'legal_reviewer',
          input: { review_type: 'contract' },
          onSuccess: 'compliance_check',
          onFailure: 'generate_report',
        },
        {
          id: 'compliance_check',
          type: 'tool',
          target: 'compliance_checker',
          input: {},
          onSuccess: 'generate_report',
          onFailure: 'generate_report',
        },
        {
          id: 'generate_report',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate comprehensive contract analysis report with verified risks and recommendations' },
        },
      ],
    });

    // Legal Research Workflow - Multi-model verification for research claims
    this.registerWorkflow({
      id: 'legal_research',
      name: 'Legal Research',
      description: 'Comprehensive legal research with multi-model fact verification',
      steps: [
        {
          id: 'formulate_research_question',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Formulate comprehensive legal research question from: {{research_topic}}' },
          onSuccess: 'search_sources',
          onFailure: 'end',
        },
        {
          id: 'search_sources',
          type: 'tool',
          target: 'rag_query',
          input: { action: 'query', query: '{{research_question}}', sourceTypes: ['westlaw', 'courtlistener'] },
          onSuccess: 'extract_claims',
          onFailure: 'end',
        },
        {
          id: 'extract_claims',
          type: 'tool',
          target: 'claim_extractor',
          input: { extractionType: 'legal', minConfidence: 0.7 },
          onSuccess: 'multi_model_verify_claims',
          onFailure: 'generate_research_report',
        },
        {
          id: 'multi_model_verify_claims',
          type: 'tool',
          target: 'fact_checker',
          input: {
            verification_mode: 'comprehensive',
            verification_level: 'exhaustive',
            claim_text: '{{legal_claims}}',
            sources: '{{research_sources}}',
          },
          onSuccess: 'verify_citations',
          onFailure: 'generate_research_report',
        },
        {
          id: 'verify_citations',
          type: 'tool',
          target: 'citation_checker',
          input: { verifyFormat: true, verifySource: true, strictMode: true },
          onSuccess: 'potemkin_verification',
          onFailure: 'generate_research_report',
        },
        {
          id: 'potemkin_verification',
          type: 'tool',
          target: 'potemkin_engine',
          input: { action: 'verify_document', content: '{{research_findings}}' },
          onSuccess: 'generate_research_report',
          onFailure: 'generate_research_report',
        },
        {
          id: 'generate_research_report',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate comprehensive legal research report with verified findings and citations' },
        },
      ],
    });

    // Due Diligence Workflow - Multi-model verification for transaction documents
    this.registerWorkflow({
      id: 'due_diligence',
      name: 'Due Diligence',
      description: 'Comprehensive due diligence with multi-model verification',
      steps: [
        {
          id: 'ingest_documents',
          type: 'tool',
          target: 'rag_query',
          input: { action: 'ingest_batch', documents: '{{due_diligence_documents}}', sourceType: 'user-upload' },
          onSuccess: 'document_analysis',
          onFailure: 'end',
        },
        {
          id: 'document_analysis',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'comprehensive' },
          onSuccess: 'extract_facts',
          onFailure: 'end',
        },
        {
          id: 'extract_facts',
          type: 'tool',
          target: 'claim_extractor',
          input: { extractionType: 'factual', minConfidence: 0.8 },
          onSuccess: 'multi_model_verify_facts',
          onFailure: 'risk_assessment',
        },
        {
          id: 'multi_model_verify_facts',
          type: 'tool',
          target: 'fact_checker',
          input: {
            verification_mode: 'comprehensive',
            verification_level: 'exhaustive',
            claim_text: '{{extracted_facts}}',
          },
          onSuccess: 'risk_assessment',
          onFailure: 'risk_assessment',
        },
        {
          id: 'risk_assessment',
          type: 'tool',
          target: 'red_flag_finder',
          input: { action: 'scan_documents', urgency_threshold: 'high' },
          onSuccess: 'compliance_check',
          onFailure: 'compliance_check',
        },
        {
          id: 'compliance_check',
          type: 'tool',
          target: 'compliance_checker',
          input: {},
          onSuccess: 'generate_dd_report',
          onFailure: 'generate_dd_report',
        },
        {
          id: 'generate_dd_report',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate comprehensive due diligence report with verified findings and risk assessment' },
        },
      ],
    });

    // Document Drafting with Verification Workflow
    this.registerWorkflow({
      id: 'document_drafting_verified',
      name: 'Document Drafting with Verification',
      description: 'Draft document with multi-model verification of claims',
      steps: [
        {
          id: 'draft_document',
          type: 'tool',
          target: 'document_drafter',
          input: { documentType: '{{document_type}}', prompt: '{{drafting_prompt}}' },
          onSuccess: 'extract_draft_claims',
          onFailure: 'end',
        },
        {
          id: 'extract_draft_claims',
          type: 'tool',
          target: 'claim_extractor',
          input: { extractionType: 'all', minConfidence: 0.6 },
          onSuccess: 'multi_model_verify_draft',
          onFailure: 'legal_review',
        },
        {
          id: 'multi_model_verify_draft',
          type: 'tool',
          target: 'fact_checker',
          input: {
            verification_mode: 'comprehensive',
            verification_level: 'thorough',
            claim_text: '{{draft_claims}}',
          },
          onSuccess: 'legal_review',
          onFailure: 'legal_review',
        },
        {
          id: 'legal_review',
          type: 'tool',
          target: 'legal_reviewer',
          input: { review_type: '{{document_type}}' },
          onSuccess: 'verify_citations',
          onFailure: 'final_review',
        },
        {
          id: 'verify_citations',
          type: 'tool',
          target: 'citation_checker',
          input: { verifyFormat: true, verifySource: true },
          onSuccess: 'potemkin_final_check',
          onFailure: 'final_review',
        },
        {
          id: 'potemkin_final_check',
          type: 'tool',
          target: 'potemkin_engine',
          input: { action: 'verify_document', content: '{{final_draft}}' },
          onSuccess: 'final_review',
          onFailure: 'final_review',
        },
        {
          id: 'final_review',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Perform final review of document with all verification results' },
        },
      ],
    });

    // Discovery Management Workflow - Uses arkiver components
    this.registerWorkflow({
      id: 'discovery_management',
      name: 'Discovery Management',
      description: 'Manage discovery process with document collection, organization, and response tracking',
      steps: [
        {
          id: 'collect_artifacts',
          type: 'tool',
          target: 'email_artifact_collector',
          input: { keywords: ['discovery', 'interrogatory', 'request', 'production'], email_provider: 'both' },
          onSuccess: 'collect_documents',
          onFailure: 'end',
        },
        {
          id: 'collect_documents',
          type: 'tool',
          target: 'document_artifact_collector',
          input: { matter_id: '{{case_id}}' },
          onSuccess: 'collect_calendar',
          onFailure: 'ingest_discovery',
        },
        {
          id: 'collect_calendar',
          type: 'tool',
          target: 'calendar_artifact_collector',
          input: { matter_id: '{{case_id}}' },
          onSuccess: 'ingest_discovery',
          onFailure: 'ingest_discovery',
        },
        {
          id: 'ingest_discovery',
          type: 'tool',
          target: 'rag_query',
          input: { action: 'ingest_batch', documents: '{{discovery_documents}}', sourceType: 'user-upload' },
          onSuccess: 'categorize_requests',
          onFailure: 'end',
        },
        {
          id: 'categorize_requests',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'discovery', extract_categories: true },
          onSuccess: 'track_deadlines',
          onFailure: 'generate_response_outline',
        },
        {
          id: 'track_deadlines',
          type: 'tool',
          target: 'red_flag_finder',
          input: { action: 'scan_documents', document_type: 'notice', urgency_threshold: 'high' },
          onSuccess: 'generate_response_outline',
          onFailure: 'generate_response_outline',
        },
        {
          id: 'generate_response_outline',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate discovery response outline and document production plan' },
        },
      ],
    });

    // Settlement Negotiation Workflow
    this.registerWorkflow({
      id: 'settlement_negotiation',
      name: 'Settlement Negotiation',
      description: 'Prepare and manage settlement negotiations with analysis and documentation',
      steps: [
        {
          id: 'analyze_case',
          type: 'tool',
          target: 'case_manager',
          input: { action: 'get_case_summary', case_id: '{{case_id}}' },
          onSuccess: 'assess_liability',
          onFailure: 'end',
        },
        {
          id: 'assess_liability',
          type: 'tool',
          target: 'legal_reviewer',
          input: { review_type: 'settlement', document: '{{case_documents}}' },
          onSuccess: 'calculate_damages',
          onFailure: 'draft_settlement_analysis',
        },
        {
          id: 'calculate_damages',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'financial', extract_figures: true },
          onSuccess: 'draft_settlement_analysis',
          onFailure: 'draft_settlement_analysis',
        },
        {
          id: 'draft_settlement_analysis',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Draft comprehensive settlement analysis with liability assessment, damages calculation, and negotiation strategy' },
          onSuccess: 'draft_settlement_agreement',
          onFailure: 'end',
        },
        {
          id: 'draft_settlement_agreement',
          type: 'tool',
          target: 'document_drafter',
          input: { documentType: 'contract', prompt: 'Draft settlement agreement based on analysis' },
          onSuccess: 'legal_review',
          onFailure: 'end',
        },
        {
          id: 'legal_review',
          type: 'tool',
          target: 'legal_reviewer',
          input: { review_type: 'settlement_agreement' },
          onSuccess: 'compliance_check',
          onFailure: 'end',
        },
        {
          id: 'compliance_check',
          type: 'tool',
          target: 'compliance_checker',
          input: {},
        },
      ],
    });

    // Deposition Preparation Workflow
    this.registerWorkflow({
      id: 'deposition_preparation',
      name: 'Deposition Preparation',
      description: 'Prepare for depositions with witness analysis, document review, and question preparation',
      steps: [
        {
          id: 'gather_documents',
          type: 'tool',
          target: 'rag_query',
          input: { action: 'query', query: '{{witness_name}} AND {{case_topics}}', sourceTypes: ['user-upload', 'email'] },
          onSuccess: 'analyze_witness',
          onFailure: 'end',
        },
        {
          id: 'analyze_witness',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'witness', extract_statements: true },
          onSuccess: 'identify_inconsistencies',
          onFailure: 'generate_questions',
        },
        {
          id: 'identify_inconsistencies',
          type: 'tool',
          target: 'consistency_checker',
          input: { documents: '{{witness_statements}}' },
          onSuccess: 'verify_facts',
          onFailure: 'generate_questions',
        },
        {
          id: 'verify_facts',
          type: 'tool',
          target: 'fact_checker',
          input: { verification_mode: 'comprehensive', claim_text: '{{witness_claims}}' },
          onSuccess: 'generate_questions',
          onFailure: 'generate_questions',
        },
        {
          id: 'generate_questions',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate comprehensive deposition questions based on witness analysis, inconsistencies, and case strategy' },
          onSuccess: 'create_exhibit_list',
          onFailure: 'end',
        },
        {
          id: 'create_exhibit_list',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Create exhibit list for deposition with document references and page numbers' },
        },
      ],
    });

    // Trial Preparation Workflow
    this.registerWorkflow({
      id: 'trial_preparation',
      name: 'Trial Preparation',
      description: 'Comprehensive trial preparation with evidence organization, witness prep, and strategy development',
      steps: [
        {
          id: 'organize_evidence',
          type: 'tool',
          target: 'document_artifact_collector',
          input: { matter_id: '{{case_id}}' },
          onSuccess: 'categorize_evidence',
          onFailure: 'end',
        },
        {
          id: 'categorize_evidence',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'evidence', extract_categories: true },
          onSuccess: 'verify_evidence',
          onFailure: 'prepare_witnesses',
        },
        {
          id: 'verify_evidence',
          type: 'tool',
          target: 'potemkin_engine',
          input: { action: 'verify_document', content: '{{evidence_documents}}' },
          onSuccess: 'prepare_witnesses',
          onFailure: 'prepare_witnesses',
        },
        {
          id: 'prepare_witnesses',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate witness preparation materials and anticipated questions' },
          onSuccess: 'draft_opening',
          onFailure: 'draft_opening',
        },
        {
          id: 'draft_opening',
          type: 'tool',
          target: 'document_drafter',
          input: { documentType: 'pleading', prompt: 'Draft opening statement outline' },
          onSuccess: 'draft_closing',
          onFailure: 'create_exhibit_binder',
        },
        {
          id: 'draft_closing',
          type: 'tool',
          target: 'document_drafter',
          input: { documentType: 'pleading', prompt: 'Draft closing argument outline' },
          onSuccess: 'create_exhibit_binder',
          onFailure: 'create_exhibit_binder',
        },
        {
          id: 'create_exhibit_binder',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Create comprehensive exhibit binder with index and organization' },
        },
      ],
    });

    // Exhibit Preparation Workflow
    this.registerWorkflow({
      id: 'exhibit_preparation',
      name: 'Exhibit Preparation',
      description: 'Prepare exhibits with numbering, authentication, and organization',
      steps: [
        {
          id: 'collect_exhibits',
          type: 'tool',
          target: 'document_artifact_collector',
          input: { matter_id: '{{case_id}}' },
          onSuccess: 'number_exhibits',
          onFailure: 'end',
        },
        {
          id: 'number_exhibits',
          type: 'tool',
          target: 'document_processor',
          input: { action: 'number_documents', numbering_scheme: 'exhibit' },
          onSuccess: 'authenticate_exhibits',
          onFailure: 'create_index',
        },
        {
          id: 'authenticate_exhibits',
          type: 'tool',
          target: 'provenance_tracker',
          input: { action: 'track_provenance', documents: '{{exhibits}}' },
          onSuccess: 'verify_exhibits',
          onFailure: 'create_index',
        },
        {
          id: 'verify_exhibits',
          type: 'tool',
          target: 'potemkin_engine',
          input: { action: 'verify_document', content: '{{exhibit_content}}' },
          onSuccess: 'create_index',
          onFailure: 'create_index',
        },
        {
          id: 'create_index',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Create comprehensive exhibit index with descriptions and page references' },
        },
      ],
    });

    // Hearing Preparation Workflow
    this.registerWorkflow({
      id: 'hearing_preparation',
      name: 'Hearing Preparation',
      description: 'Prepare for hearings with case analysis, argument preparation, and document organization',
      steps: [
        {
          id: 'analyze_hearing_type',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Analyze hearing type and requirements from: {{hearing_notice}}' },
          onSuccess: 'gather_relevant_docs',
          onFailure: 'end',
        },
        {
          id: 'gather_relevant_docs',
          type: 'tool',
          target: 'rag_query',
          input: { action: 'query', query: '{{hearing_topics}}', sourceTypes: ['user-upload', 'clio'] },
          onSuccess: 'analyze_case_law',
          onFailure: 'draft_arguments',
        },
        {
          id: 'analyze_case_law',
          type: 'tool',
          target: 'rag_query',
          input: { action: 'query', query: '{{legal_issues}}', sourceTypes: ['westlaw', 'courtlistener'] },
          onSuccess: 'draft_arguments',
          onFailure: 'draft_arguments',
        },
        {
          id: 'draft_arguments',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Draft hearing arguments and talking points based on case analysis' },
          onSuccess: 'prepare_exhibits',
          onFailure: 'end',
        },
        {
          id: 'prepare_exhibits',
          type: 'tool',
          target: 'mae_engine',
          input: { action: 'execute_workflow', workflow_id: 'exhibit_preparation', input: { case_id: '{{case_id}}' } },
          onSuccess: 'create_hearing_binder',
          onFailure: 'create_hearing_binder',
        },
        {
          id: 'create_hearing_binder',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Create hearing binder with arguments, exhibits, and case law' },
        },
      ],
    });

    // Mediation Preparation Workflow
    this.registerWorkflow({
      id: 'mediation_preparation',
      name: 'Mediation Preparation',
      description: 'Prepare for mediation with position papers, settlement analysis, and strategy development',
      steps: [
        {
          id: 'analyze_positions',
          type: 'tool',
          target: 'case_manager',
          input: { action: 'get_case_summary', case_id: '{{case_id}}' },
          onSuccess: 'assess_settlement_range',
          onFailure: 'end',
        },
        {
          id: 'assess_settlement_range',
          type: 'tool',
          target: 'mae_engine',
          input: { action: 'execute_workflow', workflow_id: 'settlement_negotiation', input: { case_id: '{{case_id}}' } },
          onSuccess: 'draft_position_paper',
          onFailure: 'draft_position_paper',
        },
        {
          id: 'draft_position_paper',
          type: 'tool',
          target: 'document_drafter',
          input: { documentType: 'pleading', prompt: 'Draft mediation position paper with client position and settlement authority' },
          onSuccess: 'prepare_demand_response',
          onFailure: 'end',
        },
        {
          id: 'prepare_demand_response',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Prepare response strategy for various settlement demands and counteroffers' },
          onSuccess: 'create_mediation_binder',
          onFailure: 'create_mediation_binder',
        },
        {
          id: 'draft_proposed_order',
          type: 'tool',
          target: 'document_drafter',
          input: { documentType: 'pleading', prompt: 'Draft proposed mediation order reflecting settlement terms and agreements' },
          onSuccess: 'create_mediation_binder',
          onFailure: 'create_mediation_binder',
        },
        {
          id: 'create_mediation_binder',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Create mediation binder with position paper, settlement analysis, proposed order, and supporting documents' },
        },
      ],
    });

    // Pretrial/Status Conference Preparation Workflow
    this.registerWorkflow({
      id: 'pretrial_preparation',
      name: 'Pretrial/Status Conference Preparation',
      description: 'Prepare for pretrial and status conferences with case status updates and scheduling',
      steps: [
        {
          id: 'gather_case_status',
          type: 'tool',
          target: 'case_manager',
          input: { action: 'get_case_status', case_id: '{{case_id}}' },
          onSuccess: 'collect_recent_activity',
          onFailure: 'end',
        },
        {
          id: 'collect_recent_activity',
          type: 'tool',
          target: 'email_artifact_collector',
          input: { start_date: '{{last_conference_date}}', keywords: ['filing', 'motion', 'order'] },
          onSuccess: 'analyze_discovery_status',
          onFailure: 'draft_status_report',
        },
        {
          id: 'analyze_discovery_status',
          type: 'tool',
          target: 'mae_engine',
          input: { action: 'execute_workflow', workflow_id: 'discovery_management', input: { case_id: '{{case_id}}' } },
          onSuccess: 'draft_status_report',
          onFailure: 'draft_status_report',
        },
        {
          id: 'draft_status_report',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Draft case status report for pretrial conference with discovery status, pending motions, and scheduling needs' },
          onSuccess: 'identify_scheduling_issues',
          onFailure: 'end',
        },
        {
          id: 'identify_scheduling_issues',
          type: 'tool',
          target: 'red_flag_finder',
          input: { action: 'scan_documents', document_type: 'order', urgency_threshold: 'medium' },
          onSuccess: 'create_conference_binder',
          onFailure: 'create_conference_binder',
        },
        {
          id: 'draft_proposed_order_award',
          type: 'tool',
          target: 'document_drafter',
          input: { documentType: 'pleading', prompt: 'Draft proposed order or proposed award for pretrial/status conference based on case status and agreements' },
          onSuccess: 'create_conference_binder',
          onFailure: 'create_conference_binder',
        },
        {
          id: 'create_conference_binder',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Create pretrial conference binder with status report, proposed order/award, and supporting documents' },
        },
      ],
    });

    // PHI/HIPAA and FERPA Redaction Scan Workflow
    this.registerWorkflow({
      id: 'phi_ferpa_redaction_scan',
      name: 'PHI/HIPAA and FERPA Redaction Scan',
      description: 'Automatically scan and redact PHI (HIPAA-protected health information), FERPA-protected education records, PII, minor names, and former names (to prevent deadnaming) from documents',
      steps: [
        {
          id: 'identify_sensitive_data',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'redaction', extract_entities: true, identify_minors: true },
          onSuccess: 'detect_phi_hipaa',
          onFailure: 'end',
        },
        {
          id: 'detect_phi_hipaa',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Identify PHI (HIPAA-protected health information), FERPA-protected education records, PII (SSN, DOB, addresses), minor names, and former names (to prevent deadnaming of trans/non-binary individuals) in: {{document_content}}' },
          onSuccess: 'detect_ferpa',
          onFailure: 'end',
        },
        {
          id: 'detect_ferpa',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Identify FERPA-protected education records (student names, grades, disciplinary records) in: {{document_content}}' },
          onSuccess: 'redact_sensitive_info',
          onFailure: 'redact_sensitive_info',
        },
        {
          id: 'redact_sensitive_info',
          type: 'tool',
          target: 'document_processor',
          input: { action: 'redact', redaction_rules: { phi: true, hipaa: true, ferpa: true, pii: true, minors: true, former_names: true, prevent_deadnaming: true } },
          onSuccess: 'verify_redaction',
          onFailure: 'end',
        },
        {
          id: 'verify_redaction',
          type: 'tool',
          target: 'potemkin_engine',
          input: { action: 'verify_document', content: '{{redacted_document}}' },
          onSuccess: 'generate_redaction_log',
          onFailure: 'generate_redaction_log',
        },
        {
          id: 'generate_redaction_log',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate redaction log documenting what was redacted (PHI/HIPAA, FERPA, PII, minor names, former names) and why, with special note about deadnaming prevention' },
        },
      ],
    });

    // Tax Return Forecast Workflow
    this.registerWorkflow({
      id: 'tax_return_forecast',
      name: 'Tax Return Forecast',
      description: 'Generate hypothetical tax return forecasts using official IRS and state forms (PLACEHOLDER: PDF form filling needed)',
      steps: [
        {
          id: 'gather_financial_data',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'financial', extract_figures: true },
          onSuccess: 'calculate_tax_scenarios',
          onFailure: 'end',
        },
        {
          id: 'calculate_tax_scenarios',
          type: 'tool',
          target: 'forecast_engine',
          input: { 
            action: 'generate_tax_forecast',
            forecast_input: '{{financial_data}}',
            branding: {
              presentationMode: 'strip',
              userRole: '{{user_role}}',
              licensedInAny: '{{licensed_in_any}}',
              riskAcknowledged: false,
            },
          },
          onSuccess: 'multi_model_verify_tax',
          onFailure: 'end',
        },
        {
          id: 'multi_model_verify_tax',
          type: 'tool',
          target: 'fact_checker',
          input: {
            verification_mode: 'comprehensive',
            verification_level: 'exhaustive',
            claim_text: '{{tax_calculations}}',
            context: 'Tax return forecast calculations - verify accuracy of AGI, taxable income, tax liability, and refund/balance calculations',
          },
          onSuccess: 'prepare_form_data',
          onFailure: 'prepare_form_data',
        },
        {
          id: 'prepare_form_data',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Prepare verified data for IRS Form 1040 and state tax forms based on multi-model verified calculations' },
          onSuccess: 'fill_tax_forms',
          onFailure: 'end',
        },
        {
          id: 'fill_tax_forms',
          type: 'tool',
          target: 'document_processor',
          input: { action: 'fill_pdf_forms', form_type: 'tax_return', form_data: '{{tax_data}}' },
          onSuccess: 'generate_forecast_report',
          onFailure: 'generate_forecast_report',
        },
        {
          id: 'apply_forecast_branding',
          type: 'tool',
          target: 'document_processor',
          input: { 
            action: 'apply_forecast_branding',
            forecast_type: 'tax_return',
            presentation_mode: '{{presentation_mode}}',
            user_role: '{{user_role}}',
            licensed_in_any: '{{licensed_in_any}}',
            risk_acknowledged: '{{risk_acknowledged}}',
          },
          onSuccess: 'generate_forecast_report',
          onFailure: 'generate_forecast_report',
        },
        {
          id: 'generate_forecast_report',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate tax return forecast report explaining scenarios and assumptions. IMPORTANT: This is a LexFiat Forecaster™ forecast - NOT a real tax return. Output will look like a real tax return but is for hypothetical forecasting only. Must include: (1) 0.5" LexFiat Forecaster™ wordmark strip at top and bottom of each page, (2) 10pt or smaller disclaimer: "LexFiat Forecaster™: This is not a real filed tax return. For hypothetical forecasting and attorney review only. Must be reviewed and finalized by a qualified tax professional before any filing." (3) Clear statement that this is not filing-ready and requires specialist review. Respect tax specialists - not trying to replace their work or mislead courts/opposing counsel.' },
        },
      ],
    });

    // Child Support Forecast Workflow
    this.registerWorkflow({
      id: 'child_support_forecast',
      name: 'Child Support Forecast',
      description: 'Generate hypothetical child support forecasts using Friend of the Court standard forms (PLACEHOLDER: PDF form filling needed)',
      steps: [
        {
          id: 'gather_income_data',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'financial', extract_income: true },
          onSuccess: 'calculate_support_scenarios',
          onFailure: 'end',
        },
        {
          id: 'calculate_support_scenarios',
          type: 'tool',
          target: 'forecast_engine',
          input: { 
            action: 'generate_child_support_forecast',
            forecast_input: '{{income_data}}',
            branding: {
              presentationMode: 'strip',
              userRole: '{{user_role}}',
              licensedInAny: '{{licensed_in_any}}',
              riskAcknowledged: false,
            },
          },
          onSuccess: 'multi_model_verify_support',
          onFailure: 'end',
        },
        {
          id: 'multi_model_verify_support',
          type: 'tool',
          target: 'fact_checker',
          input: {
            verification_mode: 'comprehensive',
            verification_level: 'exhaustive',
            claim_text: '{{support_calculations}}',
            context: 'Child support forecast calculations - verify accuracy of base support, adjustments, and final support amount using state-specific formulas',
          },
          onSuccess: 'prepare_foc_form_data',
          onFailure: 'prepare_foc_form_data',
        },
        {
          id: 'prepare_foc_form_data',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Prepare verified data for Friend of the Court Child Support Finding and Order form based on multi-model verified calculations' },
          onSuccess: 'fill_foc_forms',
          onFailure: 'end',
        },
        {
          id: 'fill_foc_forms',
          type: 'tool',
          target: 'document_processor',
          input: { action: 'fill_pdf_forms', form_type: 'child_support', form_data: '{{support_data}}' },
          onSuccess: 'generate_forecast_report',
          onFailure: 'generate_forecast_report',
        },
        {
          id: 'apply_forecast_branding',
          type: 'tool',
          target: 'document_processor',
          input: { 
            action: 'apply_forecast_branding',
            forecast_type: 'child_support',
            presentation_mode: '{{presentation_mode}}',
            user_role: '{{user_role}}',
            licensed_in_any: '{{licensed_in_any}}',
            risk_acknowledged: '{{risk_acknowledged}}',
          },
          onSuccess: 'generate_forecast_report',
          onFailure: 'generate_forecast_report',
        },
        {
          id: 'generate_forecast_report',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate child support forecast report with scenarios and calculations. IMPORTANT: This is a LexFiat Forecaster™ forecast - NOT a real court order. Output will look like a real child support finding and order but is for hypothetical forecasting only. Must include: (1) 0.5" LexFiat Forecaster™ wordmark strip at top and bottom of each page, (2) 10pt or smaller disclaimer: "LexFiat Forecaster™: This is not a real court order. For hypothetical forecasting and attorney review only. Must be reviewed and finalized by a qualified professional before any filing." (3) Clear statement that this is not filing-ready and requires specialist review. Respect FOC specialists - not trying to replace their work or mislead courts/opposing counsel.' },
        },
      ],
    });

    // QDRO Forecast Workflow
    this.registerWorkflow({
      id: 'qdro_forecast',
      name: 'QDRO Forecast',
      description: 'Generate hypothetical QDRO forecasts using ERISA-compliant templates (PLACEHOLDER: PDF form filling needed)',
      steps: [
        {
          id: 'gather_retirement_data',
          type: 'tool',
          target: 'document_analyzer',
          input: { analysis_type: 'financial', extract_retirement: true },
          onSuccess: 'calculate_qdro_scenarios',
          onFailure: 'end',
        },
        {
          id: 'calculate_qdro_scenarios',
          type: 'tool',
          target: 'forecast_engine',
          input: { 
            action: 'generate_qdro_forecast',
            forecast_input: '{{retirement_data}}',
            branding: {
              presentationMode: 'strip',
              userRole: '{{user_role}}',
              licensedInAny: '{{licensed_in_any}}',
              riskAcknowledged: false,
            },
          },
          onSuccess: 'multi_model_verify_qdro',
          onFailure: 'end',
        },
        {
          id: 'multi_model_verify_qdro',
          type: 'tool',
          target: 'fact_checker',
          input: {
            verification_mode: 'comprehensive',
            verification_level: 'exhaustive',
            claim_text: '{{qdro_calculations}}',
            context: 'QDRO forecast calculations - verify accuracy of division amounts, benefit calculations, and ERISA compliance',
          },
          onSuccess: 'verify_erisa_compliance',
          onFailure: 'verify_erisa_compliance',
        },
        {
          id: 'verify_erisa_compliance',
          type: 'tool',
          target: 'compliance_checker',
          input: { compliance_type: 'ERISA', document_type: 'QDRO' },
          onSuccess: 'prepare_qdro_form_data',
          onFailure: 'prepare_qdro_form_data',
        },
        {
          id: 'prepare_qdro_form_data',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Prepare verified data for ERISA-compliant QDRO template based on multi-model verified calculations' },
          onSuccess: 'fill_qdro_forms',
          onFailure: 'end',
        },
        {
          id: 'fill_qdro_forms',
          type: 'tool',
          target: 'document_processor',
          input: { action: 'fill_pdf_forms', form_type: 'QDRO', form_data: '{{qdro_data}}' },
          onSuccess: 'generate_forecast_report',
          onFailure: 'generate_forecast_report',
        },
        {
          id: 'apply_forecast_branding',
          type: 'tool',
          target: 'document_processor',
          input: { 
            action: 'apply_forecast_branding',
            forecast_type: 'qdro',
            presentation_mode: '{{presentation_mode}}',
            user_role: '{{user_role}}',
            licensed_in_any: '{{licensed_in_any}}',
            risk_acknowledged: '{{risk_acknowledged}}',
          },
          onSuccess: 'generate_forecast_report',
          onFailure: 'generate_forecast_report',
        },
        {
          id: 'generate_forecast_report',
          type: 'ai',
          target: 'auto',
          input: { prompt: 'Generate QDRO forecast report with ERISA compliance verification and scenarios. IMPORTANT: This is a LexFiat Forecaster™ forecast - NOT a real QDRO. Output will look like a real ERISA-compliant QDRO but is for hypothetical forecasting only. Must include: (1) 0.5" LexFiat Forecaster™ wordmark strip at top and bottom of each page, (2) 10pt or smaller disclaimer: "LexFiat Forecaster™: This is not a real QDRO. For hypothetical forecasting and attorney review only. Must be reviewed and finalized by a qualified QDRO specialist before any filing." (3) Clear statement that this is not filing-ready and requires specialist review. Respect QDRO specialists - not trying to replace their work or mislead courts/opposing counsel.' },
        },
      ],
    });
  }

  /**
   * Override executeStep to add support for 'engine' step type
   * Allows MAE workflows to call other engines (Potemkin, GoodCounsel, etc.)
   */
  protected async executeStep(step: WorkflowStep, context: any): Promise<CallToolResult> {
    // Handle 'engine' step type for calling other engines
    if (step.type === 'engine') {
      try {
        const { engineRegistry: registry } = await import('../registry.js');
        const targetEngine = registry.get(step.target);
        
        if (!targetEngine) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Engine ${step.target} not found in registry`,
              },
            ],
            isError: true,
          };
        }
        
        // Execute the engine with the provided input
        // Merge context into input for template variable resolution
        const engineInput = {
          ...context,
          ...step.input,  // step.input takes precedence over context
        };
        
        return await targetEngine.execute(engineInput);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error calling engine ${step.target}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
    
    // Fall back to base implementation for other step types
    return await super.executeStep(step, context);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup all modules
    for (const module of this.getModules()) {
      await module.cleanup();
    }
    
    // Clear workflows and state
    this.workflows.clear();
    this.state.clear();
  }
}

// Export singleton instance
export const maeEngine = new MaeEngine();
