/**
 * Ethics Rules Module
 * 
 * Uses json-rules-engine for rule-based ethics compliance checking
 * Integrates with GoodCounsel engine for ethics review workflows
 * 
 * Created: 2025-11-26
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Engine, Rule } from 'json-rules-engine';

export interface EthicsRule {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: any; // JSON Rules Engine conditions
  event: {
    type: string;
    params: {
      message: string;
      severity: 'info' | 'warning' | 'violation' | 'critical';
      action?: string;
      reference?: string;
    };
  };
}

export interface EthicsReviewResult {
  userId?: string;
  timestamp: string;
  rulesEvaluated: number;
  violations: Array<{
    ruleId: string;
    ruleName: string;
    severity: string;
    message: string;
    action?: string;
    reference?: string;
  }>;
  warnings: Array<{
    ruleId: string;
    ruleName: string;
    message: string;
    action?: string;
  }>;
  compliance: {
    status: 'compliant' | 'non_compliant' | 'needs_review';
    score: number; // 0-100
    summary: string;
  };
}

export class EthicsRulesModule {
  private engine: Engine;
  private rules: Map<string, EthicsRule>;

  constructor() {
    this.engine = new Engine();
    this.rules = new Map();
    this.loadDefaultRules();
  }

  /**
   * Load default ethics rules
   */
  private loadDefaultRules(): void {
    // Rule 1: Conflict of Interest Check
    this.addRule({
      id: 'conflict_of_interest',
      name: 'Conflict of Interest',
      description: 'Check for potential conflicts of interest',
      priority: 'critical',
      conditions: {
        all: [
          {
            fact: 'hasExistingClient',
            operator: 'equal',
            value: true,
          },
          {
            fact: 'newClientInterests',
            operator: 'intersect',
            value: ['existingClientInterests'],
          },
        ],
      },
      event: {
        type: 'conflict_detected',
        params: {
          message: 'Potential conflict of interest detected between existing and new client',
          severity: 'critical',
          action: 'Review conflict of interest rules and obtain informed consent if appropriate',
          reference: 'MRPC 1.7',
        },
      },
    });

    // Rule 2: Client Confidentiality
    this.addRule({
      id: 'client_confidentiality',
      name: 'Client Confidentiality',
      description: 'Ensure client information is kept confidential',
      priority: 'critical',
      conditions: {
        all: [
          {
            fact: 'clientInfoDisclosed',
            operator: 'equal',
            value: true,
          },
          {
            fact: 'hasClientConsent',
            operator: 'equal',
            value: false,
          },
        ],
      },
      event: {
        type: 'confidentiality_breach',
        params: {
          message: 'Client information disclosed without consent',
          severity: 'violation',
          action: 'Immediately cease disclosure and review confidentiality obligations',
          reference: 'MRPC 1.6',
        },
      },
    });

    // Rule 3: Competence Check
    this.addRule({
      id: 'competence',
      name: 'Competence',
      description: 'Ensure attorney has necessary competence for matter',
      priority: 'high',
      conditions: {
        any: [
          {
            fact: 'matterComplexity',
            operator: 'greaterThan',
            value: 'attorneyExperience',
          },
          {
            fact: 'requiresSpecialization',
            operator: 'equal',
            value: true,
          },
          {
            fact: 'hasSpecialization',
            operator: 'equal',
            value: false,
          },
        ],
      },
      event: {
        type: 'competence_concern',
        params: {
          message: 'Matter may require additional competence or consultation',
          severity: 'warning',
          action: 'Consider associating with competent counsel or acquiring necessary competence',
          reference: 'MRPC 1.1',
        },
      },
    });

    // Rule 4: Communication with Client
    this.addRule({
      id: 'client_communication',
      name: 'Client Communication',
      description: 'Ensure adequate communication with client',
      priority: 'medium',
      conditions: {
        all: [
          {
            fact: 'daysSinceLastContact',
            operator: 'greaterThan',
            value: 30,
          },
          {
            fact: 'matterActive',
            operator: 'equal',
            value: true,
          },
        ],
      },
      event: {
        type: 'communication_lapse',
        params: {
          message: 'No client contact in over 30 days for active matter',
          severity: 'warning',
          action: 'Reach out to client to provide status update',
          reference: 'MRPC 1.4',
        },
      },
    });

    // Rule 5: Fee Agreement
    this.addRule({
      id: 'fee_agreement',
      name: 'Fee Agreement',
      description: 'Ensure fee agreement is in writing when required',
      priority: 'high',
      conditions: {
        all: [
          {
            fact: 'feeAmount',
            operator: 'greaterThan',
            value: 1000,
          },
          {
            fact: 'hasWrittenAgreement',
            operator: 'equal',
            value: false,
          },
        ],
      },
      event: {
        type: 'fee_agreement_missing',
        params: {
          message: 'Fee agreement should be in writing for fees over $1000',
          severity: 'warning',
          action: 'Obtain written fee agreement from client',
          reference: 'MRPC 1.5',
        },
      },
    });
  }

  /**
   * Add a custom ethics rule
   */
  addRule(rule: EthicsRule): void {
    const engineRule = new Rule({
      conditions: rule.conditions,
      event: rule.event,
    });

    this.engine.addRule(engineRule);
    this.rules.set(rule.id, rule);
  }

  /**
   * Run ethics review
   */
  async runReview(facts: Record<string, any>, userId?: string): Promise<EthicsReviewResult> {
    const violations: EthicsReviewResult['violations'] = [];
    const warnings: EthicsReviewResult['warnings'] = [];

    // Run rules engine
    const { events } = await this.engine.run(facts);

    // Categorize results
    for (const event of events) {
      const rule = this.findRuleByEventType(event.type);
      if (!rule) continue;

      const params = event.params || {};
      const result = {
        ruleId: rule.id,
        ruleName: rule.name,
        message: params.message || '',
        action: params.action,
        reference: params.reference,
      };

      if (params.severity === 'violation' || params.severity === 'critical') {
        violations.push({
          ...result,
          severity: params.severity,
        });
      } else {
        warnings.push(result);
      }
    }

    // Calculate compliance score
    const totalRules = this.rules.size;
    const violationCount = violations.length;
    const warningCount = warnings.length;
    const score = Math.max(0, 100 - (violationCount * 20) - (warningCount * 5));

    // Determine compliance status
    let status: 'compliant' | 'non_compliant' | 'needs_review';
    if (violationCount === 0 && warningCount === 0) {
      status = 'compliant';
    } else if (violationCount > 0) {
      status = 'non_compliant';
    } else {
      status = 'needs_review';
    }

    return {
      userId,
      timestamp: new Date().toISOString(),
      rulesEvaluated: totalRules,
      violations,
      warnings,
      compliance: {
        status,
        score,
        summary: this.generateSummary(violations, warnings, status),
      },
    };
  }

  /**
   * Find rule by event type
   */
  private findRuleByEventType(eventType: string): EthicsRule | undefined {
    for (const rule of this.rules.values()) {
      if (rule.event.type === eventType) {
        return rule;
      }
    }
    return undefined;
  }

  /**
   * Generate compliance summary
   */
  private generateSummary(
    violations: EthicsReviewResult['violations'],
    warnings: EthicsReviewResult['warnings'],
    status: string
  ): string {
    if (violations.length === 0 && warnings.length === 0) {
      return 'No ethics issues detected. All rules passed.';
    }

    const parts: string[] = [];
    if (violations.length > 0) {
      parts.push(`${violations.length} violation(s) detected`);
    }
    if (warnings.length > 0) {
      parts.push(`${warnings.length} warning(s) issued`);
    }

    return `Ethics review ${status.replace('_', ' ')}. ${parts.join(', ')}. Review recommended.`;
  }

  /**
   * Get all registered rules
   */
  getRules(): EthicsRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    // Note: json-rules-engine doesn't have a direct remove method
    // We'd need to rebuild the engine without this rule
    // For now, mark as removed in our map
    this.rules.delete(ruleId);
    
    // Rebuild engine without removed rule
    this.engine = new Engine();
    for (const r of this.rules.values()) {
      this.addRule(r);
    }

    return true;
  }
}

/**
 * Default instance
 */
export const ethicsRulesModule = new EthicsRulesModule();


}
}
}
)
}