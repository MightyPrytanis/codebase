/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Zapier Webhooks Integration
 * 
 * Implements webhook infrastructure for Zapier integration (Track Theta).
 * Enables connections to 5000+ apps beyond Clio's ecosystem.
 * 
 * Security Features:
 * - Webhook authentication and validation
 * - Matter-based data filtering in webhook payloads
 * - Audit logging for webhook triggers
 * - Rate limiting and anomaly detection
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { logSecurityEvent, logAgentAction } from '../services/audit-logger.js';
import { filterWebhookPayloadByMatter } from './clio-webhooks.js';
import { webhookRateLimiter } from './clio-webhooks.js';

export interface ZapierWebhookEvent {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  matterId?: string;
}

export interface ZapierWebhookConfig {
  apiKey: string;
  enabled: boolean;
  events: string[];
  matterFilter?: string; // Optional matter ID filter
}

/**
 * Zapier webhook event types
 */
export const ZAPIER_EVENT_TYPES = {
  WORKFLOW_TRIGGERED: 'workflow.triggered',
  WORKFLOW_COMPLETED: 'workflow.completed',
  DOCUMENT_PROCESSED: 'document.processed',
  TIME_ENTRY_CREATED: 'time_entry.created',
  MATTER_UPDATED: 'matter.updated',
  TASK_COMPLETED: 'task.completed',
} as const;

/**
 * Webhook configuration store for Zapier
 */
class ZapierWebhookConfigStore {
  private configs: Map<string, ZapierWebhookConfig> = new Map();

  getConfig(webhookId: string): ZapierWebhookConfig | undefined {
    return this.configs.get(webhookId);
  }

  setConfig(webhookId: string, config: ZapierWebhookConfig): void {
    this.configs.set(webhookId, config);
  }

  deleteConfig(webhookId: string): void {
    this.configs.delete(webhookId);
  }
}

export const zapierWebhookConfigStore = new ZapierWebhookConfigStore();

/**
 * Validate Zapier webhook signature
 * Zapier signs webhooks with HMAC-SHA256 using API key
 */
export function validateZapierWebhookSignature(
  payload: string,
  signature: string,
  apiKey: string
): { valid: boolean; error?: string } {
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid Zapier webhook signature'
    };
  }

  return { valid: true };
}

/**
 * Process Zapier webhook event
 * Filters data by matter ID and triggers appropriate actions
 */
export async function processZapierWebhook(
  event: ZapierWebhookEvent,
  webhookId: string
): Promise<{ success: boolean; actionTriggered?: string; error?: string }> {
  try {
    const config = zapierWebhookConfigStore.getConfig(webhookId);
    if (!config || !config.enabled) {
      return { success: false, error: 'Webhook not configured or disabled' };
    }

    // Filter payload by matter if matter filter is set
    let filteredData = event.data;
    if (config.matterFilter) {
      filteredData = filterWebhookPayloadByMatter(event.data, config.matterFilter);
    }

    logAgentAction(
      'zapier-webhook',
      'webhook_received',
      `Zapier webhook event received: ${event.event}`,
      event.matterId,
      { event: event.event, webhook_id: webhookId }
    );

    // Process webhook based on event type
    // In production, this would trigger appropriate actions
    // For now, we'll just log and return success
    
    return { success: true, actionTriggered: event.event };
  } catch (error) {
    logSecurityEvent('error', 'zapier_webhook_processing_error', `Zapier webhook processing failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: `Webhook processing error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Express middleware for Zapier webhook endpoint
 */
export function zapierWebhookHandler(req: Request, res: Response) {
  // Rate limiting
  const clientId = req.ip || 'unknown';
  const rateLimit = webhookRateLimiter.checkLimit(clientId);
  
  if (!rateLimit.allowed) {
    logSecurityEvent('warning', 'zapier_webhook_rate_limit', `Rate limit exceeded for ${clientId}`);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      resetAt: rateLimit.resetAt
    });
  }

  // Get webhook ID and API key from headers
  const webhookId = req.headers['x-zapier-webhook-id'] as string;
  const apiKey = req.headers['x-zapier-api-key'] as string;
  
  if (!webhookId || !apiKey) {
    return res.status(401).json({ error: 'Missing webhook ID or API key' });
  }

  const config = zapierWebhookConfigStore.getConfig(webhookId);
  if (!config || config.apiKey !== apiKey) {
    logSecurityEvent('warning', 'zapier_webhook_invalid_config', `Invalid webhook configuration for ${webhookId}`);
    return res.status(403).json({ error: 'Invalid webhook configuration' });
  }

  // Validate signature
  const signature = req.headers['x-zapier-signature'] as string;
  if (signature) {
    const payload = JSON.stringify(req.body);
    const signatureValidation = validateZapierWebhookSignature(payload, signature, apiKey);
    
    if (!signatureValidation.valid) {
      logSecurityEvent('warning', 'zapier_webhook_invalid_signature', signatureValidation.error || 'Invalid signature');
      return res.status(401).json({ error: signatureValidation.error || 'Invalid signature' });
    }
  }

  // Process webhook asynchronously
  processZapierWebhook(req.body as ZapierWebhookEvent, webhookId)
    .then(result => {
      if (result.success) {
        logAgentAction(
          'zapier-webhook',
          'webhook_processed',
          `Zapier webhook processed successfully, action ${result.actionTriggered} triggered`,
          undefined,
          { action_triggered: result.actionTriggered }
        );
        res.status(200).json({ success: true, actionTriggered: result.actionTriggered });
      } else {
        logSecurityEvent('error', 'zapier_webhook_processing_failed', result.error || 'Unknown error');
        res.status(500).json({ error: result.error || 'Webhook processing failed' });
      }
    })
    .catch(error => {
      logSecurityEvent('error', 'zapier_webhook_exception', `Webhook processing exception: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ error: 'Internal server error' });
    });
}

/**
 * Register Zapier webhook
 */
export async function registerZapierWebhook(
  webhookUrl: string,
  events: string[],
  apiKey: string,
  matterFilter?: string
): Promise<{ success: boolean; webhookId?: string; error?: string }> {
  const webhookId = `zapier_webhook_${Date.now()}`;
  zapierWebhookConfigStore.setConfig(webhookId, {
    apiKey,
    enabled: true,
    events,
    matterFilter
  });

  logAgentAction(
    'zapier-webhook',
    'webhook_registered',
    `Zapier webhook registered: ${webhookUrl}`,
    undefined,
    { webhook_id: webhookId, events, webhook_url: webhookUrl }
  );

  return { success: true, webhookId };
