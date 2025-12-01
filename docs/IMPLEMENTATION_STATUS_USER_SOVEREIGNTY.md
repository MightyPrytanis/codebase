---
Document ID: IMPLEMENTATION-STATUS-USER-SOVEREIGNTY
Title: User Sovereignty & Auto-Select Implementation Status
Subject(s): Implementation | User Sovereignty | AI Provider Selection
Project: Cyrano
Version: v548
Created: 2025-01-07 (2025-W01)
Last Substantive Revision: 2025-01-07 (2025-W01)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Status of user sovereignty and auto-select implementation across the codebase.
Status: Active
---

# User Sovereignty & Auto-Select Implementation Status

**Last Updated:** 2025-01-07  
**Implementation Phase:** In Progress

---

## ✅ Completed Components

### 1. Demo Mode UI Components
- **DemoModeBanner** - Persistent banner at top of app when demo mode is active
- **DemoBadge** - Badge component for marking demo data
- **DemoWarning** - Alert component for demo mode warnings
- **DemoDataWrapper** - Wrapper component for styling demo data
- **Location:** `LexFiat/client/src/components/demo/`
- **Status:** ✅ Complete and integrated into App.tsx

### 2. Performance Tracking System
- **AIPerformanceTracker** - Tracks latency, success rate, cost per provider
- **Location:** `Cyrano/src/services/ai-performance-tracker.ts`
- **Features:**
  - Records successful/failed requests
  - Calculates average latency, success rate, cost per request
  - Provides recommendations based on task profile and performance
  - Supports quality/speed balance preferences
- **Status:** ✅ Complete and integrated into AIService

### 3. Auto-Select Logic
- **AIProviderSelector** - Implements user sovereignty and auto-select
- **Location:** `Cyrano/src/services/ai-provider-selector.ts`
- **Features:**
  - MAE default provider management (Perplexity default, user can change)
  - Auto-select based on task profile, performance metrics, and availability
  - User can override with explicit provider selection
  - Supports quality/speed balance preferences
- **Status:** ✅ Complete

### 4. MAE Engine Updates
- **Base Engine** - Updated to support 'auto' provider selection
- **MAE Engine** - Added getDefaultProvider() and setDefaultProvider() methods
- **MAE Engine Tool** - Added get_default_provider and set_default_provider actions
- **Location:** `Cyrano/src/engines/base-engine.ts`, `Cyrano/src/engines/mae/mae-engine.ts`, `Cyrano/src/tools/mae-engine.ts`
- **Status:** ✅ Complete

### 5. Updated Tools (Provider Selection + Auto Mode)
- **legal-reviewer.ts** - ✅ Updated
- **fact-checker.ts** - ✅ Updated
- **document-drafter.ts** - ✅ Updated
- **red-flag-finder.ts** - ✅ Updated

---

## ⚠️ In Progress / Remaining Work

### 1. Tools Still Needing Provider Selection Updates

The following tools have hardcoded providers and need to be updated:

1. **legal-email-drafter.ts**
   - Hardcoded: `'anthropic'` default
   - Needs: `ai_provider` parameter with 'auto' default
   - Status: ⚠️ Pending

2. **compliance-checker.ts**
   - May have hardcoded providers
   - Needs: Review and update if needed
   - Status: ⚠️ Needs review

3. **document-analyzer.ts**
   - May have hardcoded providers
   - Needs: Review and update if needed
   - Status: ⚠️ Needs review

4. **goodcounsel.ts**
   - Has provider selection but may need auto mode
   - Needs: Review and ensure auto mode support
   - Status: ⚠️ Needs review

5. **arkiver-mcp-tools.ts**
   - Has `llmProvider` but limited enum (only perplexity, anthropic, openai)
   - Needs: Expand to all providers + 'auto' option
   - Status: ⚠️ Needs update

6. **Other tools in `Cyrano/src/tools/`**
   - Needs: Comprehensive audit of all tools
   - Status: ⚠️ Needs audit

### 2. MAE Workflow UI
- **Status:** ⚠️ Not Started
- **Requirements:**
  - UI to view/edit workflows
  - Provider selection dropdown per AI step
  - "Auto" option in provider selection
  - Display which provider was used for each step
  - Settings to change MAE default provider
- **Location:** To be created in `LexFiat/client/src/pages/` or `LexFiat/client/src/components/`

### 3. Component Demo Mode Integration
- **Status:** ⚠️ Partial
- **Completed:**
  - `intake-panel.tsx` - ✅ Updated
  - `analysis-panel.tsx` - ✅ Updated
- **Remaining:**
  - `todays-focus-panel.tsx` - Needs demo wrapper
  - Other components using mock data - Needs audit
  - API response handling for `_demoWarning` - Needs implementation

### 4. Documentation Updates
- **Status:** ⚠️ Pending
- **Needs:**
  - Update ETHICS.md to document user sovereignty principle
  - Update tool documentation to reflect provider selection
  - Update MAE documentation
  - Create user guide for provider selection
  - Create developer guide for adding provider selection to new tools

---

## Implementation Pattern for Remaining Tools

### Standard Pattern:

```typescript
// 1. Add to schema
const ToolSchema = z.object({
  // ... existing fields ...
  ai_provider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto'])
    .optional()
    .default('auto')
    .describe('AI provider to use (default: auto-select)'),
});

// 2. Import selector
import { aiProviderSelector } from '../services/ai-provider-selector.js';

// 3. In execute method:
const { ai_provider, ...otherArgs } = ToolSchema.parse(args);

let provider: AIProvider;
if (ai_provider === 'auto' || !ai_provider) {
  provider = aiProviderSelector.getProviderForTask({
    taskType: 'tool_name',
    // ... task profile ...
    preferredProvider: 'auto',
    balanceQualitySpeed: 'balanced',
  });
} else {
  const validation = apiValidator.validateProvider(ai_provider as AIProvider);
  if (!validation.valid) {
    return this.createErrorResult(`Provider ${ai_provider} not configured: ${validation.error}`);
  }
  provider = ai_provider as AIProvider;
}

// 4. Use provider
const result = await aiService.call(provider, prompt, options);
```

---

## Testing Checklist

- [ ] Test auto-select with various task profiles
- [ ] Test user-provided provider selection
- [ ] Test performance tracking accuracy
- [ ] Test MAE default provider get/set
- [ ] Test demo mode UI components
- [ ] Test demo warnings in API responses
- [ ] Test workflow execution with 'auto' provider
- [ ] Test fallback when selected provider unavailable

---

## Notes

- **User Sovereignty:** All tools must respect user's explicit provider choice when provided
- **Auto-Select Default:** When 'auto' is selected (or no provider specified), use performance-based selection
- **MAE Exception:** Perplexity is hardcoded as MAE default, but user can change it
- **Performance Tracking:** All AI calls automatically tracked via AIService integration
- **Demo Mode:** All mock data should be clearly marked and visible to users

---

**Next Steps:**
1. Complete remaining tool updates
2. Build MAE workflow UI
3. Complete component demo mode integration
4. Update documentation


