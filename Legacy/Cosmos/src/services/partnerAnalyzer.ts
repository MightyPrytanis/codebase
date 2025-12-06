import { Partner } from '../types/partner';
import { NextActionRecommendation, AnalysisRequest } from '../types/recommendations';
import { DataService } from './dataService';
import { AIService } from './aiService';

export class PartnerAnalyzer {
  private dataService: DataService;
  private aiService: AIService;

  constructor() {
    this.dataService = new DataService();
    this.aiService = new AIService();
  }

  /**
   * Get next action recommendations for a specific partner
   */
  async getNextActions(partnerId: string): Promise<NextActionRecommendation[]> {
    const partner = await this.dataService.getPartnerById(partnerId);
    
    if (!partner) {
      throw new Error(`Partner with ID ${partnerId} not found`);
    }

    return await this.aiService.generateRecommendations(partner);
  }

  /**
   * Get prioritized recommendations across all partners
   */
  async getAllRecommendations(request: AnalysisRequest = {}): Promise<NextActionRecommendation[]> {
    const partners = await this.getFilteredPartners(request);
    const allRecommendations: NextActionRecommendation[] = [];

    for (const partner of partners) {
      try {
        const recommendations = await this.aiService.generateRecommendations(partner);
        allRecommendations.push(...recommendations);
      } catch (error) {
        console.error(`Error generating recommendations for partner ${partner.id}:`, error);
        // Continue with other partners even if one fails
      }
    }

    // Sort by priority and apply filters
    const filteredRecs = this.filterRecommendations(allRecommendations, request);
    return this.sortRecommendationsByPriority(filteredRecs);
  }

  /**
   * Get urgent recommendations that need immediate attention
   */
  async getUrgentRecommendations(): Promise<NextActionRecommendation[]> {
    const partners = await this.dataService.getPartnersNeedingAttention();
    const urgentRecommendations: NextActionRecommendation[] = [];

    for (const partner of partners) {
      try {
        const recommendations = await this.aiService.generateRecommendations(partner);
        const urgent = recommendations.filter(rec => rec.priority === 'urgent');
        urgentRecommendations.push(...urgent);
      } catch (error) {
        console.error(`Error generating urgent recommendations for partner ${partner.id}:`, error);
      }
    }

    return this.sortRecommendationsByPriority(urgentRecommendations);
  }

  /**
   * Analyze partner health and generate summary metrics
   */
  async analyzePartnerHealth(): Promise<{
    totalPartners: number;
    activePartners: number;
    atRiskPartners: number;
    highValuePartners: number;
    complianceIssues: number;
    averageWalletShare: number;
    totalMonthlyVolume: number;
  }> {
    const allPartners = await this.dataService.getAllPartners();
    const atRiskPartners = await this.dataService.getPartnersByStatus('at_risk');
    const highValuePartners = await this.dataService.getHighValuePartners();

    const complianceIssues = allPartners.filter(p => 
      p.compliance.licenseStatus === 'expiring' || 
      p.compliance.riskLevel === 'high'
    ).length;

    const totalWalletShare = allPartners.reduce((sum, p) => sum + p.metrics.walletShare, 0);
    const averageWalletShare = totalWalletShare / allPartners.length;

    const totalMonthlyVolume = allPartners.reduce((sum, p) => sum + p.metrics.monthlyLoanVolume, 0);

    return {
      totalPartners: allPartners.length,
      activePartners: allPartners.filter(p => p.status === 'active').length,
      atRiskPartners: atRiskPartners.length,
      highValuePartners: highValuePartners.length,
      complianceIssues,
      averageWalletShare: Math.round(averageWalletShare * 100) / 100,
      totalMonthlyVolume
    };
  }

  private async getFilteredPartners(request: AnalysisRequest): Promise<Partner[]> {
    let partners = await this.dataService.getAllPartners();

    if (request.partnerId) {
      const partner = await this.dataService.getPartnerById(request.partnerId);
      return partner ? [partner] : [];
    }

    // Apply additional filters based on timeframe and priority
    if (request.timeframe === 'immediate') {
      partners = await this.dataService.getPartnersNeedingAttention();
    }

    return partners;
  }

  private filterRecommendations(
    recommendations: NextActionRecommendation[], 
    request: AnalysisRequest
  ): NextActionRecommendation[] {
    let filtered = recommendations;

    if (request.priority) {
      filtered = filtered.filter(rec => rec.priority === request.priority);
    }

    if (request.category) {
      filtered = filtered.filter(rec => rec.category === request.category);
    }

    if (request.limit) {
      filtered = filtered.slice(0, request.limit);
    }

    return filtered;
  }

  private sortRecommendationsByPriority(recommendations: NextActionRecommendation[]): NextActionRecommendation[] {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    return recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by partner name for consistency
      return a.partnerName.localeCompare(b.partnerName);
    });
  }
}
