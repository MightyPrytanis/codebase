/**
 * Ethics Check Helper
 * 
 * Helper functions for automatically adding ethics checks to recommendation-generating tools.
 * Provides easy-to-use functions that tools can call before returning recommendations.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { ethicsReviewer } from '../engines/goodcounsel/tools/ethics-reviewer.js';
import { ethicalAIGuard } from '../tools/ethical-ai-guard.js';
import { ethicsAuditService } from './ethics-audit-service.js';
import { systemicEthicsService } from './systemic-ethics-service.js';
import { responsibilityService } from './responsibility-service.js';
import { AIProvider } from './ai-service.js';

export interface EthicsCheckOptions {
  toolName: string;
  engine?: string;
  app?: string;
  provider?: AIProvider;
  facts?: Record<string, any>; // For professional ethics rules
  strictMode?: boolean;
}

export interface EthicsCheckResult {
  passed: boolean;
  blocked: boolean;
  warnings: string[];
  complianceScore: number;
  auditId: string;
  checkDetails: any;
  aiEthics?: {
    passed: boolean;
    blocked: boolean;
    warnings: string[];
    score: number;
  };
  professionalResponsibility?: {
    passed: boolean;
    blocked: boolean;
    warnings: string[];
    violations: string[];
  };
}

/**
 * Automatically check recommendations before returning them
 */
export async function checkRecommendations(
  recommendations: any[],
  options: EthicsCheckOptions
): Promise<{
  recommendations: any[];
  ethicsCheck: EthicsCheckResult;
  modified: boolean;
}> {
  const recommendationsText = JSON.stringify(recommendations, null, 2);
  
  // DUAL-STRAND ETHICS MODEL:
  // 1. AI ETHICS (SystemicEthicsService) - Always checked
  // 2. PROFESSIONAL RESPONSIBILITY (ResponsibilityService) - Checked if facts provided
  
  // Strand 1: AI Ethics (Ten Rules)
  const aiEthicsResult = await systemicEthicsService.checkInput(recommendations);
  
  // Strand 2: Professional Responsibility (MRPC/ABA/HIPAA) - Only if facts provided
  let professionalResult: any = null;
  if (options.facts && Object.keys(options.facts).length > 0) {
    professionalResult = await responsibilityService.checkFacts(options.facts);
  }
  
  // Also use ethicalAIGuard for comprehensive check (includes both strands)
  const guardResult = await ethicalAIGuard.execute({
    proposedAction: recommendationsText,
    context: `Recommendations from ${options.toolName}`,
    provider: options.provider,
    callSiteMetadata: {
      engine: options.engine,
      app: options.app,
      tool: options.toolName,
    },
    facts: options.facts,
  });

  const guardData = guardResult.metadata as any;
  
  // Combine results: Block if either strand blocks
  const aiBlocked = aiEthicsResult.blocked;
  const professionalBlocked = professionalResult?.blocked || false;
  const blocked = aiBlocked || professionalBlocked;
  const passed = !blocked;
  
  // Combine warnings
  const allWarnings = [
    ...(aiEthicsResult.warnings || []),
    ...(professionalResult?.warnings || []),
    ...(guardData?.warnings?.map((w: any) => w.message) || []),
  ];

  // Log to audit trail
  const auditId = await ethicsAuditService.logEthicsCheck(
    options.toolName,
    'recommendation',
    recommendationsText,
    {
      ...guardData,
      aiEthics: aiEthicsResult,
      professionalResponsibility: professionalResult,
    },
    'ethical_ai_guard',
    {
      engine: options.engine,
      app: options.app,
    }
  );

  const ethicsCheck: EthicsCheckResult = {
    passed,
    blocked,
    warnings: allWarnings,
    complianceScore: guardData?.complianceScore || 100,
    auditId,
    checkDetails: guardData,
    aiEthics: {
      passed: aiEthicsResult.passed,
      blocked: aiEthicsResult.blocked,
      warnings: aiEthicsResult.warnings,
      score: guardData?.complianceScore || 100,
    },
    professionalResponsibility: professionalResult ? {
      passed: professionalResult.passed,
      blocked: professionalResult.blocked,
      warnings: professionalResult.warnings,
      violations: professionalResult.violations,
    } : undefined,
  };

  // If blocked, return empty recommendations
  if (blocked) {
    return {
      recommendations: [],
      ethicsCheck,
      modified: true,
    };
  }

  // If warnings, add ethics metadata to recommendations
  let modified = false;
  if (guardData?.warnings?.length > 0) {
    modified = true;
    recommendations = recommendations.map((rec: any) => ({
      ...rec,
      _ethicsMetadata: {
        reviewed: true,
        warnings: guardData.warnings.filter((w: any) => 
          w.ruleId?.startsWith('rule_') // Only Ten Rules warnings
        ).map((w: any) => w.message),
        complianceScore: guardData.complianceScore,
      },
    }));
  }

  return {
    recommendations,
    ethicsCheck,
    modified,
  };
}

/**
 * Automatically check a single recommendation
 */
export async function checkSingleRecommendation(
  recommendation: string | any,
  options: EthicsCheckOptions
): Promise<{
  recommendation: any;
  ethicsCheck: EthicsCheckResult;
  modified: boolean;
}> {
  const recommendationText = typeof recommendation === 'string' 
    ? recommendation 
    : JSON.stringify(recommendation, null, 2);

  // Use ethicalAIGuard
  const guardResult = await ethicalAIGuard.execute({
    proposedAction: recommendationText,
    context: `Single recommendation from ${options.toolName}`,
    provider: options.provider,
    callSiteMetadata: {
      engine: options.engine,
      app: options.app,
      tool: options.toolName,
    },
    facts: options.facts,
  });

  const guardData = guardResult.metadata as any;
  const passed = guardData?.decision !== 'block';
  const blocked = guardData?.decision === 'block';

  // Log to audit trail
  const auditId = await ethicsAuditService.logEthicsCheck(
    options.toolName,
    'recommendation',
    recommendationText,
    guardData,
    'ethical_ai_guard',
    {
      engine: options.engine,
      app: options.app,
    }
  );

  const ethicsCheck: EthicsCheckResult = {
    passed,
    blocked,
    warnings: guardData?.warnings?.map((w: any) => w.message) || [],
    complianceScore: guardData?.complianceScore || 100,
    auditId,
    checkDetails: guardData,
  };

  // If blocked, return null
  if (blocked) {
    return {
      recommendation: null,
      ethicsCheck,
      modified: true,
    };
  }

  // Add ethics metadata if warnings
  let modified = false;
  let finalRecommendation = recommendation;
  if (guardData?.warnings?.length > 0) {
    modified = true;
    if (typeof recommendation === 'string') {
      finalRecommendation = {
        text: recommendation,
        _ethicsMetadata: {
          reviewed: true,
          warnings: guardData.warnings.map((w: any) => w.message),
          complianceScore: guardData.complianceScore,
        },
      };
    } else {
      finalRecommendation = {
        ...recommendation,
        _ethicsMetadata: {
          reviewed: true,
          warnings: guardData.warnings.map((w: any) => w.message),
          complianceScore: guardData.complianceScore,
        },
      };
    }
  }

  return {
    recommendation: finalRecommendation,
    ethicsCheck,
    modified,
  };
}

/**
 * Check content generation (reports, drafts, etc.)
 */
export async function checkGeneratedContent(
  content: string,
  options: EthicsCheckOptions & { contentType?: 'answer' | 'draft' | 'report' | 'recommendation' }
): Promise<{
  content: string;
  ethicsCheck: EthicsCheckResult;
  modified: boolean;
}> {
  // Use tenRulesChecker for content
  const { tenRulesChecker } = await import('../tools/ten-rules-checker.js');
  
  const checkResult = await tenRulesChecker.execute({
    textContent: content,
    contentType: options.contentType || 'other',
    strictMode: options.strictMode || false,
  });

  const checkData = checkResult.metadata as any;
  const passed = checkData?.compliance?.status !== 'non_compliant';
  const blocked = checkData?.compliance?.status === 'non_compliant';

  // Log to audit trail
  const auditId = await ethicsAuditService.logEthicsCheck(
    options.toolName,
    'content_generation',
    content.substring(0, 1000),
    checkData,
    'ten_rules_checker',
    {
      engine: options.engine,
      app: options.app,
    }
  );

  const ethicsCheck: EthicsCheckResult = {
    passed,
    blocked,
    warnings: [
      ...(checkData?.warnings?.map((w: any) => w.message) || []),
      ...(checkData?.missingCitations?.map((c: any) => `Missing citation: ${c.claim}`) || []),
      ...(checkData?.classificationIssues?.map((i: any) => `Classification issue: ${i.issue}`) || []),
    ],
    complianceScore: checkData?.compliance?.score || 100,
    auditId,
    checkDetails: checkData,
  };

  // If blocked, return empty content
  if (blocked) {
    return {
      content: '',
      ethicsCheck,
      modified: true,
    };
  }

  // Content is not modified, but metadata is available in checkDetails
  return {
    content,
    ethicsCheck,
    modified: false,
  };
