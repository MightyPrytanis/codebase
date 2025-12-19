/**
 * Engine Registry
 * 
 * Central registry for all engines in the Cyrano system.
 * Engines are registered here and can be discovered and accessed
 * by applications.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseEngine } from './base-engine.js';
import { maeEngine } from './mae/mae-engine.js';
import { goodcounselEngine } from './goodcounsel/goodcounsel-engine.js';
import { potemkinEngine } from './potemkin/potemkin-engine.js';
import { forecastEngine } from './forecast/index.js';

class EngineRegistry {
  private engines: Map<string, BaseEngine>;

  constructor() {
    this.engines = new Map();
    // Auto-register engines
    this.register(maeEngine);
    this.register(goodcounselEngine);
    this.register(potemkinEngine);
    this.register(forecastEngine);
  }

  /**
   * Register an engine
   */
  register(engine: BaseEngine): void {
    const info = engine.getEngineInfo();
    this.engines.set(info.name, engine);
  }

  /**
   * Get an engine by name
   */
  get(name: string): BaseEngine | undefined {
    return this.engines.get(name);
  }

  /**
   * Get all registered engines
   */
  getAll(): BaseEngine[] {
    return Array.from(this.engines.values());
  }

  /**
   * Get engine names
   */
  getNames(): string[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Check if an engine is registered
   */
  has(name: string): boolean {
    return this.engines.has(name);
  }

  /**
   * Unregister an engine
   */
  unregister(name: string): void {
    this.engines.delete(name);
  }

  /**
   * Clear all engines
   */
  clear(): void {
    this.engines.clear();
  }

  /**
   * Get engine count
   */
  getCount(): number {
    return this.engines.size;
  }
}

// Export singleton instance
export const engineRegistry = new EngineRegistry();

