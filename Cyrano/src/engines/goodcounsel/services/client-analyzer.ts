/**
 * Client Analyzer Service
 * 
 * Adapted from Legacy/Cosmos/src/services/partnerAnalyzer.ts
 * Analyzes client relationships and generates wellness/ethics recommendations
 * for GoodCounsel engine.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface Client {
  id: string;
  name: string;
  email?: string;
  status: 'active' | 'inactive' | 'at_risk';
  lastContact?: Date;
  nextReviewDate?: Date;
  wellnessMetrics?: {
    overallScore: number; // 0-100
    stressLevel: number; // 0-100
    workLifeBalance: number; // 0-100
    billableHoursThisWeek: number;
  };
  ethicsCompliance?: {
    lastReview: Date;
    violations: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  habitCurb?: {
    activeAlerts: number;
    concernedHabits: string[];
  };
}

export interface ClientRecommendation {
  userId: string;
  userName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'wellness_check' | 'ethics_review' | 'client_followup' | 'self_care' | 
            'habit_alert' | 'professional_development' | 'work_life_balance';
  action: string;
  reasoning: string;
  expectedOutcome: string;
  timeframe: 'immediate' | 'this_week' | 'this_month';
  ethicsRule?: string; // Relevant ethics rule citation
  wellnessImpact?: number; // Expected wellness score improvement
  contactInfo?: {
    preferredMethod: string;
    availability: string;
  };
}

export interface AnalysisRequest {
  userId?: string;
  timeframe?: 'immediate' | 'this_week' | 'this_month';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  category?: string;
  limit?: number;
}

/**
 * Client Analyzer
 * 
 * Analyzes client relationships and generates recommendations for attorney wellness,
 * ethics compliance, and professional development.
 */
export class ClientAnalyzer {
  /**
   * Get recommendations for a specific user/client
   */
  async getNextActions(userId: string): Promise<ClientRecommendation[]> {
    // TODO: Replace with actual data service call
    const client = await this.getClientById(userId);
    
    if (!client) {
      throw new Error(`Client with ID ${userId} not found`);
    }

    return await this.generateRecommendations(client);
  }

  /**
   * Get prioritized recommendations across all clients
   */
  async getAllRecommendations(request: AnalysisRequest = {}): Promise<ClientRecommendation[]> {
    const clients = await this.getFilteredClients(request);
    const allRecommendations: ClientRecommendation[] = [];

    for (const client of clients) {
      try {
        const recommendations = await this.generateRecommendations(client);
        allRecommendations.push(...recommendations);
      } catch (error) {
        console.error(`Error generating recommendations for client ${client.id}:`, error);
        // Continue with other clients even if one fails
      }
    }

    // Sort by priority and apply filters
    const filteredRecs = this.filterRecommendations(allRecommendations, request);
    return this.sortRecommendationsByPriority(filteredRecs);
  }

  /**
   * Get urgent recommendations that need immediate attention
   */
  async getUrgentRecommendations(): Promise<ClientRecommendation[]> {
    const clients = await this.getClientsNeedingAttention();
    const urgentRecommendations: ClientRecommendation[] = [];

    for (const client of clients) {
      try {
        const recommendations = await this.generateRecommendations(client);
        const urgent = recommendations.filter(rec => rec.priority === 'urgent');
        urgentRecommendations.push(...urgent);
      } catch (error) {
        console.error(`Error generating urgent recommendations for client ${client.id}:`, error);
      }
    }

    return this.sortRecommendationsByPriority(urgentRecommendations);
  }

  /**
   * Generate recommendations for a client
   * 
   * This is the core AI-powered recommendation generation logic,
   * adapted from Cosmos's partner analysis pattern.
   */
  private async generateRecommendations(client: Client): Promise<ClientRecommendation[]> {
    const recommendations: ClientRecommendation[] = [];

    // Check for overdue client follow-ups
    if (client.lastContact) {
      const daysSinceContact = Math.floor(
        (Date.now() - client.lastContact.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceContact > 14) {
        recommendations.push({
          userId: client.id,
          userName: client.name,
          priority: daysSinceContact > 30 ? 'urgent' : 'high',
          category: 'client_followup',
          action: `Follow up with ${client.name} - no contact in ${daysSinceContact} days`,
          reasoning: `Maintaining regular client communication is essential for relationship management and can prevent issues from escalating.`,
          expectedOutcome: 'Strengthened client relationship, early issue detection',
          timeframe: daysSinceContact > 30 ? 'immediate' : 'this_week',
          contactInfo: client.email ? {
            preferredMethod: 'email',
            availability: 'Business hours',
          } : undefined,
        });
      }
    }

    // Check wellness metrics
    if (client.wellnessMetrics) {
      if (client.wellnessMetrics.overallScore < 50) {
        recommendations.push({
          userId: client.id,
          userName: client.name,
          priority: 'urgent',
          category: 'wellness_check',
          action: 'Schedule wellness check-in',
          reasoning: `Wellness score is critically low (${client.wellnessMetrics.overallScore}/100). Immediate attention needed.`,
          expectedOutcome: 'Improved wellness metrics, reduced burnout risk',
          timeframe: 'immediate',
          wellnessImpact: 20,
        });
      }

      if (client.wellnessMetrics.billableHoursThisWeek > 60) {
        recommendations.push({
          userId: client.id,
          userName: client.name,
          priority: 'high',
          category: 'work_life_balance',
          action: 'Review workload and consider delegation',
          reasoning: `High billable hours (${client.wellnessMetrics.billableHoursThisWeek}h) may indicate overwork.`,
          expectedOutcome: 'Better work-life balance, reduced stress',
          timeframe: 'this_week',
          wellnessImpact: 15,
        });
      }
    }

    // Check ethics compliance
    if (client.ethicsCompliance) {
      if (client.ethicsCompliance.riskLevel === 'high' || client.ethicsCompliance.violations > 0) {
        recommendations.push({
          userId: client.id,
          userName: client.name,
          priority: 'urgent',
          category: 'ethics_review',
          action: 'Conduct ethics compliance review',
          reasoning: `Ethics risk level is ${client.ethicsCompliance.riskLevel} with ${client.ethicsCompliance.violations} violations.`,
          expectedOutcome: 'Improved ethics compliance, reduced risk',
          timeframe: 'immediate',
          ethicsRule: 'ABA Model Rules 1.1, 1.3 (Competence and Diligence)',
        });
      }
    }

    // Check habit alerts
    if (client.habitCurb && client.habitCurb.activeAlerts > 0) {
      recommendations.push({
        userId: client.id,
        userName: client.name,
        priority: 'high',
        category: 'habit_alert',
        action: `Address ${client.habitCurb.activeAlerts} active habit alert(s)`,
        reasoning: `Habit patterns detected: ${client.habitCurb.concernedHabits.join(', ')}`,
        expectedOutcome: 'Improved habit patterns, better wellness',
        timeframe: 'this_week',
        wellnessImpact: 10,
      });
    }

    // Check for upcoming review dates
    if (client.nextReviewDate) {
      const daysUntilReview = Math.floor(
        (client.nextReviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilReview <= 7 && daysUntilReview >= 0) {
        recommendations.push({
          userId: client.id,
          userName: client.name,
          priority: 'medium',
          category: 'professional_development',
          action: `Prepare for upcoming review (${daysUntilReview} days)`,
          reasoning: 'Upcoming review date requires preparation',
          expectedOutcome: 'Successful review, continued professional growth',
          timeframe: 'this_week',
        });
      }
    }

    return recommendations;
  }

  /**
   * Get filtered clients based on request
   */
  private async getFilteredClients(request: AnalysisRequest): Promise<Client[]> {
    // TODO: Replace with actual data service call
    let clients = await this.getAllClients();

    if (request.userId) {
      const client = await this.getClientById(request.userId);
      return client ? [client] : [];
    }

    // Apply additional filters
    if (request.timeframe === 'immediate') {
      clients = await this.getClientsNeedingAttention();
    }

    return clients;
  }

  /**
   * Filter recommendations based on request
   */
  private filterRecommendations(
    recommendations: ClientRecommendation[],
    request: AnalysisRequest
  ): ClientRecommendation[] {
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

  /**
   * Sort recommendations by priority
   */
  private sortRecommendationsByPriority(
    recommendations: ClientRecommendation[]
  ): ClientRecommendation[] {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    return recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by user name for consistency
      return a.userName.localeCompare(b.userName);
    });
  }

  // Data service implementations - integrate with Clio or other practice management system
  private async getClientById(userId: string): Promise<Client | null> {
    // Try Clio integration first if available
    if (process.env.CLIO_API_KEY) {
      try {
        const { clioIntegration } = await import('../../../tools/clio-integration.js');
        const result = await clioIntegration.execute({
          action: 'get_client_info',
          client_id: userId,
          parameters: {},
        });
        
        if (!result.isError && result.content?.[0]?.text) {
          const text = result.content[0].text;
          if (typeof text === 'string') {
            const clientData = JSON.parse(text);
            return this.mapClioClientToClient(clientData);
          }
        }
      } catch (error) {
        console.warn('Clio client lookup failed:', error);
      }
    }
    
    // Fallback: return null if no data service available
    // In production, this would integrate with database or other data source
    return null;
  }

  private async getAllClients(): Promise<Client[]> {
    // Try Clio integration first if available
    if (process.env.CLIO_API_KEY) {
      try {
        const { clioIntegration } = await import('../../../tools/clio-integration.js');
        const result = await clioIntegration.execute({
          action: 'search_matters',
          parameters: {
            limit: '100',
          } as Record<string, any>,
        });
        
        if (!result.isError && result.content?.[0]?.text) {
          const text = result.content[0].text;
          if (typeof text === 'string') {
            const data = JSON.parse(text);
            const matters = data.matters || [];
            // Extract unique clients from matters
            const clientMap = new Map<string, any>();
            matters.forEach((matter: any) => {
              if (matter.client?.id && !clientMap.has(matter.client.id)) {
                clientMap.set(matter.client.id, this.mapClioClientToClient(matter.client));
              }
            });
            return Array.from(clientMap.values());
          }
        }
      } catch (error) {
        console.warn('Clio client search failed:', error);
      }
    }
    
    // Fallback: return empty array if no data service available
    return [];
  }

  private async getClientsNeedingAttention(): Promise<Client[]> {
    // Get all clients and filter for those needing attention
    const allClients = await this.getAllClients();
    
    // Filter clients with:
    // - High stress levels (>70)
    // - Low work-life balance (<30)
    // - Ethics violations
    // - No recent contact (>30 days)
    const now = new Date();
    return allClients.filter(client => {
      const needsAttention = 
        (client.wellnessMetrics?.stressLevel || 0) > 70 ||
        (client.wellnessMetrics?.workLifeBalance || 100) < 30 ||
        (client.ethicsCompliance?.violations || 0) > 0 ||
        (client.lastContact && (now.getTime() - new Date(client.lastContact).getTime()) > 30 * 24 * 60 * 60 * 1000);
      
      return needsAttention;
    });
  }

  private mapClioClientToClient(clioData: any): Client {
    return {
      id: clioData.id || clioData.client_id || '',
      name: clioData.name || clioData.display_name || 'Unknown Client',
      email: clioData.email || clioData.email_address,
      status: this.mapClioStatusToStatus(clioData.status),
      lastContact: clioData.last_contact ? new Date(clioData.last_contact) : undefined,
      nextReviewDate: clioData.next_review ? new Date(clioData.next_review) : undefined,
      wellnessMetrics: {
        overallScore: 50, // Default - would be calculated from actual data
        stressLevel: 50,
        workLifeBalance: 50,
        billableHoursThisWeek: 0,
      },
      ethicsCompliance: {
        lastReview: new Date(),
        violations: 0,
        riskLevel: 'low' as const,
      },
      habitCurb: {
        activeAlerts: 0,
        concernedHabits: [],
      },
    };
  }

  private mapClioStatusToStatus(clioStatus: string): 'active' | 'inactive' | 'at_risk' {
    if (!clioStatus) return 'active';
    const status = clioStatus.toLowerCase();
    if (status.includes('inactive') || status.includes('closed')) return 'inactive';
    if (status.includes('risk') || status.includes('warning')) return 'at_risk';
    return 'active';
  }
}

