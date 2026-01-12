import OpenAI from 'openai';
import { Partner } from '../types/partner';
import { NextActionRecommendation } from '../types/recommendations';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'fallback_key'
    });
  }

  async generateRecommendations(partner: Partner): Promise<NextActionRecommendation[]> {
    const systemPrompt = `You are an expert mortgage industry relationship manager AI. Analyze partner data and provide specific, actionable recommendations for improving business relationships and outcomes.

Focus on:
- Revenue optimization opportunities
- Risk mitigation strategies  
- Compliance management
- Relationship strengthening
- Performance improvement

Provide practical, specific actions with clear business reasoning. Return your response as a JSON array of recommendation objects with these fields:
- priority: "urgent" | "high" | "medium" | "low"
- category: "follow_up" | "risk_mitigation" | "opportunity" | "compliance" | "performance"
- action: string (specific action to take)
- reasoning: string (why this action is needed)
- expectedOutcome: string (what result to expect)
- timeframe: string (when to complete)
- estimatedROI: string (optional, financial impact)`;

    const partnerContext = `
Partner: ${partner.name} (${partner.type})
Status: ${partner.status}

Performance Metrics:
- Monthly Volume: $${partner.metrics.monthlyLoanVolume.toLocaleString()}
- Loan Count: ${partner.metrics.loanCount}
- Wallet Share: ${partner.metrics.walletShare}%
- Days Since Contact: ${partner.metrics.daysSinceLastContact}
- Response Rate: ${partner.metrics.responseRate}%

Compliance:
- License Status: ${partner.compliance.licenseStatus}
- Risk Level: ${partner.compliance.riskLevel}
- Audit Score: ${partner.compliance.auditScore}/100

Performance:
- Closing Rate: ${partner.performance.closingRate}%
- Avg Closing Time: ${partner.performance.averageClosingTime} days
- Customer Satisfaction: ${partner.performance.customerSatisfactionScore}/10
- Trend: ${partner.performance.trendDirection}

Contact: ${partner.contact.primaryContact} (${partner.contact.preferredContactMethod})
`;

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this partner and provide 2-3 specific next action recommendations:\n\n${partnerContext}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      };

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      const parsedResponse = JSON.parse(aiResponse);
      return this.structureRecommendations(parsedResponse, partner);
     catch (error) {
      console.error('AI service error:', error);
      return this.generateFallbackRecommendations(partner);
    }

  private structureRecommendations(aiResponse: any, partner: Partner): NextActionRecommendation[] {
    const recommendations: NextActionRecommendation[] = [];
    
    // Handle both array and object responses from AI
    const aiRecs = Array.isArray(aiResponse) ? aiResponse : 
                   aiResponse.recommendations || [aiResponse];

    for (const rec of aiRecs) {
      recommendations.push({
        partnerId: partner.id,
        partnerName: partner.name,
        priority: rec.priority || this.determinePriority(partner),
        category: rec.category || this.determineCategory(partner),
        action: rec.action || 'Review partner relationship',
        reasoning: rec.reasoning || 'Regular partner maintenance',
        expectedOutcome: rec.expectedOutcome || 'Maintain partner engagement',
        timeframe: rec.timeframe || 'This week',
        estimatedROI: rec.estimatedROI,
        contactInfo: {
          method: partner.contact.preferredContactMethod,
          details: partner.contact.preferredContactMethod === 'email' ? 
                   partner.contact.email : partner.contact.phone
        }
      });
    }

    return recommendations;
  }

  private determinePriority(partner: Partner): 'urgent' | 'high' | 'medium' | 'low' {
    if (partner.status === 'at_risk' || 
        partner.compliance.licenseStatus === 'expiring' ||
        partner.metrics.daysSinceLastContact > 21) {
      return 'urgent';
    }
    if (partner.performance.trendDirection === 'declining' ||
        partner.metrics.daysSinceLastContact > 14) {
      return 'high';
    }
    if (partner.metrics.walletShare < 20 ||
        partner.metrics.responseRate < 60) {
      return 'medium';
    }
    return 'low';
  }

  private determineCategory(partner: Partner): 'follow_up' | 'risk_mitigation' | 'opportunity' | 'compliance' | 'performance' {
    if (partner.status === 'at_risk') return 'risk_mitigation';
    if (partner.compliance.licenseStatus === 'expiring') return 'compliance';
    if (partner.performance.trendDirection === 'declining') return 'performance';
    if (partner.metrics.walletShare < 30 && partner.performance.closingRate > 75) return 'opportunity';
    return 'follow_up';
  }

  private generateFallbackRecommendations(partner: Partner): NextActionRecommendation[] {
    const recommendations: NextActionRecommendation[] = [];

    // Generate rule-based recommendations as fallback
    if (partner.status === 'at_risk') {
      recommendations.push({
        partnerId: partner.id,
        partnerName: partner.name,
        priority: 'urgent',
        category: 'risk_mitigation',
        action: `Immediate call to ${partner.contact.primaryContact}`,
        reasoning: `Partner hasn't been contacted in ${partner.metrics.daysSinceLastContact} days and shows declining performance`,
        expectedOutcome: 'Understand concerns and develop retention strategy',
        timeframe: 'Within 24 hours',
        contactInfo: {
          method: partner.contact.preferredContactMethod,
          details: partner.contact.phone
        }
      });
    }

    if (partner.compliance.licenseStatus === 'expiring') {
      recommendations.push({
        partnerId: partner.id,
        partnerName: partner.name,
        priority: 'high',
        category: 'compliance',
        action: 'License renewal reminder and assistance',
        reasoning: `License expires on ${partner.compliance.licenseExpiryDate}`,
        expectedOutcome: 'Ensure compliance continuity and avoid business disruption',
        timeframe: 'This week'
      });
    }

    if (partner.metrics.walletShare < 30 && partner.performance.trendDirection === 'improving') {
      recommendations.push({
        partnerId: partner.id,
        partnerName: partner.name,
        priority: 'medium',
        category: 'opportunity',
        action: 'Propose expanded partnership terms',
        reasoning: `Strong performance (${partner.performance.closingRate}% closing rate) but low wallet share`,
        expectedOutcome: `Increase wallet share from ${partner.metrics.walletShare}% to 40%+`,
        timeframe: 'Next 2 weeks',
        estimatedROI: '$50,000 additional monthly revenue'
      });
    }

    // Always provide at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        partnerId: partner.id,
        partnerName: partner.name,
        priority: 'medium',
        category: 'follow_up',
        action: 'Standard partner check-in',
        reasoning: 'Regular relationship maintenance',
        expectedOutcome: 'Maintain partner engagement',
        timeframe: 'This week'
      });
    }

    return recommendations;

}
}
)
}