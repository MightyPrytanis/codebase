/**
 * Delphi TypeScript Client for Potemkin
 * Lightweight API wrapper for moral reasoning queries
 */

import axios, { AxiosInstance } from 'axios';

interface DelphiConfig {
  apiUrl: string;
  timeout: number;
  confidenceThreshold: number;
  version: string;
}

interface DelphiResponse {
  query: string;
  judgment: string;
  confidence: number;
  reasoning?: string;
}

interface PotemkinOutput {
  parser: string;
  original_text: string;
  moral_judgment: string;
  confidence_score: number;
  reasoning?: string;
  meets_threshold: boolean;
  meta {
    parser_version: string;
    api_endpoint: string;
  };
}

export class DelphiClient {
  private client: AxiosInstance;
  private config: DelphiConfig;

  constructor(config: DelphiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Analyze a single argument using Delphi
   */
  async analyzeArgument(argumentText: string): Promise<DelphiResponse> {
    try {
      const response = await this.client.post('/query', {
        query: argumentText,
        format: 'structured',
      });

      return {
        query: argumentText,
        judgment: response.data.judgment || 'unknown',
        confidence: response.data.confidence || 0.0,
        reasoning: response.data.reasoning,
      };
    } catch (error) {
      console.error('Error querying Delphi API:', error);
      return {
        query: argumentText,
        judgment: 'error',
        confidence: 0.0,
        reasoning: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Batch analyze multiple arguments
   */
  async batchAnalyze(arguments: string[]): Promise<DelphiResponse[]> {
    const promises = arguments.map((arg) => this.analyzeArgument(arg));
    return Promise.all(promises);
  }

  /**
   * Check if response meets confidence threshold
   */
  isConfident(response: DelphiResponse): boolean {
    return response.confidence >= this.config.confidenceThreshold;
  }

  /**
   * Format response for Potemkin pipeline
   */
  formatForPotemkin(response: DelphiResponse): PotemkinOutput {
    return {
      parser: 'delphi',
      original_text: response.query,
      moral_judgment: response.judgment,
      confidence_score: response.confidence,
      reasoning: response.reasoning,
      meets_threshold: this.isConfident(response),
      meta {
        parser_version: this.config.version,
        api_endpoint: this.config.apiUrl,
      },
    };
  }
}

// Example usage
export async function testDelphiClient() {
  const config: DelphiConfig = {
    apiUrl: 'https://delphi.allenai.org/api',
    timeout: 10000,
    confidenceThreshold: 0.7,
    version: '1.0.0',
  };

  const client = new DelphiClient(config);

  const testArgument =
    'A lawyer should disclose client confidences if doing so prevents substantial harm to others.';

  const result = await client.analyzeArgument(testArgument);
  const formatted = client.formatForPotemkin(result);

  console.log(JSON.stringify(formatted, null, 2));
}
