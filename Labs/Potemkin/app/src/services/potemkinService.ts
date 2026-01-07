/**
 * Potemkin Service
 * 
 * Service for communicating with the Potemkin engine via MCP protocol.
 * Handles document verification, integrity monitoring, and other Potemkin operations.
 */

const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3000';

class PotemkinService {
  /**
   * Verify a document file
   */
  async verifyDocument(file: File): Promise<unknown> {
    // Read file content
    const text = await file.text();
    
    const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'potemkin_engine',
        arguments: {
          action: 'verify_document',
          content: text,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify document');
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
   * Verify content from a URL
   */
  async verifyUrl(url: string): Promise<unknown> {
    const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'potemkin_engine',
        arguments: {
          action: 'verify_document',
          content: url,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify URL');
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
   * Verify pasted content
   */
  async verifyContent(content: string): Promise<unknown> {
    const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'potemkin_engine',
        arguments: {
          action: 'verify_document',
          content: content,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify content');
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
   * Get integrity metrics
   */
  async getIntegrityMetrics(): Promise<unknown> {
    const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'potemkin_engine',
        arguments: {
          action: 'monitor_integrity',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get integrity metrics');
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
   * Detect bias in content
   */
  async detectBias(content: string): Promise<unknown> {
    const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'potemkin_engine',
        arguments: {
          action: 'detect_bias',
          content: content,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to detect bias');
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
   * Test opinion drift
   */
  async testOpinionDrift(): Promise<unknown> {
    const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'potemkin_engine',
        arguments: {
          action: 'test_opinion_drift',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to test opinion drift');
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
}

export const potemkinService = new PotemkinService();

