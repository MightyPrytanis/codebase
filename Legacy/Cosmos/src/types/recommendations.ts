export interface NextActionRecommendation {
  partnerId: string;
  partnerName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'follow_up' | 'risk_mitigation' | 'opportunity' | 'compliance' | 'performance';
  action: string;
  reasoning: string;
  expectedOutcome: string;
  timeframe: string;
  estimatedROI?: string;
  contactInfo?: {
    method: string;
    details: string;
  };
}

export interface AnalysisRequest {
  partnerId?: string;
  timeframe?: 'immediate' | 'this_week' | 'this_month';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  category?: string;
  limit?: number;
}
