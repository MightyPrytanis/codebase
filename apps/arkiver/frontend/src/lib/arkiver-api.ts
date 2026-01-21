/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Arkiver API Client
 * Handles all API calls to the Cyrano MCP HTTP bridge for Arkiver operations
 */

const API_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';

export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  status?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface JobStatus {
  success: boolean;
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileId: string;
  startedAt?: string;
  completedAt?: string;
  result?: {
    insights: Insight[];
    metadata: {
      pageCount?: number;
      wordCount?: number;
      processingTime: number;
      extractorsUsed: string[];
      processorsUsed: string[];
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface Insight {
  insightId: string;
  fileId: string;
  title: string;
  content: string;
  sourceLLM: string;
  tags: string[];
  entities: Record<string, any>;
  citations: string[];
  confidence: number;
  createdAt: string;
  caseId?: string;
  pageNumber?: number;
}

export interface IntegrityTestResult {
  success: boolean;
  testId: string;
  status: 'completed' | 'queued';
  results?: {
    testType: string;
    insightsTested: number;
    passed: number;
    failed: number;
    warnings: number;
    details: Array<{
      insightId: string;
      status: 'passed' | 'failed' | 'warning';
      score?: number;
      issues?: string[];
      recommendations?: string[];
    }>;
  };
}

/**
 * Execute a Cyrano MCP tool (internal helper)
 */
async function executeToolInternal(
  tool: string,
  args: Record<string, any> = {}
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool,
        arguments: args,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.content && result.content[0]?.text) {
      try {
        return JSON.parse(result.content[0].text);
      } catch {
        return result.content[0].text;
      }
    }
    return result;
  } catch (error) {
    console.error(`Error executing tool ${tool}:`, error);
    throw error;
  }
}

/**
 * Upload a file to Cyrano
 */
export async function uploadFile(
  file: File,
  metadata?: {
    caseId?: string;
    tags?: string[];
    description?: string;
  }
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  try {
    const response = await fetch(`${API_URL}/api/arkiver/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || {
          code: 'UPLOAD_FAILED',
          message: `Upload failed: ${response.statusText}`,
        },
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
}

/**
 * Process a file (async job pattern)
 */
export async function processFile(
  fileId: string,
  processingSettings: {
    extractionMode: 'standard' | 'deep' | 'fast';
    enableOCR?: boolean;
    categories?: string[];
    extractCitations?: boolean;
    extractEntities?: boolean;
    extractTimeline?: boolean;
    caseId?: string;
    jurisdiction?: 'michigan' | 'federal' | 'bluebook' | 'auto';
    useLLM?: boolean;
    llmProvider?: 'perplexity' | 'anthropic' | 'openai';
    insightType?: 'general' | 'legal' | 'medical' | 'business';
    customPrompt?: string;
  }
): Promise<{ success: boolean; jobId?: string; error?: any }> {
  try {
    const result = await executeToolInternal('arkiver_process_file', {
      fileId,
      processingSettings,
    });
    return result;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PROCESSING_FAILED',
        message: error instanceof Error ? error.message : 'Processing failed',
      },
    };
  }
}

/**
 * Check job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  try {
    const result = await executeToolInternal('arkiver_job_status', { jobId });
    return result;
  } catch (error) {
    return {
      success: false,
      jobId,
      status: 'failed',
      progress: 0,
      fileId: '',
      error: {
        code: 'STATUS_CHECK_FAILED',
        message: error instanceof Error ? error.message : 'Status check failed',
      },
    };
  }
}

/**
 * Query insights with filters
 */
export async function queryInsights(filters: {
  keywords?: string;
  sourceLLM?: string;
  tags?: string[];
  fileId?: string;
  caseId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minConfidence?: number;
  sort?: {
    field: 'createdAt' | 'confidence' | 'relevance';
    order: 'asc' | 'desc';
  };
  pagination?: {
    limit: number;
    offset: number;
  };
}): Promise<{ success: boolean; insights?: Insight[]; total?: number; pagination?: any }> {
  try {
    const result = await executeToolInternal('arkiver_query_insights', { filters });
    return result;
  } catch (error) {
    return {
      success: false,
      insights: [],
      total: 0,
    };
  }
}

/**
 * Store an insight
 */
export async function storeInsight(
  fileId: string,
  insight: {
    title: string;
    content: string;
    sourceLLM: string;
    tags?: string[];
    entities?: Record<string, any>;
    citations?: string[];
    confidence?: number;
    pageNumber?: number;
    caseId?: string;
  }
): Promise<{ success: boolean; insightId?: string; error?: any }> {
  try {
    const result = await executeToolInternal('arkiver_store_insight', {
      fileId,
      insight,
    });
    return result;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'STORE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to store insight',
      },
    };
  }
}

/**
 * Run integrity test
 */
export async function runIntegrityTest(params: {
  testType: 'opinion_drift' | 'bias' | 'honesty' | 'ten_rules' | 'fact_check';
  insightIds: string[];
  fileId?: string;
  llmSource: string;
  parameters?: Record<string, any>;
}): Promise<IntegrityTestResult> {
  try {
    const result = await executeToolInternal('arkiver_integrity_test', params);
    return result;
  } catch (error) {
    return {
      success: false,
      testId: '',
      status: 'completed',
      results: {
        testType: params.testType,
        insightsTested: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        details: [],
      },
    };
  }
}

/**
 * Get file status
 */
export async function getFileStatus(fileId: string): Promise<{
  success: boolean;
  file?: {
    fileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    status: 'uploaded' | 'processing' | 'processed' | 'failed';
    processingJobId?: string;
    error?: string;
  };
}> {
  try {
    const response = await fetch(`${API_URL}/api/arkiver/files/${fileId}`);
    if (!response.ok) {
      return { success: false };
    }
    return await response.json();
  } catch (error) {
    return { success: false };
  }
}

/**
 * Execute a generic Cyrano tool (for AI Assistant)
 */
export async function executeTool(
  tool: string,
  args: Record<string, any> = {}
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool,
        arguments: args,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.content && result.content[0]?.text) {
      try {
        return JSON.parse(result.content[0].text);
      } catch {
        return result.content[0].text;
      }
    }
    return result;
  } catch (error) {
    console.error(`Error executing tool ${tool}:`, error);
    throw error;
  }
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
