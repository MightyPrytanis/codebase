/*
 * SystemicEthicsService
 * Technical ethics guardrail for toxicity/bias/groundedness using existing ethicalAIGuard and tenRulesChecker.
 */
import { ethicalAIGuard } from '../tools/ethical-ai-guard.js';
import { tenRulesChecker } from '../tools/ten-rules-checker.js';

export interface EthicsCheckResult {
  passed: boolean;
  blocked: boolean;
  warnings: string[];
  details?: any;
}

export class SystemicEthicsService {
  async checkInput(input: any): Promise<EthicsCheckResult> {
    // Leverage ethicalAIGuard for proposed actions
    const guardResult = await ethicalAIGuard.execute({
      proposedAction: JSON.stringify(input).slice(0, 2000),
      context: 'systemic_ethics_input_scan',
    });
    const guardData = guardResult.metadata as any;
    return {
      passed: guardData?.decision !== 'block',
      blocked: guardData?.decision === 'block',
      warnings: guardData?.warnings?.map((w: any) => w.message) || [],
      details: guardData,
    };
  }

  async checkOutput(text: string): Promise<EthicsCheckResult> {
    const checkResult = await tenRulesChecker.execute({
      textContent: text,
      contentType: 'answer',
      strictMode: true,
    });
    const checkData = checkResult.metadata as any;
    return {
      passed: checkData?.compliance?.status !== 'non_compliant',
      blocked: checkData?.compliance?.status === 'non_compliant',
      warnings: [
        ...(checkData?.warnings?.map((w: any) => w.message) || []),
        ...(checkData?.missingCitations?.map((c: any) => `Missing citation: ${c.claim}`) || []),
      ],
      details: checkData,
    };
  }
}

export const systemicEthicsService = new SystemicEthicsService();

}
}
}
]