/**
 * Database-backed Job Queue for Arkiver
 * 
 * Implements async job processing using PostgreSQL as queue backend.
 * No Redis dependency - simpler deployment for MVP.
 * 
 * Created: 2025-11-22
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { db } from '../../../db.js';
import { arkiverJobs, type ArkiverJob, type NewArkiverJob } from '../schema.js';
import { eq, and, or, lt, isNull } from 'drizzle-orm';

/**
 * Job status enum
 */
export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Job type enum
 */
export enum JobType {
  FILE_EXTRACTION = 'file_extraction',
  INSIGHT_PROCESSING = 'insight_processing',
  INTEGRITY_TEST = 'integrity_test',
  FILE_CLEANUP = 'file_cleanup',
}

/**
 * Job configuration
 */
export interface JobConfig {
  extractionType?: string;
  processingSteps?: string[];
  timeout?: number;
  retryCount?: number;
  [key: string]: any;
}

/**
 * Job result
 */
export interface JobResult {
  insightsCreated?: number;
  processingTime?: number;
  summary?: string;
  [key: string]: any;
}

/**
 * Job error (contract-compliant)
 */
export interface JobError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Job creation options
 */
export interface CreateJobOptions {
  fileId?: string;
  type: JobType | string;
  config?: JobConfig;
  maxAttempts?: number;
}

/**
 * Job queue interface
 */
export interface JobQueue {
  createJob(options: CreateJobOptions): Promise<string>; // Returns jobId
  getJob(jobId: string): Promise<ArkiverJob | null>;
  updateJobStatus(jobId: string, status: JobStatus, progress?: number): Promise<boolean>;
  updateJobProgress(jobId: string, progress: number): Promise<boolean>;
  completeJob(jobId: string, result: JobResult): Promise<boolean>;
  failJob(jobId: string, error: JobError): Promise<boolean>;
  cancelJob(jobId: string): Promise<boolean>;
  getNextJob(): Promise<ArkiverJob | null>;
  retryJob(jobId: string): Promise<boolean>;
  cleanupOldJobs(olderThanDays: number): Promise<number>; // Returns count deleted
}

/**
 * Database job queue implementation
 */
export class DatabaseJobQueue implements JobQueue {
  private pollIntervalMs: number;
  private processingTimeoutMs: number;

  constructor(options?: {
    pollIntervalMs?: number;
    processingTimeoutMs?: number;
  }) {
    this.pollIntervalMs = options?.pollIntervalMs || 2000; // 2 seconds default
    this.processingTimeoutMs = options?.processingTimeoutMs || 300000; // 5 minutes default
  }

  /**
   * Create a new job
   */
  async createJob(options: CreateJobOptions): Promise<string> {
    const newJob: NewArkiverJob = {
      fileId: options.fileId || null,
      type: options.type,
      status: JobStatus.QUEUED,
      progress: 0,
      config: options.config || {},
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
    };

    const [created] = await db.insert(arkiverJobs).values(newJob).returning();
    return created.id;
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<ArkiverJob | null> {
    const [job] = await db
      .select()
      .from(arkiverJobs)
      .where(eq(arkiverJobs.id, jobId))
      .limit(1);

    return job || null;
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: JobStatus, progress?: number): Promise<boolean> {
    try {
      const updates: Partial<ArkiverJob> = {
        status,
      };

      if (progress !== undefined) {
        updates.progress = progress;
      }

      if (status === JobStatus.PROCESSING) {
        updates.startedAt = new Date();
        updates.lastAttemptAt = new Date();
      }

      await db.update(arkiverJobs).set(updates).where(eq(arkiverJobs.id, jobId));

      return true;
    } catch (error) {
      console.error(`Failed to update job status for ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(jobId: string, progress: number): Promise<boolean> {
    try {
      await db
        .update(arkiverJobs)
        .set({
          progress: Math.min(100, Math.max(0, progress)),
        })
        .where(eq(arkiverJobs.id, jobId));

      return true;
    } catch (error) {
      console.error(`Failed to update job progress for ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Complete a job with results
   */
  async completeJob(jobId: string, result: JobResult): Promise<boolean> {
    try {
      await db
        .update(arkiverJobs)
        .set({
          status: JobStatus.COMPLETED,
          progress: 100,
          result,
          completedAt: new Date(),
        })
        .where(eq(arkiverJobs.id, jobId));

      return true;
    } catch (error) {
      console.error(`Failed to complete job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Fail a job with error details
   */
  async failJob(jobId: string, error: JobError): Promise<boolean> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        return false;
      }

      const shouldRetry = job.attempts < job.maxAttempts;

      await db
        .update(arkiverJobs)
        .set({
          status: shouldRetry ? JobStatus.QUEUED : JobStatus.FAILED,
          error,
          attempts: job.attempts + 1,
          lastAttemptAt: new Date(),
          completedAt: shouldRetry ? null : new Date(),
        })
        .where(eq(arkiverJobs.id, jobId));

      return true;
    } catch (err) {
      console.error(`Failed to fail job ${jobId}:`, err);
      return false;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      await db
        .update(arkiverJobs)
        .set({
          status: JobStatus.CANCELLED,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(arkiverJobs.id, jobId),
            or(
              eq(arkiverJobs.status, JobStatus.QUEUED),
              eq(arkiverJobs.status, JobStatus.PROCESSING)
            )
          )
        );

      return true;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get the next queued job
   * Also handles stale jobs (stuck in processing for too long)
   */
  async getNextJob(): Promise<ArkiverJob | null> {
    try {
      // First, reset any stale jobs (stuck in processing for too long)
      const staleThreshold = new Date(Date.now() - this.processingTimeoutMs);
      await db
        .update(arkiverJobs)
        .set({
          status: JobStatus.QUEUED,
        })
        .where(
          and(
            eq(arkiverJobs.status, JobStatus.PROCESSING),
            lt(arkiverJobs.startedAt, staleThreshold)
          )
        );

      // Get next queued job (FIFO order)
      const [nextJob] = await db
        .select()
        .from(arkiverJobs)
        .where(eq(arkiverJobs.status, JobStatus.QUEUED))
        .orderBy(arkiverJobs.createdAt)
        .limit(1);

      return nextJob || null;
    } catch (error) {
      console.error('Failed to get next job:', error);
      return null;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.getJob(jobId);
      if (!job || job.status !== JobStatus.FAILED) {
        return false;
      }

      await db
        .update(arkiverJobs)
        .set({
          status: JobStatus.QUEUED,
          progress: 0,
          error: null,
          attempts: 0, // Reset attempts
          completedAt: null,
        })
        .where(eq(arkiverJobs.id, jobId));

      return true;
    } catch (error) {
      console.error(`Failed to retry job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deleted = await db
        .delete(arkiverJobs)
        .where(
          and(
            or(
              eq(arkiverJobs.status, JobStatus.COMPLETED),
              eq(arkiverJobs.status, JobStatus.FAILED),
              eq(arkiverJobs.status, JobStatus.CANCELLED)
            ),
            lt(arkiverJobs.completedAt, cutoffDate)
          )
        );

      return deleted.length || 0;
    } catch (error) {
      console.error('Failed to cleanup old jobs:', error);
      return 0;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    try {
      const jobs = await db.select().from(arkiverJobs);

      return {
        queued: jobs.filter((j) => j.status === JobStatus.QUEUED).length,
        processing: jobs.filter((j) => j.status === JobStatus.PROCESSING).length,
        completed: jobs.filter((j) => j.status === JobStatus.COMPLETED).length,
        failed: jobs.filter((j) => j.status === JobStatus.FAILED).length,
        cancelled: jobs.filter((j) => j.status === JobStatus.CANCELLED).length,
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return { queued: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 };
    }
  }
}

/**
 * Job worker - processes jobs from the queue
 */
export class JobWorker {
  private queue: JobQueue;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private handlers: Map<string, (job: ArkiverJob) => Promise<JobResult>>;

  constructor(queue: JobQueue) {
    this.queue = queue;
    this.handlers = new Map();
  }

  /**
   * Register a job handler
   */
  registerHandler(jobType: string, handler: (job: ArkiverJob) => Promise<JobResult>) {
    this.handlers.set(jobType, handler);
  }

  /**
   * Start the worker
   */
  start(pollIntervalMs: number = 2000) {
    if (this.isRunning) {
      console.warn('Worker already running');
      return;
    }

    this.isRunning = true;
    console.log('Job worker started');

    this.pollInterval = setInterval(async () => {
      await this.processNextJob();
    }, pollIntervalMs);

    // Process immediately on start
    this.processNextJob();
  }

  /**
   * Stop the worker
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    console.log('Job worker stopped');
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob() {
    if (!this.isRunning) {
      return;
    }

    try {
      const job = await this.queue.getNextJob();

      if (!job) {
        return; // No jobs available
      }

      const handler = this.handlers.get(job.type);

      if (!handler) {
        await this.queue.failJob(job.id, {
          code: 'NO_HANDLER',
          message: `No handler registered for job type: ${job.type}`,
        });
        return;
      }

      // Mark as processing
      await this.queue.updateJobStatus(job.id, JobStatus.PROCESSING);

      try {
        // Execute handler
        const result = await handler(job);

        // Mark as completed
        await this.queue.completeJob(job.id, result);
      } catch (error) {
        // Mark as failed
        await this.queue.failJob(job.id, {
          code: 'HANDLER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined,
        });
      }
    } catch (error) {
      console.error('Error processing job:', error);
    }
  }
}

/**
 * Default job queue instance
 */
export const defaultJobQueue = new DatabaseJobQueue({
  pollIntervalMs: 2000,
  processingTimeoutMs: 300000, // 5 minutes
});
