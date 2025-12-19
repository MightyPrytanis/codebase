/*
 * LexFiat Forecaster™ API Client
 * Connects to the Forecast Engine via HTTP bridge
 */

const API_BASE_URL = import.meta.env.VITE_FORECASTER_API_URL || 'http://localhost:3000';

export interface TaxForecastRequest {
  year: number;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widow';
  wages: number;
  selfEmploymentIncome?: number;
  interestIncome?: number;
  dividendIncome?: number;
  capitalGains?: number;
  rentalIncome?: number;
  otherIncome?: number;
  standardDeduction?: number;
  itemizedDeductions?: number;
  dependents?: number;
  credits?: {
    earnedIncomeCredit?: number;
    childTaxCredit?: number;
    educationCredit?: number;
    otherCredits?: number;
  };
  estimatedWithholding?: number;
}

export interface ChildSupportForecastRequest {
  jurisdiction: string;
  payerIncome: number;
  payeeIncome: number;
  numberOfChildren: number;
  overnightsPayer: number;
  overnightsPayee: number;
  healthInsurance?: number;
  childcare?: number;
  otherChildren?: number;
}

export interface QDROForecastRequest {
  planType: 'defined_contribution' | 'defined_benefit';
  accountBalance?: number;
  monthlyBenefit?: number;
  maritalServiceStart: string;
  maritalServiceEnd: string;
  retirementAge?: number;
  divisionPercentage: number;
  participantDOB?: string;
  alternatePayeeDOB?: string;
}

export interface ForecastResponse {
  success: boolean;
  forecastType: string;
  calculatedValues: any;
  brandingApplied: boolean;
  presentationMode: 'strip' | 'watermark' | 'none';
  error?: string;
}

export async function generateTaxForecast(
  input: TaxForecastRequest,
  branding?: {
    presentationMode?: 'strip' | 'watermark' | 'none';
    userRole?: 'attorney' | 'staff' | 'client' | 'other';
    licensedInAny?: boolean;
    riskAcknowledged?: boolean;
  }
): Promise<ForecastResponse> {
  const response = await fetch(`${API_BASE_URL}/api/forecast/tax`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      forecast_input: input,
      branding: branding || {
        presentationMode: 'strip',
        userRole: 'other',
        licensedInAny: false,
        riskAcknowledged: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export async function generateChildSupportForecast(
  input: ChildSupportForecastRequest,
  branding?: {
    presentationMode?: 'strip' | 'watermark' | 'none';
    userRole?: 'attorney' | 'staff' | 'client' | 'other';
    licensedInAny?: boolean;
    riskAcknowledged?: boolean;
  }
): Promise<ForecastResponse> {
  const response = await fetch(`${API_BASE_URL}/api/forecast/support`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      forecast_input: input,
      branding: branding || {
        presentationMode: 'strip',
        userRole: 'other',
        licensedInAny: false,
        riskAcknowledged: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export async function generateQDROForecast(
  input: QDROForecastRequest,
  branding?: {
    presentationMode?: 'strip' | 'watermark' | 'none';
    userRole?: 'attorney' | 'staff' | 'client' | 'other';
    licensedInAny?: boolean;
    riskAcknowledged?: boolean;
  }
): Promise<ForecastResponse> {
  const response = await fetch(`${API_BASE_URL}/api/forecast/qdro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      forecast_input: input,
      branding: branding || {
        presentationMode: 'strip',
        userRole: 'other',
        licensedInAny: false,
        riskAcknowledged: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

