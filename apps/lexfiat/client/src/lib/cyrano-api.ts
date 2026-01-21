/**
 * Cyrano API Client
 * Handles all API calls to the Cyrano MCP HTTP bridge
 */

const API_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';

export interface CyranoToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  _demo?: boolean;
  _demoWarning?: string;
}

/**
 * Execute a Cyrano tool (alias for executeTool)
 */
export async function executeCyranoTool(
  tool: string,
  args: Record<string, any> = {}
): Promise<CyranoToolResult> {
  return executeTool(tool, args);
}

/**
 * Execute a Cyrano tool
 */
export async function executeTool(
  tool: string,
  args: Record<string, any> = {}
): Promise<CyranoToolResult> {
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
    }).catch((fetchError) => {
      // Silently handle network errors (CORS, connection refused, etc.)
      // Don't log to console to avoid cluttering with permission errors
      return null;
    });

    if (!response || !response.ok) {
      // Return graceful error without throwing - be transparent
      const statusText = response ? `${response.status} ${response.statusText}` : 'Connection failed';
      return {
        content: [
          {
            type: 'text',
            text: `Service unavailable (${statusText}). Please ensure the Cyrano MCP server is running and accessible.`,
          },
        ],
        isError: true,
        _serviceUnavailable: true,
      };

    const result = await response.json();
    return result;
  } catch (error) {
    // Only log unexpected errors, not network/permission errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error - return gracefully but transparently
      return {
        content: [
          {
            type: 'text',
            text: `Network error: Unable to reach Cyrano MCP server. Please check your connection and ensure the server is running at ${API_URL}.`,
          },
        ],
        isError: true,
        _networkError: true,
      };
    }
    console.error(`Error executing tool ${tool}:`, error);
    // Be transparent about errors while failing gracefully
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${tool}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
      isError: true,
      _executionError: true,
    };
  }
}
/**
 * Get workflow data from workflow_manager
 */
export async function getWorkflowData() {
  const result = await executeTool('workflow_manager', {
    action: 'get_status',
  });

  if (result.isError) {
    return null;
  }

  try {
    const text = result.content[0]?.text || '{}';
    return typeof text === 'string' ? JSON.parse(text) : text;
  } catch {
    return null;
  }
}

/**
 * Get case data from case_manager
 */
export async function getCases() {
  const result = await executeTool('case_manager', {
    action: 'list_cases',
  });

  if (result.isError) {
    return [];
  }

  try {
    const text = result.content[0]?.text || '[]';
    const parsed = typeof text === 'string' ? JSON.parse(text) : text;
    return Array.isArray(parsed) ? parsed : parsed.cases || [];
  } catch {
    return [];
  }
}

/**
 * Get red flags from red_flag_finder
 */
export async function getRedFlags() {
  const result = await executeTool('red_flag_finder', {
    action: 'list_flags',
  });

  if (result.isError) {
    return [];
  }

  try {
    const text = result.content[0]?.text || '[]';
    const parsed = typeof text === 'string' ? JSON.parse(text) : text;
    return Array.isArray(parsed) ? parsed : parsed.flags || [];
  } catch {
    return [];
  }
}

/**
 * Get document intake metrics from document_processor
 */
export async function getIntakeMetrics() {
  const result = await executeTool('document_processor', {
    action: 'get_metrics',
  });

  if (result.isError) {
    return { today: 0, pending: 0 };
  }

  try {
    const text = result.content[0]?.text || '{}';
    const parsed = typeof text === 'string' ? JSON.parse(text) : text;
    return {
      today: parsed.today || parsed.processed_today || 0,
      pending: parsed.pending || parsed.queue_length || 0,
    };
  } catch {
    return { today: 0, pending: 0 };
  }
}

/**
 * Get priority alerts from alert_generator
 */
export async function getPriorityAlerts() {
  const result = await executeTool('alert_generator', {
    action: 'get_active_alerts',
  });

  if (result.isError) {
    return [];
  }

  try {
    const text = result.content[0]?.text || '[]';
    const parsed = typeof text === 'string' ? JSON.parse(text) : text;
    return Array.isArray(parsed) ? parsed : parsed.alerts || [];
  } catch {
    return [];
  }
}

/**
 * Get GoodCounsel insights
 */
export async function getGoodCounselInsights() {
  const result = await executeTool('goodcounsel_engine', {
    action: 'client_recommendations',
    input: {
      context: 'dashboard',
    },
    userId: 'default-user', // TODO: Get from auth
  });

  if (result.isError) {
    return [];
  }

  try {
    const text = result.content[0]?.text || '[]';
    const parsed = typeof text === 'string' ? JSON.parse(text) : text;
    return Array.isArray(parsed) ? parsed : parsed.insights || [];
  } catch {
    return [];
  }
}

/**
 * Get system status
 */
export async function getSystemStatus() {
  const result = await executeTool('system_status', {});

  if (result.isError) {
    return null;
  }

  try {
    const text = result.content[0]?.text || '{}';
    return typeof text === 'string' ? JSON.parse(text) : text;
  } catch {
    return null;
  }
}

/**
 * Check if Cyrano API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
