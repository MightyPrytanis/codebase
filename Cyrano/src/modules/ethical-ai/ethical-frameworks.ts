/**
 * Ethical Frameworks Module
 * 
 * Defines structured ethical frameworks for moral reasoning:
 * - Deontological: Rule-based ethics, duties, categorical imperatives
 * - Consequentialist: Utilitarian analysis, outcome evaluation, harm/benefit weighing
 * - Virtue Ethics: Character, integrity, professional excellence, moral exemplars
 * - Legal Ethics: MRPC principles, professional responsibility, client interests
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface FrameworkAnalysis {
  framework: 'deontological' | 'consequentialist' | 'virtue' | 'legal';
  conclusion: 'permissible' | 'impermissible' | 'obligatory' | 'ambiguous';
  reasoning: string;
  keyPrinciples: string[];
  considerations: string[];
  strengths: string[];
  weaknesses: string[];
  confidence: number; // 0-100
}

export interface DeontologicalAnalysis {
  duties: Array<{
    duty: string;
    source: string;
    applies: boolean;
    reasoning: string;
  }>;
  categoricalImperatives: Array<{
    principle: string;
    universalizable: boolean;
    reasoning: string;
  }>;
  ruleConflicts: Array<{
    rule1: string;
    rule2: string;
    conflict: string;
    resolution: string;
  }>;
  conclusion: FrameworkAnalysis['conclusion'];
  reasoning: string;
}

export interface ConsequentialistAnalysis {
  stakeholders: Array<{
    stakeholder: string;
    interests: string[];
    affected: 'benefit' | 'harm' | 'neutral';
    magnitude: 'low' | 'medium' | 'high' | 'critical';
  }>;
  outcomes: Array<{
    outcome: string;
    probability: number; // 0-1
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: 'low' | 'medium' | 'high' | 'critical';
  }>;
  netUtility: {
    calculation: string;
    value: number; // positive = net benefit, negative = net harm
  };
  longTermEffects: string[];
  conclusion: FrameworkAnalysis['conclusion'];
  reasoning: string;
}

export interface VirtueEthicsAnalysis {
  relevantVirtues: Array<{
    virtue: string;
    definition: string;
    applies: boolean;
    reasoning: string;
  }>;
  characterTraits: Array<{
    trait: string;
    demonstrated: boolean;
    reasoning: string;
  }>;
  moralExemplars: Array<{
    exemplar: string;
    context: string;
    lesson: string;
  }>;
  professionalExcellence: {
    standards: string[];
    met: boolean;
    reasoning: string;
  };
  conclusion: FrameworkAnalysis['conclusion'];
  reasoning: string;
}

export interface LegalEthicsAnalysis {
  mrpcRules: Array<{
    rule: string;
    number: string; // e.g., "1.1", "1.7"
    applies: boolean;
    compliance: 'compliant' | 'non_compliant' | 'ambiguous';
    reasoning: string;
  }>;
  professionalResponsibility: {
    duties: string[];
    met: boolean;
    reasoning: string;
  };
  clientInterests: {
    protected: boolean;
    conflicts: string[];
    reasoning: string;
  };
  conclusion: FrameworkAnalysis['conclusion'];
  reasoning: string;
}

/**
 * Deontological Framework Analyzer
 */
export class DeontologicalFramework {
  /**
   * Analyze using deontological (duty-based) ethics
   */
  analyze(
    action: string,
    context: Record<string, any>,
    rules: string[]
  ): DeontologicalAnalysis {
    const duties: DeontologicalAnalysis['duties'] = [];
    const categoricalImperatives: DeontologicalAnalysis['categoricalImperatives'] = [];
    const ruleConflicts: DeontologicalAnalysis['ruleConflicts'] = [];

    // Identify duties
    if (context.hasClient) {
      duties.push({
        duty: 'Duty to client',
        source: 'Professional relationship',
        applies: true,
        reasoning: 'Attorney has fiduciary duty to client',
      });
    }

    if (context.hasConfidentiality) {
      duties.push({
        duty: 'Duty of confidentiality',
        source: 'MRPC 1.6',
        applies: true,
        reasoning: 'Attorney must maintain client confidences',
      });
    }

    if (context.hasCompetence) {
      duties.push({
        duty: 'Duty of competence',
        source: 'MRPC 1.1',
        applies: true,
        reasoning: 'Attorney must provide competent representation',
      });
    }

    // Categorical imperatives
    categoricalImperatives.push({
      principle: 'Act only according to maxims that can be universalized',
      universalizable: this.isUniversalizable(action, context),
      reasoning: this.assessUniversalizability(action, context),
    });

    // Check for rule conflicts
    if (duties.length > 1) {
      for (let i = 0; i < duties.length; i++) {
        for (let j = i + 1; j < duties.length; j++) {
          const conflict = this.detectDutyConflict(duties[i], duties[j], context);
          if (conflict) {
            ruleConflicts.push({
              rule1: duties[i].duty,
              rule2: duties[j].duty,
              conflict: conflict,
              resolution: this.resolveDutyConflict(duties[i], duties[j], context),
            });
          }
        }
      }
    }

    // Determine conclusion
    const conclusion = this.determineDeontologicalConclusion(duties, categoricalImperatives, ruleConflicts);
    const reasoning = this.generateDeontologicalReasoning(duties, categoricalImperatives, ruleConflicts, conclusion);

    return {
      duties,
      categoricalImperatives,
      ruleConflicts,
      conclusion,
      reasoning,
    };
  }

  private isUniversalizable(action: string, context: Record<string, any>): boolean {
    // Simplified: Would it be acceptable if everyone did this?
    // In practice, this would be more sophisticated
    return !action.toLowerCase().includes('deceive') && 
           !action.toLowerCase().includes('harm') &&
           !action.toLowerCase().includes('violate');
  }

  private assessUniversalizability(action: string, context: Record<string, any>): string {
    if (this.isUniversalizable(action, context)) {
      return 'This action could be universalized without contradiction';
    }
    return 'This action cannot be universalized - it would lead to contradiction if everyone did it';
  }

  private detectDutyConflict(
    duty1: DeontologicalAnalysis['duties'][0],
    duty2: DeontologicalAnalysis['duties'][0],
    context: Record<string, any>
  ): string | null {
    // Check for common conflicts
    if (duty1.duty.includes('confidentiality') && duty2.duty.includes('disclosure')) {
      return 'Conflict between confidentiality and disclosure obligations';
    }
    if (duty1.duty.includes('client') && duty2.duty.includes('third party')) {
      return 'Conflict between client interests and third-party interests';
    }
    return null;
  }

  private resolveDutyConflict(
    duty1: DeontologicalAnalysis['duties'][0],
    duty2: DeontologicalAnalysis['duties'][0],
    context: Record<string, any>
  ): string {
    // Prioritize based on severity and context
    if (duty1.duty.includes('confidentiality') && context.hasLegalRequirement) {
      return 'Confidentiality may be breached only if legally required';
    }
    return 'Resolve by weighing relative importance and seeking guidance if needed';
  }

  private determineDeontologicalConclusion(
    duties: DeontologicalAnalysis['duties'],
    imperatives: DeontologicalAnalysis['categoricalImperatives'],
    conflicts: DeontologicalAnalysis['ruleConflicts']
  ): FrameworkAnalysis['conclusion'] {
    if (conflicts.length > 0 && conflicts.some(c => c.conflict.includes('critical'))) {
      return 'ambiguous';
    }
    if (imperatives.some(i => !i.universalizable)) {
      return 'impermissible';
    }
    if (duties.every(d => d.applies)) {
      return 'permissible';
    }
    return 'ambiguous';
  }

  private generateDeontologicalReasoning(
    duties: DeontologicalAnalysis['duties'],
    imperatives: DeontologicalAnalysis['categoricalImperatives'],
    conflicts: DeontologicalAnalysis['ruleConflicts'],
    conclusion: FrameworkAnalysis['conclusion']
  ): string {
    let reasoning = 'Deontological analysis: ';
    reasoning += `Identified ${duties.length} relevant duties. `;
    reasoning += `${imperatives.length} categorical imperatives evaluated. `;
    if (conflicts.length > 0) {
      reasoning += `${conflicts.length} duty conflicts detected. `;
    }
    reasoning += `Conclusion: ${conclusion}.`;
    return reasoning;
  }
}

/**
 * Consequentialist Framework Analyzer
 */
export class ConsequentialistFramework {
  /**
   * Analyze using consequentialist (utilitarian) ethics
   */
  analyze(
    action: string,
    context: Record<string, any>,
    stakeholders: string[]
  ): ConsequentialistAnalysis {
    const stakeholderAnalysis: ConsequentialistAnalysis['stakeholders'] = stakeholders.map(s => ({
      stakeholder: s,
      interests: this.identifyInterests(s, context),
      affected: this.assessImpact(s, action, context),
      magnitude: this.assessMagnitude(s, action, context),
    }));

    const outcomes: ConsequentialistAnalysis['outcomes'] = this.identifyOutcomes(action, context);
    const netUtility = this.calculateNetUtility(stakeholderAnalysis, outcomes);
    const longTermEffects = this.assessLongTermEffects(action, context);

    const conclusion = this.determineConsequentialistConclusion(netUtility, outcomes);
    const reasoning = this.generateConsequentialistReasoning(stakeholderAnalysis, outcomes, netUtility, conclusion);

    return {
      stakeholders: stakeholderAnalysis,
      outcomes,
      netUtility,
      longTermEffects,
      conclusion,
      reasoning,
    };
  }

  private identifyInterests(stakeholder: string, context: Record<string, any>): string[] {
    // Simplified - in practice would be more sophisticated
    const interests: string[] = [];
    if (stakeholder.includes('client')) {
      interests.push('Legal representation', 'Confidentiality', 'Competent service');
    }
    if (stakeholder.includes('attorney')) {
      interests.push('Professional reputation', 'Compliance', 'Ethical standing');
    }
    return interests;
  }

  private assessImpact(
    stakeholder: string,
    action: string,
    context: Record<string, any>
  ): 'benefit' | 'harm' | 'neutral' {
    // Simplified assessment
    if (action.toLowerCase().includes('protect') || action.toLowerCase().includes('help')) {
      return 'benefit';
    }
    if (action.toLowerCase().includes('harm') || action.toLowerCase().includes('violate')) {
      return 'harm';
    }
    return 'neutral';
  }

  private assessMagnitude(
    stakeholder: string,
    action: string,
    context: Record<string, any>
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Simplified - would be more sophisticated in practice
    return 'medium';
  }

  private identifyOutcomes(
    action: string,
    context: Record<string, any>
  ): ConsequentialistAnalysis['outcomes'] {
    return [
      {
        outcome: 'Primary outcome',
        probability: 0.7,
        impact: 'positive',
        magnitude: 'medium',
      },
    ];
  }

  private calculateNetUtility(
    stakeholders: ConsequentialistAnalysis['stakeholders'],
    outcomes: ConsequentialistAnalysis['outcomes']
  ): ConsequentialistAnalysis['netUtility'] {
    let totalUtility = 0;
    for (const stakeholder of stakeholders) {
      if (stakeholder.affected === 'benefit') {
        const weight = stakeholder.magnitude === 'critical' ? 10 : 
                       stakeholder.magnitude === 'high' ? 5 :
                       stakeholder.magnitude === 'medium' ? 2 : 1;
        totalUtility += weight;
      } else if (stakeholder.affected === 'harm') {
        const weight = stakeholder.magnitude === 'critical' ? -10 : 
                       stakeholder.magnitude === 'high' ? -5 :
                       stakeholder.magnitude === 'medium' ? -2 : -1;
        totalUtility += weight;
      }
    }

    for (const outcome of outcomes) {
      const utility = outcome.impact === 'positive' ? outcome.probability * 5 :
                     outcome.impact === 'negative' ? -outcome.probability * 5 : 0;
      totalUtility += utility;
    }

    return {
      calculation: `Sum of stakeholder impacts and outcome utilities`,
      value: totalUtility,
    };
  }

  private assessLongTermEffects(action: string, context: Record<string, any>): string[] {
    return [
      'Long-term impact on professional relationships',
      'Systemic effects on legal practice',
    ];
  }

  private determineConsequentialistConclusion(
    netUtility: ConsequentialistAnalysis['netUtility'],
    outcomes: ConsequentialistAnalysis['outcomes']
  ): FrameworkAnalysis['conclusion'] {
    if (netUtility.value > 5) {
      return 'permissible';
    }
    if (netUtility.value < -5) {
      return 'impermissible';
    }
    return 'ambiguous';
  }

  private generateConsequentialistReasoning(
    stakeholders: ConsequentialistAnalysis['stakeholders'],
    outcomes: ConsequentialistAnalysis['outcomes'],
    netUtility: ConsequentialistAnalysis['netUtility'],
    conclusion: FrameworkAnalysis['conclusion']
  ): string {
    let reasoning = 'Consequentialist analysis: ';
    reasoning += `Evaluated impact on ${stakeholders.length} stakeholders. `;
    reasoning += `Identified ${outcomes.length} potential outcomes. `;
    reasoning += `Net utility: ${netUtility.value}. `;
    reasoning += `Conclusion: ${conclusion}.`;
    return reasoning;
  }
}

/**
 * Virtue Ethics Framework Analyzer
 */
export class VirtueEthicsFramework {
  /**
   * Analyze using virtue ethics
   */
  analyze(
    action: string,
    context: Record<string, any>
  ): VirtueEthicsAnalysis {
    const relevantVirtues: VirtueEthicsAnalysis['relevantVirtues'] = [
      {
        virtue: 'Integrity',
        definition: 'Adherence to moral principles and professional standards',
        applies: this.assessIntegrity(action, context),
        reasoning: this.reasonIntegrity(action, context),
      },
      {
        virtue: 'Competence',
        definition: 'Professional skill and knowledge',
        applies: this.assessCompetence(action, context),
        reasoning: this.reasonCompetence(action, context),
      },
      {
        virtue: 'Courage',
        definition: 'Willingness to do what is right despite difficulty',
        applies: this.assessCourage(action, context),
        reasoning: this.reasonCourage(action, context),
      },
    ];

    const characterTraits: VirtueEthicsAnalysis['characterTraits'] = [
      {
        trait: 'Professionalism',
        demonstrated: this.demonstratesProfessionalism(action, context),
        reasoning: this.reasonProfessionalism(action, context),
      },
    ];

    const moralExemplars: VirtueEthicsAnalysis['moralExemplars'] = [];

    const professionalExcellence = {
      standards: ['MRPC compliance', 'Client service', 'Ethical conduct'],
      met: relevantVirtues.every(v => v.applies),
      reasoning: this.reasonProfessionalExcellence(relevantVirtues),
    };

    const conclusion = this.determineVirtueConclusion(relevantVirtues, professionalExcellence);
    const reasoning = this.generateVirtueReasoning(relevantVirtues, professionalExcellence, conclusion);

    return {
      relevantVirtues,
      characterTraits,
      moralExemplars,
      professionalExcellence,
      conclusion,
      reasoning,
    };
  }

  private assessIntegrity(action: string, context: Record<string, any>): boolean {
    return !action.toLowerCase().includes('deceive') && 
           !action.toLowerCase().includes('violate');
  }

  private reasonIntegrity(action: string, context: Record<string, any>): string {
    if (this.assessIntegrity(action, context)) {
      return 'Action demonstrates integrity by adhering to moral principles';
    }
    return 'Action may compromise integrity';
  }

  private assessCompetence(action: string, context: Record<string, any>): boolean {
    return context.hasCompetence !== false;
  }

  private reasonCompetence(action: string, context: Record<string, any>): string {
    if (this.assessCompetence(action, context)) {
      return 'Action demonstrates professional competence';
    }
    return 'Action may require additional competence or consultation';
  }

  private assessCourage(action: string, context: Record<string, any>): boolean {
    return true; // Simplified
  }

  private reasonCourage(action: string, context: Record<string, any>): string {
    return 'Action demonstrates willingness to do what is right';
  }

  private demonstratesProfessionalism(action: string, context: Record<string, any>): boolean {
    return this.assessIntegrity(action, context) && this.assessCompetence(action, context);
  }

  private reasonProfessionalism(action: string, context: Record<string, any>): string {
    if (this.demonstratesProfessionalism(action, context)) {
      return 'Action demonstrates professional conduct';
    }
    return 'Action may not meet professional standards';
  }

  private reasonProfessionalExcellence(
    virtues: VirtueEthicsAnalysis['relevantVirtues']
  ): string {
    const metCount = virtues.filter(v => v.applies).length;
    return `${metCount} of ${virtues.length} relevant virtues demonstrated`;
  }

  private determineVirtueConclusion(
    virtues: VirtueEthicsAnalysis['relevantVirtues'],
    excellence: VirtueEthicsAnalysis['professionalExcellence']
  ): FrameworkAnalysis['conclusion'] {
    if (excellence.met) {
      return 'permissible';
    }
    if (virtues.filter(v => !v.applies).length > virtues.length / 2) {
      return 'impermissible';
    }
    return 'ambiguous';
  }

  private generateVirtueReasoning(
    virtues: VirtueEthicsAnalysis['relevantVirtues'],
    excellence: VirtueEthicsAnalysis['professionalExcellence'],
    conclusion: FrameworkAnalysis['conclusion']
  ): string {
    let reasoning = 'Virtue ethics analysis: ';
    reasoning += `Evaluated ${virtues.length} relevant virtues. `;
    reasoning += `Professional excellence: ${excellence.met ? 'met' : 'not met'}. `;
    reasoning += `Conclusion: ${conclusion}.`;
    return reasoning;
  }
}

/**
 * Legal Ethics Framework Analyzer
 */
export class LegalEthicsFramework {
  /**
   * Analyze using legal ethics (MRPC)
   */
  analyze(
    action: string,
    context: Record<string, any>
  ): LegalEthicsAnalysis {
    const mrpcRules: LegalEthicsAnalysis['mrpcRules'] = [
      {
        rule: 'Competence',
        number: '1.1',
        applies: context.hasClient || false,
        compliance: this.assessMRPCCompliance('1.1', action, context),
        reasoning: this.reasonMRPC('1.1', action, context),
      },
      {
        rule: 'Confidentiality',
        number: '1.6',
        applies: context.hasConfidentiality || false,
        compliance: this.assessMRPCCompliance('1.6', action, context),
        reasoning: this.reasonMRPC('1.6', action, context),
      },
      {
        rule: 'Conflict of Interest',
        number: '1.7',
        applies: context.hasConflictCheck || false,
        compliance: this.assessMRPCCompliance('1.7', action, context),
        reasoning: this.reasonMRPC('1.7', action, context),
      },
    ];

    const professionalResponsibility = {
      duties: ['Duty to client', 'Duty to court', 'Duty to profession'],
      met: mrpcRules.every(r => !r.applies || r.compliance === 'compliant'),
      reasoning: this.reasonProfessionalResponsibility(mrpcRules),
    };

    const clientInterests = {
      protected: !action.toLowerCase().includes('harm') && 
                 !action.toLowerCase().includes('violate'),
      conflicts: this.identifyClientConflicts(action, context),
      reasoning: this.reasonClientInterests(action, context),
    };

    const conclusion = this.determineLegalConclusion(mrpcRules, professionalResponsibility, clientInterests);
    const reasoning = this.generateLegalReasoning(mrpcRules, professionalResponsibility, clientInterests, conclusion);

    return {
      mrpcRules,
      professionalResponsibility,
      clientInterests,
      conclusion,
      reasoning,
    };
  }

  private assessMRPCCompliance(
    ruleNumber: string,
    action: string,
    context: Record<string, any>
  ): 'compliant' | 'non_compliant' | 'ambiguous' {
    // Simplified - would check actual MRPC rules
    if (action.toLowerCase().includes('violate') || action.toLowerCase().includes('breach')) {
      return 'non_compliant';
    }
    return 'compliant';
  }

  private reasonMRPC(ruleNumber: string, action: string, context: Record<string, any>): string {
    const compliance = this.assessMRPCCompliance(ruleNumber, action, context);
    return `MRPC ${ruleNumber}: ${compliance}`;
  }

  private reasonProfessionalResponsibility(
    rules: LegalEthicsAnalysis['mrpcRules']
  ): string {
    const compliant = rules.filter(r => r.compliance === 'compliant').length;
    return `${compliant} of ${rules.length} applicable MRPC rules compliant`;
  }

  private identifyClientConflicts(action: string, context: Record<string, any>): string[] {
    const conflicts: string[] = [];
    if (action.toLowerCase().includes('conflict')) {
      conflicts.push('Potential conflict of interest');
    }
    return conflicts;
  }

  private reasonClientInterests(action: string, context: Record<string, any>): string {
    if (this.identifyClientConflicts(action, context).length === 0) {
      return 'Client interests appear protected';
    }
    return 'Potential conflicts with client interests identified';
  }

  private determineLegalConclusion(
    rules: LegalEthicsAnalysis['mrpcRules'],
    responsibility: LegalEthicsAnalysis['professionalResponsibility'],
    clientInterests: LegalEthicsAnalysis['clientInterests']
  ): FrameworkAnalysis['conclusion'] {
    if (responsibility.met && clientInterests.protected) {
      return 'permissible';
    }
    if (rules.some(r => r.compliance === 'non_compliant')) {
      return 'impermissible';
    }
    return 'ambiguous';
  }

  private generateLegalReasoning(
    rules: LegalEthicsAnalysis['mrpcRules'],
    responsibility: LegalEthicsAnalysis['professionalResponsibility'],
    clientInterests: LegalEthicsAnalysis['clientInterests'],
    conclusion: FrameworkAnalysis['conclusion']
  ): string {
    let reasoning = 'Legal ethics analysis: ';
    reasoning += `Evaluated ${rules.length} MRPC rules. `;
    reasoning += `Professional responsibility: ${responsibility.met ? 'met' : 'not met'}. `;
    reasoning += `Client interests: ${clientInterests.protected ? 'protected' : 'at risk'}. `;
    reasoning += `Conclusion: ${conclusion}.`;
    return reasoning;
  }
}

/**
 * Export framework analyzers
 */
export const deontologicalFramework = new DeontologicalFramework();
export const consequentialistFramework = new ConsequentialistFramework();
export const virtueEthicsFramework = new VirtueEthicsFramework();
export const legalEthicsFramework = new LegalEthicsFramework();
