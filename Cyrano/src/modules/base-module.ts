/**
 * Base Module Class
 * 
 * Modules are conceptual organizations of tools, resources, and prompts
 * that work together to handle a discrete, domain-specific function.
 * 
 * Unlike tools (atomic units), modules compose multiple tools and may
 * include resources and prompt templates for AI-driven orchestration.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from '../tools/base-tool.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface ModuleConfig {
  name: string;
  description: string;
  version: string;
  tools?: BaseTool[];
  resources?: ModuleResource[];
  prompts?: ModulePrompt[];
}

export interface ModuleResource {
  id: string;
  type: 'file' | 'data' | 'api' | 'template';
  path?: string;
  content?: any;
  description?: string;
}

export interface ModulePrompt {
  id: string;
  template: string;
  variables?: string[];
  description?: string;
}

export abstract class BaseModule {
  protected config: ModuleConfig;
  protected tools: Map<string, BaseTool>;
  protected resources: Map<string, ModuleResource>;
  protected prompts: Map<string, ModulePrompt>;

  constructor(config: ModuleConfig) {
    this.config = config;
    this.tools = new Map();
    this.resources = new Map();
    this.prompts = new Map();

    // Register provided tools
    if (config.tools) {
      config.tools.forEach(tool => {
        const definition = tool.getToolDefinition();
        this.tools.set(definition.name, tool);
      });
    }

    // Register provided resources
    if (config.resources) {
      config.resources.forEach(resource => {
        this.resources.set(resource.id, resource);
      });
    }

    // Register provided prompts
    if (config.prompts) {
      config.prompts.forEach(prompt => {
        this.prompts.set(prompt.id, prompt);
      });
    }
  }

  /**
   * Initialize the module
   * Load resources, set up connections, etc.
   */
  abstract initialize(): Promise<void>;

  /**
   * Execute module functionality
   * This is the main entry point for module operations
   */
  abstract execute(input: any): Promise<CallToolResult>;

  /**
   * Get module metadata
   */
  getModuleInfo() {
    return {
      name: this.config.name,
      description: this.config.description,
      version: this.config.version,
      toolCount: this.tools.size,
      resourceCount: this.resources.size,
      promptCount: this.prompts.size,
    };
  }

  /**
   * Get all tools in this module
   */
  getTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Register a new tool
   */
  registerTool(tool: BaseTool): void {
    const definition = tool.getToolDefinition();
    this.tools.set(definition.name, tool);
  }

  /**
   * Get a resource by ID
   */
  getResource(id: string): ModuleResource | undefined {
    return this.resources.get(id);
  }

  /**
   * Register a resource
   */
  registerResource(resource: ModuleResource): void {
    this.resources.set(resource.id, resource);
  }

  /**
   * Get a prompt by ID
   */
  getPrompt(id: string): ModulePrompt | undefined {
    return this.prompts.get(id);
  }

  /**
   * Render a prompt template with variables
   */
  renderPrompt(id: string, variables: Record<string, string>): string {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      throw new Error(`Prompt ${id} not found`);
    }

    let rendered = prompt.template;
    if (prompt.variables) {
      prompt.variables.forEach(variable => {
        const value = variables[variable] || '';
        rendered = rendered.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
      });
    }

    return rendered;
  }

  /**
   * Register a prompt
   */
  registerPrompt(prompt: ModulePrompt): void {
    this.prompts.set(prompt.id, prompt);
  }

  /**
   * Cleanup resources
   */
  abstract cleanup(): Promise<void>;

  /**
   * Execute a tool within this module
   */
  protected async executeTool(toolName: string, args: any): Promise<CallToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Tool ${toolName} not found in module ${this.config.name}`,
          },
        ],
        isError: true,
      };
    }

    return await tool.execute(args);
  }
}

