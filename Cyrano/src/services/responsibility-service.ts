/*
 * ResponsibilityService
 * Professional responsibility guardrail (MRPC/ABA/HIPAA/FERPA).
 * Wraps ethicsRulesService to keep concerns separate from systemic AI ethics.
 */
import { ethicsRulesService, EthicsReviewResult } from '../engines/goodcounsel/services/ethics-rules-service.js';

export interface DutyCheckResult {
  passed: boolean;
  blocked: boolean;
  warnings: string[];
  violations: string[];
  details?: EthicsReviewResult;
}

export class ResponsibilityService {
  async checkFacts(facts: Record<string, any>, userId?: string): Promise<DutyCheckResult> {
    const review = await ethicsRulesService.runReview(facts, userId);
    const violations = review.violations.map(v => `${v.ruleName}: ${v.message}`);
    const warnings = review.warnings.map(w => `${w.ruleName}: ${w.message}`);
    const blocked = review.compliance.status === 'non_compliant';
    return {
      passed: !blocked,
      blocked,
      warnings,
      violations,
      details: review,
    };
  }

  async checkOutput(content: string, facts?: Record<string, any>, userId?: string): Promise<DutyCheckResult> {
    // If no facts provided, return pass-through
    if (!facts) {
      return { passed: true, blocked: false, warnings: [], violations: [] };
    }
    return this.checkFacts({ ...facts, generatedContent: content }, userId);
  }
}

export const responsibilityService = new ResponsibilityService();

