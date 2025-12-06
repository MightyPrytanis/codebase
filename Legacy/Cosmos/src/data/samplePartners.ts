import { Partner } from '../types/partner';

export const samplePartners: Partner[] = [
  {
    id: 'PARTNER001',
    name: 'Metro Mortgage Brokers',
    type: 'mortgage_broker',
    status: 'active',
    metrics: {
      monthlyLoanVolume: 2500000,
      averageLoanSize: 425000,
      loanCount: 47,
      revenue: 125000,
      walletShare: 23,
      daysSinceLastContact: 8,
      responseRate: 85
    },
    contact: {
      primaryContact: 'Sarah Mitchell',
      email: 'sarah.mitchell@metromorphb.com',
      phone: '(555) 123-4567',
      lastContactDate: '2025-01-24',
      preferredContactMethod: 'email'
    },
    compliance: {
      licenseStatus: 'current',
      licenseExpiryDate: '2025-12-31',
      auditScore: 92,
      riskLevel: 'low',
      lastAuditDate: '2024-11-15'
    },
    performance: {
      closingRate: 78,
      averageClosingTime: 32,
      customerSatisfactionScore: 8.4,
      defectRate: 2.1,
      trendDirection: 'improving'
    }
  },
  {
    id: 'PARTNER002', 
    name: 'Capital City Credit Union',
    type: 'credit_union',
    status: 'at_risk',
    metrics: {
      monthlyLoanVolume: 890000,
      averageLoanSize: 285000,
      loanCount: 18,
      revenue: 45000,
      walletShare: 12,
      daysSinceLastContact: 23,
      responseRate: 45
    },
    contact: {
      primaryContact: 'Michael Chen',
      email: 'mchen@capitalcitycu.org',
      phone: '(555) 987-6543',
      lastContactDate: '2025-01-08',
      preferredContactMethod: 'phone'
    },
    compliance: {
      licenseStatus: 'expiring',
      licenseExpiryDate: '2025-03-15',
      auditScore: 76,
      riskLevel: 'medium',
      lastAuditDate: '2024-08-22'
    },
    performance: {
      closingRate: 62,
      averageClosingTime: 45,
      customerSatisfactionScore: 6.8,
      defectRate: 4.7,
      trendDirection: 'declining'
    }
  },
  {
    id: 'PARTNER003',
    name: 'Pinnacle Home Loans',
    type: 'correspondent_lender', 
    status: 'active',
    metrics: {
      monthlyLoanVolume: 4200000,
      averageLoanSize: 380000,
      loanCount: 73,
      revenue: 210000,
      walletShare: 45,
      daysSinceLastContact: 3,
      responseRate: 92
    },
    contact: {
      primaryContact: 'Jennifer Rodriguez',
      email: 'j.rodriguez@pinnaclehl.com',
      phone: '(555) 456-7890',
      lastContactDate: '2025-01-28',
      preferredContactMethod: 'email'
    },
    compliance: {
      licenseStatus: 'current',
      licenseExpiryDate: '2026-06-30',
      auditScore: 96,
      riskLevel: 'low', 
      lastAuditDate: '2024-12-10'
    },
    performance: {
      closingRate: 85,
      averageClosingTime: 28,
      customerSatisfactionScore: 9.1,
      defectRate: 1.3,
      trendDirection: 'improving'
    }
  },
  {
    id: 'PARTNER004',
    name: 'Regional First Mortgage',
    type: 'mortgage_broker',
    status: 'pending',
    metrics: {
      monthlyLoanVolume: 1200000,
      averageLoanSize: 320000,
      loanCount: 22,
      revenue: 60000,
      walletShare: 8,
      daysSinceLastContact: 15,
      responseRate: 68
    },
    contact: {
      primaryContact: 'David Kim',
      email: 'dkim@regionalfirst.com',
      phone: '(555) 234-5678',
      lastContactDate: '2025-01-17',
      preferredContactMethod: 'text'
    },
    compliance: {
      licenseStatus: 'current',
      licenseExpiryDate: '2025-09-15',
      auditScore: 84,
      riskLevel: 'low',
      lastAuditDate: '2024-10-05'
    },
    performance: {
      closingRate: 71,
      averageClosingTime: 38,
      customerSatisfactionScore: 7.6,
      defectRate: 3.2,
      trendDirection: 'stable'
    }
  }
];
