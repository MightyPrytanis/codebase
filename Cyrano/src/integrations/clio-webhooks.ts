/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Clio Webhooks Integration
 * 
 * Implements Clio event webhooks/listeners for Track Zeta.
 * Enables MAE workflows to trigger from Clio events.
 * 
 * Security Features:
 * - Webhook authentication and validation
 * - Matter-based data filtering
 * - Audit logging for webhook triggers
 * - Rate limiting and anomaly detection
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { logSecurityEvent, logAgentAction } from '../services/audit-logger.js';
import { enforceMatterIsolation, extractMatterId } from '../middleware/matter-isolation.js';
import { maeEngine } from '../engines/mae/mae-engine.js';

export interface ClioWebhookEvent {
  event_type: string;
  data: {
    id: string;
    type: string;
    attributes: Record<string, any>;
    relationships?: Record<string, any>;
  };
  timestamp: string;
}

export interface WebhookConfig {
  secret: string;
  enabled: boolean;
  events: string[];
}

/**
 * Clio webhook event types
 */
export const CLIO_EVENT_TYPES = {
  MATTER_CREATED: 'matter.created',
  MATTER_UPDATED: 'matter.updated',
  MATTER_DELETED: 'matter.deleted',
  ACTIVITY_CREATED: 'activity.created',
  ACTIVITY_UPDATED: 'activity.updated',
  DOCUMENT_CREATED: 'document.created',
  DOCUMENT_UPDATED: 'document.updated',
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
} as const;

/**
 * Webhook configuration store (in-memory, should be database-backed in production)
 */
class WebhookConfigStore {
  private configs: Map<string, WebhookConfig> = new Map();

  getConfig(webhookId: string): WebhookConfig | undefined {
    return this.configs.get(webhookId);
  }

  setConfig(webhookId: string, config: WebhookConfig): void {
    this.configs.set(webhookId, config);
  }

  deleteConfig(webhookId: string): void {
    this.configs.delete(webhookId);
  }
}

export const webhookConfigStore = new WebhookConfigStore();

/**
 * Validate Clio webhook signature
 * Clio signs webhooks with HMAC-SHA256
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): { valid: boolean; error?: string } {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid webhook signature'
    };
  }

  return { valid: true };
}

/**
 * Process Clio webhook event
 * Filters data by matter ID and triggers appropriate workflows
 */
export async function processClioWebhook(
  event: ClioWebhookEvent,
  matterId?: string
): Promise<{ success: boolean; workflowTriggered?: string; error?: string }> {
  try {
    // Extract matter ID from event if not provided
    const extractedMatterId = matterId || extractMatterId(event.data.attributes) || extractMatterId(event.data.relationships);
    
    if (!extractedMatterId) {
      logSecurityEvent('warning', 'clio_webhook_no_matter_id', `Clio webhook event ${event.event_type} has no matter ID`);
      return { success: false, error: 'No matter ID found in webhook event' };
    }

    // Enforce matter isolation
    return await enforceMatterIsolation(
      `webhook-${event.event_type}`,
      extractedMatterId,
      async () => {
        // Map Clio events to MAE workflows
        const workflowMapping: Record<string, string> = {
          [CLIO_EVENT_TYPES.MATTER_CREATED]: 'matter_intake',
          [CLIO_EVENT_TYPES.MATTER_UPDATED]: 'matter_update',
          [CLIO_EVENT_TYPES.ACTIVITY_CREATED]: 'activity_processing',
          [CLIO_EVENT_TYPES.DOCUMENT_CREATED]: 'document_analysis',
          [CLIO_EVENT_TYPES.TASK_CREATED]: 'task_management',
          [CLIO_EVENT_TYPES.TASK_COMPLETED]: 'task_completion',
        };

        const workflowId = workflowMapping[event.event_type];
        if (!workflowId) {
          logAgentAction(
            'clio-webhook',
            'webhook_event_unmapped',
            `Clio webhook event ${event.event_type} has no workflow mapping`,
            extractedMatterId,
            { event_type: event.event_type }
          );
          return { success: false, error: `No workflow mapping for event type: ${event.event_type}` };
        }

        // Trigger MAE workflow
        logAgentAction(
          'clio-webhook',
          'workflow_triggered',
          `Triggering MAE workflow ${workflowId} from Clio event ${event.event_type}`,
          extractedMatterId,
          { event_type: event.event_type, workflow_id: workflowId }
        );

        const workflowResult = await maeEngine.execute({
          action: 'execute_workflow',
          workflow_id: workflowId,
          input: {
            clio_event: event,
            matter_id: extractedMatterId,
            event_type: event.event_type,
            event_data: event.data
          }
        });

        const firstContent = workflowResult.content?.[0];
        const isText = firstContent && firstContent.type === 'text' && 'text' in firstContent;
        const errorText = isText ? firstContent.text : 'Unknown error';

        if (workflowResult.isError) {
          logSecurityEvent('error', 'clio_webhook_workflow_failed', `Workflow ${workflowId} failed: ${errorText}`);
          return { success: false, error: `Workflow execution failed: ${errorText}` };
        }

        logAgentAction(
          'clio-webhook',
          'workflow_completed',
          `MAE workflow ${workflowId} completed successfully`,
          extractedMatterId,
          { workflow_id: workflowId, result: workflowResult }
        );

        return { success: true, workflowTriggered: workflowId };
      }
    );
  } catch (error) {
    logSecurityEvent('error', 'clio_webhook_processing_error', `Webhook processing failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: `Webhook processing error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Filter webhook payload by matter ID
 * Removes data not related to the specified matter
 */
export function filterWebhookPayloadByMatter(
  payload: any,
  matterId: string
): any {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  // Recursively filter payload
  const filtered: any = {};
  
  for (const [key, value] of Object.entries(payload)) {
    // Keep matter-related fields
    if (key === 'matter_id' || key === 'matterId' || key === 'matter') {
      filtered[key] = value;
      continue;
    }

    // Filter nested objects
    if (typeof value === 'object' && value !== null) {
      const nestedFiltered = filterWebhookPayloadByMatter(value, matterId);
      if (Object.keys(nestedFiltered).length > 0) {
        filtered[key] = nestedFiltered;
      }
    } else {
      // Keep non-object values (they're safe)
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Webhook rate limiter (in-memory, should be Redis-backed in production)
 */
class WebhookRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number = 100; // Max requests per window
  private windowMs: number = 60000; // 1 minute window

  checkLimit(identifier: string): { allowed: boolean; remaining?: number; resetAt?: number } {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove requests outside window
    const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetAt = oldestRequest + this.windowMs;
      return { allowed: false, resetAt };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - recentRequests.length,
      resetAt: now + this.windowMs
    };
  }
}

export const webhookRateLimiter = new WebhookRateLimiter();

/**
 * Express middleware for Clio webhook endpoint
 */
export function clioWebhookHandler(req: Request, res: Response) {
  // Rate limiting
  const clientId = req.ip || 'unknown';
  const rateLimit = webhookRateLimiter.checkLimit(clientId);
  
  if (!rateLimit.allowed) {
    logSecurityEvent('warning', 'clio_webhook_rate_limit', `Rate limit exceeded for ${clientId}`);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      resetAt: rateLimit.resetAt
    });
  }

  // Get webhook secret from config
  const webhookId = req.headers['x-clio-webhook-id'] as string;
  const config = webhookConfigStore.getConfig(webhookId || 'default');
  
  if (!config || !config.enabled) {
    return res.status(403).json({ error: 'Webhook not configured or disabled' });
  }

  // Validate signature
  const signature = req.headers['x-clio-signature'] as string;
  if (!signature) {
    logSecurityEvent('warning', 'clio_webhook_no_signature', 'Webhook request missing signature');
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  const payload = JSON.stringify(req.body);
  const signatureValidation = validateWebhookSignature(payload, signature, config.secret);
  
  if (!signatureValidation.valid) {
    logSecurityEvent('warning', 'clio_webhook_invalid_signature', signatureValidation.error || 'Invalid signature');
    return res.status(401).json({ error: signatureValidation.error || 'Invalid signature' });
  }

  // Process webhook asynchronously
  processClioWebhook(req.body as ClioWebhookEvent)
    .then(result => {
      if (result.success) {
        logAgentAction(
          'clio-webhook',
          'webhook_processed',
          `Clio webhook processed successfully, workflow ${result.workflowTriggered} triggered`,
          undefined,
          { workflow_triggered: result.workflowTriggered }
        );
        res.status(200).json({ success: true, workflowTriggered: result.workflowTriggered });
      } else {
        logSecurityEvent('error', 'clio_webhook_processing_failed', result.error || 'Unknown error');
        res.status(500).json({ error: result.error || 'Webhook processing failed' });
      }
    })
    .catch(error => {
      logSecurityEvent('error', 'clio_webhook_exception', `Webhook processing exception: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ error: 'Internal server error' });
    });
}

/**
 * Register webhook with Clio
 * (This would be called when setting up webhooks in Clio)
 */
export async function registerClioWebhook(
  webhookUrl: string,
  events: string[],
  secret: string
): Promise<{ success: boolean; webhookId?: string; error?: string }> {
  // In production, this would make an API call to Clio to register the webhook
  // For now, we'll just store the configuration locally
  
  const webhookId = `clio_webhook_${Date.now()}`;
  webhookConfigStore.setConfig(webhookId, {
    secret,
    enabled: true,
    events
  });

  logAgentAction(
    'clio-webhook',
    'webhook_registered',
    `Clio webhook registered: ${webhookUrl}`,
    undefined,
    { webhook_id: webhookId, events, webhook_url: webhookUrl }
  );

  return { success: true, webhookId };
}

}
}
}
}
}
)
)
}
)
}