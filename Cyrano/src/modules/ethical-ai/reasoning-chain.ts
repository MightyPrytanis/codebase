/**
 * Reasoning Chain Structure
 * 
 * Defines the structured reasoning chain interface for deep moral reasoning.
 * Provides a step-by-step analysis framework for ethical decision-making.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { FrameworkAnalysis } from './ethical-frameworks.js';
import { TenRule } from './ten-rules.js';

export interface ReasoningChain {
  problemIdentification: ProblemIdentification;
  contextAnalysis: ContextAnalysis;
  stakeholderAnalysis: StakeholderAnalysis;
  principleIdentification: PrincipleIdentification;
  frameworkAnalysis: {
    frameworks: FrameworkAnalysis[];
    overallConclusion: 'permissible' | 'impermissible' | 'obligatory' | 'ambiguous';
    consensus: string[];
    conflicts: string[];
  };
  conflictDetection: ConflictDetection;
  maximsReference: MaximsReference;
  weighingAndBalancing: WeighingAndBalancing;
  consequenceAnalysis: ConsequenceAnalysis;
  decisionWithJustification: DecisionWithJustification;
  alternativeConsideration: AlternativeConsideration;
  metadata: {
    timestamp: string;
    caseId?: string;
    reasoningVersion: string;
  };
}

export interface ProblemIdentification {
  ethicalQuestion: string;
  whatIsAtStake: string[];
  scopeOfAnalysis: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContextAnalysis {
  relevantFacts: Array<{
    fact: string;
    source: string;
    reliability: 'high' | 'medium' | 'low';
  }>;
  relationships: Array<{
    party1: string;
    party2: string;
    relationship: string;
    nature: string;
  }>;
  temporalFactors: {
    timing: string;
    deadlines: string[];
    historicalContext: string;
  };
  situationalFactors: string[];
  precedents: Array<{
    precedent: string;
    relevance: string;
    application: string;
  }>;
}

export interface StakeholderAnalysis {
  stakeholders: Array<{
    stakeholder: string;
    role: string;
    interests: string[];
    rights: string[];
    power: 'low' | 'medium' | 'high';
    vulnerability: 'low' | 'medium' | 'high';
    dependency: 'low' | 'medium' | 'high';
  }>;
  powerDynamics: Array<{
    relationship: string;
    dynamic: string;
    implications: string;
  }>;
  vulnerableParties: string[];
}

export interface PrincipleIdentification {
  tenRules: Array<{
    rule: TenRule;
    applies: boolean;
    relevance: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  professionalEthics: Array<{
    principle: string;
    source: string; // e.g., "MRPC 1.1"
    applies: boolean;
    relevance: string;
  }>;
  legalPrinciples: Array<{
    principle: string;
    source: string;
    applies: boolean;
    relevance: string;
  }>;
  moralPrinciples: Array<{
    principle: string; // e.g., "justice", "fairness", "autonomy"
    applies: boolean;
    relevance: string;
  }>;
}

export interface ConflictDetection {
  frameworkConflicts: Array<{
    framework1: string;
    framework2: string;
    conflict: string;
    nature: 'absolute' | 'relative';
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  principleConflicts: Array<{
    principle1: string;
    principle2: string;
    conflict: string;
    nature: 'absolute' | 'relative';
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  irreconcilableTensions: Array<{
    tension: string;
    parties: string[];
    whyIrreconcilable: string;
  }>;
  areasOfAgreement: Array<{
    area: string;
    frameworks: string[];
    consensus: string;
  }>;
}

export interface MaximsReference {
  maxims: Array<{
    maxim: string;
    latin: string;
    english: string;
    applies: boolean;
    application: string;
    guidance: string;
    limitation: string; // Why it doesn't dictate the conclusion
  }>;
  howMaximsInform: string;
  whyNotDictate: string;
}

export interface WeighingAndBalancing {
  conflictingPrinciples: Array<{
    principle1: string;
    principle2: string;
    relativeImportance: string;
    contextFactors: string[];
    reasoning: string;
  }>;
  proportionalityAnalysis: {
    action: string;
    necessity: 'low' | 'medium' | 'high';
    effectiveness: 'low' | 'medium' | 'high';
    proportionality: 'proportional' | 'disproportional' | 'ambiguous';
    reasoning: string;
  };
  precedentAndConsistency: {
    relevantPrecedents: string[];
    consistency: 'consistent' | 'inconsistent' | 'ambiguous';
    reasoning: string;
  };
  temporalConsiderations: {
    shortTerm: string[];
    longTerm: string[];
    tradeoffs: string;
  };
  balancingConclusion: string;
}

export interface ConsequenceAnalysis {
  likelyOutcomes: Array<{
    outcome: string;
    probability: number; // 0-1
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: 'low' | 'medium' | 'high' | 'critical';
    affectedParties: string[];
  }>;
  unintendedConsequences: Array<{
    consequence: string;
    likelihood: 'low' | 'medium' | 'high';
    impact: string;
    mitigation: string;
  }>;
  reversibility: {
    reversible: boolean;
    difficulty: 'easy' | 'moderate' | 'difficult' | 'irreversible';
    reasoning: string;
  };
  trustAndRelationships: {
    impact: 'positive' | 'negative' | 'neutral';
    affectedRelationships: string[];
    longTermEffects: string;
  };
  systemicEffects: Array<{
    effect: string;
    scope: 'local' | 'organizational' | 'professional' | 'societal';
    implications: string;
  }>;
}

export interface DecisionWithJustification {
  decision: 'permissible' | 'impermissible' | 'obligatory' | 'ambiguous';
  recommendedAction?: string;
  justification: string;
  whyEthicallySound: string;
  limitations: string[];
  uncertainties: string[];
  residualConcerns: string[];
  confidence: number; // 0-100
}

export interface AlternativeConsideration {
  alternatives: Array<{
    alternative: string;
    description: string;
    pros: string[];
    cons: string[];
    whyNotChosen: string;
    ethicalAssessment: 'better' | 'worse' | 'equivalent' | 'ambiguous';
  }>;
  modifications: Array<{
    modification: string;
    description: string;
    howImproves: string;
    feasibility: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Reasoning Chain Builder
 * 
 * Helper class to build reasoning chains step by step
 */
export class ReasoningChainBuilder {
  private chain: Partial<ReasoningChain>;

  constructor() {
    this.chain = {
      metadata: {
        timestamp: new Date().toISOString(),
        reasoningVersion: '1.0',
      },
    };
  }

  setProblemIdentification(problem: ProblemIdentification): this {
    this.chain.problemIdentification = problem;
    return this;
  }

  setContextAnalysis(context: ContextAnalysis): this {
    this.chain.contextAnalysis = context;
    return this;
  }

  setStakeholderAnalysis(stakeholders: StakeholderAnalysis): this {
    this.chain.stakeholderAnalysis = stakeholders;
    return this;
  }

  setPrincipleIdentification(principles: PrincipleIdentification): this {
    this.chain.principleIdentification = principles;
    return this;
  }

  setFrameworkAnalysis(frameworks: FrameworkAnalysis[]): this {
    // Combine framework analyses
    this.chain.frameworkAnalysis = {
      frameworks,
      overallConclusion: this.synthesizeFrameworkConclusions(frameworks),
      consensus: this.findFrameworkConsensus(frameworks),
      conflicts: this.findFrameworkConflicts(frameworks),
    };
    return this;
  }

  setConflictDetection(conflicts: ConflictDetection): this {
    this.chain.conflictDetection = conflicts;
    return this;
  }

  setMaximsReference(maxims: MaximsReference): this {
    this.chain.maximsReference = maxims;
    return this;
  }

  setWeighingAndBalancing(weighing: WeighingAndBalancing): this {
    this.chain.weighingAndBalancing = weighing;
    return this;
  }

  setConsequenceAnalysis(consequences: ConsequenceAnalysis): this {
    this.chain.consequenceAnalysis = consequences;
    return this;
  }

  setDecisionWithJustification(decision: DecisionWithJustification): this {
    this.chain.decisionWithJustification = decision;
    return this;
  }

  setAlternativeConsideration(alternatives: AlternativeConsideration): this {
    this.chain.alternativeConsideration = alternatives;
    return this;
  }

  build(): ReasoningChain {
    // Validate that all required steps are present
    const required = [
      'problemIdentification',
      'contextAnalysis',
      'stakeholderAnalysis',
      'principleIdentification',
      'frameworkAnalysis',
      'conflictDetection',
      'maximsReference',
      'weighingAndBalancing',
      'consequenceAnalysis',
      'decisionWithJustification',
      'alternativeConsideration',
    ];

    for (const field of required) {
      if (!(field in this.chain)) {
        throw new Error(`Missing required reasoning chain step: ${field}`);
      }
    }

    return this.chain as ReasoningChain;
  }

  private synthesizeFrameworkConclusions(frameworks: FrameworkAnalysis[]): 'ambiguous' | 'permissible' | 'impermissible' | 'obligatory' {
    const conclusions = frameworks.map(f => f.conclusion);
    const counts = {
      permissible: conclusions.filter(c => c === 'permissible').length,
      impermissible: conclusions.filter(c => c === 'impermissible').length,
      obligatory: conclusions.filter(c => c === 'obligatory').length,
      ambiguous: conclusions.filter(c => c === 'ambiguous').length,
    };

    if (counts.impermissible > counts.permissible) {
      return 'impermissible';
    }
    if (counts.permissible > counts.impermissible) {
      return 'permissible';
    }
    if (counts.obligatory > 0) {
      return 'obligatory';
    }
    return 'ambiguous';
  }

  private findFrameworkConsensus(frameworks: FrameworkAnalysis[]): string[] {
    // Find areas where frameworks agree
    const consensus: string[] = [];
    // Simplified - would do more sophisticated analysis
    return consensus;
  }

  private findFrameworkConflicts(frameworks: FrameworkAnalysis[]): string[] {
    // Find areas where frameworks disagree
    const conflicts: string[] = [];
    // Simplified - would do more sophisticated analysis
    return conflicts;
  }
}

/**
 * Export common jurisprudential maxims
 */
export const JURISPRUDENTIAL_MAXIMS = [
  {
    maxim: 'specialis derogat generali',
    latin: 'specialis derogat generali',
    english: 'The specific overrides the general',
    description: 'When a specific rule conflicts with a general rule, the specific rule takes precedence',
    whenToApply: 'When there is a conflict between a general principle and a specific rule that applies to the situation',
  },
  {
    maxim: 'expressio unius est exclusio alterius',
    latin: 'expressio unius est exclusio alterius',
    english: 'The expression of one excludes others',
    description: 'When a list is explicitly stated, items not listed are excluded',
    whenToApply: 'When interpreting rules or principles that list specific items',
  },
  {
    maxim: 'ut res magis valeat quam pereat',
    latin: 'ut res magis valeat quam pereat',
    english: 'Things should be given effect rather than destroyed',
    description: 'Prefer interpretations that give effect to rules rather than render them meaningless',
    whenToApply: 'When multiple interpretations are possible, prefer the one that gives effect to the rule',
  },
  {
    maxim: 'intentionem legis est lex',
    latin: 'intentionem legis est lex',
    english: 'The intention of the law is the law',
    description: 'The purpose and intent behind a rule should guide its application',
    whenToApply: 'When the literal meaning conflicts with the apparent purpose of the rule',
  },
  {
    maxim: 'in pari materia',
    latin: 'in pari materia',
    english: 'On the same subject',
    description: 'Rules on the same subject should be interpreted together',
    whenToApply: 'When multiple rules address the same subject matter',
  },
];

}
}