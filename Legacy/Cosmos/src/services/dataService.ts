import { Partner } from '../types/partner';
import { samplePartners } from '../data/samplePartners';

export class DataService {
  private partners: Partner[] = samplePartners;

  /**
   * Get all partners
   */
  async getAllPartners(): Promise<Partner[]> {
    return this.partners;
  }

  /**
   * Get partner by ID
   */
  async getPartnerById(id: string): Promise<Partner | undefined> {
    return this.partners.find(partner => partner.id === id);
  }

  /**
   * Get partners by status
   */
  async getPartnersByStatus(status: Partner['status']): Promise<Partner[]> {
    return this.partners.filter(partner => partner.status === status);
  }

  /**
   * Get partners by type
   */
  async getPartnersByType(type: Partner['type']): Promise<Partner[]> {
    return this.partners.filter(partner => partner.type === type);
  }

  /**
   * Get partners requiring immediate attention
   */
  async getPartnersNeedingAttention(): Promise<Partner[]> {
    return this.partners.filter(partner => 
      partner.status === 'at_risk' ||
      partner.compliance.licenseStatus === 'expiring' ||
      partner.metrics.daysSinceLastContact > 14 ||
      partner.performance.trendDirection === 'declining'
    );
  }

  /**
   * Get high-value partners (top performers)
   */
  async getHighValuePartners(): Promise<Partner[]> {
    return this.partners.filter(partner => 
      partner.metrics.monthlyLoanVolume > 2000000 ||
      partner.metrics.walletShare > 30 ||
      partner.performance.closingRate > 80
    );
  }

  /**
   * Search partners by name
   */
  async searchPartners(query: string): Promise<Partner[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.partners.filter(partner => 
      partner.name.toLowerCase().includes(lowercaseQuery) ||
      partner.contact.primaryContact.toLowerCase().includes(lowercaseQuery)
    );
  }
}
