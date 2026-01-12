/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

const API_BASE_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:3000';

export interface SystemStatus {
  system: {
    name: string;
    version: string;
    status: string;
    timestamp: string;
    uptime?: number;
    demo_mode?: boolean;
  };
  ai_integration: {
    status: string;
    available_providers: string[];
    missing_providers: string[];
    total_providers: number;
    functional_ai: boolean;
  };
  tools: {
    total_tools: number;
    ai_tools?: number;
    data_processing_tools?: number;
    demo_mode?: boolean;
  };
  warnings?: string[];
}

export interface ToolInfo {
  name: string;
  description: string;
  category?: string;
  inputSchema?: any;
}

export interface SecurityStatus {
  csrfProtection: boolean;
  rateLimiting: boolean;
  authentication: boolean;
}

/**
 * Execute a Cyrano MCP tool
 */
export async function executeTool(
  tool: string,
  args: Record<string, any> = {}
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/mcp/execute`, {
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
}

/**
 * Get system status
 */
export async function getSystemStatus(includeConfigDetails = false): Promise<SystemStatus> {
  const result = await executeTool('system_status', {
    include_config_details: includeConfigDetails,
  });
  return result;
}

/**
 * List all available tools
 */
export async function listTools(): Promise<ToolInfo[]> {
  const response = await fetch(`${API_BASE_URL}/mcp/tools/info`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Get health status
 */
export async function getHealth(): Promise<{
  status: string;
  timestamp: string;
  version: string;
  tools_count: number;
  uptime: number;
  security: SecurityStatus;
}> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Get security status
 */
export async function getSecurityStatus(): Promise<SecurityStatus> {
  const response = await fetch(`${API_BASE_URL}/security/status`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();

}
}
}
}
)