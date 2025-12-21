/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * MAE Services
 * 
 * Utility services for the Multi-Agent Engine (MAE). These are utility classes
 * that provide functionality but don't compose tools or extend BaseModule.
 * 
 * Services vs Modules:
 * - Services: Utility classes (like AIService, RAGService) that provide functionality
 * - Modules: Domain-specific components that compose tools, resources, and prompts (extend BaseModule)
 */

export { multiModelService, MultiModelService, MultiModelConfig, MultiModelResult, ModelResult } from './multi-model-service.js';
export { aiOrchestrator } from './ai-orchestrator.js';

