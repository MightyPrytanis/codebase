# Legacy Cosmos Inventory
**Created:** 2025-11-22  
**Updated:** 2025-11-22 (revised after GoodCounsel.md review)  
**Purpose:** Document reusable code from Cosmos for GoodCounsel implementation  
**Scanned:** /Users/davidtowne/Desktop/Coding/codebase/Legacy/Cosmos/

---

## Executive Summary

Cosmos is a mortgage partner management system that **was previously deployed** with MCP server integration for Claude Desktop. While no longer actively deployed, the codebase contains valuable patterns for GoodCounsel - specifically the **"Next Action" AI recommendation engine** for context-aware professional relationship management.

**Critical Context - GoodCounsel's True Scope:**

After reviewing `GoodCounsel.md`, it's clear that GoodCounsel is **far more than** a "next action" recommendation system. GoodCounsel is LexFiat's **differentiating feature** - a comprehensive attorney wellness, ethics, and professional development system that addresses:

1. **Attorney Health & Wellness** - Physical, mental, social well-being
2. **Ethical Guidance** - ABA/state bar rules, ethics training, reflection
3. **Work-Life Balance** - Proactive scheduling, burnout prevention
4. **Crisis Support** - Confidential pathways to help, resource matching
5. **Professional Growth** - Development tracking, continuing education
6. **Context-Aware Nudges** - Intelligent reminders beyond just "next actions"

**Cosmos provides ONE piece** (next action recommendations) of this much larger system. The pattern is valuable, but GoodCounsel requires significantly more implementation than just adapting Cosmos.

**Status:** ⚠️ PREVIOUSLY DEPLOYED (no longer active)  
**MCP Compatible:** ✅ YES (code demonstrates MCP patterns)  
**Reusability:** 60% - Good patterns for ONE component of GoodCounsel (not the whole engine)

---

## Directory Structure

```
Cosmos/
├── src/
│   ├── index.ts                    (MCP server entry point)
│   ├── tools/
│   │   └── nextAction.ts           ⭐ CRITICAL for GoodCounsel
│   ├── services/
│   │   ├── partnerAnalyzer.ts      ⭐ CRITICAL - AI analysis engine
│   │   ├── aiService.ts            (OpenAI GPT-4 integration)
│   │   └── dataService.ts          (Partner data management)
│   ├── types/
│   │   ├── partner.ts
│   │   └── recommendations.ts
│   └── data/
│       └── partners.json           (Mock data - replaceable)
├── public/
│   └── [Web dashboard files]
├── deploy.sh
├── package.json
├── README.md
├── INSTALL.md
└── SECURITY_OPTIONS.md
```

---

## Key Components for GoodCounsel

### 🔥 HIGH PRIORITY - Critical Extractions

#### 1. Next Action Tool (`src/tools/nextAction.ts`)
**Lines:** 156 total  
**Purpose:** MCP tool for generating AI-powered next action recommendations  
**Reusability:** 90% - Nearly perfect fit for GoodCounsel

**Key Features:**
- ✅ **MCP Tool Definition**: Proper schema for Claude Desktop integration
- ✅ **Flexible Filtering**: By partner, timeframe, priority, category
- ✅ **Priority Classification**: urgent, high, medium, low
- ✅ **Category Classification**: follow_up, risk_mitigation, opportunity, compliance, performance
- ✅ **ROI Estimation**: Expected return on investment for each action
- ✅ **Timeframe Analysis**: immediate, this_week, this_month
- ✅ **Summary Generation**: Aggregate statistics across recommendations

**Input Schema:**
```typescript
const NextActionInputSchema = z.object({
  partnerId: z.string().optional()
    .describe('Specific partner ID to analyze'),
  timeframe: z.enum(['immediate', 'this_week', 'this_month']).optional()
    .describe('Time horizon for recommendations'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional()
    .describe('Filter by priority level'),
  category: z.string().optional()
    .describe('Filter by recommendation category'),
  limit: z.number().min(1).max(20).optional()
    .describe('Maximum number of recommendations to return')
});
```

**Output Structure:**
```typescript
{
  success: true,
  timestamp: "2025-11-22T...",
  requestedFilters: { /* input parameters */ },
  totalRecommendations: 5,
  recommendations: [
    {
      partner: {
        id: "partner-001",
        name: "John Smith"
      },
      priority: "high",
      category: "follow_up",
      action: "Schedule quarterly review call",
      reasoning: "No contact in 45 days, historically high performer",
      expectedOutcome: "Maintain relationship, prevent drift",
      timeframe: "this_week",
      estimatedROI: "$15,000/year",
      contactInfo: { /* contact details */ }
    }
  ],
  summary: {
    priorityBreakdown: { urgent: 2, high: 3, ... },
    categoryBreakdown: { follow_up: 2, opportunity: 1, ... }
  }
}
```

**Adaptation for GoodCounsel:**

**IMPORTANT:** This is ONE component of GoodCounsel's comprehensive system. Per `GoodCounsel.md`, the full scope includes:

1. **Next Action Recommendations** (Cosmos pattern applies here) ✅
   - Client follow-ups (e.g., "You haven't talked with Jim Hartley in two weeks...")
   - Proactive schedule balancing (e.g., "Light day today, but Thursday/Friday busy...")
   - Professional development (e.g., "ICLE seminar next month...")

2. **Wellness Nudges** (NOT covered by Cosmos) ⚠️
   - Break reminders (e.g., "You've been working for 2 hours without a break...")
   - Physical health prompts (stretch, hydrate, bathroom break)
   - Work session management

3. **Ethics & Professional Growth** (NOT covered by Cosmos) ⚠️
   - ABA/state bar rules integration
   - Ethics quizzes and training
   - Reflective practice tools
   - MCLE/CLE tracking

4. **Crisis Support & Resource Pathways** (NOT covered by Cosmos) ⚠️
   - Confidential resource matching
   - Anonymous outreach options
   - Professional support navigation
   - Wellness plan creation

5. **Privacy & Confidentiality Infrastructure** (NOT covered by Cosmos) ⚠️
   - End-to-end encryption for personal disclosures
   - Strict privacy controls
   - No sharing with employers/authorities (except legally required)

**Cosmos Provides:** ~20% of GoodCounsel (next action pattern only)  
**Still Needed:** 80% (wellness monitoring, ethics engine, crisis support, privacy infrastructure)

**Estimated Extraction Time:** 2-3 hours (for next action component only)  
**Integration Complexity:** Low (for this one piece)  
**Total GoodCounsel Complexity:** HIGH (much more to build beyond Cosmos)

---

#### 2. Partner Analyzer Service (`src/services/partnerAnalyzer.ts`)
**Lines:** 156 total  
**Purpose:** Core analysis engine for generating recommendations  
**Reusability:** 70% - Good pattern for ONE aspect of GoodCounsel

**What It Provides:**
- Intelligent recommendation generation
- Priority-based filtering
- Aggregate metrics/dashboard
- Urgent item detection

**What GoodCounsel Needs Beyond This:**

Per `GoodCounsel.md`, the analyzer is just the beginning. GoodCounsel requires:

1. **Multi-Modal Monitoring** (not in Cosmos):
   - Work session tracking (time worked without breaks)
   - Physical wellness indicators (movement, hydration)
   - Schedule analysis (workload distribution)
   - Stress/burnout detection

2. **Ethics Rules Engine** (not in Cosmos):
   - ABA Model Rules integration
   - State-specific bar rules
   - Ethics decision trees
   - Conflict detection
   - MCLE/CLE tracking

3. **Crisis Detection & Response** (not in Cosmos):
   - Pattern recognition for distress signals
   - Confidential resource matching
   - Graduated intervention pathways
   - Anonymous outreach facilitation

4. **Privacy-First Architecture** (not in Cosmos):
   - End-to-end encryption for sensitive data
   - Strict access controls
   - Audit logging with privacy protections
   - Mandatory disclosure protocols (when legally required)

**Key Methods (Cosmos Pattern):**

```typescript
class PartnerAnalyzer {
  // Get recommendations for specific partner
  async getNextActions(partnerId: string): Promise<NextActionRecommendation[]>

  // Get all recommendations with filtering
  async getAllRecommendations(request: AnalysisRequest): Promise<NextActionRecommendation[]>

  // Get urgent recommendations only
  async getUrgentRecommendations(): Promise<NextActionRecommendation[]>

  // Generate health metrics/dashboard
  async analyzePartnerHealth(): Promise<HealthMetrics>
}
```

**What GoodCounsel's Analyzer Needs:**

```typescript
class GoodCounselAnalyzer {
  // Client relationship recommendations (similar to Cosmos) ✅
  async getClientActionRecommendations(userId: string): Promise<Recommendation[]>
  
  // Wellness monitoring (NEW - not in Cosmos) ⚠️
  async analyzeWorkSession(userId: string): Promise<WellnessAlert[]>
  async detectBurnoutRisk(userId: string): Promise<RiskAssessment>
  async generateWellnessNudge(context: WorkContext): Promise<WellnessPrompt>
  
  // Ethics guidance (NEW - not in Cosmos) ⚠️
  async checkEthicsCompliance(situation: EthicalScenario): Promise<EthicsGuidance>
  async recommendEthicsTraining(userId: string): Promise<TrainingRecommendation[]>
  async trackMCLE(userId: string): Promise<MCLEStatus>
  
  // Crisis support (NEW - not in Cosmos) ⚠️
  async assessWellnessRisk(indicators: WellnessIndicators): Promise<SupportPathways>
  async matchResources(needs: SupportNeeds): Promise<ResourceRecommendations[]>
  async facilitateAnonymousOutreach(request: OutreachRequest): Promise<OutreachResult>
  
  // Dashboard & reporting (similar to Cosmos, but more comprehensive) ⚠️
  async generateWellnessDashboard(userId: string): Promise<WellnessMetrics>
  async generateEthicsDashboard(userId: string): Promise<EthicsMetrics>
}
```

**Adaptation for GoodCounsel:**

```typescript
class WellnessAnalyzer {
  // Get wellness recommendations for specific attorney
  async getNextActions(userId: string): Promise<WellnessRecommendation[]>

  // Get all wellness recommendations
  async getAllRecommendations(request: AnalysisRequest): Promise<WellnessRecommendation[]>

  // Get urgent wellness/ethics alerts
  async getUrgentRecommendations(): Promise<WellnessRecommendation[]>

  // Generate wellness dashboard metrics
  async analyzeWellnessHealth(): Promise<WellnessMetrics>
}
```

**Wellness Metrics for GoodCounsel:**
```typescript
{
  totalUsers: number,                    // Total attorneys using system
  activeUsers: number,                   // Recently active
  atRiskUsers: number,                   // Showing stress/burnout signs
  complianceIssues: number,              // Ethics violations flagged
  averageWellnessScore: number,          // 0-100 wellness score
  habitCurbAlerts: number,               // Active habit concerns
  overdueCheckIns: number                // Users overdue for wellness check
}
```

**Estimated Extraction Time:** 3-4 hours  
**Integration Complexity:** Medium - Requires wellness data model

---

#### 3. AI Service (`src/services/aiService.ts`)
**Purpose:** OpenAI GPT-4 integration for generating recommendations  
**Reusability:** 60% - Can reuse patterns, but Cyrano likely has better implementation

**What It Does:**
- Constructs detailed prompts for recommendation generation
- Calls OpenAI GPT-4 with partner/client context
- Parses and structures AI responses
- Handles API errors gracefully

**Key Pattern for GoodCounsel:**
```typescript
async generateRecommendations(partner: Partner): Promise<Recommendation[]> {
  const prompt = this.buildPrompt(partner);
  const response = await this.openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an expert mortgage partner relationship manager..."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });
  
  return this.parseRecommendations(response);
}
```

**Adaptation for GoodCounsel:**
- System prompt: "You are an expert legal ethics and attorney wellness advisor..."
- Include ethics rules, wellness best practices in prompt
- Parse recommendations with wellness/ethics categories
- Add validation for ethics rule citations

**Note:** Cyrano MAE likely has better AI orchestration. Consider using MAE instead of porting this.

**Estimated Extraction Time:** 2 hours (if needed)  
**Integration Complexity:** Low

---

### 🟡 MEDIUM PRIORITY - Supporting Components

#### 4. Data Service (`src/services/dataService.ts`)
**Purpose:** CRUD operations for partner data  
**Reusability:** 50% - Pattern useful, but implementation specific to partners

**What It Provides:**
- In-memory data storage (production would use database)
- Filtering methods (by status, risk level, value)
- Query methods (get by ID, get all, get specific subsets)

**Adaptation for GoodCounsel:**
- Replace partner data with user wellness data
- Add methods for wellness score tracking
- Add methods for HabitCurb integration
- Add ethics violation tracking

**Estimated Extraction Time:** 2 hours  
**Integration Complexity:** Medium

---

#### 5. Type Definitions (`src/types/`)
**Files:**
- `partner.ts` - Partner data structure
- `recommendations.ts` - Recommendation structure

**Reusability:** 70% - Structure is excellent, just need to adapt field names

**Partner Type (Example):**
```typescript
interface Partner {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'at_risk';
  metrics: {
    monthlyLoanVolume: number;
    walletShare: number;
    averageLoanSize: number;
  };
  compliance: {
    licenseStatus: 'active' | 'expiring' | 'expired';
    riskLevel: 'low' | 'medium' | 'high';
  };
  lastContact: Date;
  nextReviewDate: Date;
}
```

**GoodCounsel Equivalent:**
```typescript
interface User {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'at_risk';
  wellnessMetrics: {
    overallScore: number;           // 0-100
    stressLevel: number;            // 0-100
    workLifeBalance: number;        // 0-100
    billableHours: number;
  };
  ethicsCompliance: {
    lastReview: Date;
    violations: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  habitCurb: {
    activeAlerts: number;
    concernedHabits: string[];
  };
  lastCheckIn: Date;
  nextReviewDate: Date;
}
```

**Estimated Extraction Time:** 1-2 hours  
**Integration Complexity:** Low

---

### 🔵 LOW PRIORITY - Reference Only

#### 6. Web Dashboard (`public/`)
**Purpose:** Demo/admin interface  
**Reusability:** 30% - LexFiat will have its own UI

**What's Useful:**
- Dashboard layout inspiration
- Dark/light mode toggle implementation
- Real-time status indicators

**Note:** Don't port directly, but use as UI/UX reference

#### 7. Deployment Scripts (`deploy.sh`, `Procfile`)
**Purpose:** Replit deployment  
**Reusability:** 20% - Deployment approach will differ

---

## Next Action Tool Deep Dive

### Recommendation Generation Flow

```
1. User Request (via MCP)
   ↓
2. NextActionTool.execute()
   ├─→ Validate input schema (Zod)
   ├─→ Determine recommendation scope
   │   ├─ Specific partner/client?
   │   ├─ Urgent only?
   │   └─ All with filters?
   └─→ Route to PartnerAnalyzer
       ↓
3. PartnerAnalyzer.getNextActions()
   ├─→ Fetch partner/client data
   ├─→ Analyze current state
   ├─→ Generate recommendations (AI)
   └─→ Apply filters
       ↓
4. Format Response
   ├─→ Structure recommendations
   ├─→ Generate summary statistics
   └─→ Return JSON
       ↓
5. Return to MCP Client
```

### Priority Determination Logic

**Urgent:**
- License expiring within 7 days
- Compliance violations detected
- High-value partner not contacted in 60+ days
- Risk level elevated to "high"

**High:**
- Important milestone approaching
- Significant business opportunity identified
- Performance declining
- Review overdue

**Medium:**
- Routine follow-up needed
- Standard check-in time
- Minor optimization opportunity

**Low:**
- Nice-to-have improvements
- Long-term strategic planning
- Optional enhancements

**Adaptation for GoodCounsel:**

**Urgent:**
- Ethics violation detected
- Mental health crisis indicators
- HabitCurb severe alert
- Wellness score < 30

**High:**
- Ethics review overdue
- Wellness score declining rapidly
- Work hours excessive (burnout risk)
- Client complaint received

**Medium:**
- Routine wellness check-in
- Professional development opportunity
- Wellness score trending down slowly

**Low:**
- General wellness tips
- Long-term professional growth
- Optional resource recommendations

---

## Category Classification

### Cosmos Categories (Mortgage Partners)
1. **follow_up** - Routine relationship maintenance
2. **risk_mitigation** - Prevent problems
3. **opportunity** - Revenue/growth opportunities
4. **compliance** - Regulatory requirements
5. **performance** - Optimization recommendations

### GoodCounsel Categories (Per GoodCounsel.md)

**Client Relationship Actions** (Cosmos pattern applies) ✅
1. **client_follow_up** - Check-ins with clients (e.g., "Jim Hartley hasn't heard from you...")
2. **proactive_outreach** - Preventive client communication
3. **hearing_prep** - Case milestone support

**Wellness Nudges** (NOT in Cosmos) ⚠️
4. **break_reminder** - Physical wellness prompts (stretch, hydrate, bathroom)
5. **session_management** - Work duration monitoring
6. **schedule_balance** - Workload distribution (e.g., "Light today, busy Thursday...")

**Ethics & Professional** (NOT in Cosmos) ⚠️
7. **ethics_review** - Rules compliance, conflict checks
8. **ethics_training** - ABA/bar continuing education
9. **professional_development** - Career growth, seminars (e.g., "ICLE QDRO seminar...")
10. **mcle_tracking** - Continuing legal education requirements

**Crisis Support** (NOT in Cosmos) ⚠️
11. **wellness_assessment** - Burnout risk, stress detection
12. **resource_matching** - Confidential support pathways
13. **intervention** - Graduated support responses

**Note:** Cosmos provides patterns for categories 1-3 only. Categories 4-13 require new implementation.

---

## MCP Integration Pattern

### Tool Registration (From Cosmos)

```typescript
export class NextActionTool {
  getToolDefinition() {
    return {
      name: 'recommend_next_action',
      description: 'Generate AI-powered next action recommendations...',
      inputSchema: {
        type: 'object',
        properties: { /* Zod schema converted to JSON Schema */ }
      }
    };
  }

  async execute(request: CallToolRequest) {
    try {
      const input = NextActionInputSchema.parse(request.params.arguments || {});
      const recommendations = await this.partnerAnalyzer.getNextActions(input);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: false, error: error.message })
        }],
        isError: true
      };
    }
  }
}
```

### GoodCounsel Equivalent

```typescript
export class WellnessActionTool {
  getToolDefinition() {
    return {
      name: 'recommend_wellness_action',
      description: 'Generate AI-powered wellness and ethics recommendations for attorneys',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'Attorney user ID to analyze'
          },
          timeframe: {
            type: 'string',
            enum: ['immediate', 'this_week', 'this_month']
          },
          category: {
            type: 'string',
            enum: ['wellness_check', 'ethics_review', 'self_care', 'habit_alert', 'professional_development']
          },
          priority: {
            type: 'string',
            enum: ['urgent', 'high', 'medium', 'low']
          }
        }
      }
    };
  }

  async execute(request: CallToolRequest) {
    const input = WellnessActionInputSchema.parse(request.params.arguments || {});
    const recommendations = await this.wellnessAnalyzer.getNextActions(input);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          recommendations: recommendations.map(rec => ({
            user: rec.user,
            priority: rec.priority,
            category: rec.category,
            action: rec.action,
            reasoning: rec.reasoning,
            ethicsRule: rec.ethicsRule,        // New field
            wellnessImpact: rec.wellnessImpact, // New field
            timeframe: rec.timeframe
          })),
          summary: this.generateWellnessSummary(recommendations)
        }, null, 2)
      }]
    };
  }
}
```

---

## Extraction Recommendations

### ⚠️ REVISED ASSESSMENT - GoodCounsel Scope Reality

After reviewing `GoodCounsel.md`, the original assessment **significantly understated** GoodCounsel's complexity. 

**Original Estimate:** 5-7 hours to adapt Cosmos → GoodCounsel  
**Revised Reality:** Cosmos provides ~20% of GoodCounsel's requirements

### What Cosmos Provides (20% of GoodCounsel)

**Client Relationship Recommendations** ✅
- Next action pattern (intelligent, context-aware suggestions)
- Priority-based filtering
- Timeframe categorization
- AI-powered recommendation generation

**Effort to Extract:** 5-7 hours  
**Value:** Medium-High (good foundation, but incomplete)

### What GoodCounsel Needs Beyond Cosmos (80% Still Required)

#### 1. Wellness Monitoring System (Not in Cosmos)
**Effort:** 15-20 hours
- Work session tracking (time worked, breaks)
- Physical wellness nudges (stretch, hydrate, bathroom breaks)
- Schedule analysis and workload balancing
- Burnout risk detection
- Context-aware wellness prompts

**Example from GoodCounsel.md:**
> "You've been working without a break for almost two hours. It's time to stand up, stretch, walk around..."

#### 2. Ethics & Professional Development Engine (Not in Cosmos)
**Effort:** 20-25 hours
- ABA Model Rules integration
- State bar rules database
- Ethics quiz/training system
- MCLE/CLE tracking
- Conflict detection
- Reflective practice tools
- Continuing education recommendations

**Example from GoodCounsel.md:**
> Ethics quizzes, deep dives on various points of legal ethics, integration with ABA and state bar rules

#### 3. Crisis Support & Resource System (Not in Cosmos)
**Effort:** 15-20 hours
- Pattern recognition for distress signals
- Confidential resource matching
- Anonymous outreach facilitation
- Graduated intervention pathways
- Professional support navigation
- Wellness plan creation

**Example from GoodCounsel.md:**
> Contextual resource matching, peer/mentor connection, ongoing self-assessment tools, true anonymity controls

#### 4. Privacy & Security Infrastructure (Not in Cosmos)
**Effort:** 10-15 hours
- End-to-end encryption for sensitive data
- Strict access controls (never shared with employers/authorities)
- Audit logging with privacy protections
- Mandatory disclosure protocols (legal requirements)
- User consent management

**Example from GoodCounsel.md:**
> "Personal information provided by a user is never shared with employers, supervisors, coworkers, licensing authorities..."

#### 5. Multi-Modal Context Awareness (Partially in Cosmos)
**Effort:** 8-10 hours
- Integrate with calendar/scheduling
- Track billable hours
- Monitor email/communication patterns
- Analyze case workload
- Detect stress indicators

**Note:** Cosmos has some context awareness for business metrics, but not health/wellness indicators.

---

### 🔥 Realistic Extraction Plan

#### Phase 1: Foundation (Week 4) - Extract Cosmos Pattern
**Effort:** 5-7 hours

1. ✅ Extract Next Action Tool structure
2. ✅ Extract recommendation generation pattern
3. ✅ Adapt priority/category classification
4. ✅ Create client relationship recommendation types

**Deliverable:** Client follow-up recommendations working (20% of GoodCounsel)

#### Phase 2: Wellness Monitoring (Week 5) - Build New
**Effort:** 15-20 hours

1. ⚠️ Implement work session tracking
2. ⚠️ Build wellness nudge system
3. ⚠️ Create physical health prompts
4. ⚠️ Implement burnout risk detection
5. ⚠️ Build schedule analysis

**Deliverable:** Wellness monitoring system operational (40% of GoodCounsel)

#### Phase 3: Ethics Engine (Week 6-7) - Build New
**Effort:** 20-25 hours

1. ⚠️ Integrate ABA Model Rules database
2. ⚠️ Add state bar rules
3. ⚠️ Build ethics training/quiz system
4. ⚠️ Implement MCLE tracking
5. ⚠️ Create conflict detection

**Deliverable:** Ethics guidance system operational (60% of GoodCounsel)

#### Phase 4: Crisis Support (Week 8) - Build New
**Effort:** 15-20 hours

1. ⚠️ Build resource matching system
2. ⚠️ Implement anonymous outreach
3. ⚠️ Create intervention pathways
4. ⚠️ Build wellness plan tools

**Deliverable:** Crisis support system operational (80% of GoodCounsel)

#### Phase 5: Privacy Infrastructure (Week 9) - Build New
**Effort:** 10-15 hours

1. ⚠️ Implement end-to-end encryption
2. ⚠️ Build access control system
3. ⚠️ Create audit logging
4. ⚠️ Implement mandatory disclosure protocols

**Deliverable:** Privacy-compliant system (100% of GoodCounsel)

---

### Revised Effort Estimates

| Component | Cosmos Provides | Build New | Total Effort |
|-----------|----------------|-----------|--------------|
| Client Recommendations | ✅ Yes | - | 5-7 hours |
| Wellness Monitoring | ❌ No | ⚠️ Yes | 15-20 hours |
| Ethics Engine | ❌ No | ⚠️ Yes | 20-25 hours |
| Crisis Support | ❌ No | ⚠️ Yes | 15-20 hours |
| Privacy Infrastructure | ❌ No | ⚠️ Yes | 10-15 hours |
| **TOTAL** | **20%** | **80%** | **65-87 hours** |

**Original Estimate:** 8-12 hours (SIGNIFICANTLY understated)  
**Revised Estimate:** 65-87 hours (~9-12 work days at 8 hrs/day)  
**Time Savings from Cosmos:** ~5-7 hours (not 3-4 weeks as originally stated)

### Phase 3: Integration (Week 5-6)
1. Connect to HabitCurb data
2. Integrate ethics rule database
3. Add wellness score tracking
4. **Deliverable:** Full-featured wellness recommendation system

---

## Testing Strategy

### Unit Tests Required
1. Priority classification logic
2. Category assignment
3. Filtering (by priority, category, timeframe)
4. Summary generation

### Integration Tests Required
1. Full recommendation flow with real wellness data
2. HabitCurb integration
3. Ethics rule citation validation
4. Performance with large user base

---

## Risk Assessment

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Wellness data model complexity | Medium | Start simple, iterate |
| Ethics rule database integration | Medium | Use structured knowledge base |
| HabitCurb data access | Medium | Define clear API contract |
| AI hallucination on ethics rules | HIGH | Strict validation, human review |

### Compliance Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| HIPAA violations (mental health data) | HIGH | Encryption, access controls |
| Ethics rule misinterpretation | HIGH | Legal review, disclaimers |
| Privacy concerns | HIGH | Strict data minimization |

---

## Documentation Requirements

### Code Documentation
- Wellness recommendation algorithm
- Priority classification logic
- Category definitions
- Ethics rule citation format

### User Documentation
- How to interpret recommendations
- Priority levels explained
- When to seek professional help (mental health)
- Ethics rule reference guide

---

## Production Notes

### Cosmos Deployment Status (Updated)
- ⚠️ **Previously Deployed** (no longer active per user)
- ⚠️ **MCP Server Pattern** (code demonstrates MCP compatibility)
- ✅ **Code Quality** (production-ready patterns)
- ⚠️ **Web Dashboard** (historical reference only)

### Confidence Level - REVISED

**Original:** 85% confidence that Next Action pattern covers GoodCounsel needs  
**Revised:** 70% confidence that Next Action pattern is ONE useful component

**Reality Check:**
- Cosmos provides ~20% of GoodCounsel (client relationship recommendations only)
- GoodCounsel requires 80% new development (wellness monitoring, ethics engine, crisis support, privacy infrastructure)
- Next Action pattern is valuable but insufficient alone

---

## Revised Recommendations

### ✅ DO Extract from Cosmos:
1. **Next Action Tool Pattern** - Good foundation for client recommendations
2. **Priority Classification Logic** - Reusable for all recommendation types
3. **MCP Tool Structure** - Demonstrates proper MCP integration
4. **Recommendation Generation Pattern** - Adaptable template

**Effort:** 5-7 hours  
**Value:** Medium-High (good start, not complete solution)

### ⚠️ DON'T Expect Cosmos to Solve GoodCounsel:

Cosmos provides ONE piece of a much larger system. After extracting Cosmos patterns, you still need to build:

1. **Wellness Monitoring** (~15-20 hours) - Work session tracking, break reminders, burnout detection
2. **Ethics Engine** (~20-25 hours) - ABA/bar rules, training, MCLE tracking
3. **Crisis Support** (~15-20 hours) - Resource matching, anonymous outreach, intervention pathways
4. **Privacy Infrastructure** (~10-15 hours) - End-to-end encryption, strict access controls

**Total Additional Effort:** 60-80 hours beyond Cosmos extraction

---

## Next Steps - REVISED

### Week 4: Extract Cosmos Foundation (5-7 hours)
1. ✅ Extract `nextAction.ts` pattern to `/Cyrano/src/engines/goodcounsel/tools/client-action.ts`
2. ✅ Adapt `partnerAnalyzer.ts` pattern for client relationship analyzer
3. ✅ Define client recommendation types
4. **Deliverable:** Client follow-up recommendations working

### Week 5+: Build GoodCounsel Core (60-80 hours)
1. ⚠️ **NEW:** Build wellness monitoring system (not in Cosmos)
2. ⚠️ **NEW:** Build ethics engine (not in Cosmos)
3. ⚠️ **NEW:** Build crisis support system (not in Cosmos)
4. ⚠️ **NEW:** Build privacy infrastructure (not in Cosmos)
5. ⚠️ **NEW:** Integrate all components with LexFiat UI
6. **Deliverable:** Full GoodCounsel engine operational

### Reference Materials
- `GoodCounsel.md` - Authoritative specification
- Annunciator app (GitHub) - Context-aware reminder system
- HabitCurb integration requirements
- ABA Model Rules database
- State bar rules repositories

---

**Status:** Inventory complete - REVISED with realistic scope  
**Recommendation:** Extract Cosmos patterns as ONE component, but plan for significant additional development  
**Original Estimate:** 8-12 hours (❌ INCORRECT)  
**Revised Estimate:** 65-87 hours total (5-7 from Cosmos, 60-80 new development)  
**Expected Value:** Medium (useful foundation, but 80% of work remains)

---

## Key Takeaway

**GoodCounsel is LexFiat's differentiating feature** - a comprehensive attorney wellness, ethics, and crisis support system that goes far beyond simple "next action" recommendations. 

Cosmos provides a good starting pattern for CLIENT relationship recommendations, but the majority of GoodCounsel's functionality (wellness monitoring, ethics guidance, crisis support, privacy infrastructure) must be built from scratch.

**Don't underestimate GoodCounsel's scope.** Per `GoodCounsel.md`: "Without GoodCounsel, LexFiat is just another law practice management app."
