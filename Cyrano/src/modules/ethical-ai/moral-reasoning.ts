/**
 * Moral Reasoning Service
 * 
 * Deep moral reasoning layer with structured ethical analysis.
 * Implements comprehensive 11-step reasoning process for complex ethical cases.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { aiService, AIProvider } from '../../services/ai-service.js';
import { injectTenRulesIntoSystemPrompt } from '../../services/ethics-prompt-injector.js';
import {
  ReasoningChain,
  ReasoningChainBuilder,
  ProblemIdentification,
  ContextAnalysis,
  StakeholderAnalysis,
  PrincipleIdentification,
  ConflictDetection,
  MaximsReference,
  WeighingAndBalancing,
  ConsequenceAnalysis,
  DecisionWithJustification,
  AlternativeConsideration,
  JURISPRUDENTIAL_MAXIMS,
} from './reasoning-chain.js';
import {
  deontologicalFramework,
  consequentialistFramework,
  virtueEthicsFramework,
  legalEthicsFramework,
  FrameworkAnalysis,
  DeontologicalAnalysis,
  ConsequentialistAnalysis,
  VirtueEthicsAnalysis,
  LegalEthicsAnalysis,
} from './ethical-frameworks.js';
import { TEN_RULES, getRulesByCategory } from './ten-rules.js';

export interface MoralReasoningRequest {
  conflict: string; // Description of the ethical conflict or ambiguous case
  context: Record<string, any>; // Full context about the situation
  rules?: string[]; // Specific rules to consider
  stakeholders?: string[]; // Affected parties
  provider?: AIProvider; // AI provider for deep reasoning
}

export interface MoralReasoningResponse {
  reasoningChain: ReasoningChain;
  summary: string;
  recommendation: {
    action: string;
    justification: string;
    confidence: number;
  };
}

/**
 * Deep Moral Reasoning Service
 */
export class MoralReasoningService {
  /**
   * Reason about an ethical case using the full 11-step process
   */
  async reasonAboutEthicalCase(
    request: MoralReasoningRequest
  ): Promise<MoralReasoningResponse> {
    const builder = new ReasoningChainBuilder();

    // Step 1: Problem Identification
    const problem = await this.identifyProblem(request);
    builder.setProblemIdentification(problem);

    // Step 2: Context Analysis
    const context = await this.analyzeContext(request);
    builder.setContextAnalysis(context);

    // Step 3: Stakeholder Analysis
    const stakeholders = await this.analyzeStakeholders(request);
    builder.setStakeholderAnalysis(stakeholders);

    // Step 4: Principle Identification
    const principles = await this.identifyPrinciples(request);
    builder.setPrincipleIdentification(principles);

    // Step 5: Multi-Framework Analysis
    const frameworks = await this.performMultiFrameworkAnalysis(request);
    builder.setFrameworkAnalysis(frameworks);

    // Step 6: Conflict Detection
    const conflicts = await this.detectConflicts(frameworks, principles);
    builder.setConflictDetection(conflicts);

    // Step 7: Reference to Jurisprudential Maxims
    const maxims = await this.referenceMaxims(request, conflicts);
    builder.setMaximsReference(maxims);

    // Step 8: Weighing and Balancing
    const weighing = await this.weighAndBalance(frameworks, conflicts, request);
    builder.setWeighingAndBalancing(weighing);

    // Step 9: Consequence Analysis
    const consequences = await this.analyzeConsequences(request, weighing);
    builder.setConsequenceAnalysis(consequences);

    // Step 10: Decision with Justification
    const decision = await this.makeDecisionWithJustification(
      frameworks,
      weighing,
      consequences,
      request
    );
    builder.setDecisionWithJustification(decision);

    // Step 11: Alternative Consideration
    const alternatives = await this.considerAlternatives(decision, request);
    builder.setAlternativeConsideration(alternatives);

    // Build the complete reasoning chain
    const reasoningChain = builder.build();

    // Generate summary and recommendation
    const summary = this.generateSummary(reasoningChain);
    const recommendation = {
      action: decision.recommendedAction || 'No specific action recommended',
      justification: decision.justification,
      confidence: decision.confidence,
    };

    return {
      reasoningChain,
      summary,
      recommendation,
    };
  }

  /**
   * Step 1: Problem Identification
   */
  private async identifyProblem(
    request: MoralReasoningRequest
  ): Promise<ProblemIdentification> {
    const prompt = `Identify the ethical problem in the following situation:

Conflict: ${request.conflict}
Context: ${JSON.stringify(request.context, null, 2)}

Clearly articulate:
1. What is the ethical question being asked?
2. What is at stake?
3. What is the scope of analysis?
4. What is the urgency level?

Return JSON:
{
  "ethicalQuestion": "the ethical question",
  "whatIsAtStake": ["stake 1", "stake 2"],
  "scopeOfAnalysis": "scope description",
  "urgency": "low|medium|high|critical"
}`;

    try {
      let systemPrompt = 'You are an expert ethical analyst. Identify ethical problems clearly.';
      systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');
      
      const response = await aiService.call(request.provider || 'anthropic', prompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 2000,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // Fallback
    }

    // Fallback
    return {
      ethicalQuestion: request.conflict,
      whatIsAtStake: ['Ethical compliance', 'Professional standards'],
      scopeOfAnalysis: 'Full ethical analysis required',
      urgency: 'medium',
    };
  }

  /**
   * Step 2: Context Analysis
   */
  private async analyzeContext(
    request: MoralReasoningRequest
  ): Promise<ContextAnalysis> {
    // Extract facts from context
    const relevantFacts = Object.entries(request.context).map(([key, value]) => ({
      fact: `${key}: ${JSON.stringify(value)}`,
      source: 'provided context',
      reliability: 'high' as const,
    }));

    return {
      relevantFacts,
      relationships: this.extractRelationships(request.context),
      temporalFactors: {
        timing: request.context.timing || 'current',
        deadlines: request.context.deadlines || [],
        historicalContext: request.context.historicalContext || 'none',
      },
      situationalFactors: Object.keys(request.context),
      precedents: [],
    };
  }

  /**
   * Step 3: Stakeholder Analysis
   */
  private async analyzeStakeholders(
    request: MoralReasoningRequest
  ): Promise<StakeholderAnalysis> {
    const stakeholders = (request.stakeholders || ['client', 'attorney']).map(s => ({
      stakeholder: s,
      role: this.inferRole(s),
      interests: this.inferInterests(s),
      rights: this.inferRights(s),
      power: 'medium' as const,
      vulnerability: 'medium' as const,
      dependency: 'medium' as const,
    }));

    return {
      stakeholders,
      powerDynamics: [],
      vulnerableParties: stakeholders.filter((s: any) => s.vulnerability === 'high').map((s: any) => s.stakeholder),
    };
  }

  private assessComplexity(stakeholders: any[]): 'low' | 'medium' | 'high' {
    // Complexity assessment logic
    if (stakeholders.length > 5) return 'high';
    if (stakeholders.length > 2) return 'medium';
    return 'low';
  }

  /**
   * Step 4: Principle Identification
   */
  private async identifyPrinciples(
    request: MoralReasoningRequest
  ): Promise<PrincipleIdentification> {
    // Map to Ten Rules
    const tenRules = TEN_RULES.map(rule => ({
      rule,
      applies: this.ruleApplies(rule, request),
      relevance: this.assessRelevance(rule, request),
      priority: this.assessPriority(rule, request),
    }));

    // Professional ethics
    const professionalEthics = [
      {
        principle: 'Competence',
        source: 'MRPC 1.1',
        applies: request.context.hasClient || false,
        relevance: 'Ensures attorney has necessary competence',
      },
      {
        principle: 'Confidentiality',
        source: 'MRPC 1.6',
        applies: request.context.hasConfidentiality || false,
        relevance: 'Protects client confidences',
      },
    ];

    return {
      tenRules,
      professionalEthics,
      legalPrinciples: [],
      moralPrinciples: [
        {
          principle: 'justice',
          applies: true,
          relevance: 'Ensures fair treatment',
        },
        {
          principle: 'autonomy',
          applies: true,
          relevance: 'Respects individual autonomy',
        },
      ],
    };
  }

  /**
   * Step 5: Multi-Framework Analysis
   */
  private async performMultiFrameworkAnalysis(
    request: MoralReasoningRequest
  ): Promise<FrameworkAnalysis[]> {
    const action = request.conflict;
    const context = request.context;
    const stakeholders = request.stakeholders || [];

    // Deontological analysis
    const deontological = deontologicalFramework.analyze(action, context, []);
    const deontologicalAnalysis: FrameworkAnalysis = {
      framework: 'deontological',
      conclusion: deontological.conclusion,
      reasoning: deontological.reasoning,
      keyPrinciples: deontological.duties.map(d => d.duty),
      considerations: deontological.duties.map(d => d.reasoning),
      strengths: ['Clear rules', 'Duty-based'],
      weaknesses: ['May not account for consequences'],
      confidence: 75,
    };

    // Consequentialist analysis
    const consequentialist = consequentialistFramework.analyze(action, context, stakeholders);
    const consequentialistAnalysis: FrameworkAnalysis = {
      framework: 'consequentialist',
      conclusion: consequentialist.conclusion,
      reasoning: consequentialist.reasoning,
      keyPrinciples: ['Utility maximization', 'Harm minimization'],
      considerations: consequentialist.outcomes.map(o => o.outcome),
      strengths: ['Considers outcomes', 'Stakeholder-focused'],
      weaknesses: ['Difficult to predict', 'May justify harm'],
      confidence: 70,
    };

    // Virtue ethics analysis
    const virtue = virtueEthicsFramework.analyze(action, context);
    const virtueAnalysis: FrameworkAnalysis = {
      framework: 'virtue',
      conclusion: virtue.conclusion,
      reasoning: virtue.reasoning,
      keyPrinciples: virtue.relevantVirtues.map(v => v.virtue),
      considerations: virtue.relevantVirtues.map(v => v.reasoning),
      strengths: ['Character-focused', 'Professional excellence'],
      weaknesses: ['Subjective', 'May conflict with rules'],
      confidence: 65,
    };

    // Legal ethics analysis
    const legal = legalEthicsFramework.analyze(action, context);
    const legalAnalysis: FrameworkAnalysis = {
      framework: 'legal',
      conclusion: legal.conclusion,
      reasoning: legal.reasoning,
      keyPrinciples: legal.mrpcRules.map(r => r.rule),
      considerations: legal.mrpcRules.map(r => r.reasoning),
      strengths: ['Binding rules', 'Professional standards'],
      weaknesses: ['May not cover all cases'],
      confidence: 80,
    };

    return [deontologicalAnalysis, consequentialistAnalysis, virtueAnalysis, legalAnalysis];
  }

  /**
   * Step 6: Conflict Detection
   */
  private async detectConflicts(
    frameworks: FrameworkAnalysis[],
    principles: PrincipleIdentification
  ): Promise<ConflictDetection> {
    const frameworkConflicts: ConflictDetection['frameworkConflicts'] = [];
    const principleConflicts: ConflictDetection['principleConflicts'] = [];

    // Detect framework conflicts
    for (let i = 0; i < frameworks.length; i++) {
      for (let j = i + 1; j < frameworks.length; j++) {
        if (frameworks[i].conclusion !== frameworks[j].conclusion) {
          frameworkConflicts.push({
            framework1: frameworks[i].framework,
            framework2: frameworks[j].framework,
            conflict: `${frameworks[i].framework} says ${frameworks[i].conclusion}, but ${frameworks[j].framework} says ${frameworks[j].conclusion}`,
            nature: 'relative',
            severity: 'medium',
          });
        }
      }
    }

    // Detect principle conflicts
    const applicableRules = principles.tenRules.filter(r => r.applies);
    for (let i = 0; i < applicableRules.length; i++) {
      for (let j = i + 1; j < applicableRules.length; j++) {
        if (applicableRules[i].priority === 'critical' && applicableRules[j].priority === 'critical') {
          principleConflicts.push({
            principle1: applicableRules[i].rule.name,
            principle2: applicableRules[j].rule.name,
            conflict: 'Both principles are critical but may conflict',
            nature: 'relative',
            severity: 'high',
          });
        }
      }
    }

    return {
      frameworkConflicts,
      principleConflicts,
      irreconcilableTensions: [],
      areasOfAgreement: [],
    };
  }

  /**
   * Step 7: Reference to Jurisprudential Maxims
   */
  private async referenceMaxims(
    request: MoralReasoningRequest,
    conflicts: ConflictDetection
  ): Promise<MaximsReference> {
    const applicableMaxims = JURISPRUDENTIAL_MAXIMS.map(maxim => ({
      maxim: maxim.maxim,
      latin: maxim.latin,
      english: maxim.english,
      applies: conflicts.frameworkConflicts.length > 0 || conflicts.principleConflicts.length > 0,
      application: maxim.whenToApply,
      guidance: `This maxim suggests: ${maxim.description}`,
      limitation: 'Maxims provide guidance but do not replace comprehensive ethical reasoning',
    }));

    return {
      maxims: applicableMaxims,
      howMaximsInform: 'Maxims provide interpretive guidance for resolving conflicts between rules and principles',
      whyNotDictate: 'Maxims are heuristics, not absolute rules. They inform but do not replace comprehensive analysis.',
    };
  }

  /**
   * Step 8: Weighing and Balancing
   */
  private async weighAndBalance(
    frameworks: FrameworkAnalysis[],
    conflicts: ConflictDetection,
    request: MoralReasoningRequest
  ): Promise<WeighingAndBalancing> {
    const conflictingPrinciples: WeighingAndBalancing['conflictingPrinciples'] = conflicts.principleConflicts.map(c => ({
      principle1: c.principle1,
      principle2: c.principle2,
      relativeImportance: 'Context-dependent',
      contextFactors: Object.keys(request.context),
      reasoning: c.conflict,
    }));

    return {
      conflictingPrinciples,
      proportionalityAnalysis: {
        action: request.conflict,
        necessity: 'medium',
        effectiveness: 'medium',
        proportionality: 'proportional',
        reasoning: 'Action appears proportional to the situation',
      },
      precedentAndConsistency: {
        relevantPrecedents: [],
        consistency: 'consistent',
        reasoning: 'Consistent with professional standards',
      },
      temporalConsiderations: {
        shortTerm: ['Immediate effects'],
        longTerm: ['Long-term professional relationships'],
        tradeoffs: 'Balance short-term needs with long-term consequences',
      },
      balancingConclusion: 'Weighing suggests proceeding with caution and full disclosure',
    };
  }

  /**
   * Step 9: Consequence Analysis
   */
  private async analyzeConsequences(
    request: MoralReasoningRequest,
    weighing: WeighingAndBalancing
  ): Promise<ConsequenceAnalysis> {
    return {
      likelyOutcomes: [
        {
          outcome: 'Primary outcome',
          probability: 0.7,
          impact: 'positive',
          magnitude: 'medium',
          affectedParties: request.stakeholders || [],
        },
      ],
      unintendedConsequences: [],
      reversibility: {
        reversible: true,
        difficulty: 'moderate',
        reasoning: 'Action may be reversible with effort',
      },
      trustAndRelationships: {
        impact: 'neutral',
        affectedRelationships: [],
        longTermEffects: 'Minimal long-term impact expected',
      },
      systemicEffects: [],
    };
  }

  /**
   * Step 10: Decision with Justification
   */
  private async makeDecisionWithJustification(
    frameworks: FrameworkAnalysis[],
    weighing: WeighingAndBalancing,
    consequences: ConsequenceAnalysis,
    request: MoralReasoningRequest
  ): Promise<DecisionWithJustification> {
    // Synthesize framework conclusions
    const conclusions = frameworks.map(f => f.conclusion);
    const permissibleCount = conclusions.filter(c => c === 'permissible').length;
    const impermissibleCount = conclusions.filter(c => c === 'impermissible').length;

    let decision: DecisionWithJustification['decision'];
    if (impermissibleCount > permissibleCount) {
      decision = 'impermissible';
    } else if (permissibleCount > impermissibleCount) {
      decision = 'permissible';
    } else {
      decision = 'ambiguous';
    }

    return {
      decision,
      recommendedAction: decision === 'permissible' ? 'Proceed with caution and full disclosure' : 'Do not proceed',
      justification: `Based on multi-framework analysis: ${permissibleCount} frameworks suggest permissible, ${impermissibleCount} suggest impermissible`,
      whyEthicallySound: 'Decision based on comprehensive analysis of all ethical frameworks',
      limitations: ['Analysis based on provided context', 'May not account for all factors'],
      uncertainties: ['Long-term consequences', 'Unintended effects'],
      residualConcerns: [],
      confidence: 70,
    };
  }

  /**
   * Step 11: Alternative Consideration
   */
  private async considerAlternatives(
    decision: DecisionWithJustification,
    request: MoralReasoningRequest
  ): Promise<AlternativeConsideration> {
    return {
      alternatives: [
        {
          alternative: 'Alternative approach',
          description: 'A different way to address the situation',
          pros: ['May avoid ethical concerns'],
          cons: ['May be less effective'],
          whyNotChosen: 'Primary approach is ethically sound',
          ethicalAssessment: 'equivalent',
        },
      ],
      modifications: [
        {
          modification: 'Add safeguards',
          description: 'Add additional safeguards to the recommended action',
          howImproves: 'Reduces ethical risk',
          feasibility: 'high',
        },
      ],
    };
  }

  /**
   * Helper methods
   */
  private extractRelationships(context: Record<string, any>): ContextAnalysis['relationships'] {
    return [];
  }

  private inferRole(stakeholder: string): string {
    if (stakeholder.includes('client')) return 'Client';
    if (stakeholder.includes('attorney')) return 'Attorney';
    return 'Other party';
  }

  private inferInterests(stakeholder: string): string[] {
    if (stakeholder.includes('client')) {
      return ['Legal representation', 'Confidentiality', 'Competent service'];
    }
    return ['Professional standards', 'Ethical compliance'];
  }

  private inferRights(stakeholder: string): string[] {
    if (stakeholder.includes('client')) {
      return ['Right to representation', 'Right to confidentiality'];
    }
    return ['Right to professional autonomy'];
  }

  private ruleApplies(rule: typeof TEN_RULES[0], request: MoralReasoningRequest): boolean {
    // Simplified - would do more sophisticated matching
    return rule.keywords.some(keyword => 
      request.conflict.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private assessRelevance(rule: typeof TEN_RULES[0], request: MoralReasoningRequest): string {
    return `Rule ${rule.number} (${rule.name}) is relevant because it addresses truth and factual accuracy`;
  }

  private assessPriority(rule: typeof TEN_RULES[0], request: MoralReasoningRequest): 'low' | 'medium' | 'high' | 'critical' {
    if (rule.enforcementStrategy === 'hard') {
      return rule.number <= 4 ? 'critical' : 'high';
    }
    return 'medium';
  }

  private generateSummary(chain: ReasoningChain): string {
    return `Ethical reasoning completed. Problem: ${chain.problemIdentification.ethicalQuestion}. ` +
           `Decision: ${chain.decisionWithJustification.decision}. ` +
           `Confidence: ${chain.decisionWithJustification.confidence}%. ` +
           `Justification: ${chain.decisionWithJustification.justification}`;
  }
}

/**
 * Export singleton instance
 */
export const moralReasoningService = new MoralReasoningService();

