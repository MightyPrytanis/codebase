---
Document ID: EXPERTISE-LAYER-REVIEW
Title: Expertise Layer Architectural Review
Subject(s): Architecture | Review | Proposal
Project: Cyrano
Version: v1.0
Created: 2025-12-21 (2025-W51)
Last Substantive Revision: 2025-12-21 (2025-W51)
Owner: Architect Agent / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Expertise Layer Architectural Review

**Review Date:** 2025-12-21  
**Reviewer:** Architect Agent  
**Proposal Source:** Gemini-generated specification  
**Status:** **FEASIBLE WITH MODIFICATIONS** ✅

## Executive Summary

The Gemini proposal for a "Modular Agent Skills Architecture" aligns well with Cyrano's existing modular design but requires significant harmonization with current infrastructure. **The proposal is feasible and would provide real user value**, but several concepts need to be mapped to existing Cyrano patterns rather than introducing new abstractions.

**Key Recommendation:** Implement as an **enhancement layer** on top of existing Modules/Engines rather than a parallel architecture.

---

## 1. Feasibility Assessment

### ✅ **HIGHLY FEASIBLE** Components

#### 1.1 Skills Standard (`.cursor/skills/` or `.claude/skills/`)

**Status:** New feature, easily implementable

**Current State:**
- Modules already support `resources` and `prompts` via `BaseModule`
- No standardized skills directory structure exists
- No frontmatter-led skill definitions

**Implementation Path:**
- Create `Cyrano/src/skills/` directory structure
- Define `Skill` interface that extends `ModuleConfig` with frontmatter support
- Implement `SkillLoader` service to parse frontmatter + resources + prompts
- Skills can be converted to Modules at runtime

**Effort:** Medium

#### 1.2 Resource Provisioning Service

**Status:** Partially exists, needs enhancement

**Current State:**
- `ResourceLoader` service exists (`Cyrano/src/services/resource-loader.ts`)
- Resources are defined in modules but not centrally managed
- No automated resource updates (Cron jobs)

**Implementation Path:**
- Enhance `ResourceLoader` → `ResourceProvisionerService`
- Add version tracking and update detection
- Implement Cron job scheduler for statutory data updates
- Create resource registry for shared resources across modules

**Effort:** Medium

#### 1.3 Dual-Thread Ethics Protocol

**Status:** Conceptually exists, needs formalization

**Current State:**
- `EthicsRulesService` exists (professional responsibility)
- `ethicalAIGuard` tool exists (Ten Rules enforcement)
- `EthicsAuditService` exists for logging
- **BUT:** Not separated into distinct "SystemicEthicsService" vs "ResponsibilityService"

**Implementation Path:**
- Refactor existing ethics services into two clear services:
  - `SystemicEthicsService` (wraps `ethicalAIGuard`, `tenRulesChecker`)
  - `ResposibilityService` (wraps `EthicsRulesService`, adds MRPC/HIPAA checks)
- Create middleware pattern for `BaseEngine.execute()` wrapper
- Inject both services into engine execution pipeline

**Effort:** Medium-High

#### 1.4 LogicAuditService (Troubleshooting Hook)

**Status:** New feature, high value

**Current State:**
- No "State of Reasoning" capture on errors
- Error handling exists but doesn't capture prompt/resource context

**Implementation Path:**
- Create `LogicAuditService` to capture:
  - Exact prompt used (with variables resolved)
  - Resource context loaded
  - Module/Engine state at time of error
  - Full execution trace
- Integrate into `BaseEngine.executeStep()` error handling
- Store audit logs for maintenance review

**Effort:** Medium

### ⚠️ **REQUIRES HARMONIZATION** Components

#### 1.5 "Expertise" Abstraction

**Proposal Says:** "Expertise is not a single file; it is a composition of reasoning (Prompts), context (Resources), and action (Modules)."

**Current Reality:**
- **This is exactly what `BaseModule` already does!**
- Modules compose: Tools (action) + Resources (context) + Prompts (reasoning)
- Engines orchestrate multiple modules

**Harmonization:**
- **Map "Expertise Module" → Existing `BaseModule`**
- **Map "Expertise Engine" → Existing `BaseEngine`**
- **Map "Skill" → Enhanced `ModuleConfig` with frontmatter**

**Recommendation:** Use existing terminology. "Expertise" is redundant with "Module/Engine."

#### 1.6 Expertise Wrapper (`withExpertise`)

**Proposal Says:** "Create a `withExpertise(engine, expertiseId)` wrapper that injects specialized system prompts and resource-context into the LLM's system message before execution."

**Current Reality:**
- `BaseEngine.execute()` is abstract - each engine implements its own
- System prompts are injected in `BaseEngine.executeStep()` for AI steps (line 386-390)
- Resources are loaded in `BaseModule.initialize()`

**Harmonization:**
- **Option A:** Create `ExpertiseMiddleware` that wraps engine execution
- **Option B:** Enhance `BaseEngine` to accept optional "expertise context" in `execute()`
- **Option C:** Create `ExpertiseEngine` wrapper class that composes base engine + expertise

**Recommendation:** Option B - enhance `BaseEngine` config to accept expertise context.

#### 1.7 MAE Expertise Selection

**Proposal Says:** "MAE analyzes the task and 'hires' the Engine with the highest ExpertiseScore for that domain."

**Current Reality:**
- MAE orchestrates workflows but doesn't have domain-scoring logic
- Engines are selected manually or via workflow definitions

**Harmonization:**
- Add `ExpertiseScore` calculation to `BaseEngine.getEngineInfo()`
- Create `MAEExpertiseSelector` service
- Enhance MAE workflows to use selector for engine routing

**Effort:** Medium

### ❌ **NOT RECOMMENDED** Components

#### 1.8 Plugin Architecture (`cyrano-plugins/`)

**Proposal Says:** "The engineRegistry must support hot-reloading of new expertise modules via a `cyrano-plugins/` directory."

**Current Reality:**
- Engines are registered at startup in `engine-registry.ts`
- Modules are registered at startup in `module-registry.ts`
- No hot-reloading exists

**Concerns:**
- **Security Risk:** Hot-reloading arbitrary code is dangerous
- **Complexity:** Adds significant complexity for minimal benefit
- **MCP Compliance:** MCP tools must be registered at server startup

**Recommendation:** **DO NOT IMPLEMENT** hot-reloading. Instead:
- Use standard module/engine registration
- Support dynamic resource/prompt updates (not code)
- If needed, implement "plugin" as a Module that can be registered at startup

---

## 2. Value/ROI Assessment

### ✅ **HIGH VALUE** Features

#### 2.1 Skills Standard (`.cursor/skills/`)
**ROI:** ⭐⭐⭐⭐⭐

**Benefits:**
- **User Sovereignty:** Users can define custom skills without code changes
- **Maintainability:** Skills are versioned, documented, and portable
- **Onboarding:** New developers can understand expertise through frontmatter
- **MCP Compliance:** Skills can expose MCP resources

**User Value:**
- Lawyers can create domain-specific skills (e.g., "Divorce Strategy Skill")
- Skills can be shared across teams
- Skills are self-documenting

#### 2.2 Dual-Thread Ethics Protocol
**ROI:** ⭐⭐⭐⭐⭐

**Benefits:**
- **Compliance:** Clear separation of AI ethics vs. professional responsibility
- **Auditability:** Distinct audit trails for each thread
- **Legal Protection:** Explicit MRPC/ABA/HIPAA/FERPA compliance checks

**User Value:**
- Reduces malpractice risk
- Provides clear compliance documentation
- Enables confident AI adoption in legal practice

#### 2.3 LogicAuditService
**ROI:** ⭐⭐⭐⭐

**Benefits:**
- **Debugging:** Capture exact reasoning state on errors
- **Maintenance:** Identify prompt/resource issues quickly
- **Improvement:** Learn from failures to improve skills

**User Value:**
- Faster troubleshooting
- Better AI outputs over time
- Transparent error reporting

#### 2.4 Resource Provisioning Service
**ROI:** ⭐⭐⭐⭐

**Benefits:**
- **Accuracy:** Always use latest statutory data (tax brackets, support tables)
- **Automation:** No manual updates required
- **Consistency:** Shared resources across modules

**User Value:**
- Always accurate calculations
- Reduced maintenance burden
- Compliance with latest regulations

### ⚠️ **MODERATE VALUE** Features

#### 2.5 MAE Expertise Selection
**ROI:** ⭐⭐⭐

**Benefits:**
- **Automation:** Automatic engine selection
- **Efficiency:** Reduces manual routing

**Concerns:**
- **User Sovereignty:** May conflict with user's explicit engine choice
- **Complexity:** Scoring logic may be opaque

**Recommendation:** Make it **opt-in** with user override.

---

## 3. Harmonization Recommendations

### 3.1 Terminology Mapping

| Proposal Term | Cyrano Equivalent | Action |
|--------------|-------------------|--------|
| "Expertise Engine" | `BaseEngine` | Use existing term |
| "Expertise Module" | `BaseModule` | Use existing term |
| "Skill" | Enhanced `ModuleConfig` | New: `Skill` interface |
| "Resource" | `ModuleResource` | Use existing term |
| "Prompt" | `ModulePrompt` | Use existing term |

### 3.2 Architecture Integration

#### Phase 1: Skills Infrastructure (Week 1)
1. Create `Cyrano/src/skills/` directory
2. Define `Skill` interface extending `ModuleConfig`
3. Implement `SkillLoader` service
4. Create example skills (e.g., `skills/legal-reasoning/irac-skill.md`)

#### Phase 2: Ethics Refactoring (Week 2)
1. Create `SystemicEthicsService` (wraps existing AI ethics tools)
2. Create `ResponsibilityService` (enhances `EthicsRulesService`)
3. Add middleware pattern to `BaseEngine.execute()`
4. Update all engines to use dual-thread protocol

#### Phase 3: Resource Provisioning (Week 2-3)
1. Enhance `ResourceLoader` → `ResourceProvisionerService`
2. Add version tracking and update detection
3. Implement Cron job scheduler
4. Create shared resource registry

#### Phase 4: Troubleshooting & Selection (Week 3)
1. Implement `LogicAuditService`
2. Integrate into `BaseEngine.executeStep()` error handling
3. Add `ExpertiseScore` to `BaseEngine.getEngineInfo()`
4. Create `MAEExpertiseSelector` (opt-in)

### 3.3 Code Structure

```
Cyrano/src/
├── skills/                          # NEW: Skills directory
│   ├── base-skill.ts               # Skill interface & loader
│   ├── skill-loader.ts             # Frontmatter parser
│   ├── legal-reasoning/
│   │   ├── irac-skill.md           # Example skill
│   │   └── resources/
│   └── forensic-finance/
│       └── qdro-skill.md
├── services/
│   ├── resource-provisioner.ts     # ENHANCED: From resource-loader.ts
│   ├── systemic-ethics-service.ts # NEW: AI ethics wrapper
│   ├── resoponsibility-service.ts # NEW: MRPC/ABA/HIPAA/FERPA wrapper
│   ├── logic-audit-service.ts      # NEW: Troubleshooting hook
│   └── mae-expertise-selector.ts   # NEW: Engine selection
├── engines/
│   └── base-engine.ts              # ENHANCED: Add expertise context
└── modules/
    └── base-module.ts               # UNCHANGED: Already supports resources/prompts
```

---

## 4. Implementation Specifications

### 4.1 Skill Interface

```typescript
// Cyrano/src/skills/base-skill.ts

export interface SkillFrontmatter {
  name: string;
  description: string;
  version: string;
  domain: string; // e.g., "legal-reasoning", "forensic-finance"
  proficiency: string[]; // e.g., ["IRAC", "Legal Writing"]
  resources: string[]; // Resource IDs
  prompts: string[]; // Prompt IDs
  checklist?: string[]; // Procedural checklist
}

export interface Skill extends ModuleConfig {
  frontmatter: SkillFrontmatter;
  content: string; // Markdown content after frontmatter
}
```

### 4.2 Dual-Thread Ethics Middleware

```typescript
// Cyrano/src/services/ethics-middleware.ts

export async function withEthicsMiddleware(
  engine: BaseEngine,
  input: any,
  executeFn: (input: any) => Promise<CallToolResult>
): Promise<CallToolResult> {
  // Thread A: Systemic Ethics
  const systemicCheck = await systemicEthicsService.checkInput(input);
  if (!systemicCheck.passed) {
    return createErrorResult('Systemic ethics violation', systemicCheck);
  }

  // Execute
  const result = await executeFn(input);

  // Thread B: Professional Duty
  const dutyCheck = await ResponsibilityService.checkOutput(result, input);
  if (!dutyCheck.passed) {
    // Append warning headers
    result.metadata = {
      ...result.metadata,
      attorneyReviewRequired: true,
      complianceWarnings: dutyCheck.warnings,
    };
  }

  return result;
}
```

### 4.3 Enhanced BaseEngine

```typescript
// Cyrano/src/engines/base-engine.ts (additions)

export interface EngineConfig {
  // ... existing fields
  expertiseContext?: {
    skillId?: string;
    domain?: string;
    proficiency?: string[];
  };
}

export abstract class BaseEngine {
  // ... existing code

  async execute(input: any): Promise<CallToolResult> {
    // Wrap with ethics middleware if configured
    if (this.config.expertiseContext) {
      return await withEthicsMiddleware(this, input, async (inp) => {
        return await this.executeInternal(inp);
      });
    }
    return await this.executeInternal(input);
  }

  protected abstract executeInternal(input: any): Promise<CallToolResult>;
}
```

---

## 5. Risk Assessment

### 5.1 Low Risk ✅
- Skills infrastructure (isolated, additive)
- Resource provisioning (enhancement, not replacement)
- LogicAuditService (logging only, no side effects)

### 5.2 Medium Risk ⚠️
- Dual-thread ethics (requires careful testing to avoid false positives)
- MAE expertise selection (may conflict with user sovereignty)

### 5.3 High Risk ❌
- Plugin architecture (security, complexity) - **NOT RECOMMENDED**

---

## 6. Success Criteria

### 6.1 Technical
- [ ] Skills can be loaded from `.cursor/skills/` directory
- [ ] Dual-thread ethics protocol is enforced on all engine executions
- [ ] Resource provisioning service updates statutory data automatically
- [ ] LogicAuditService captures reasoning state on all errors
- [ ] MAE can optionally select engines by expertise score

### 6.2 User Value
- [ ] Users can create custom skills without code changes
- [ ] Compliance documentation is automatically generated
- [ ] Troubleshooting time is reduced by 50%
- [ ] Resource accuracy is maintained without manual updates

### 6.3 Architecture
- [ ] No breaking changes to existing Modules/Engines
- [ ] MCP compliance maintained
- [ ] Ten Rules enforcement maintained
- [ ] User sovereignty respected

---

## 7. Final Recommendation

### ✅ **APPROVE WITH MODIFICATIONS**

**Implement:**
1. ✅ Skills standard (`.cursor/skills/`)
2. ✅ Dual-thread ethics protocol (refactor existing services)
3. ✅ Resource provisioning service (enhance existing)
4. ✅ LogicAuditService (new)
5. ⚠️ MAE expertise selection (opt-in only)

**Do NOT Implement:**
1. ❌ Plugin architecture (hot-reloading)
2. ❌ "Expertise" abstraction (use existing Modules/Engines)

**Timeline:** ASAP

**Priority:** High - Provides significant user value and maintains architectural integrity

---

## 8. Next Steps

1. **Review this document** with stakeholders
2. **Approve implementation plan** or request modifications
3. **Create implementation tickets** for each phase
4. **Begin Phase 1** (Skills Infrastructure)

---

**Document Status:** Ready for Review  
**Architect Approval:** Pending Stakeholder Review
