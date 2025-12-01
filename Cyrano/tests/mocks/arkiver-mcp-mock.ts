/**
 * Mock MCP Server for Arkiver
 * 
 * Implements the 5 MCP tools from ARKIVER_MCP_INTERFACE_CONTRACT.md
 * Enables independent development and testing without waiting for Cursor
 * 
 * Created: 2025-11-22
 */

import { EventEmitter } from 'events';

/**
 * Contract types (from ARKIVER_MCP_INTERFACE_CONTRACT.md)
 */

export interface ExtractionSettings {
  extractionMode: 'standard' | 'deep' | 'fast';
  enableOCR?: boolean;
  extractEntities?: boolean;
  extractCitations?: boolean;
  extractTimeline?: boolean;
  categories?: string[];
}

export interface Insight {
  insightId: string;
  title: string;
  type: string;
  content: string;
  context?: string;
  entities?: Record<string, any>;
  citations?: string[];
  confidence?: number;
  caseId?: string;
}

export interface ProcessFileParams {
  filePath: string;
  fileName: string;
  fileType: string;
  settings?: ExtractionSettings;
}

export interface ProcessFileResult {
  jobId: string;
  status: 'queued' | 'processing';
  message: string;
}

export interface JobStatusParams {
  jobId: string;
}

export interface JobStatusResult {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    insights: Insight[];
    metadata: {
      totalInsights: number;
      processingTime: number;
      extractionMode: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface StoreInsightParams {
  fileId: string;
  insight: Omit<Insight, 'insightId'>;
}

export interface StoreInsightResult {
  insightId: string;
  success: boolean;
  message: string;
}

export interface QueryInsightsParams {
  fileId?: string;
  type?: string;
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface QueryInsightsResult {
  insights: Insight[];
  total: number;
  limit: number;
  offset: number;
}

export interface IntegrityTestParams {
  testType: 'opinion_drift' | 'bias_detection' | 'honesty_assessment' | 'ten_rules_compliance';
  targetLLM: string;
  topic?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface IntegrityTestResult {
  testId: string;
  status: 'running' | 'completed' | 'failed';
  score?: number;
  findings?: string;
  recommendations?: string[];
}

/**
 * Mock MCP Server
 * Simulates async behavior with realistic delays and state transitions
 */
export class MockMCPServer extends EventEmitter {
  private jobs: Map<string, JobStatusResult>;
  private insights: Map<string, Insight>;
  private jobCounter: number = 0;
  private insightCounter: number = 0;

  constructor() {
    super();
    this.jobs = new Map();
    this.insights = new Map();
  }

  /**
   * Tool 1: arkiver_process_file
   * Queues a file for processing and returns a job ID
   */
  async processFile(params: ProcessFileParams): Promise<ProcessFileResult> {
    // Validate parameters
    if (!params.filePath || !params.fileName || !params.fileType) {
      throw new Error('Missing required parameters: filePath, fileName, fileType');
    }

    // Generate job ID
    const jobId = `job_${++this.jobCounter}_${Date.now()}`;

    // Create initial job status
    const jobStatus: JobStatusResult = {
      jobId,
      status: 'queued',
      progress: 0,
    };

    this.jobs.set(jobId, jobStatus);

    // Simulate async processing
    this.simulateProcessing(jobId, params);

    return {
      jobId,
      status: 'queued',
      message: `File ${params.fileName} queued for processing`,
    };
  }

  /**
   * Tool 2: arkiver_job_status
   * Polls the status of an async job
   */
  async getJobStatus(params: JobStatusParams): Promise<JobStatusResult> {
    const job = this.jobs.get(params.jobId);

    if (!job) {
      throw new Error(`Job not found: ${params.jobId}`);
    }

    return job;
  }

  /**
   * Tool 3: arkiver_store_insight
   * Manually creates/stores an insight
   */
  async storeInsight(params: StoreInsightParams): Promise<StoreInsightResult> {
    // Validate parameters
    if (!params.fileId || !params.insight) {
      throw new Error('Missing required parameters: fileId, insight');
    }

    if (!params.insight.title || !params.insight.type || !params.insight.content) {
      throw new Error('Insight must have title, type, and content');
    }

    // Generate insight ID
    const insightId = `insight_${++this.insightCounter}_${Date.now()}`;

    // Store insight
    const insight: Insight = {
      insightId,
      ...params.insight,
    };

    this.insights.set(insightId, insight);

    return {
      insightId,
      success: true,
      message: 'Insight stored successfully',
    };
  }

  /**
   * Tool 4: arkiver_query_insights
   * Searches/filters insights with pagination
   */
  async queryInsights(params: QueryInsightsParams): Promise<QueryInsightsResult> {
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    // Filter insights
    let results = Array.from(this.insights.values());

    if (params.fileId) {
      // Note: Mock doesn't track fileId, so this would filter nothing
      // In real implementation, this would filter by fileId
    }

    if (params.type) {
      results = results.filter((insight) => insight.type === params.type);
    }

    if (params.searchText) {
      const search = params.searchText.toLowerCase();
      results = results.filter(
        (insight) =>
          insight.title.toLowerCase().includes(search) ||
          insight.content.toLowerCase().includes(search)
      );
    }

    // Paginate
    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return {
      insights: paginated,
      total,
      limit,
      offset,
    };
  }

  /**
   * Tool 5: arkiver_integrity_test
   * Runs AI integrity monitoring tests
   */
  async runIntegrityTest(params: IntegrityTestParams): Promise<IntegrityTestResult> {
    // Validate parameters
    if (!params.testType || !params.targetLLM) {
      throw new Error('Missing required parameters: testType, targetLLM');
    }

    // Generate test ID
    const testId = `test_${Date.now()}`;

    // Simulate test execution
    this.simulateIntegrityTest(testId, params);

    return {
      testId,
      status: 'running',
    };
  }

  /**
   * HTTP endpoint simulation: POST /api/arkiver/upload
   */
  async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<{
    fileId: string;
    success: boolean;
    message: string;
  }> {
    // Simulate file upload
    const fileId = `file_${Date.now()}`;

    return {
      fileId,
      success: true,
      message: `File ${filename} uploaded successfully`,
    };
  }

  /**
   * Simulate async file processing
   */
  private async simulateProcessing(jobId: string, params: ProcessFileParams) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Transition to processing
    await this.delay(500);
    job.status = 'processing';
    job.progress = 10;
    this.emit('job:updated', job);

    // Simulate processing steps
    const steps = [20, 40, 60, 80, 90];
    for (const progress of steps) {
      await this.delay(1000);
      job.progress = progress;
      this.emit('job:updated', job);
    }

    // Determine extraction mode
    const mode = params.settings?.extractionMode || 'standard';
    const insightCount = mode === 'deep' ? 15 : mode === 'fast' ? 5 : 10;

    // Generate mock insights
    const insights: Insight[] = [];
    for (let i = 0; i < insightCount; i++) {
      const insight: Insight = {
        insightId: `insight_${++this.insightCounter}_${Date.now()}`,
        title: `Insight ${i + 1} from ${params.fileName}`,
        type: this.randomInsightType(),
        content: `This is mock insight content extracted from ${params.fileName}`,
        context: `Surrounding context for insight ${i + 1}`,
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      };

      insights.push(insight);
      this.insights.set(insight.insightId, insight);
    }

    // Complete job
    await this.delay(1000);
    job.status = 'completed';
    job.progress = 100;
    job.result = {
      insights,
      metadata: {
        totalInsights: insights.length,
        processingTime: 5000,
        extractionMode: mode,
      },
    };

    this.emit('job:completed', job);
  }

  /**
   * Simulate integrity test execution
   */
  private async simulateIntegrityTest(testId: string, params: IntegrityTestParams) {
    await this.delay(3000);

    const result: IntegrityTestResult = {
      testId,
      status: 'completed',
      score: Math.random() * 0.4 + 0.6, // 0.6-1.0
      findings: `Mock findings for ${params.testType} test on ${params.targetLLM}`,
      recommendations: [
        'Monitor for continued drift',
        'Review response patterns',
        'Consider alternative prompting strategies',
      ],
    };

    this.emit('integrity_test:completed', result);
  }

  /**
   * Helper: Random insight type
   */
  private randomInsightType(): string {
    const types = ['citation', 'entity', 'date', 'topic', 'summary', 'legal_principle'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Helper: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reset mock server state (for testing)
   */
  reset() {
    this.jobs.clear();
    this.insights.clear();
    this.jobCounter = 0;
    this.insightCounter = 0;
  }

  /**
   * Get server statistics (for debugging)
   */
  getStats() {
    return {
      totalJobs: this.jobs.size,
      totalInsights: this.insights.size,
      jobStatuses: {
        queued: Array.from(this.jobs.values()).filter((j) => j.status === 'queued').length,
        processing: Array.from(this.jobs.values()).filter((j) => j.status === 'processing').length,
        completed: Array.from(this.jobs.values()).filter((j) => j.status === 'completed').length,
        failed: Array.from(this.jobs.values()).filter((j) => j.status === 'failed').length,
      },
    };
  }
}

/**
 * Default mock server instance
 */
export const mockServer = new MockMCPServer();

/**
 * Example usage:
 * 
 * ```typescript
 * import { mockServer } from './tests/mocks/arkiver-mcp-mock';
 * 
 * // Process a file
 * const { jobId } = await mockServer.processFile({
 *   filePath: '/uploads/test.pdf',
 *   fileName: 'test.pdf',
 *   fileType: 'pdf',
 *   settings: {
 *     extractionMode: 'deep',
 *     extractEntities: true,
 *   },
 * });
 * 
 * // Poll job status
 * const status = await mockServer.getJobStatus({ jobId });
 * console.log(status.progress); // 0-100
 * 
 * // Query insights
 * const results = await mockServer.queryInsights({
 *   type: 'citation',
 *   limit: 10,
 * });
 * ```
 */
