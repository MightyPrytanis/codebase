/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseEngine, Workflow } from '../base-engine.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
// Import shared verification tools
import { claimExtractor } from '../../tools/verification/claim-extractor.js';
import { citationChecker } from '../../tools/verification/citation-checker.js';
import { sourceVerifier } from '../../tools/verification/source-verifier.js';
import { consistencyChecker } from '../../tools/verification/consistency-checker.js';
// Import Potemkin-specific tools
import {
  historyRetriever,
  driftCalculator,
  biasDetector,
  integrityMonitor,
  alertGenerator,
} from './tools/index.js';

const PotemkinInputSchema = z.object({
  action: z.enum([
    'execute_workflow',
    'list_workflows',
    'verify_document',
    'detect_bias',
    'monitor_integrity',
    'test_opinion_drift',
    'assess_honesty',
  ]).describe('Action to perform'),
  workflow_id: z.string().optional().describe('Workflow ID for execution'),
  input: z.any().optional().describe('Input data for workflow execution'),
  documentId: z.string().optional().describe('Document ID for verification'),
  content: z.string().optional().describe('Content to verify/analyze'),
});

/**
 * Potemkin Engine
 * Verification and Integrity Engine
 * 
 * The "truth and logic stickler" - designed to help identify and correct
 * AI-induced delusions, hallucinations, and logical inconsistencies.
 * 
 * Key Features:
 * - Document Verification: Verify facts, citations, and claims
 * - Bias Detection: Identify bias in AI-generated content
 * - Integrity Monitoring: Continuous monitoring of AI output quality
 * - Opinion Drift Testing: Detect when AI opinions change over time
 * - Honesty Assessment: Evaluate truthfulness and accuracy
 */
export class PotemkinEngine extends BaseEngine {
  constructor() {
    super({
      name: 'potemkin',
      description: 'Verification and Integrity Engine - Truth and logic verification for AI-generated content',
      version: '1.0.0',
      // aiProviders removed - default to 'auto' (all providers available) for user sovereignty
      // Register shared verification tools
      tools: [
        claimExtractor,
        citationChecker,
        sourceVerifier,
        consistencyChecker,
        // Potemkin-specific tools
        historyRetriever,
        driftCalculator,
        biasDetector,
        integrityMonitor,
        alertGenerator,
      ],
    });
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    // Register default workflows
    this.registerDefaultWorkflows();
  }

  /**
   * Register default workflows
   */
  private registerDefaultWorkflows(): void {
    // Document Verification Workflow
    this.registerWorkflow({
      id: 'verify_document',
      name: 'Document Verification',
      description: 'Verifies facts, citations, and claims in a document',
      steps: [
        {
          id: 'extract_claims',
          type: 'tool',
          target: 'claim_extractor',
          input: {
            content: '{{documentContent}}',
            extractionType: 'all',
            minConfidence: 0.5,
            includeEntities: true,
            includeKeywords: true,
          },
          onSuccess: 'verify_facts',
        },
        {
          id: 'verify_facts',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Verify factual claims against known sources' },
          onSuccess: 'check_citations',
        },
        {
          id: 'check_citations',
          type: 'tool',
          target: 'citation_checker',
          input: {
            citations: '{{extractedCitations}}',
            verifyFormat: true,
            strictMode: false,
          },
          onSuccess: 'generate_report',
        },
        {
          id: 'generate_report',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Generate verification report with confidence scores' },
        },
      ],
    });

    // Bias Detection Workflow
    this.registerWorkflow({
      id: 'detect_bias',
      name: 'Bias Detection',
      description: 'Detects bias in AI-generated content',
      steps: [
        {
          id: 'analyze_content',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Analyze content for potential bias indicators' },
          onSuccess: 'check_patterns',
        },
        {
          id: 'check_patterns',
          type: 'tool',
          target: 'bias_detector',
          input: {
            targetLLM: '{{targetLLM}}',
            biasTopic: '{{biasTopic}}',
            insights: '{{insights}}',
            minInsights: 5,
          },
          onSuccess: 'generate_report',
        },
        {
          id: 'generate_report',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Generate bias detection report with recommendations' },
        },
      ],
    });

    // Integrity Monitoring Workflow
    this.registerWorkflow({
      id: 'monitor_integrity',
      name: 'Integrity Monitoring',
      description: 'Monitors AI output quality and integrity over time',
      steps: [
        {
          id: 'collect_metrics',
          type: 'tool',
          target: 'integrity_monitor',
          input: {
            testResults: '{{testResults}}',
            userConfig: '{{userConfig}}',
            timeWindowHours: 24,
          },
          onSuccess: 'analyze_trends',
        },
        {
          id: 'analyze_trends',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Analyze integrity trends and identify anomalies' },
          onSuccess: 'generate_alerts',
        },
        {
          id: 'generate_alerts',
          type: 'tool',
          target: 'alert_generator',
          input: {
            alert: '{{alert}}',
            userConfig: '{{userConfig}}',
            existingAlerts: '{{existingAlerts}}',
          },
        },
      ],
    });

    // Opinion Drift Testing Workflow
    this.registerWorkflow({
      id: 'test_opinion_drift',
      name: 'Opinion Drift Test',
      description: 'Tests whether AI opinions have drifted over time',
      steps: [
        {
          id: 'retrieve_history',
          type: 'tool',
          target: 'history_retriever',
          input: {
            targetLLM: '{{targetLLM}}',
            topic: '{{topic}}',
            dateRange: '{{dateRange}}',
            minInsights: 3,
            splitRatio: 0.33,
          },
          onSuccess: 'compare_opinions',
        },
        {
          id: 'compare_opinions',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Compare current opinions with historical opinions' },
          onSuccess: 'calculate_drift',
        },
        {
          id: 'calculate_drift',
          type: 'tool',
          target: 'drift_calculator',
          input: {
            targetLLM: '{{targetLLM}}',
            topic: '{{topic}}',
            earlyInsights: '{{earlyInsights}}',
            recentInsights: '{{recentInsights}}',
          },
          onSuccess: 'generate_report',
        },
        {
          id: 'generate_report',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Generate opinion drift report' },
        },
      ],
    });

    // Honesty Assessment Workflow
    this.registerWorkflow({
      id: 'assess_honesty',
      name: 'Honesty Assessment',
      description: 'Assesses truthfulness and accuracy of AI-generated content',
      steps: [
        {
          id: 'analyze_content',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Analyze content for truthfulness indicators' },
          onSuccess: 'check_consistency',
        },
        {
          id: 'check_consistency',
          type: 'tool',
          target: 'consistency_checker',
          input: {},
          onSuccess: 'verify_sources',
        },
        {
          id: 'verify_sources',
          type: 'tool',
          target: 'source_verifier',
          input: {},
          onSuccess: 'generate_score',
        },
        {
          id: 'generate_score',
          type: 'ai',
          target: 'anthropic',
          input: { prompt: 'Generate honesty score and detailed assessment' },
        },
      ],
    });
  }

  /**
   * Execute engine functionality
   */
  async execute(input: any): Promise<CallToolResult> {
    try {
      const parsed = PotemkinInputSchema.parse(input);

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
          return await this.executeWorkflow(parsed.workflow_id, parsed.input || {});

        case 'list_workflows': {
          const workflows = await this.getWorkflows();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  workflows: workflows.map(w => ({
                    id: w.id,
                    name: w.name,
                    description: w.description,
                    step_count: w.steps.length,
                  })),
                }, null, 2),
              },
            ],
          };
        }

        case 'verify_document':
          return await this.executeWorkflow('verify_document', {
            documentId: parsed.documentId,
            content: parsed.content,
            ...(parsed.input && typeof parsed.input === 'object' && !Array.isArray(parsed.input) ? parsed.input : {}),
          });

        case 'detect_bias':
          return await this.executeWorkflow('detect_bias', {
            content: parsed.content,
            ...(parsed.input && typeof parsed.input === 'object' && !Array.isArray(parsed.input) ? parsed.input : {}),
          });

        case 'monitor_integrity':
          return await this.executeWorkflow('monitor_integrity', {
            ...(parsed.input && typeof parsed.input === 'object' && !Array.isArray(parsed.input) ? parsed.input : {}),
          });

        case 'test_opinion_drift':
          return await this.executeWorkflow('test_opinion_drift', {
            ...(parsed.input && typeof parsed.input === 'object' && !Array.isArray(parsed.input) ? parsed.input : {}),
          });

        case 'assess_honesty':
          return await this.executeWorkflow('assess_honesty', {
            content: parsed.content,
            ...(parsed.input && typeof parsed.input === 'object' && !Array.isArray(parsed.input) ? parsed.input : {}),
          });

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Error: Unknown action: ${parsed.action}`,
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
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get available workflows
   */
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  /**
   * Execute a specific workflow
   */
  async executeWorkflow(workflowId: string, input: any): Promise<CallToolResult> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Workflow '${workflowId}' not found`,
          },
        ],
        isError: true,
      };
    }

    try {
      // Initialize workflow state
      const state = {
        ...workflow.initialState,
        ...input,
        workflowId,
        currentStep: 0,
        results: [],
      };

      // Execute workflow steps
      for (const step of workflow.steps) {
        // Check condition if present
        if (step.condition && !step.condition(state)) {
          if (step.onFailure) {
            // Skip to failure step
            const failureStep = workflow.steps.find(s => s.id === step.onFailure);
            if (failureStep) {
              continue;
            }
          }
          continue;
        }

        // Use BaseEngine's executeStep method for real implementations
        const stepExecutionResult = await this.executeStep(step, state);
        
        // Convert CallToolResult to step result format
        let stepResult: any;
        if (stepExecutionResult.isError) {
          stepResult = {
            type: step.type,
            target: step.target,
            error: (stepExecutionResult.content[0] && stepExecutionResult.content[0].type === 'text' && 'text' in stepExecutionResult.content[0]) ? stepExecutionResult.content[0].text : 'Unknown error',
            result: undefined,
          };
        } else {
          const resultText = (stepExecutionResult.content[0] && stepExecutionResult.content[0].type === 'text' && 'text' in stepExecutionResult.content[0]) ? stepExecutionResult.content[0].text : '';
          stepResult = {
            type: step.type,
            target: step.target,
            result: resultText,
          };
        }

        state.results.push({
          stepId: step.id,
          result: stepResult,
        });
        state.currentStep++;

        // Update state with step result
        Object.assign(state, stepResult);
      }

      // Ethics check: Verify results comply with Ten Rules (especially for verification workflows)
      const { checkGeneratedContent } = await import('../../services/ethics-check-helper.js');
      const workflowResult = {
        success: true,
        workflowId,
        workflowName: workflow.name,
        results: state.results,
        finalState: state,
      };
      
      const resultText = JSON.stringify(workflowResult, null, 2);
      const ethicsCheck = await checkGeneratedContent(resultText, {
        toolName: `potemkin_${workflowId}`,
        contentType: 'report',
        strictMode: true, // Strict for verification results
      });

      // If blocked, return error
      if (ethicsCheck.ethicsCheck.blocked) {
        return {
          content: [
            {
              type: 'text',
              text: 'Workflow result blocked by ethics check. Verification does not meet Ten Rules compliance standards.',
            },
          ],
          isError: true,
        };
      }

      // Add ethics metadata
      const finalResult = {
        ...workflowResult,
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
            text: JSON.stringify(finalResult, null, 2),
          },
        ],
        metadata: {
          ethicsReviewed: true,
          ethicsComplianceScore: ethicsCheck.ethicsCheck.complianceScore,
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing workflow: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Clear workflows and state
    this.workflows.clear();
    this.state.clear();
  }
}

// Export singleton instance
export const potemkinEngine = new PotemkinEngine();

}
}
}
}
}
}