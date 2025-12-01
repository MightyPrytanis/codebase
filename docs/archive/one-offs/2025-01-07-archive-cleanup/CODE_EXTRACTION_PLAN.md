# Code Extraction Plan
**Created:** 2025-11-22  
**Purpose:** Prioritized plan for extracting and adapting legacy code into Cyrano/LexFiat  
**Based on:** SwimMeet, Cosmos, and Arkiver inventories

---

## Executive Summary

**UPDATED:** 2025-11-22 after GoodCounsel.md review

Three legacy systems have been comprehensively analyzed for reusable code:

| System | Status | Reusability | Value | Integration Effort |
|--------|--------|-------------|-------|-------------------|
| **SwimMeet** | Archived (UI issues) | 75% | Very High | Medium |
| **Cosmos** | ⚠️ Previously Deployed | 60% (REVISED) | Medium | Low |
| **Arkiver** | ✅ Production Ready | 95% | Exceptionally High | Very Low |

**Key Finding - REVISED:** 

- **Arkiver:** 95% of ArkiverMJ requirements ✅
- **SwimMeet:** 75% of MAE requirements ✅
- **Cosmos:** 20% of GoodCounsel requirements ⚠️ (SIGNIFICANTLY REVISED)

**Original Assessment:** Cosmos provides 85% of GoodCounsel  
**Revised Reality:** Cosmos provides ~20% of GoodCounsel (client recommendations only)

**GoodCounsel Requires 80% New Development:**
- Wellness monitoring system (15-20 hours)
- Ethics engine (20-25 hours)
- Crisis support system (15-20 hours)
- Privacy infrastructure (10-15 hours)

**Estimated time savings:** 3-4 weeks (not 6-8 weeks as originally stated)

---

## Prioritized Extraction Roadmap

### 🔥 Phase 1: Critical Infrastructure (Week 3)

#### Priority 1A: Arkiver Integration (Immediate - Day 1-2)
**Target:** ArkiverMJ Module  
**Effort:** 2-3 hours  
**Value:** Exceptionally High  
**Complexity:** Very Low

**Actions:**
1. ✅ Copy entire Arkiver package to `/Cyrano/src/modules/arkiver/`
   ```bash
   cp -r /Coding/codebase/Labs/Arkiver/arkiver /Coding/codebase/Cyrano/src/modules/arkiver
   cp /Coding/codebase/Labs/Arkiver/pyproject.toml /Coding/codebase/Cyrano/arkiver_requirements.txt
   ```

2. ✅ Install Arkiver plugin in Cyrano MCP server
   ```typescript
   // In /Cyrano/src/mcp-server.ts
   import { ArkiverPlugin } from './modules/arkiver';
   
   // During server initialization
   arkiverPlugin.install(server);
   ```

3. ✅ Test all 7 MCP tools
   - extract_conversations
   - extract_text_content
   - categorize_with_keywords
   - process_with_regex
   - generate_categorized_files
   - run_extraction_pipeline
   - create_arkiver_config

**Deliverable:** ArkiverMJ operational with 7 working MCP tools

**Success Criteria:**
- All 7 tools callable via MCP
- Sample document extraction working
- Configuration system operational

---

#### Priority 1B: MAE Workflow Engine (Day 3-5)
**Target:** MAE Engine  
**Effort:** 6-8 hours  
**Value:** Very High  
**Complexity:** Medium

**Actions:**
1. ✅ Extract SwimMeet workflow engine
   - Copy `/SwimMeet/server/workflow-engine.ts` → `/Cyrano/src/engines/mae/workflow-engine.ts`
   - Extract interfaces (WorkflowNode, WorkflowConnection, ExecutionContext, ExecutionStep)

2. ✅ Adapt node types for Cyrano
   ```typescript
   // Extend SwimMeet's node types
   interface CyranoWorkflowNode extends WorkflowNode {
     type: 'start' | 'ai' | 'decision' | 'end' | 'module' | 'engine' | 'tool';
     moduleConfig?: {
       module: string;      // e.g., 'chronometric'
       action: string;      // e.g., 'identify_gaps'
       params: Record<string, any>;
     };
     engineConfig?: {
       engine: string;      // e.g., 'goodcounsel'
       workflow: string;    // e.g., 'wellness_check'
       params: Record<string, any>;
     };
     toolConfig?: {
       tool: string;        // e.g., 'gap-identifier'
       params: Record<string, any>;
     };
   }
   ```

3. ✅ Integrate with existing MAE scaffold (created by Cursor)
   - Replace or enhance existing workflow system
   - Keep Cursor's module orchestration
   - Add SwimMeet's topological sort for dependencies

4. ✅ Update execution logic
   ```typescript
   private async executeNode(
     node: CyranoWorkflowNode,
     context: ExecutionContext,
     credentials: Record<string, string>
   ): Promise<any> {
     switch (node.type) {
       case 'module':
         return await this.modules.get(node.moduleConfig.module)
           .executeAction(node.moduleConfig.action, node.moduleConfig.params);
       
       case 'engine':
         return await this.engines.get(node.engineConfig.engine)
           .runWorkflow(node.engineConfig.workflow, node.engineConfig.params);
       
       case 'tool':
         return await this.toolRegistry.executeTool(
           node.toolConfig.tool,
           node.toolConfig.params
         );
       
       case 'ai':
         return await this.aiCoordinator.query(
           node.provider,
           context.currentInput,
           node.config
         );
       
       default:
         throw new Error(`Unsupported node type: ${node.type}`);
     }
   }
   ```

**Deliverable:** MAE can execute complex workflows with dependencies

**Success Criteria:**
- Topological sort working for complex dependency graphs
- Module/engine/tool nodes executing correctly
- Execution context tracking variables across steps
- Error handling with step-by-step failure details

---

#### Priority 1C: GoodCounsel Client Recommendations from Cosmos (Day 6-8)
**Target:** GoodCounsel Engine - **CLIENT RELATIONSHIP COMPONENT ONLY**  
**Effort:** 5-7 hours (covers ~20% of GoodCounsel total)  
**Value:** Medium (useful pattern but incomplete)  
**Complexity:** Low

**⚠️ CRITICAL SCOPE NOTE:**
This phase extracts ONLY the client relationship recommendation pattern from Cosmos. GoodCounsel requires 4 additional major systems (wellness monitoring, ethics engine, crisis support, privacy infrastructure) totaling 60-80 additional hours. See Phase 2D, 3D, and 3E for complete GoodCounsel implementation.

**Actions:**
1. ✅ Extract Cosmos Next Action pattern
   - Copy `/Cosmos/src/tools/nextAction.ts` → `/Cyrano/src/engines/goodcounsel/tools/client-action.ts`
   - Copy `/Cosmos/src/services/partnerAnalyzer.ts` → `/Cyrano/src/engines/goodcounsel/services/client-analyzer.ts`

2. ✅ Adapt data models for client relationships
   ```typescript
   // Partner → User
   interface User {
     id: string;
     name: string;
     email: string;
     status: 'active' | 'inactive' | 'at_risk';
     wellnessMetrics: {
       overallScore: number;          // 0-100
       stressLevel: number;           // 0-100
       workLifeBalance: number;       // 0-100
       billableHoursThisWeek: number;
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
   
   interface WellnessRecommendation {
     userId: string;
     userName: string;
     priority: 'urgent' | 'high' | 'medium' | 'low';
     category: 'wellness_check' | 'ethics_review' | 'self_care' | 
               'habit_alert' | 'professional_development' | 'work_life_balance';
     action: string;
     reasoning: string;
     expectedOutcome: string;
     timeframe: 'immediate' | 'this_week' | 'this_month';
     ethicsRule?: string;               // New: relevant ethics rule citation
     wellnessImpact: number;            // New: expected wellness score improvement
     contactInfo?: {
       preferredMethod: string;
       availability: string;
     };
   }
   ```

3. ✅ Implement wellness analyzer
   ```typescript
   class WellnessAnalyzer {
     async getNextActions(userId: string): Promise<WellnessRecommendation[]> {
       const user = await this.dataService.getUserById(userId);
       
       if (!user) {
         throw new Error(`User with ID ${userId} not found`);
       }
       
       return await this.aiService.generateWellnessRecommendations(user);
     }
     
     async getUrgentRecommendations(): Promise<WellnessRecommendation[]> {
       const usersAtRisk = await this.dataService.getUsersAtRisk();
       const urgentRecommendations: WellnessRecommendation[] = [];
       
       for (const user of usersAtRisk) {
         const recommendations = await this.aiService.generateWellnessRecommendations(user);
         const urgent = recommendations.filter(rec => rec.priority === 'urgent');
         urgentRecommendations.push(...urgent);
       }
       
       return this.sortByPriority(urgentRecommendations);
     }
     
     async analyzeWellnessHealth(): Promise<WellnessMetrics> {
       const allUsers = await this.dataService.getAllUsers();
       
       return {
         totalUsers: allUsers.length,
         activeUsers: allUsers.filter(u => u.status === 'active').length,
         atRiskUsers: allUsers.filter(u => u.status === 'at_risk').length,
         complianceIssues: allUsers.filter(u => u.ethicsCompliance.violations > 0).length,
         averageWellnessScore: this.calculateAverageWellness(allUsers),
         habitCurbAlerts: allUsers.reduce((sum, u) => sum + u.habitCurb.activeAlerts, 0),
         overdueCheckIns: allUsers.filter(u => this.isOverdue(u.nextReviewDate)).length
       };
     }
   }
   ```

4. ✅ Create MCP tool definition
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
               description: 'Attorney user ID to analyze (optional)'
             },
             timeframe: {
               type: 'string',
               enum: ['immediate', 'this_week', 'this_month'],
               description: 'Time horizon for recommendations'
             },
             priority: {
               type: 'string',
               enum: ['urgent', 'high', 'medium', 'low'],
               description: 'Filter by priority level'
             },
             category: {
               type: 'string',
               enum: ['wellness_check', 'ethics_review', 'self_care', 
                      'habit_alert', 'professional_development', 'work_life_balance'],
               description: 'Filter by recommendation category'
             },
             limit: {
               type: 'number',
               minimum: 1,
               maximum: 20,
               description: 'Maximum number of recommendations'
             }
           }
         }
       };
     }
   }
   ```

**Deliverable:** GoodCounsel client relationship recommendations operational

**Success Criteria:**
- Client relationship recommendations generated via MCP
- Priority classification working (follow-ups, check-ins)
- Category filtering working (engagement health, communication patterns)
- Integration with client data sources

**What This Phase Does NOT Deliver:**
- ❌ Wellness monitoring system (15-20 hours additional)
- ❌ Ethics & professional development engine (20-25 hours additional)
- ❌ Crisis support & resource system (15-20 hours additional)
- ❌ Privacy & security infrastructure (10-15 hours additional)

**Estimated Completion:** ~20% of full GoodCounsel specification

---

### 🟡 Phase 2: Enhancements (Week 4)

#### Priority 2A: AI Coordinator (MAE Enhancement)
**Target:** MAE Engine  
**Effort:** 4-5 hours  
**Value:** High  
**Complexity:** Medium

**Actions:**
1. ✅ Extract SwimMeet AI Service multi-provider pattern
   - Copy `/SwimMeet/server/services/ai-service.ts` → `/Cyrano/src/engines/mae/ai-coordinator.ts`
   - Adapt for Cyrano's credential management

2. ✅ Implement provider abstraction
   ```typescript
   class AICoordinator {
     private providers: Map<string, AIProvider> = new Map();
     
     async query(
       provider: string,
       prompt: string,
       config?: AIConfig
     ): Promise<AIResponse> {
       const providerInstance = this.providers.get(provider);
       if (!providerInstance) {
         throw new Error(`Unknown AI provider: ${provider}`);
       }
       
       return await providerInstance.query(prompt, config);
     }
     
     async queryBest(
       prompt: string,
       requirements?: AIRequirements
     ): Promise<AIResponse> {
       const bestProvider = this.selectProvider(prompt, requirements);
       return await this.query(bestProvider, prompt);
     }
     
     private selectProvider(
       prompt: string,
       requirements?: AIRequirements
     ): string {
       // Intelligent provider selection based on:
       // - Task type (research, creative, analytical)
       // - Response time requirements
       // - Token budget
       // - Model capabilities
     }
   }
   ```

**Deliverable:** MAE can intelligently route AI queries to appropriate providers

---

#### Priority 2B: Legal Document Processors (ArkiverMJ Enhancement)
**Target:** ArkiverMJ Module  
**Effort:** 6-8 hours  
**Value:** High  
**Complexity:** Low-Medium

**Actions:**
1. ✅ Implement PDF Extractor
   ```python
   # /Cyrano/src/modules/arkiver/extractors_legal.py
   from pypdf import PdfReader
   from .extractors import BaseExtractor, EXTRACTOR_REGISTRY
   
   class PDFExtractor(BaseExtractor):
       def extract(self) -> Iterator[Dict[str, Any]]:
           file_path = self.config.get("path")
           reader = PdfReader(file_path)
           
           text_content = ""
           for page in reader.pages:
               text_content += page.extract_text()
           
           yield {
               "type": "pdf",
               "title": os.path.basename(file_path),
               "content": text_content,
               "pages": len(reader.pages),
               "metadata": {
                   "producer": reader.metadata.producer if reader.metadata else None,
                   "creator": reader.metadata.creator if reader.metadata else None,
                   "creation_date": reader.metadata.creation_date if reader.metadata else None
               },
               "raw_data": {"file_path": file_path}
           }
   
   EXTRACTOR_REGISTRY["pdf"] = PDFExtractor
   ```

2. ✅ Implement Legal Citation Processor
   ```python
   # /Cyrano/src/modules/arkiver/processors_legal.py
   import re
   from .processors import BaseProcessor, PROCESSOR_REGISTRY
   
   class LegalCitationProcessor(BaseProcessor):
       CITATION_PATTERNS = {
           'supreme_court': r'\d+ U\.S\. \d+',
           'federal_court': r'\d+ F\.\d+d \d+',
           'supreme_court_reporter': r'\d+ S\.Ct\. \d+',
           'state_reporter': r'\d+ [A-Z][a-z\.]+ \d+',
           'law_review': r'\d+ [A-Z][a-z\. ]+ L\. Rev\. \d+',
       }
       
       def setup(self) -> None:
           self.patterns = {
               name: re.compile(pattern, re.IGNORECASE)
               for name, pattern in self.CITATION_PATTERNS.items()
           }
       
       def process(self, item: Dict[str, Any], text_content: str) -> Dict[str, Any]:
           citations_by_type = {}
           all_citations = []
           
           for citation_type, pattern in self.patterns.items():
               matches = pattern.findall(text_content)
               unique_matches = list(set(matches))
               
               if unique_matches:
                   citations_by_type[citation_type] = unique_matches
                   all_citations.extend(unique_matches)
           
           return {
               "processor": "legal_citation",
               "citations": list(set(all_citations)),
               "citations_by_type": citations_by_type,
               "citation_count": len(all_citations),
               "has_citations": len(all_citations) > 0
           }
   
   PROCESSOR_REGISTRY["legal_citation"] = LegalCitationProcessor
   ```

3. ✅ Implement Entity Processor (basic)
   ```python
   class LegalEntityProcessor(BaseProcessor):
       ENTITY_PATTERNS = {
           'attorney': r'(?:Attorney|Counsel|Esq\.|Esquire)\s+([A-Z][a-z]+ [A-Z][a-z]+)',
           'judge': r'(?:Judge|Justice|Hon\.)\s+([A-Z][a-z]+ [A-Z][a-z]+)',
           'party': r'(?:Plaintiff|Defendant|Appellant|Appellee)\s+([A-Z][a-z]+ [A-Z][a-z]+)',
           'court': r'((?:[A-Z][a-z]+ )+(?:Court|Tribunal))',
       }
       
       def process(self, item: Dict[str, Any], text_content: str) -> Dict[str, Any]:
           entities_by_type = {}
           
           for entity_type, pattern in self.ENTITY_PATTERNS.items():
               matches = re.findall(pattern, text_content, re.IGNORECASE)
               unique_matches = list(set(matches))
               
               if unique_matches:
                   entities_by_type[entity_type] = unique_matches
           
           return {
               "processor": "legal_entity",
               "entities": entities_by_type,
               "entity_count": sum(len(entities) for entities in entities_by_type.values()),
               "has_entities": len(entities_by_type) > 0
           }
   
   PROCESSOR_REGISTRY["legal_entity"] = LegalEntityProcessor
   ```

**Deliverable:** ArkiverMJ can extract and process legal documents (PDFs, citations, entities)

---

#### Priority 2C: Wellness Dashboard (GoodCounsel Enhancement)
**Target:** GoodCounsel Engine  
**Effort:** 3-4 hours  
**Value:** Medium  
**Complexity:** Low

**Actions:**
1. ✅ Adapt Cosmos health metrics to wellness metrics
2. ✅ Implement dashboard data aggregation
3. ✅ Create MCP tool for dashboard queries

**Deliverable:** Admin can view wellness metrics across all users

---

### 🔵 Phase 3: Integration & Polish (Week 5-6)

#### Priority 3A: LexFiat Integration
**Target:** LexFiat App  
**Effort:** 8-10 hours  
**Value:** High  
**Complexity:** Medium

**Actions:**
1. ✅ Create LexFiat output handler for Arkiver
   ```python
   class LexFiatCaseFileOutput(BaseOutput):
       """Output handler for LexFiat case files."""
       
       def output(self, processed_items: List[Dict[str, Any]]) -> None:
           case_id = self.config.get("case_id")
           
           for item in processed_items:
               # Extract relevant data
               categories = self._extract_categories(item)
               citations = self._extract_citations(item)
               entities = self._extract_entities(item)
               key_dates = self._extract_dates(item)
               
               # Store in LexFiat database
               self.lexfiat_api.add_document(
                   case_id=case_id,
                   document={
                       "title": item["title"],
                       "content": item.get("content"),
                       "source": item.get("source_name"),
                       "document_type": item.get("type"),
                       "categories": categories,
                       "legal_citations": citations,
                       "entities": entities,
                       "key_dates": key_dates,
                       "processing_metadata": item.get("processing_results"),
                       "uploaded_at": datetime.now().isoformat()
                   }
               )
   ```

2. ✅ Wire MAE workflows to LexFiat UI
3. ✅ Wire GoodCounsel recommendations to LexFiat UI
4. ✅ Wire ArkiverMJ tools to LexFiat document management

**Deliverable:** LexFiat can trigger MAE workflows, display wellness recommendations, and process documents with Arkiver

---

#### Priority 3B: Database Integration
**Target:** All modules  
**Effort:** 4-5 hours  
**Value:** Medium  
**Complexity:** Medium

**Actions:**
1. ✅ Implement database output handlers for Arkiver
2. ✅ Implement user wellness data persistence for GoodCounsel
3. ✅ Implement workflow execution history for MAE

**Deliverable:** All data persisted to database, not just in-memory

---

#### Priority 3C: Testing & Documentation
**Target:** All modules  
**Effort:** 6-8 hours  
**Value:** High  
**Complexity:** Low

**Actions:**
1. ✅ Write unit tests for extracted code
2. ✅ Write integration tests for workflows
3. ✅ Update documentation
4. ✅ Create user guides

**Deliverable:** Comprehensive test coverage and documentation

---

## Extraction Dependencies

### Dependency Graph
```
Arkiver Integration (1A)
├─→ Legal Processors (2B) [optional enhancement]
└─→ LexFiat Integration (3A)

MAE Workflow Engine (1B)
├─→ AI Coordinator (2A) [optional enhancement]
└─→ LexFiat Integration (3A)

GoodCounsel Client Recommendations (1C) [⚠️ 20% of GoodCounsel only]
├─→ GoodCounsel Core Systems (2D, 3D, 3E) [60-80 hours additional]
├─→ Wellness Dashboard (2C) [optional enhancement]
└─→ LexFiat Integration (3A)

Database Integration (3B)
└─→ Requires: 1A, 1B, 1C

GoodCounsel Complete Implementation
└─→ Requires: 1C, 2D, 3D, 3E

Testing & Documentation (3C)
└─→ Requires: All prior phases
```

### Critical Path
```
1A (Arkiver) → 1B (MAE) → 1C (GoodCounsel) → 3A (LexFiat) → 3C (Testing)
```

**Total Critical Path Time:** 24-30 hours (3-4 work days at 8 hrs/day)

---

## Resource Allocation

### Time Estimates by Component

| Component | Extraction | Adaptation | Testing | Total | Priority |
|-----------|-----------|-----------|---------|-------|----------|
| Arkiver Integration | 0.5h | 1.5h | 1h | 3h | CRITICAL |
| MAE Workflow Engine | 2h | 4h | 2h | 8h | CRITICAL |
| **GoodCounsel Client Recs (from Cosmos)** | **2h** | **3h** | **2h** | **7h** | **MEDIUM** |
| **GoodCounsel Wellness System** | **0h** | **15h** | **5h** | **20h** | **HIGH** |
| **GoodCounsel Ethics Engine** | **0h** | **20h** | **5h** | **25h** | **HIGH** |
| **GoodCounsel Crisis Support** | **0h** | **15h** | **5h** | **20h** | **MEDIUM** |
| **GoodCounsel Privacy Infrastructure** | **0h** | **10h** | **5h** | **15h** | **MEDIUM** |
| AI Coordinator | 1h | 2h | 1h | 4h | HIGH |
| Legal Processors | 0h | 6h | 2h | 8h | HIGH |
| Wellness Dashboard | 1h | 2h | 1h | 4h | MEDIUM |
| LexFiat Integration | 0h | 8h | 2h | 10h | HIGH |
| Database Integration | 0h | 4h | 1h | 5h | MEDIUM |
| Testing & Documentation | 0h | 4h | 4h | 8h | HIGH |
| **TOTAL (with full GoodCounsel)** | **6.5h** | **94.5h** | **36h** | **137h** | |
| **TOTAL (without GoodCounsel extensions)** | **6.5h** | **34.5h** | **16h** | **57h** | |

### Breakdown by Phase

**⚠️ TWO SCENARIOS: With/Without Full GoodCounsel**

#### Scenario A: Minimal GoodCounsel (Client Recommendations Only)
| Phase | Components | Total Time | Timeline |
|-------|-----------|-----------|----------|
| Phase 1 (Critical) | 1A, 1B, 1C | 18 hours | Week 3 (Days 1-8) |
| Phase 2 (Enhancements) | 2A, 2B, 2C | 16 hours | Week 4 (Days 9-12) |
| Phase 3 (Integration) | 3A, 3B, 3C | 23 hours | Week 5-6 (Days 13-18) |
| **TOTAL** | All | **57 hours** | **18 work days** |

**At 8 hours per day:** ~7 work days  
**At 4 hours per day:** ~14 work days  
**With buffer (25%):** ~9-18 work days

#### Scenario B: Full GoodCounsel (All 5 Core Systems)
| Phase | Components | Total Time | Timeline |
|-------|-----------|-----------|----------|
| Phase 1 (Foundation) | 1A, 1B, 1C | 18 hours | Week 3 (Days 1-8) |
| Phase 2 (Enhancements) | 2A, 2B, 2C | 16 hours | Week 4 (Days 9-12) |
| **Phase 2D (GoodCounsel Wellness)** | **Wellness monitoring system** | **20 hours** | **Week 5 (Days 13-15)** |
| **Phase 3D (GoodCounsel Ethics)** | **Ethics & professional development** | **25 hours** | **Week 6 (Days 16-19)** |
| **Phase 3E (GoodCounsel Crisis/Privacy)** | **Crisis support + privacy** | **35 hours** | **Week 7-8 (Days 20-24)** |
| Phase 3 (Integration) | 3A, 3B, 3C | 23 hours | Week 9 (Days 25-27) |
| **TOTAL** | All | **137 hours** | **27 work days** |

**At 8 hours per day:** ~17 work days  
**At 4 hours per day:** ~34 work days  
**With buffer (25%):** ~21-43 work days

**CRITICAL DECISION POINT:** User must decide whether to build full GoodCounsel (80 additional hours) or defer 80% of features to later phase.

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| SwimMeet code incompatibility | Medium | Low | Thorough testing before integration | Cursor |
| Arkiver Python/TypeScript bridge issues | Low | Very Low | Use MCP protocol (already working) | Cursor |
| Cosmos pattern doesn't fit wellness domain | Medium | Low | Adapt data models, use AI for gap filling | Cursor |
| Performance degradation | Medium | Medium | Profile and optimize, implement caching | Cursor |
| Type safety issues (TypeScript) | Low | Medium | Comprehensive type checking, unit tests | Cursor |

### Integration Risks

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Breaking Cursor's existing MAE scaffold | High | Low | Incremental integration, feature flags | Cursor |
| LexFiat API not ready | High | Medium | Mock API for testing, parallel development | User/Cursor |
| Database schema conflicts | Medium | Medium | Migration scripts, schema versioning | Cursor |
| MCP protocol version mismatch | Low | Very Low | Pin MCP SDK versions | Cursor |

### Timeline Risks

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Underestimated complexity | Medium | Medium | 25% time buffer, prioritize ruthlessly | User |
| Scope creep | High | High | Stick to plan, defer nice-to-haves | User |
| Context loss between sessions | Medium | Medium | Detailed documentation, checkpoint commits | Cursor |
| Parallel AI agent conflicts | High | Low | Don't modify same files, clear ownership | User |

---

## Quality Gates

### Phase 1 Completion Criteria
- [ ] All 7 Arkiver MCP tools callable and tested
- [ ] MAE can execute sample workflow with module/engine/tool nodes
- [ ] MAE topological sort working with dependency graph
- [ ] **GoodCounsel can generate client relationship recommendations (⚠️ 20% of total GoodCounsel scope)**
- [ ] All code compiles without errors
- [ ] Basic integration tests passing

**Note:** Phase 1C delivers client recommendations only. Full GoodCounsel requires Phase 2D, 3D, and 3E (60-80 additional hours).

### Phase 2 Completion Criteria
- [ ] MAE AI Coordinator can route to multiple providers
- [ ] Arkiver can extract PDFs and find legal citations
- [ ] Arkiver can identify entities (attorneys, judges, parties)
- [ ] GoodCounsel dashboard showing aggregate metrics
- [ ] Performance profiling done, no major bottlenecks

### Phase 3 Completion Criteria
- [ ] LexFiat can trigger MAE workflows
- [ ] LexFiat displays GoodCounsel recommendations
- [ ] LexFiat uses Arkiver for document processing
- [ ] All data persisted to database
- [ ] Comprehensive test suite (>80% coverage)
- [ ] Documentation complete and reviewed
- [ ] Performance acceptable (<1s for most operations)

---

## Success Metrics

### Code Reuse
- **Target:** 70% of code extracted from legacy systems
- **Actual (REVISED):** 
  - Arkiver: 95% reusable ✅
  - MAE (from SwimMeet): 75% reusable ✅
  - GoodCounsel (from Cosmos): **20% reusable** ⚠️ (REVISED DOWN from 85%)

### Time Savings
- **Build from Scratch:** 12-16 weeks
- **With Extraction (Minimal GoodCounsel):** 8-12 weeks
- **With Extraction (Full GoodCounsel):** 10-14 weeks
- **Savings:** 2-4 weeks (15-25%) ⚠️ (REVISED DOWN from 30-40%)

**Critical Note:** Time savings significantly lower than originally estimated due to GoodCounsel requiring 80% new development.

### Code Quality
- **Type Safety:** 100% (TypeScript/Python type hints)
- **Test Coverage:** >80% (unit + integration)
- **Documentation:** Comprehensive (all public APIs documented)
- **Performance:** <1s for most operations, <5s for complex workflows

### Feature Completeness (After Phase 1)
- **MAE:** 90% (workflow orchestration, AI coordination, module/engine support)
- **GoodCounsel:** **20%** (client relationship recommendations only) ⚠️ (REVISED DOWN from 85%)
- **ArkiverMJ:** 95% (data extraction, processing, categorization, MCP tools)

### Feature Completeness (After Full Implementation)
- **MAE:** 95% (with all enhancements)
- **GoodCounsel:** 90% (wellness, ethics, crisis support, privacy, client relationships)
- **ArkiverMJ:** 100% (fully integrated with legal processors)

---

## Rollout Strategy

### Week 3: Foundation
**Days 1-2:** Arkiver Integration  
**Days 3-5:** MAE Workflow Engine  
**Days 6-8:** GoodCounsel Next Action  
**Checkpoint:** All three systems operational independently

### Week 4: Enhancement
**Days 9-10:** AI Coordinator for MAE  
**Days 11-12:** Legal Processors for Arkiver  
**Days 13:** Wellness Dashboard for GoodCounsel  
**Checkpoint:** Enhanced features working

### Week 5-6: Integration
**Days 14-16:** LexFiat Integration  
**Days 17:** Database Integration  
**Days 18-20:** Testing & Documentation  
**Checkpoint:** Full integration, production-ready

---

## Communication Plan

### Daily Updates (During Extraction)
- What was extracted today
- What worked / what didn't
- Blockers encountered
- Tomorrow's plan

### Weekly Checkpoints
- Progress vs. plan
- Quality metrics (tests passing, coverage)
- Risk assessment update
- Adjust plan if needed

### Completion Report
- Final metrics (code reuse %, time saved, etc.)
- Lessons learned
- Technical debt identified
- Next steps / future enhancements

---

## Backup Plans

### If SwimMeet Workflow Engine Doesn't Integrate Cleanly
**Fallback:** Use Cursor's existing MAE scaffold, enhance with topological sort algorithm only

### If Cosmos Client Recommendations Not Useful for GoodCounsel
**Fallback:** Skip Cosmos extraction entirely, build GoodCounsel from scratch (removes 5-7h from extraction, adds 65-87h total development)

### If Arkiver Has Compatibility Issues
**Fallback:** Highly unlikely (95% confidence), but can use Arkiver as reference and rebuild core (add 20-30 hours)

### If Timeline Slips
**Priority 1:** Arkiver (critical for document processing, 2-3 hours)  
**Priority 2:** MAE Workflow Engine (enables automation, 6-8 hours)  
**Priority 3:** GoodCounsel Client Recommendations (useful pattern, 5-7 hours)  
**Defer:** GoodCounsel complete implementation (60-80 hours) to post-MVP  
**Defer:** Enhancements (2A, 2B, 2C) to post-MVP

**Minimal Viable Extraction:** Arkiver + MAE only = 11 hours, saves 4+ weeks

---

## Context for Cursor (When Resuming)

When you return to Cursor to continue implementation, provide this context:

> **Context for Cursor:**
> 
> "While you were working on the engines, I asked Copilot to inventory our legacy codebases to identify reusable code. The inventory is complete. Here's what we found:
> 
> **Key Findings (REVISED 2025-11-22):**
> 1. **Arkiver** (Labs/) - Production-ready data extraction system with 7 MCP tools, 95% reusable, 2-3 hour integration ✅
> 2. **SwimMeet** (Legacy/) - Workflow engine with topological sort, perfect for MAE, 6-8 hour extraction ✅
> 3. **Cosmos** (Legacy/) - Client recommendation pattern, provides ~20% of GoodCounsel requirements, 5-7 hour adaptation ⚠️
> 
> **CRITICAL CLARIFICATION on GoodCounsel:**
> Initial analysis overestimated Cosmos's applicability. After reviewing GoodCounsel.md specification:
> - Cosmos provides: Client relationship recommendations (useful pattern)
> - GoodCounsel requires: Wellness monitoring, ethics engine, crisis support, privacy infrastructure
> - **Cosmos covers 20% of GoodCounsel, not 85%**
> - **Full GoodCounsel implementation: 65-87 hours (5-7h from Cosmos + 60-80h new development)**
> 
> **Two Scenarios:**
> 1. **Minimal extraction (Arkiver + MAE only):** 11 hours, saves 4+ weeks ✅ RECOMMENDED
> 2. **Full extraction (+ Cosmos pattern):** 18 hours, saves 4+ weeks, provides GoodCounsel foundation
> 
> **Recommendation:** Integrate Arkiver and MAE immediately (high value, low effort). Defer GoodCounsel decision—we can extract the Cosmos pattern later if helpful, but understand it's only 20% of the total system.
> 
> **Detailed Plans:** See `/Coding/Dev+Test/` directory
> - `CODE_EXTRACTION_PLAN.md` - Master roadmap with revised estimates
> - `LEGACY_SWIMMEET_INVENTORY.md` - Workflow engine for MAE
> - `LEGACY_COSMOS_INVENTORY.md` - Client recommendations for GoodCounsel (REVISED with full scope)
> - `LABS_ARKIVER_INVENTORY.md` - Data extraction for ArkiverMJ
> 
> **Next Steps:** Review extraction plan and decide:
> - Option A: Extract Arkiver + MAE now (11 hours)
> - Option B: Extract all three including Cosmos pattern (18 hours)
> - Option C: Build everything from scratch (no extraction)"

---

## Appendix: File Locations

### Legacy Systems
- **SwimMeet:** `/Coding/codebase/Legacy/SwimMeet/`
- **Cosmos:** `/Coding/codebase/Legacy/Cosmos/`
- **Arkiver:** `/Coding/codebase/Labs/Arkiver/`

### Cyrano Target Locations
- **MAE Engine:** `/Coding/codebase/Cyrano/src/engines/mae/`
- **GoodCounsel Engine:** `/Coding/codebase/Cyrano/src/engines/goodcounsel/`
- **ArkiverMJ Module:** `/Coding/codebase/Cyrano/src/modules/arkiver/`

### Documentation Locations
- **Inventories:** `/Coding/Dev+Test/LEGACY_*_INVENTORY.md`
- **Extraction Plan:** `/Coding/Dev+Test/CODE_EXTRACTION_PLAN.md`
- **Implementation Plan:** `/Coding/Dev+Test/Detailed Implementation Plan.md`
- **Realistic Plan:** `/Coding/Dev+Test/REALISTIC_IMPLEMENTATION_PLAN.md`

---

**Status:** Plan complete and ready for execution  
**Total Estimated Time:** 57 hours (7-14 work days depending on pace)  
**Expected Time Savings:** 4-6 weeks vs. building from scratch  
**Confidence Level:** High (85%) - Based on comprehensive code review  
**Recommendation:** PROCEED with extraction - highest ROI activity available

---

## Final Notes

This extraction plan is **aggressive but achievable**. The legacy systems are of **high quality** (particularly Arkiver, which is exceptional), and the architecture alignment is **very good**. 

The biggest risk is **scope creep** - stick to the plan, defer nice-to-haves, and focus on getting the core functionality operational. You can always add enhancements later.

The biggest opportunity is **Arkiver** - it's production-ready, exceptionally well-designed, and can be integrated in hours. Start there for immediate value.

**Good luck, and happy coding!** 🚀
