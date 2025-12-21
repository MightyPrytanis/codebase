/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Drafting Mode Executor
 * Implements end-to-end workflows for different drafting modes
 */

import { DraftingModeId, getDraftingMode, isModeAvailable } from './drafting-mode-registry.js';
import {
  DocumentState,
  DocumentWorkflowState,
  createTransition,
  isValidTransition,
  getStateCategory,
} from './document-state-machine.js';
import { logStateTransition } from './state-transition-log.js';
import { documentAnalyzer } from '../../tools/document-analyzer.js';
import { documentDrafterTool } from '../../tools/document-drafter.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getTextFromResult } from '../../utils/mcp-helpers.js';

export interface DraftingContext {
  documentId: string;
  matterId?: string;
  documentType: string;
  documentText?: string;
  userId: string;
  jurisdiction?: string;
  caseContext?: string;
}

export interface DraftingResult {
  success: boolean;
  documentId: string;
  currentState: DocumentState;
  result?: any;
  error?: string;
}

/**
 * Execute Mode A: Auto-draft for review
 * 
 * Workflow:
 * 1. Document is ingested and classified
 * 2. Run analysis
 * 3. Generate draft response automatically
 * 4. Store draft in document system
 * 5. Surface in "Draft Preparation → Drafts Ready" and "Attorney Review → Awaiting"
 */
export async function executeModeA(context: DraftingContext): Promise<DraftingResult> {
  if (!isModeAvailable('auto-draft')) {
    return {
      success: false,
      documentId: context.documentId,
      currentState: 'ingested',
      error: 'Auto-draft mode is not available',
    };
  }

  try {
    let currentState: DocumentState = 'ingested';
    const stateHistory: DocumentWorkflowState['history'] = [];

    // Step 1: Classify (assumed already done, but verify)
    if (currentState === 'ingested') {
      const transition = createTransition('ingested', 'classified', context.userId, 'Auto-classification');
      stateHistory.push(transition);
      currentState = 'classified';
      logStateTransition(context.documentId, transition);
    }

    // Step 2: Analysis Pending → Analysis Complete
    if (currentState === 'classified') {
      const transition = createTransition('classified', 'analysis_pending', context.userId, 'Starting analysis');
      stateHistory.push(transition);
      currentState = 'analysis_pending';
      logStateTransition(context.documentId, transition);

      // Perform analysis
      if (context.documentText) {
        const analysisResult = await documentAnalyzer.execute({
          document_text: context.documentText,
          analysis_type: 'comprehensive',
        });

        if (analysisResult.isError) {
          return {
            success: false,
            documentId: context.documentId,
            currentState: 'analysis_pending',
            error: `Analysis failed: ${getTextFromResult(analysisResult) || 'Unknown error'}`,
          };
        }

        const transition2 = createTransition('analysis_pending', 'analysis_complete', context.userId, 'Analysis completed');
        stateHistory.push(transition2);
        currentState = 'analysis_complete';
        logStateTransition(context.documentId, transition2);
      }
    }

    // Step 3: Mode Selected → Draft Pending
    if (currentState === 'analysis_complete') {
      const transition = createTransition('analysis_complete', 'mode_selected', context.userId, 'Mode A selected');
      stateHistory.push(transition);
      currentState = 'mode_selected';
      logStateTransition(context.documentId, transition);

      const transition2 = createTransition('mode_selected', 'draft_pending', context.userId, 'Starting draft generation');
      stateHistory.push(transition2);
      currentState = 'draft_pending';
      logStateTransition(context.documentId, transition2);
    }

    // Step 4: Generate Draft
    if (currentState === 'draft_pending') {
      const draftPrompt = context.documentText
        ? `Based on the following document, draft a response:\n\n${context.documentText.substring(0, 2000)}`
        : `Draft a ${context.documentType} document${context.caseContext ? ` for case: ${context.caseContext}` : ''}`;

      const draftResult = await documentDrafterTool.execute({
        prompt: draftPrompt,
        documentType: context.documentType as any,
        caseContext: context.caseContext,
        jurisdiction: context.jurisdiction,
        aiProvider: 'auto',
      });

      if (draftResult.isError) {
        return {
          success: false,
          documentId: context.documentId,
          currentState: 'draft_pending',
          error: `Draft generation failed: ${getTextFromResult(draftResult) || 'Unknown error'}`,
        };
      }

      // Step 5: Draft Ready → Attorney Review Pending
      const transition = createTransition('draft_pending', 'draft_ready', context.userId, 'Draft generated');
      stateHistory.push(transition);
      currentState = 'draft_ready';
      logStateTransition(context.documentId, transition);

      const transition2 = createTransition('draft_ready', 'attorney_review_pending', context.userId, 'Ready for review');
      stateHistory.push(transition2);
      currentState = 'attorney_review_pending';
      logStateTransition(context.documentId, transition2);

      return {
        success: true,
        documentId: context.documentId,
        currentState: 'attorney_review_pending',
        result: {
          draftContent: getTextFromResult(draftResult),
          stateHistory,
        },
      };
    }

    return {
      success: false,
      documentId: context.documentId,
      currentState,
      error: 'Unexpected state in Mode A workflow',
    };
  } catch (error) {
    return {
      success: false,
      documentId: context.documentId,
      currentState: 'ingested',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Execute Mode B: Summarize → Discuss → Draft
 * 
 * Workflow:
 * 1. Document is ingested and classified
 * 2. Generate structured summary
 * 3. Show summary in AI Analysis panel
 * 4. Allow interactive Q&A
 * 5. On user command ("Generate draft response"), run same drafting pipeline as Mode A
 */
export interface ModeBState {
  documentId: string;
  summary?: string;
  qaHistory?: Array<{ question: string; answer: string; timestamp: string }>;
  readyToDraft: boolean;
}

export async function executeModeBSummary(context: DraftingContext): Promise<DraftingResult & { summary?: string }> {
  if (!isModeAvailable('summarize-discuss-draft')) {
    return {
      success: false,
      documentId: context.documentId,
      currentState: 'ingested',
      error: 'Summarize-discuss-draft mode is not available',
    };
  }

  try {
    let currentState: DocumentState = 'ingested';

    // Step 1: Classify
    if (currentState === 'ingested') {
      const transition = createTransition('ingested', 'classified', context.userId, 'Auto-classification');
      currentState = 'classified';
      logStateTransition(context.documentId, transition);
    }

    // Step 2: Analysis Pending → Analysis Complete (Generate Summary)
    if (currentState === 'classified') {
      const transition = createTransition('classified', 'analysis_pending', context.userId, 'Generating summary');
      currentState = 'analysis_pending';
      logStateTransition(context.documentId, transition);

      if (context.documentText) {
        // Generate summary
        const analysisResult = await documentAnalyzer.execute({
          document_text: context.documentText,
          analysis_type: 'summary',
        });

        if (analysisResult.isError) {
          return {
            success: false,
            documentId: context.documentId,
            currentState: 'analysis_pending',
            error: `Summary generation failed: ${getTextFromResult(analysisResult) || 'Unknown error'}`,
          };
        }

        const summary = getTextFromResult(analysisResult) || '';

        const transition2 = createTransition('analysis_pending', 'analysis_complete', context.userId, 'Summary generated');
        currentState = 'analysis_complete';
        logStateTransition(context.documentId, transition2);

        return {
          success: true,
          documentId: context.documentId,
          currentState: 'analysis_complete',
          result: {
            summary,
            readyForQA: true,
          },
        };
      }
    }

    return {
      success: false,
      documentId: context.documentId,
      currentState,
      error: 'Unexpected state in Mode B summary workflow',
    };
  } catch (error) {
    return {
      success: false,
      documentId: context.documentId,
      currentState: 'ingested',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Execute Mode B: Generate Draft (after Q&A)
 * Called when user clicks "Generate draft response"
 */
export async function executeModeBDraft(context: DraftingContext, summary: string, qaHistory?: Array<{ question: string; answer: string }>): Promise<DraftingResult> {
  try {
    let currentState: DocumentState = 'analysis_complete';

    // Step 1: Mode Selected → Draft Pending
    if (currentState === 'analysis_complete') {
      const transition = createTransition('analysis_complete', 'mode_selected', context.userId, 'Mode B selected, user requested draft');
      currentState = 'mode_selected';
      logStateTransition(context.documentId, transition);

      const transition2 = createTransition('mode_selected', 'draft_pending', context.userId, 'Starting draft generation');
      currentState = 'draft_pending';
      logStateTransition(context.documentId, transition2);
    }

    // Step 2: Generate Draft (same as Mode A)
    if (currentState === 'draft_pending') {
      // Include summary and Q&A in prompt
      let draftPrompt = `Based on the following summary, draft a ${context.documentType} response:\n\nSummary:\n${summary}`;
      
      if (qaHistory && qaHistory.length > 0) {
        draftPrompt += '\n\nQ&A Context:\n';
        qaHistory.forEach((qa, idx) => {
          draftPrompt += `Q${idx + 1}: ${qa.question}\nA${idx + 1}: ${qa.answer}\n\n`;
        });
      }

      if (context.caseContext) {
        draftPrompt += `\nCase: ${context.caseContext}`;
      }

      const draftResult = await documentDrafterTool.execute({
        prompt: draftPrompt,
        documentType: context.documentType as any,
        caseContext: context.caseContext,
        jurisdiction: context.jurisdiction,
        aiProvider: 'auto',
      });

      if (draftResult.isError) {
        return {
          success: false,
          documentId: context.documentId,
          currentState: 'draft_pending',
          error: `Draft generation failed: ${getTextFromResult(draftResult) || 'Unknown error'}`,
        };
      }

      // Step 3: Draft Ready → Attorney Review Pending
      const transition = createTransition('draft_pending', 'draft_ready', context.userId, 'Draft generated');
      currentState = 'draft_ready';
      logStateTransition(context.documentId, transition);

      const transition2 = createTransition('draft_ready', 'attorney_review_pending', context.userId, 'Ready for review');
      currentState = 'attorney_review_pending';
      logStateTransition(context.documentId, transition2);

      return {
        success: true,
        documentId: context.documentId,
        currentState: 'attorney_review_pending',
        result: {
          draftContent: getTextFromResult(draftResult),
        },
      };
    }

    return {
      success: false,
      documentId: context.documentId,
      currentState,
      error: 'Unexpected state in Mode B draft workflow',
    };
  } catch (error) {
    return {
      success: false,
      documentId: context.documentId,
      currentState: 'analysis_complete',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}


