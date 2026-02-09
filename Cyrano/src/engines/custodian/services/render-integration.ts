/*
 * Render Integration Service
 * Integrates Custodian with Render platform APIs
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

export interface RenderMetrics {
  cpu_usage: number;
  memory_usage: number;
  request_count: number;
  error_rate: number;
  response_time: number;
}

export interface RenderDeployStatus {
  id: string;
  status: 'live' | 'build_in_progress' | 'update_in_progress' | 'suspended' | 'deactivated';
  commit: string;
  created_at: string;
}

class RenderIntegrationService {
  private initialized: boolean = false;
  private renderApiKey: string | null = null;
  private renderServiceId: string | null = null;
  private isRenderEnvironment: boolean = false;

  async initialize(): Promise<void> {
    this.initialized = true;
    this.isRenderEnvironment = !!process.env.RENDER;
    this.renderApiKey = process.env.RENDER_API_KEY || null;
    this.renderServiceId = process.env.RENDER_SERVICE_ID || null;
    
    if (this.isRenderEnvironment) {
      console.log('[Render Integration] Service initialized for Render environment');
      if (!this.renderApiKey) {
        console.warn('[Render Integration] RENDER_API_KEY not set - Render API features disabled');
      }
      if (!this.renderServiceId) {
        console.warn('[Render Integration] RENDER_SERVICE_ID not set - Service-specific features disabled');
      }
    } else {
      console.log('[Render Integration] Service initialized (non-Render environment)');
    }
  }

  async getStatus(): Promise<{ initialized: boolean; is_render: boolean; api_configured: boolean }> {
    return {
      initialized: this.initialized,
      is_render: this.isRenderEnvironment,
      api_configured: !!(this.renderApiKey && this.renderServiceId),
    };
  }

  /**
   * Get Render metrics via Render Metrics API
   */
  async getRenderMetrics(): Promise<RenderMetrics | null> {
    if (!this.isRenderEnvironment || !this.renderApiKey || !this.renderServiceId) {
      return null;
    }

    try {
      // Render Metrics API endpoint
      const response = await fetch(
        `https://api.render.com/v1/services/${this.renderServiceId}/metrics`,
        {
          headers: {
            'Authorization': `Bearer ${this.renderApiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('[Render Integration] Failed to fetch metrics:', response.statusText);
        return null;
      }

      const data = await response.json();
      
      // Parse Render metrics format
      return {
        cpu_usage: data.cpu?.percent || 0,
        memory_usage: data.memory?.percent || 0,
        request_count: data.requests?.count || 0,
        error_rate: data.requests?.error_rate || 0,
        response_time: data.requests?.avg_response_time_ms || 0,
      };
    } catch (error) {
      console.error('[Render Integration] Error fetching Render metrics:', error);
      return null;
    }
  }

  /**
   * Get current deployment status
   */
  async getDeployStatus(): Promise<RenderDeployStatus | null> {
    if (!this.isRenderEnvironment || !this.renderApiKey || !this.renderServiceId) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.render.com/v1/services/${this.renderServiceId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.renderApiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('[Render Integration] Failed to fetch deploy status:', response.statusText);
        return null;
      }

      const data = await response.json();
      
      return {
        id: data.service?.id || '',
        status: data.service?.deploy?.status || 'unknown',
        commit: data.service?.deploy?.commit?.id || '',
        created_at: data.service?.deploy?.createdAt || '',
      };
    } catch (error) {
      console.error('[Render Integration] Error fetching deploy status:', error);
      return null;
    }
  }
  /**
   * Trigger a new deployment (for dependency updates)
   */
  async triggerDeploy(reason: string): Promise<{ success: boolean; deploy_id?: string; error?: string }> {
    if (!this.isRenderEnvironment || !this.renderApiKey || !this.renderServiceId) {
      return {
        success: false,
        error: 'Render API not configured',
      };
    }

    try {
      // Render Deploy API - trigger manual deploy
      const response = await fetch(
        `https://api.render.com/v1/services/${this.renderServiceId}/deploys`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.renderApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            clearBuildCache: true,
            // Render will use latest commit from connected repo
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Render API error: ${response.status} ${errorText}`,
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        deploy_id: data.deploy?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if we're running on Render
   */
  isRender(): boolean {
    return this.isRenderEnvironment;
  }

  /**
   * Check if Render API is configured
   */
  isConfigured(): boolean {
    return !!(this.renderApiKey && this.renderServiceId);
  }
}

export const renderIntegrationService = new RenderIntegrationService();
