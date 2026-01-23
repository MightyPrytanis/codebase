/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ContractComparatorSchema = z.object({
  document1_text: z.string().describe('First contract/agreement to compare'),
  document2_text: z.string().describe('Second contract/agreement to compare'),
  comparison_type: z.enum(['comprehensive', 'clauses', 'terms', 'structure', 'risk_analysis', 'obligations', 'choice_of_law', 'financial', 'rights_remedies', 'term_termination']).default('comprehensive'),
  focus_areas: z.array(z.string()).optional().describe('Specific areas to focus comparison on'),
});

export const contractComparator = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'contract_comparator',
      description: 'Compare two contracts/agreements to identify differences, similarities, and key variations. Note: This tool is designed for contracts and agreements, not all legal documents. For settlement agreements requiring court/referee approval, additional review may be needed.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          document1_text: {
            type: 'string',
            description: 'First contract/agreement to compare',
          },
          document2_text: {
            type: 'string',
            description: 'Second contract/agreement to compare',
          },
          comparison_type: {
            type: 'string',
            enum: ['comprehensive', 'clauses', 'terms', 'structure', 'risk_analysis', 'obligations', 'choice_of_law', 'financial', 'rights_remedies', 'term_termination'],
            default: 'comprehensive',
            description: 'Type of comparison to perform - comprehensive includes all advanced legal analysis',
          },
          focus_areas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific areas to focus comparison on',
          },
        },
        required: ['document1_text', 'document2_text'],
      },
    };
  }

  async execute(args: any) {
    try {
      const { document1_text, document2_text, comparison_type, focus_areas } = ContractComparatorSchema.parse(args);

      const comparison = this.performComparison(document1_text, document2_text, comparison_type, focus_areas);

      // Use formatted output for comprehensive analysis
      const output = comparison_type === 'comprehensive'
        ? this.formatEnhancedAnalysis(comparison)
        : JSON.stringify(comparison, null, 2);

      return this.createSuccessResult(output, {
        comparison_type,
        document1_word_count: document1_text.split(' ').length,
        document2_word_count: document2_text.split(' ').length,
        focus_areas: focus_areas || [],
      });
    } catch (error) {
      return this.createErrorResult(`Legal comparison failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public performComparison(doc1: string, doc2: string, comparisonType: string, focusAreas?: string[]) {
    const comparison: any = {
      metadata: {
        comparison_type: comparisonType,
        timestamp: new Date().toISOString(),
        document1_length: doc1.length,
        document2_length: doc2.length,
      },
      structural_differences: this.compareStructure(doc1, doc2),
      content_differences: this.compareContent(doc1, doc2),
      similarity_score: this.calculateSimilarity(doc1, doc2),
      key_differences: this.identifyKeyDifferences(doc1, doc2),
      recommendations: this.generateComparisonRecommendations(doc1, doc2),
      focused_comparison: undefined as any,
    };

    // Add specialized analysis based on comparison type
    if (comparisonType === 'risk_analysis' || comparisonType === 'comprehensive') {
      comparison.risk_analysis = this.performRiskAnalysis(doc1, doc2);
    }

    if (comparisonType === 'obligations' || comparisonType === 'comprehensive') {
      comparison.obligations_analysis = this.performObligationsAnalysis(doc1, doc2);
    }

    if (comparisonType === 'choice_of_law' || comparisonType === 'comprehensive') {
      comparison.choice_of_law_analysis = this.performChoiceOfLawAnalysis(doc1, doc2);
    }

    if (comparisonType === 'financial' || comparisonType === 'comprehensive') {
      comparison.financial_analysis = this.performFinancialAnalysis(doc1, doc2);
    }

    if (comparisonType === 'rights_remedies' || comparisonType === 'comprehensive') {
      comparison.rights_and_remedies = this.performRightsAndRemediesAnalysis(doc1, doc2);
    }

    if (comparisonType === 'term_termination' || comparisonType === 'comprehensive') {
      comparison.term_and_termination = this.performTermAndTerminationAnalysis(doc1, doc2);
    }

    if (focusAreas && focusAreas.length > 0) {
      comparison.focused_comparison = this.performFocusedComparison(doc1, doc2, focusAreas);
    }

    return comparison;
  }

  public formatEnhancedAnalysis(results: any): string {
    let output = '';

    // Basic comparison info
    output += `📊 Similarity Score: ${(results.similarity_score * 100).toFixed(1)}%\n`;
    output += `📄 Document 1 Length: ${results.metadata?.document1_length || 'Unknown'} chars\n`;
    output += `📄 Document 2 Length: ${results.metadata?.document2_length || 'Unknown'} chars\n`;
    output += `⏰ Comparison Time: ${new Date().toLocaleString()}\n\n`;

    // Key differences
    if (results.key_differences && results.key_differences.length > 0) {
      output += `🔍 Key Differences:\n`;
      results.key_differences.forEach((diff: string) => output += `  • ${diff}\n`);
      output += '\n';
    }

    // Enhanced analysis sections
    if (results.risk_analysis) {
      output += `🛡️ RISK ANALYSIS:\n`;
      output += `  Document 1 Risks: ${results.risk_analysis.doc1_risks?.join(', ') || 'None identified'}\n`;
      output += `  Document 2 Risks: ${results.risk_analysis.doc2_risks?.join(', ') || 'None identified'}\n`;
      output += `  Overall Assessment: ${results.risk_analysis.overall_risk_assessment || 'Not assessed'}\n`;
      if (results.risk_analysis.traps_for_unwary?.length > 0) {
        output += `  ⚠️  Traps for Unwary: ${results.risk_analysis.traps_for_unwary.join('; ')}\n`;
      }
      output += '\n';
    }

    if (results.obligations_analysis) {
      output += `📋 OBLIGATIONS ANALYSIS:\n`;
      output += `  Document 1 Obligations: ${results.obligations_analysis.doc1_obligations?.length || 0} identified\n`;
      output += `  Document 2 Obligations: ${results.obligations_analysis.doc2_obligations?.length || 0} identified\n`;
      output += `  Common Obligations: ${results.obligations_analysis.obligations_comparison?.common_obligations?.length || 0}\n`;
      output += `  Party Analysis: ${results.obligations_analysis.party_responsibilities || 'Not analyzed'}\n\n`;
    }

    if (results.choice_of_law_analysis) {
      output += `⚖️ CHOICE OF LAW ANALYSIS:\n`;
      output += `  Document 1 Governing Law: ${results.choice_of_law_analysis.doc1_choice_of_law || 'Not specified'}\n`;
      output += `  Document 2 Governing Law: ${results.choice_of_law_analysis.doc2_choice_of_law || 'Not specified'}\n`;
      output += `  Same Jurisdiction: ${results.choice_of_law_analysis.jurisdiction_comparison?.same_jurisdiction || false}\n`;
      if (results.choice_of_law_analysis.governing_law_implications?.length > 0) {
        output += `  Legal Implications: ${results.choice_of_law_analysis.governing_law_implications.join('; ')}\n`;
      }
      output += '\n';
    }

    if (results.financial_analysis) {
      output += `💰 FINANCIAL ANALYSIS:\n`;
      output += `  Document 1 Amounts: ${results.financial_analysis.doc1_financial_terms?.payment_amounts?.length || 0} monetary terms\n`;
      output += `  Document 2 Amounts: ${results.financial_analysis.doc2_financial_terms?.payment_amounts?.length || 0} monetary terms\n`;
      output += `  Payment Comparison: ${results.financial_analysis.payment_terms_comparison?.payment_comparison || 'Not compared'}\n`;
      output += `  Penalty Comparison: ${results.financial_analysis.payment_terms_comparison?.penalty_comparison || 'Not compared'}\n\n`;
    }

    if (results.rights_and_remedies) {
      output += `🏛️ RIGHTS & REMEDIES ANALYSIS:\n`;
      output += `  Document 1 Termination Rights: ${results.rights_and_remedies.doc1_rights_and_remedies?.termination_rights?.length || 0}\n`;
      output += `  Document 2 Termination Rights: ${results.rights_and_remedies.doc2_rights_and_remedies?.termination_rights?.length || 0}\n`;
      output += `  Remedies Comparison: ${results.rights_and_remedies.remedies_comparison?.remedies_comparison || 'Not compared'}\n`;
      output += `  Dispute Resolution: ${results.rights_and_remedies.dispute_resolution?.doc1_dispute_mechanism || 'Not specified'} vs ${results.rights_and_remedies.dispute_resolution?.doc2_dispute_mechanism || 'Not specified'}\n\n`;
    }

    if (results.term_and_termination) {
      output += `⏰ TERM & TERMINATION ANALYSIS:\n`;
      output += `  Document 1 Duration: ${results.term_and_termination.doc1_term_and_termination?.duration || 'Not specified'}\n`;
      output += `  Document 2 Duration: ${results.term_and_termination.doc2_term_and_termination?.duration || 'Not specified'}\n`;
      output += `  Duration Comparison: ${results.term_and_termination.duration_comparison?.duration_comparison || 'Not compared'}\n\n`;
    }

    // Recommendations
    if (results.recommendations && results.recommendations.length > 0) {
      output += `📋 Recommendations:\n`;
      results.recommendations.forEach((rec: string) => output += `  • ${rec}\n`);
      output += '\n';
    }

    // Content analysis
    if (results.content_differences) {
      output += `📊 Content Analysis:\n`;
      output += `  Common legal terms: ${results.content_differences.common_terms?.join(', ') || 'None'}\n`;
      if (results.content_differences.unique_to_doc1?.length > 0) {
        output += `  Unique to Document 1: ${results.content_differences.unique_to_doc1.join(', ')}\n`;
      }
      if (results.content_differences.unique_to_doc2?.length > 0) {
        output += `  Unique to Document 2: ${results.content_differences.unique_to_doc2.join(', ')}\n`;
      }
    }

    return output;
  }

  public compareStructure(doc1: string, doc2: string): any {
    const sections1 = this.extractSections(doc1);
    const sections2 = this.extractSections(doc2);
    
    return {
      doc1_sections: sections1.length,
      doc2_sections: sections2.length,
      section_differences: this.findSectionDifferences(sections1, sections2),
      structural_similarity: this.calculateStructuralSimilarity(sections1, sections2),
    };
  }

  public compareContent(doc1: string, doc2: string): any {
    const terms1 = this.extractLegalTerms(doc1);
    const terms2 = this.extractLegalTerms(doc2);
    
    return {
      common_terms: this.findCommonTerms(terms1, terms2),
      unique_to_doc1: this.findUniqueTerms(terms1, terms2),
      unique_to_doc2: this.findUniqueTerms(terms2, terms1),
      term_frequency_differences: this.compareTermFrequencies(terms1, terms2),
    };
  }

  public calculateSimilarity(doc1: string, doc2: string): number {
    const words1 = new Set(doc1.toLowerCase().split(/\W+/));
    const words2 = new Set(doc2.toLowerCase().split(/\W+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  public identifyKeyDifferences(doc1: string, doc2: string): string[] {
    const differences: string[] = [];
    
    // Check for different legal terms
    const terms1 = this.extractLegalTerms(doc1);
    const terms2 = this.extractLegalTerms(doc2);
    const uniqueTerms1 = this.findUniqueTerms(terms1, terms2);
    const uniqueTerms2 = this.findUniqueTerms(terms2, terms1);
    
    if (uniqueTerms1.length > 0) {
      differences.push(`Document 1 contains unique terms: ${uniqueTerms1.join(', ')}`);
    }
    if (uniqueTerms2.length > 0) {
      differences.push(`Document 2 contains unique terms: ${uniqueTerms2.join(', ')}`);
    }
    
    // Check for different numerical values
    const numbers1 = this.extractNumbers(doc1);
    const numbers2 = this.extractNumbers(doc2);
    const differentNumbers = this.findDifferentNumbers(numbers1, numbers2);
    
    if (differentNumbers.length > 0) {
      differences.push(`Different numerical values found: ${differentNumbers.join(', ')}`);
    }
    
    return differences;
  }

  public generateComparisonRecommendations(doc1: string, doc2: string): string[] {
    const recommendations: string[] = [];
    
    const similarity = this.calculateSimilarity(doc1, doc2);
    
    if (similarity < 0.3) {
      recommendations.push('Documents are significantly different - review for compatibility');
    } else if (similarity > 0.8) {
      recommendations.push('Documents are very similar - check for subtle differences');
    }
    
    const terms1 = this.extractLegalTerms(doc1);
    const terms2 = this.extractLegalTerms(doc2);
    const commonTerms = this.findCommonTerms(terms1, terms2);
    
    if (commonTerms.length < 5) {
      recommendations.push('Limited common legal terminology - verify document types match');
    }
    
    return recommendations;
  }

  public extractSections(text: string): string[] {
    const sectionPattern = /(?:section|clause|article|paragraph)\s+\d+[:.-]?\s*([^.!?]+)/gi;
    const matches = text.match(sectionPattern) || [];
    return matches.map(match => match.trim());
  }

  public extractLegalTerms(text: string): string[] {
    const legalTerms = [
      'contract', 'agreement', 'liability', 'damages', 'breach', 'warranty',
      'indemnification', 'jurisdiction', 'governing law', 'force majeure',
      'termination', 'remedy', 'arbitration', 'mediation', 'party', 'parties',
      'obligation', 'duty', 'right', 'entitlement', 'provision', 'clause'
    ];
    
    return legalTerms.filter(term => 
      text.toLowerCase().includes(term)
    );
  }

  public findCommonTerms(terms1: string[], terms2: string[]): string[] {
    const set1 = new Set(terms1);
    const set2 = new Set(terms2);
    return [...set1].filter(term => set2.has(term));
  }

  public findUniqueTerms(terms1: string[], terms2: string[]): string[] {
    const set2 = new Set(terms2);
    return terms1.filter(term => !set2.has(term));
  }

  public compareTermFrequencies(terms1: string[], terms2: string[]): Record<string, { doc1: number; doc2: number }> {
    const freq1 = this.getTermFrequencies(terms1);
    const freq2 = this.getTermFrequencies(terms2);
    const allTerms = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
    
    const result: Record<string, { doc1: number; doc2: number }> = {};
    allTerms.forEach(term => {
      result[term] = {
        doc1: freq1[term] || 0,
        doc2: freq2[term] || 0,
      };
    });
    
    return result;
  }

  public getTermFrequencies(terms: string[]): Record<string, number> {
    const frequencies: Record<string, number> = {};
    terms.forEach(term => {
      frequencies[term] = (frequencies[term] || 0) + 1;
    });
    return frequencies;
  }

  public findSectionDifferences(sections1: string[], sections2: string[]): any {
    return {
      doc1_unique_sections: sections1.filter(s => !sections2.includes(s)),
      doc2_unique_sections: sections2.filter(s => !sections1.includes(s)),
      common_sections: sections1.filter(s => sections2.includes(s)),
    };
  }

  public calculateStructuralSimilarity(sections1: string[], sections2: string[]): number {
    const set1 = new Set(sections1);
    const set2 = new Set(sections2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  public extractNumbers(text: string): number[] {
    const numberPattern = /\b\d+(?:\.\d+)?\b/g;
    const matches = text.match(numberPattern) || [];
    return matches.map(match => parseFloat(match));
  }

  public findDifferentNumbers(numbers1: number[], numbers2: number[]): string[] {
    const set1 = new Set(numbers1);
    const set2 = new Set(numbers2);
    const different1 = numbers1.filter(n => !set2.has(n));
    const different2 = numbers2.filter(n => !set1.has(n));
    
    return [
      ...different1.map(n => `Doc1: ${n}`),
      ...different2.map(n => `Doc2: ${n}`),
    ];
  }

  public performFocusedComparison(doc1: string, doc2: string, focusAreas: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    focusAreas.forEach(area => {
      switch (area.toLowerCase()) {
        case 'contracts':
          result.contracts = this.compareContractElements(doc1, doc2);
          break;
        case 'liability':
          result.liability = this.compareLiabilityClauses(doc1, doc2);
          break;
        case 'compliance':
          result.compliance = this.compareComplianceElements(doc1, doc2);
          break;
        default:
          result[area] = `Focused comparison for ${area} not implemented`;
      }
    });
    
    return result;
  }

  public compareContractElements(doc1: string, doc2: string): any {
    return {
      doc1_contract_indicators: (doc1.match(/contract|agreement/gi) || []).length,
      doc2_contract_indicators: (doc2.match(/contract|agreement/gi) || []).length,
      parties_doc1: this.extractParties(doc1),
      parties_doc2: this.extractParties(doc2),
    };
  }

  public compareLiabilityClauses(doc1: string, doc2: string): any {
    return {
      doc1_liability_mentions: (doc1.match(/liability|damages/gi) || []).length,
      doc2_liability_mentions: (doc2.match(/liability|damages/gi) || []).length,
      liability_differences: this.findLiabilityDifferences(doc1, doc2),
    };
  }

  public compareComplianceElements(doc1: string, doc2: string): any {
    return {
      doc1_compliance_mentions: (doc1.match(/compliance|regulation/gi) || []).length,
      doc2_compliance_mentions: (doc2.match(/compliance|regulation/gi) || []).length,
      compliance_differences: this.findComplianceDifferences(doc1, doc2),
    };
  }

  public extractParties(text: string): string[] {
    const partyPattern = /(?:party|parties|between|and)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    const matches = text.match(partyPattern) || [];
    return matches.map(match => match.replace(/(?:party|parties|between|and)\s+/i, '').trim());
  }

  public findLiabilityDifferences(doc1: string, doc2: string): string[] {
    const liabilityTerms = ['liability', 'damages', 'breach', 'negligence'];
    const differences: string[] = [];
    
    liabilityTerms.forEach(term => {
      const escapedTerm = escapeRegExp(term);
      const count1 = (doc1.match(new RegExp(escapedTerm, 'gi')) || []).length;
      const count2 = (doc2.match(new RegExp(escapedTerm, 'gi')) || []).length;
      
      if (count1 !== count2) {
        differences.push(`${term}: Doc1 has ${count1}, Doc2 has ${count2}`);
      }
    });
    
    return differences;
  }

  public findComplianceDifferences(doc1: string, doc2: string): string[] {
    const complianceTerms = ['compliance', 'regulation', 'statute', 'law'];
    const differences: string[] = [];
    
    complianceTerms.forEach(term => {
      const escapedTerm = escapeRegExp(term);
      const count1 = (doc1.match(new RegExp(escapedTerm, 'gi')) || []).length;
      const count2 = (doc2.match(new RegExp(escapedTerm, 'gi')) || []).length;
      
      if (count1 !== count2) {
        differences.push(`${term}: Doc1 has ${count1}, Doc2 has ${count2}`);
      }
    });
    
    return differences;
  }

  // ===== NEW ADVANCED LEGAL ANALYSIS METHODS =====

  public performRiskAnalysis(doc1: string, doc2: string): any {
    return {
      doc1_risks: this.identifyRisks(doc1),
      doc2_risks: this.identifyRisks(doc2),
      risk_comparison: this.compareRisks(doc1, doc2),
      traps_for_unwary: this.identifyTrapsForUnwary(doc1, doc2),
      overall_risk_assessment: this.assessOverallRisk(doc1, doc2)
    };
  }

  public performObligationsAnalysis(doc1: string, doc2: string): any {
    return {
      doc1_obligations: this.extractObligations(doc1),
      doc2_obligations: this.extractObligations(doc2),
      obligations_comparison: this.compareObligations(doc1, doc2),
      party_responsibilities: this.analyzePartyResponsibilities(doc1, doc2)
    };
  }

  public performChoiceOfLawAnalysis(doc1: string, doc2: string): any {
    return {
      doc1_choice_of_law: this.extractChoiceOfLaw(doc1),
      doc2_choice_of_law: this.extractChoiceOfLaw(doc2),
      jurisdiction_comparison: this.compareJurisdiction(doc1, doc2),
      governing_law_implications: this.analyzeGoverningLawImplications(doc1, doc2)
    };
  }

  public performFinancialAnalysis(doc1: string, doc2: string): any {
    return {
      doc1_financial_terms: this.extractFinancialTerms(doc1),
      doc2_financial_terms: this.extractFinancialTerms(doc2),
      payment_terms_comparison: this.comparePaymentTerms(doc1, doc2),
      penalties_and_liabilities: this.analyzePenaltiesAndLiabilities(doc1, doc2)
    };
  }

  public performRightsAndRemediesAnalysis(doc1: string, doc2: string): any {
    return {
      doc1_rights_and_remedies: this.extractRightsAndRemedies(doc1),
      doc2_rights_and_remedies: this.extractRightsAndRemedies(doc2),
      remedies_comparison: this.compareRemedies(doc1, doc2),
      dispute_resolution: this.analyzeDisputeResolution(doc1, doc2)
    };
  }

  public performTermAndTerminationAnalysis(doc1: string, doc2: string): any {
    return {
      doc1_term_and_termination: this.extractTermAndTermination(doc1),
      doc2_term_and_termination: this.extractTermAndTermination(doc2),
      duration_comparison: this.compareContractDuration(doc1, doc2),
      termination_conditions: this.analyzeTerminationConditions(doc1, doc2)
    };
  }

  // ===== RISK ANALYSIS METHODS =====

  public identifyRisks(text: string): string[] {
    const risks: string[] = [];

    // Check for one-sided obligations
    if (this.hasOneSidedObligations(text)) {
      risks.push('Potentially one-sided obligations favoring one party');
    }

    // Check for unlimited liability
    if (this.hasUnlimitedLiability(text)) {
      risks.push('Unlimited liability exposure');
    }

    // Check for broad indemnification
    if (this.hasBroadIndemnification(text)) {
      risks.push('Broad indemnification requirements');
    }

    // Check for non-compete clauses
    if (this.hasNonCompete(text)) {
      risks.push('Restrictive non-compete provisions');
    }

    // Check for liquidated damages
    if (this.hasLiquidatedDamages(text)) {
      risks.push('High liquidated damages provisions');
    }

    // Check for unfavorable choice of law
    if (this.hasUnfavorableChoiceOfLaw(text)) {
      risks.push('Potentially unfavorable choice of law');
    }

    return risks;
  }

  public compareRisks(doc1: string, doc2: string): any {
    const risks1 = this.identifyRisks(doc1);
    const risks2 = this.identifyRisks(doc2);

    return {
      doc1_risk_count: risks1.length,
      doc2_risk_count: risks2.length,
      riskier_document: risks1.length > risks2.length ? 'Document 1' : risks1.length < risks2.length ? 'Document 2' : 'Similar risk levels',
      unique_risks_doc1: risks1.filter(r => !risks2.includes(r)),
      unique_risks_doc2: risks2.filter(r => !risks1.includes(r))
    };
  }

  public identifyTrapsForUnwary(doc1: string, doc2: string): string[] {
    const traps: string[] = [];

    // Compare liability limitations
    if (this.hasUnlimitedLiability(doc1) && !this.hasUnlimitedLiability(doc2)) {
      traps.push('Document 1 has unlimited liability while Document 2 limits it');
    }
    if (this.hasUnlimitedLiability(doc2) && !this.hasUnlimitedLiability(doc1)) {
      traps.push('Document 2 has unlimited liability while Document 1 limits it');
    }

    // Compare termination rights
    const term1 = this.extractTerminationRights(doc1);
    const term2 = this.extractTerminationRights(doc2);
    if (term1.length > term2.length) {
      traps.push('Document 1 has more termination rights for one party');
    }
    if (term2.length > term1.length) {
      traps.push('Document 2 has more termination rights for one party');
    }

    // Compare governing law
    const law1 = this.extractChoiceOfLaw(doc1);
    const law2 = this.extractChoiceOfLaw(doc2);
    if (law1 !== law2) {
      traps.push(`Different governing law: ${law1} vs ${law2} - may affect enforceability`);
    }

    return traps;
  }

  public assessOverallRisk(doc1: string, doc2: string): string {
    const risks1 = this.identifyRisks(doc1).length;
    const risks2 = this.identifyRisks(doc2).length;

    if (Math.abs(risks1 - risks2) <= 1) {
      return 'Similar risk profiles - both documents appear balanced';
    } else if (risks1 > risks2 + 2) {
      return 'Document 1 appears significantly riskier than Document 2';
    } else if (risks2 > risks1 + 2) {
      return 'Document 2 appears significantly riskier than Document 1';
    } else {
      return 'Minor risk differences between documents';
    }
  }

  // ===== OBLIGATIONS ANALYSIS METHODS =====

  public extractObligations(text: string): string[] {
    const obligations: string[] = [];
    const obligationPatterns = [
      /shall\s+([^.!?]+(?:provide|deliver|pay|perform|maintain|comply|notify|disclose|return|destroy|cooperate)[^.!?]*)/gi,
      /agrees?\s+to\s+([^.!?]+(?:provide|deliver|pay|perform|maintain|comply|notify|disclose|return|destroy|cooperate)[^.!?]*)/gi,
      /obligated?\s+to\s+([^.!?]+(?:provide|deliver|pay|perform|maintain|comply|notify|disclose|return|destroy|cooperate)[^.!?]*)/gi,
      /must\s+([^.!?]+(?:provide|deliver|pay|perform|maintain|comply|notify|disclose|return|destroy|cooperate)[^.!?]*)/gi,
      /required?\s+to\s+([^.!?]+(?:provide|deliver|pay|perform|maintain|comply|notify|disclose|return|destroy|cooperate)[^.!?]*)/gi
    ];

    obligationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        obligations.push(...matches.map(match => match.trim()));
      }
    });

    return [...new Set(obligations)]; // Remove duplicates
  }

  public compareObligations(doc1: string, doc2: string): any {
    const obl1 = this.extractObligations(doc1);
    const obl2 = this.extractObligations(doc2);

    return {
      doc1_obligation_count: obl1.length,
      doc2_obligation_count: obl2.length,
      common_obligations: this.findCommonObligations(obl1, obl2),
      unique_to_doc1: obl1.filter(o => !obl2.some(o2 => this.areObligationsSimilar(o, o2))),
      unique_to_doc2: obl2.filter(o => !obl1.some(o1 => this.areObligationsSimilar(o, o1)))
    };
  }

  public analyzePartyResponsibilities(doc1: string, doc2: string): any {
    const parties1 = this.extractParties(doc1);
    const parties2 = this.extractParties(doc2);
    const obl1 = this.extractObligations(doc1);
    const obl2 = this.extractObligations(doc2);

    return {
      doc1_party_analysis: this.analyzePartyObligations(parties1, obl1, doc1),
      doc2_party_analysis: this.analyzePartyObligations(parties2, obl2, doc2),
      responsibility_comparison: this.comparePartyResponsibilities(parties1, parties2, obl1, obl2)
    };
  }

  // ===== CHOICE OF LAW ANALYSIS METHODS =====

  public extractChoiceOfLaw(text: string): string {
    const patterns = [
      /governed\s+by\s+the\s+laws?\s+of\s+([^.!?\n]+)/i,
      /governing\s+law[:\s]+([^.!?\n]+)/i,
      /applicable\s+law[:\s]+([^.!?\n]+)/i,
      /laws?\s+of\s+([^.!?\n]+)\s+shall\s+govern/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Not specified';
  }

  public compareJurisdiction(doc1: string, doc2: string): any {
    const law1 = this.extractChoiceOfLaw(doc1);
    const law2 = this.extractChoiceOfLaw(doc2);

    return {
      doc1_governing_law: law1,
      doc2_governing_law: law2,
      same_jurisdiction: law1 === law2,
      jurisdiction_notes: this.analyzeJurisdictionDifferences(law1, law2)
    };
  }

  public analyzeGoverningLawImplications(doc1: string, doc2: string): string[] {
    const implications: string[] = [];
    const law1 = this.extractChoiceOfLaw(doc1);
    const law2 = this.extractChoiceOfLaw(doc2);

    if (law1 !== law2) {
      implications.push('Different governing law may affect interpretation and enforcement');
    }

    // Check for specific jurisdiction implications
    if (law1.includes('California') || law2.includes('California')) {
      implications.push('California law may provide stronger consumer/worker protections');
    }

    if (law1.includes('Delaware') || law2.includes('Delaware')) {
      implications.push('Delaware law is business-friendly for corporations');
    }

    if (law1.includes('New York') || law2.includes('New York')) {
      implications.push('New York law has extensive commercial precedent');
    }

    return implications;
  }

  // ===== FINANCIAL ANALYSIS METHODS =====

  public extractFinancialTerms(text: string): any {
    return {
      payment_amounts: this.extractMonetaryAmounts(text),
      payment_schedule: this.extractPaymentSchedule(text),
      penalties: this.extractPenalties(text),
      currency: this.detectCurrency(text)
    };
  }

  public comparePaymentTerms(doc1: string, doc2: string): any {
    const fin1 = this.extractFinancialTerms(doc1);
    const fin2 = this.extractFinancialTerms(doc2);

    return {
      payment_comparison: this.compareMonetaryAmounts(fin1.payment_amounts, fin2.payment_amounts),
      schedule_comparison: this.comparePaymentSchedules(fin1.payment_schedule, fin2.payment_schedule),
      penalty_comparison: this.comparePenalties(fin1.penalties, fin2.penalties)
    };
  }

  public analyzePenaltiesAndLiabilities(doc1: string, doc2: string): any {
    const penalties1 = this.extractPenalties(doc1);
    const penalties2 = this.extractPenalties(doc2);

    return {
      doc1_penalties: penalties1,
      doc2_penalties: penalties2,
      penalty_severity_comparison: this.comparePenaltySeverity(penalties1, penalties2),
      liability_limitations: this.compareLiabilityLimitations(doc1, doc2)
    };
  }

  // ===== RIGHTS AND REMEDIES ANALYSIS METHODS =====

  public extractRightsAndRemedies(text: string): any {
    return {
      termination_rights: this.extractTerminationRights(text),
      remedies: this.extractRemedies(text),
      dispute_resolution: this.extractDisputeResolution(text)
    };
  }

  public compareRemedies(doc1: string, doc2: string): any {
    const rem1 = this.extractRightsAndRemedies(doc1);
    const rem2 = this.extractRightsAndRemedies(doc2);

    return {
      termination_rights_comparison: this.compareTerminationRights(rem1.termination_rights, rem2.termination_rights),
      remedies_comparison: this.compareRemediesLists(rem1.remedies, rem2.remedies),
      dispute_resolution_comparison: this.compareDisputeResolution(rem1.dispute_resolution, rem2.dispute_resolution)
    };
  }

  public analyzeDisputeResolution(doc1: string, doc2: string): any {
    const disp1 = this.extractDisputeResolution(doc1);
    const disp2 = this.extractDisputeResolution(doc2);

    return {
      doc1_dispute_mechanism: disp1,
      doc2_dispute_mechanism: disp2,
      dispute_resolution_notes: this.compareDisputeMechanisms(disp1, disp2)
    };
  }

  // ===== TERM AND TERMINATION ANALYSIS METHODS =====

  public extractTermAndTermination(text: string): any {
    return {
      duration: this.extractContractDuration(text),
      termination_conditions: this.extractTerminationConditions(text),
      renewal_terms: this.extractRenewalTerms(text)
    };
  }

  public compareContractDuration(doc1: string, doc2: string): any {
    const term1 = this.extractTermAndTermination(doc1);
    const term2 = this.extractTermAndTermination(doc2);

    return {
      doc1_duration: term1.duration,
      doc2_duration: term2.duration,
      duration_comparison: this.compareDurations(term1.duration, term2.duration)
    };
  }

  public analyzeTerminationConditions(doc1: string, doc2: string): any {
    const term1 = this.extractTermAndTermination(doc1);
    const term2 = this.extractTermAndTermination(doc2);

    return {
      doc1_termination: term1.termination_conditions,
      doc2_termination: term2.termination_conditions,
      termination_analysis: this.compareTerminationConditions(term1.termination_conditions, term2.termination_conditions)
    };
  }

  // ===== HELPER METHODS =====

  public hasOneSidedObligations(text: string): boolean {
    const shallCount = (text.match(/shall/gi) || []).length;
    const agreesCount = (text.match(/agrees?\s+to/gi) || []).length;
    return Math.abs(shallCount - agreesCount) > 3; // Significant imbalance
  }

  public hasUnlimitedLiability(text: string): boolean {
    return /unlimited\s+liability|full\s+liability|all\s+liabilit/i.test(text);
  }

  public hasBroadIndemnification(text: string): boolean {
    return /indemnif.*any.*loss|indemnif.*all.*claim|indemnif.*third.*part/i.test(text);
  }

  public hasNonCompete(text: string): boolean {
    return /non.?compete|non.?competition|restrictive\s+covenant/i.test(text);
  }

  public hasLiquidatedDamages(text: string): boolean {
    return /liquidated\s+damages|specified\s+damages/i.test(text);
  }

  public hasUnfavorableChoiceOfLaw(text: string): boolean {
    // Check for choice of law clauses that may be unfavorable
    // Unfavorable typically means: foreign jurisdiction, distant venue, or known unfavorable precedent
    const choiceOfLawPattern = /choice\s+of\s+law|governing\s+law|applicable\s+law/i;
    const hasChoiceOfLaw = choiceOfLawPattern.test(text);
    
    if (!hasChoiceOfLaw) return false;
    
    // Check for potentially unfavorable indicators
    const unfavorableIndicators = [
      /jurisdiction\s+of\s+[A-Z][a-z]+\s+state/i, // Specific state mentioned
      /venue\s+in\s+[A-Z][a-z]+/i,
      /laws\s+of\s+[A-Z][a-z]+/i,
    ];
    
    // If choice of law exists but no specific jurisdiction mentioned, 
    // it's likely default (usually favorable to drafter)
    const hasSpecificJurisdiction = unfavorableIndicators.some(pattern => pattern.test(text));
    
    // Return true if choice of law exists with specific jurisdiction
    // (specific jurisdiction may be unfavorable depending on context)
    return hasSpecificJurisdiction;
  }

  public findCommonObligations(obl1: string[], obl2: string[]): string[] {
    return obl1.filter(o1 => obl2.some(o2 => this.areObligationsSimilar(o1, o2)));
  }

  public areObligationsSimilar(obl1: string, obl2: string): boolean {
    // Simple similarity check - could be enhanced with NLP
    const words1 = obl1.toLowerCase().split(/\s+/);
    const words2 = obl2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    return commonWords.length >= 3; // At least 3 common words
  }

  public analyzePartyObligations(parties: string[], obligations: string[], text: string): any {
    // This would analyze which obligations belong to which parties
    return {
      parties_identified: parties,
      total_obligations: obligations.length,
      obligations_per_party: 'Analysis would require more sophisticated NLP'
    };
  }

  public comparePartyResponsibilities(parties1: string[], parties2: string[], obl1: string[], obl2: string[]): string {
    if (obl1.length > obl2.length + 2) {
      return 'Document 1 has significantly more obligations than Document 2';
    } else if (obl2.length > obl1.length + 2) {
      return 'Document 2 has significantly more obligations than Document 1';
    } else {
      return 'Similar obligation levels in both documents';
    }
  }

  public analyzeJurisdictionDifferences(law1: string, law2: string): string[] {
    const notes: string[] = [];

    if (law1 === 'Not specified' || law2 === 'Not specified') {
      notes.push('One or both documents lack governing law specification');
    }

    if (law1 !== law2) {
      notes.push('Different jurisdictions may lead to different interpretations');
    }

    return notes;
  }

  public extractMonetaryAmounts(text: string): number[] {
    const amountPattern = /\$[\d,]+(?:\.\d{2})?/g;
    const matches = text.match(amountPattern) || [];
    return matches.map(match => parseFloat(match.replace(/[$,]/g, '')));
  }

  public extractPaymentSchedule(text: string): string {
    const patterns = [
      /payment.*(?:monthly|quarterly|annually|upon|within|after)/i,
      /due.*(?:immediately|receipt|completion|delivery)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'Not specified';
  }

  public extractPenalties(text: string): string[] {
    const penalties: string[] = [];
    const patterns = [
      /late.*fee|penalty.*payment|liquidated.*damage/i,
      /interest.*rate.*default|default.*interest/i,
      /per\s+day.*late|daily.*penalty/i
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        penalties.push(...matches);
      }
    });

    return penalties;
  }

  public detectCurrency(text: string): string {
    if (text.includes('$')) return 'USD';
    if (text.includes('€')) return 'EUR';
    if (text.includes('£')) return 'GBP';
    return 'Not specified';
  }

  public compareMonetaryAmounts(amounts1: number[], amounts2: number[]): string {
    const sum1 = amounts1.reduce((a, b) => a + b, 0);
    const sum2 = amounts2.reduce((a, b) => a + b, 0);

    if (Math.abs(sum1 - sum2) < 1000) {
      return 'Similar monetary amounts';
    } else if (sum1 > sum2) {
      return `Document 1 has higher amounts ($${sum1} vs $${sum2})`;
    } else {
      return `Document 2 has higher amounts ($${sum2} vs $${sum1})`;
    }
  }

  public comparePaymentSchedules(schedule1: string, schedule2: string): string {
    if (schedule1 === schedule2) {
      return 'Same payment schedule';
    } else {
      return `Different schedules: "${schedule1}" vs "${schedule2}"`;
    }
  }

  public comparePenalties(penalties1: string[], penalties2: string[]): string {
    if (penalties1.length > penalties2.length) {
      return 'Document 1 has more penalty provisions';
    } else if (penalties2.length > penalties1.length) {
      return 'Document 2 has more penalty provisions';
    } else {
      return 'Similar penalty structures';
    }
  }

  public comparePenaltySeverity(penalties1: string[], penalties2: string[]): string {
    // Simple severity analysis
    const severeTerms = ['liquidated', 'daily', 'per day', 'interest'];
    const severity1 = penalties1.filter(p => severeTerms.some(term => p.includes(term))).length;
    const severity2 = penalties2.filter(p => severeTerms.some(term => p.includes(term))).length;

    if (severity1 > severity2) {
      return 'Document 1 has more severe penalty terms';
    } else if (severity2 > severity1) {
      return 'Document 2 has more severe penalty terms';
    } else {
      return 'Similar penalty severity';
    }
  }

  public compareLiabilityLimitations(doc1: string, doc2: string): any {
    const limit1 = this.extractLiabilityLimitations(doc1);
    const limit2 = this.extractLiabilityLimitations(doc2);

    return {
      doc1_limitations: limit1,
      doc2_limitations: limit2,
      comparison: limit1 === limit2 ? 'Same limitations' : 'Different liability approaches'
    };
  }

  public extractLiabilityLimitations(text: string): string {
    const patterns = [
      /liability.*limited.*to/i,
      /maximum.*liability/i,
      /not.*exceed.*amount/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'No explicit limitations found';
  }

  public extractTerminationRights(text: string): string[] {
    const rights: string[] = [];
    const patterns = [
      /may\s+terminate|right\s+to\s+terminate|terminate\s+for\s+cause/i,
      /terminate\s+immediately|terminate\s+upon\s+notice/i
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        rights.push(...matches);
      }
    });

    return rights;
  }

  public extractRemedies(text: string): string[] {
    const remedies: string[] = [];
    const patterns = [
      /seek\s+injunctive|injunctive\s+relief/i,
      /specific\s+performance/i,
      /monetary\s+damages|compensatory\s+damages/i,
      /liquidated\s+damages/i
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        remedies.push(...matches);
      }
    });

    return remedies;
  }

  public extractDisputeResolution(text: string): string {
    if (/arbitration|arbitrator/i.test(text)) {
      return 'Arbitration';
    } else if (/mediation/i.test(text)) {
      return 'Mediation';
    } else if (/litigation|court|lawsuit/i.test(text)) {
      return 'Litigation';
    } else {
      return 'Not specified';
    }
  }

  public extractContractDuration(text: string): string {
    const patterns = [
      /term.*\d+.*year|duration.*\d+.*year/i,
      /effective.*until|end.*\d{1,2}\/\d{1,2}\/\d{4}/i,
      /month.*term|annual.*term/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'Not specified';
  }

  public extractTerminationConditions(text: string): string[] {
    const conditions: string[] = [];
    const patterns = [
      /terminate.*breach|terminate.*default/i,
      /terminate.*immediately|terminate.*cause/i,
      /notice.*period.*termination/i
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        conditions.push(...matches);
      }
    });

    return conditions;
  }

  public extractRenewalTerms(text: string): string {
    const patterns = [
      /renew.*automatically|auto.*renew/i,
      /renewal.*notice|renewal.*term/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'Not specified';
  }

  public compareTerminationRights(rights1: string[], rights2: string[]): string {
    if (rights1.length > rights2.length) {
      return 'Document 1 provides more termination rights';
    } else if (rights2.length > rights1.length) {
      return 'Document 2 provides more termination rights';
    } else {
      return 'Similar termination rights';
    }
  }

  public compareRemediesLists(remedies1: string[], remedies2: string[]): string {
    if (remedies1.length > remedies2.length) {
      return 'Document 1 provides more remedies';
    } else if (remedies2.length > remedies1.length) {
      return 'Document 2 provides more remedies';
    } else {
      return 'Similar remedy structures';
    }
  }

  public compareDisputeResolution(disp1: string, disp2: string): string {
    if (disp1 === disp2) {
      return 'Same dispute resolution mechanism';
    } else {
      return `Different approaches: ${disp1} vs ${disp2}`;
    }
  }

  public compareDisputeMechanisms(disp1: string, disp2: string): string {
    if (disp1 === disp2) {
      return 'Same dispute resolution mechanism';
    } else {
      return `Different approaches: ${disp1} vs ${disp2}`;
    }
  }

  public compareDurations(dur1: string, dur2: string): string {
    if (dur1 === dur2) {
      return 'Same contract duration';
    } else {
      return `Different durations: "${dur1}" vs "${dur2}"`;
    }
  }

  public compareTerminationConditions(cond1: string[], cond2: string[]): string {
    if (cond1.length > cond2.length) {
      return 'Document 1 has more termination conditions';
    } else if (cond2.length > cond1.length) {
      return 'Document 2 has more termination conditions';
    } else {
      return 'Similar termination structures';
    }
  }
})();
