/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { engineRegistry } from '../engines/registry.js';

const ForecastEngineSchema = z.object({
  action: z.enum([
    'generate_tax_forecast',
    'generate_child_support_forecast',
    'generate_qdro_forecast',
    'get_status',
  ]).describe('Action to perform'),
  forecast_input: z.any().optional().describe('Forecast-specific input data'),
  branding: z.object({
    presentationMode: z.enum(['strip', 'watermark', 'none']).default('strip'),
    userRole: z.enum(['attorney', 'staff', 'client', 'other']),
    licensedInAny: z.boolean(),
    riskAcknowledged: z.boolean(),
  }).optional().describe('Branding configuration'),
});

/**
 * Forecast Engine Wrapper Tool
 * Exposes the Forecast Engine functionality through MCP
 */
class ForecastEngineTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'forecast_engine',
      description: 'Forecast Engine - Generates hypothetical forecasts (tax returns, child support, QDROs) with mandatory LexFiat branding and multi-model verification',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['generate_tax_forecast', 'generate_child_support_forecast', 'generate_qdro_forecast', 'get_status'],
            description: 'Action to perform',
          },
          forecast_input: {
            type: 'object',
            description: 'Forecast-specific input data (varies by forecast type)',
          },
          branding: {
            type: 'object',
            properties: {
              presentationMode: {
                type: 'string',
                enum: ['strip', 'watermark', 'none'],
                default: 'strip',
                description: 'Branding presentation mode (strip is default and required for non-attorneys)',
              },
              userRole: {
                type: 'string',
                enum: ['attorney', 'staff', 'client', 'other'],
                description: 'User role for branding override validation',
              },
              licensedInAny: {
                type: 'boolean',
                description: 'Whether user is licensed in any jurisdiction',
              },
              riskAcknowledged: {
                type: 'boolean',
                description: 'Whether user has acknowledged risks of disabling branding',
              },
            },
            description: 'Branding configuration (optional, defaults to strip mode)',
          },
        },
        required: ['action'],
      },
    };
  }

  async execute(args: any) {
    try {
      const parsed = ForecastEngineSchema.parse(args);
      
      // Get Forecast Engine from registry
      const forecastEngine = engineRegistry.get('forecast');
      if (!forecastEngine) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: 'Forecast Engine not found in registry',
              }, null, 2),
            },
          ],
          isError: true,
        } as CallToolResult;
      }

      // Execute action on Forecast Engine
      const result = await forecastEngine.execute({
        action: parsed.action,
        forecast_input: parsed.forecast_input,
        branding: parsed.branding,
      });
      // Normalize result to match CallToolResult type - ensure content array has proper types
      // The forecast engine returns CallToolResult, but TypeScript sees different type definitions
      // We normalize the content array to ensure type compatibility
      if (result && typeof result === 'object' && 'content' in result && Array.isArray(result.content)) {
        const normalizedContent = result.content.map((item: any) => {
          if (item && typeof item === 'object' && 'type' in item) {
            if (item.type === 'text' || (typeof item.type === 'string' && 'text' in item)) {
              return {
                type: 'text' as const,
                text: String(item.text || ''),
                ...(item.annotations ? { annotations: item.annotations } : {}),
                ...(item._meta ? { _meta: item._meta } : {}),
              };
            }
          }
          return item;
        });
        // Type assertion needed due to structural type mismatch between MCP SDK versions
        return {
          ...result,
          content: normalizedContent,
        } as CallToolResult;
      }
      // Type assertion needed due to structural type mismatch
      return result as CallToolResult;
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            }, null, 2),
          },
        ],
        isError: true,
      } as CallToolResult;
    }
  }
}

export const forecastEngineTool = new ForecastEngineTool();

