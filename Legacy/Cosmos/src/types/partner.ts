export interface Partner {
  id: string;
  name: string;
  type: 'mortgage_broker' | 'correspondent_lender' | 'credit_union';
  status: 'active' | 'inactive' | 'pending' | 'at_risk';
  metrics: PartnerMetrics;
  contact: ContactInfo;
  compliance: ComplianceStatus;
  performance: PerformanceData;
}

export interface PartnerMetrics {
  monthlyLoanVolume: number;
  averageLoanSize: number;
  loanCount: number;
  revenue: number;
  walletShare: number; // percentage
  daysSinceLastContact: number;
  responseRate: number; // percentage
}

export interface ContactInfo {
  primaryContact: string;
  email: string;
  phone: string;
  lastContactDate: string;
  preferredContactMethod: 'email' | 'phone' | 'text';
}

export interface ComplianceStatus {
  licenseStatus: 'current' | 'expiring' | 'expired';
  licenseExpiryDate: string;
  auditScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  lastAuditDate: string;
}

export interface PerformanceData {
  closingRate: number; // percentage
  averageClosingTime: number; // days
  customerSatisfactionScore: number; // 1-10
  defectRate: number; // percentage
  trendDirection: 'improving' | 'stable' | 'declining';
}
