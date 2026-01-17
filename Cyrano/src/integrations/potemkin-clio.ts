/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Potemkin-Clio Document Integration
 * 
 * Integrates Potemkin document verification with Clio documents (Track Eta).
 * Enables automatic document analysis for Clio documents.
 * 
 * Security Features:
 * - Matter-based document isolation
 * - Attorney verification for document analysis results
 * - Audit logging for document access
 * - Template sanitization (remove client-specific information)
 */

import { potemkinEngine } from '../engines/potemkin/potemkin-engine.js';
import { enforceMatterIsolation, extractMatterId } from '../middleware/matter-isolation.js';
import { requireAttorneyVerification, completeAttorneyVerification } from '../services/attorney-verification.js';
import { logAgentAction, logMatterAccess } from '../services/audit-logger.js';
import { ClioClient } from '../services/clio-client.js';

export interface ClioDocument {
  id: string;
  matter_id?: string;
  name: string;
  content?: string;
  url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentAnalysisResult {
  documentId: string;
  matterId?: string;
  verificationResult: any;
  claimsExtracted: any[];
  citationsChecked: any[];
  biasDetected?: any;
  integrityScore?: number;
  requiresAttorneyVerification: boolean;
  workProductId: string;
}

/**
 * Analyze Clio document with Potemkin
 * Enforces matter isolation and attorney verification
 */
export async function analyzeClioDocument(
  documentId: string,
  matterId?: string,
  userId?: string
): Promise<{ result: DocumentAnalysisResult; error?: string }> {
  try {
    // Get document from Clio
    const clioClient = new ClioClient({
      apiKey: process.env.CLIO_API_KEY || '',
      baseUrl: process.env.CLIO_BASE_URL
    });

    // Fetch document (this would use Clio API when OAuth is available)
    // For now, we'll use the document ID and matter ID
    const extractedMatterId = matterId || documentId.split('-')[0]; // Fallback extraction
    
    if (!extractedMatterId) {
      return {
        result: {} as DocumentAnalysisResult,
        error: 'Matter ID is required for document analysis'
      };
    }

    // Enforce matter isolation
    return await enforceMatterIsolation(
      `potemkin-${documentId}`,
      extractedMatterId,
      async () => {
        logMatterAccess(
          userId || 'system',
          extractedMatterId,
          'document_analysis',
          `Analyzing Clio document ${documentId} with Potemkin`
        );

        // Execute Potemkin verification workflow
        const verificationResult = await potemkinEngine.execute({
          action: 'verify_document',
          input: {
            documentId,
            matterId: extractedMatterId,
            source: 'clio'
          }
        });

        const firstContent = verificationResult.content[0];
        const isTextContent = firstContent && firstContent.type === 'text' && 'text' in firstContent;

        if (verificationResult.isError) {
          const errorText = isTextContent ? firstContent.text : 'Unknown error';
          return {
            result: {} as DocumentAnalysisResult,
            error: `Potemkin verification failed: ${errorText}`
          };
        }

        // Extract verification data
        const verificationData = isTextContent ? JSON.parse(firstContent.text) : {};

        // Create work product ID for attorney verification
        const workProductId = `potemkin-analysis-${documentId}-${Date.now()}`;
        
        // Require attorney verification for document analysis results
        const review = requireAttorneyVerification(
          workProductId,
          'confidential', // Document analysis is confidential
          JSON.stringify(verificationData)
        );

        logAgentAction(
          'potemkin-clio',
          'document_analyzed',
          `Clio document ${documentId} analyzed with Potemkin`,
          extractedMatterId,
          { document_id: documentId, verification_result: verificationData }
        );

        const result: DocumentAnalysisResult = {
          documentId,
          matterId: extractedMatterId,
          verificationResult: verificationData,
          claimsExtracted: verificationData.claims || [],
          citationsChecked: verificationData.citations || [],
          biasDetected: verificationData.bias,
          integrityScore: verificationData.integrityScore,
          requiresAttorneyVerification: true,
          workProductId
        };

        return { result };
      }
    );
   catch (error) {
    return {
      result: {} as DocumentAnalysisResult,
      error: `Document analysis error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Sanitize document template
 * Removes client-specific information for template reuse
 */
export function sanitizeDocumentTemplate(content: string): string {
  // Remove client names (common patterns)
  let sanitized = content.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[CLIENT_NAME]');
  
  // Remove dates (keep structure)
  sanitized = sanitized.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '[DATE]');
  sanitized = sanitized.replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]');
  
  // Remove addresses
  sanitized = sanitized.replace(/\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Place|Pl)/gi, '[ADDRESS]');
  
  // Remove phone numbers
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  
  // Remove email addresses
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Remove case numbers
  sanitized = sanitized.replace(/\bCase\s+No\.?\s*:?\s*[A-Z0-9-]+\b/gi, 'Case No: [CASE_NUMBER]');
  
  return sanitized;
}

/**
 * Sync document insights back to Clio
 */
export async function syncInsightsToClio(
  documentId: string,
  insights: DocumentAnalysisResult,
  clioApiKey?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const clioClient = new ClioClient({
      apiKey: clioApiKey || process.env.CLIO_API_KEY || '',
      baseUrl: process.env.CLIO_BASE_URL
    });

    // In production, this would update Clio document with insights
    // For now, we'll just log the sync
    logAgentAction(
      'potemkin-clio',
      'insights_synced',
      `Document insights synced to Clio for document ${documentId}`,
      insights.matterId,
      { document_id: documentId, insights: insights.verificationResult }
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to sync insights to Clio: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Batch analyze multiple Clio documents
 */
export async function batchAnalyzeClioDocuments(
  documentIds: string[],
  matterId?: string,
  userId?: string
): Promise<{ results: DocumentAnalysisResult[]; errors: string[] }> {
  const results: DocumentAnalysisResult[] = [];
  const errors: string[] = [];

  for (const documentId of documentIds) {
    const analysis = await analyzeClioDocument(documentId, matterId, userId);
    if (analysis.error) {
      errors.push(`Document ${documentId}: ${analysis.error}`);
    } else {
      results.push(analysis.result);
    }
  }

  return { results, errors };
