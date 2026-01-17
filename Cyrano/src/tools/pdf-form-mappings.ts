/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * PDF Form Field Mappings
 * 
 * Maps form data to PDF form field names for various tax and legal forms.
 * Field names are extracted from actual PDF forms using pdf-lib.
 */

/**
 * IRS Form 1040 Field Mappings
 * Based on 2024/2025 Form 1040 structure
 */
export const FORM_1040_MAPPINGS: Record<string, string> = {
  // Page 1 - Top section
  'firstName': 'topmostSubform[0].Page1[0].f1_01[0]',
  'lastName': 'topmostSubform[0].Page1[0].f1_02[0]',
  'ssn': 'topmostSubform[0].Page1[0].f1_03[0]',
  'spouseFirstName': 'topmostSubform[0].Page1[0].f1_04[0]',
  'spouseLastName': 'topmostSubform[0].Page1[0].f1_05[0]',
  'spouseSSN': 'topmostSubform[0].Page1[0].f1_06[0]',
  'preparerPTIN': 'topmostSubform[0].Page1[0].f1_07[0]',
  'selfSelectPIN': 'topmostSubform[0].Page1[0].f1_08[0]',
  'occupation': 'topmostSubform[0].Page1[0].f1_09[0]',
  
  // Address fields
  'address': 'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_10[0]',
  'city': 'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_11[0]',
  'state': 'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_12[0]',
  'zip': 'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_13[0]',
  'foreignCountry': 'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_14[0]',
  'foreignProvince': 'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_15[0]',
  'foreignPostalCode': 'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_16[0]',
  'foreignZip': 'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_17[0]',
  
  // Filing status checkboxes (0=Single, 1=Married Joint, 2=Married Separate, 3=Head of Household, 4=Qualifying Widow)
  'filingStatus': 'topmostSubform[0].Page1[0].FilingStatus_ReadOrder[0].c1_3', // Array index 0-4
  
  // Standard deduction
  'standardDeduction': 'topmostSubform[0].Page1[0].f1_18[0]',
  
  // Dependents
  'numDependents': 'topmostSubform[0].Page1[0].f1_19[0]',
  
  // Income lines (approximate - actual line numbers may vary by year)
  'wages': 'topmostSubform[0].Page1[0].f1_32[0]', // Line 1a
  'taxableInterest': 'topmostSubform[0].Page1[0].f1_33[0]', // Line 2a
  'taxExemptInterest': 'topmostSubform[0].Page1[0].f1_34[0]', // Line 2b
  'ordinaryDividends': 'topmostSubform[0].Page1[0].f1_35[0]', // Line 3a
  'qualifiedDividends': 'topmostSubform[0].Page1[0].f1_36[0]', // Line 3b
  'iraDistributions': 'topmostSubform[0].Page1[0].f1_37[0]', // Line 4a
  'taxableIraDistributions': 'topmostSubform[0].Page1[0].f1_38[0]', // Line 4b
  'pensions': 'topmostSubform[0].Page1[0].f1_39[0]', // Line 5a
  'taxablePensions': 'topmostSubform[0].Page1[0].f1_40[0]', // Line 5b
  'socialSecurityBenefits': 'topmostSubform[0].Page1[0].f1_41[0]', // Line 6a
  'taxableSocialSecurity': 'topmostSubform[0].Page1[0].f1_42[0]', // Line 6b
  'capitalGain': 'topmostSubform[0].Page1[0].f1_43[0]', // Line 7
  'otherIncome': 'topmostSubform[0].Page1[0].f1_44[0]', // Line 8
  'totalIncome': 'topmostSubform[0].Page1[0].f1_45[0]', // Line 9
  
  // Adjustments
  'educatorExpenses': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_46[0]', // Line 10
  'businessExpenses': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_47[0]', // Line 11
  'hsaDeduction': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_48[0]', // Line 12
  'movingExpenses': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_49[0]', // Line 13
  'selfEmployedSep': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_50[0]', // Line 14
  'selfEmployedHealth': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_51[0]', // Line 15
  'penaltyEarlyWithdrawal': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_52[0]', // Line 16
  'alimonyPaid': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_53[0]', // Line 17
  'iraDeduction': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_54[0]', // Line 18
  'studentLoanInterest': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_55[0]', // Line 19
  'tuitionFees': 'topmostSubform[0].Page1[0].Line4a-11_ReadOrder[0].f1_56[0]', // Line 20
  'adjustedGrossIncome': 'topmostSubform[0].Page1[0].f1_57[0]', // Line 21
  
  // Standard/itemized deduction
  'standardDeductionAmount': 'topmostSubform[0].Page1[0].f1_58[0]', // Line 22
  'qualifiedBusinessIncome': 'topmostSubform[0].Page1[0].f1_59[0]', // Line 23
  'taxableIncome': 'topmostSubform[0].Page1[0].f1_60[0]', // Line 24
  
  // Page 2 - Tax and payments
  'federalTaxWithheld': 'topmostSubform[0].Page2[0].f2_01[0]', // Line 25
  'estimatedTaxPayments': 'topmostSubform[0].Page2[0].f2_02[0]', // Line 26
  'earnedIncomeCredit': 'topmostSubform[0].Page2[0].f2_03[0]', // Line 27
  'additionalChildTaxCredit': 'topmostSubform[0].Page2[0].f2_04[0]', // Line 28
  'americanOpportunityCredit': 'topmostSubform[0].Page2[0].f2_05[0]', // Line 29
  'recoveryRebateCredit': 'topmostSubform[0].Page2[0].f2_06[0]', // Line 30
  'otherCredits': 'topmostSubform[0].Page2[0].f2_07[0]', // Line 31
  'totalPayments': 'topmostSubform[0].Page2[0].f2_08[0]', // Line 32
  'taxOwed': 'topmostSubform[0].Page2[0].f2_09[0]', // Line 33
  'overpayment': 'topmostSubform[0].Page2[0].f2_10[0]', // Line 34
  'refundAmount': 'topmostSubform[0].Page2[0].f2_11[0]', // Line 35
  'amountOwed': 'topmostSubform[0].Page2[0].f2_12[0]', // Line 36
};

/**
 * Michigan Child Support Formula (MCSF) Form Field Mappings
 * Based on 2025 MCSF forms (2025mcsf.pdf, 2025mcsfsupp.pdf)
 */
export const MICHIGAN_CHILD_SUPPORT_MAPPINGS: Record<string, string> = {
  // These will be populated after examining the actual PDF forms
  // For now, using common field naming patterns
  'payerName': 'payer_name',
  'payeeName': 'payee_name',
  'caseNumber': 'case_number',
  'numberOfChildren': 'num_children',
  'payerIncome': 'payer_income',
  'payeeIncome': 'payee_income',
  'combinedIncome': 'combined_income',
  'baseSupportObligation': 'base_support',
  'parentingTimeAdjustment': 'parenting_time_adj',
  'healthInsurance': 'health_insurance',
  'childcare': 'childcare',
  'finalSupportAmount': 'final_support',
};

/**
 * Map form data to PDF form fields
 */
export function mapFormDataToFields(
  formType: string,
  formData: any,
  fieldMappings: Record<string, string>
): Map<string, any> {
  const fieldValues = new Map<string, any>();
  
  for (const [dataKey, fieldName] of Object.entries(fieldMappings)) {
    if (formData[dataKey] !== undefined && formData[dataKey] !== null) {
      // Format value based on type
      let value = formData[dataKey];
      
      // Format numbers to 2 decimal places for currency
      if (typeof value === 'number' && (dataKey.includes('Income') || dataKey.includes('Amount') || dataKey.includes('Support') || dataKey.includes('Deduction') || dataKey.includes('Credit'))) {
        value = value.toFixed(2);
      }
      
      // Format SSN with dashes
      if (dataKey.includes('ssn') || dataKey.includes('SSN')) {
        value = String(value).replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
      }
      
      // Format ZIP codes
      if (dataKey === 'zip' && String(value).length === 9) {
        value = String(value).replace(/(\d{5})(\d{4})/, '$1-$2');
      }
      
      fieldValues.set(fieldName, String(value));
    }
  }
  
  return fieldValues;
}

/**
 * Get form field mappings for a specific form type
 */
export function getFormMappings(formType: string): Record<string, string> {
  switch (formType) {
    case 'tax_return':
    case '1040':
      return FORM_1040_MAPPINGS;
    case 'child_support':
    case 'mcsf':
      return MICHIGAN_CHILD_SUPPORT_MAPPINGS;
    default:
      return {};
