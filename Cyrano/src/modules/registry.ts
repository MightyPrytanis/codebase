/**
 * Module Registry
 * 
 * Central registry for all modules in the Cyrano system.
 * Modules are registered here and can be discovered and accessed
 * by engines and applications.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseModule } from './base-module.js';
import { chronometricModule } from './chronometric/chronometric.js';
import { taxForecastModule, childSupportForecastModule, qdroForecastModule } from './forecast/index.js';
import { arkExtractorModule } from './arkiver/ark-extractor-module.js';
import { arkProcessorModule } from './arkiver/ark-processor-module.js';
import { arkAnalystModule } from './arkiver/ark-analyst-module.js';
import { ragModule } from './rag/rag-module.js';
import { verificationModule } from './verification/verification-module.js';
import { legalAnalysisModule } from './legal-analysis/legal-analysis-module.js';

class ModuleRegistry {
  private modules: Map<string, BaseModule>;

  constructor() {
    this.modules = new Map();
    // Auto-register modules
    this.register(chronometricModule);
    this.register(taxForecastModule);
    this.register(childSupportForecastModule);
    this.register(qdroForecastModule);
    // Register new modular BaseModule classes
    this.register(arkExtractorModule);
    this.register(arkProcessorModule);
    this.register(arkAnalystModule);
    this.register(ragModule);
    this.register(verificationModule);
    this.register(legalAnalysisModule);
  }

  /**
   * Register a module
   */
  register(module: BaseModule): void {
    const info = module.getModuleInfo();
    this.modules.set(info.name, module);
  }

  /**
   * Get a module by name
   */
  get(name: string): BaseModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Get all registered modules
   */
  getAll(): BaseModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get module names
   */
  getNames(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Check if a module is registered
   */
  has(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Unregister a module
   */
  unregister(name: string): void {
    this.modules.delete(name);
  }

  /**
   * Clear all modules
   */
  clear(): void {
    this.modules.clear();
  }

  /**
   * Get module count
   */
  getCount(): number {
    return this.modules.size;
  }
}

// Export singleton instance
export const moduleRegistry = new ModuleRegistry();

