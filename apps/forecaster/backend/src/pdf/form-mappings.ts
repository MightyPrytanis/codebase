/**
 * PDF Form Field Mappings
 *
 * NOTE: These field names are extracted from IRS fillable PDFs (AcroForm/XFA-derived names).
 * They are expected to be stable across recent years (e.g. 2023+).
 */

export type PresentationMode = 'strip' | 'watermark' | 'none';

export const FORM_1040_MAPPINGS: Record<string, string> = {
  // Filing status checkboxes (0=Single, 1=Married Joint, 2=Married Separate, 3=Head of Household, 4=Qualifying Widow)
  filingStatus: 'topmostSubform[0].Page1[0].c1_3', // Array index 0-4

  // Page 1 income totals
  wages: 'topmostSubform[0].Page1[0].f1_32[0]', // Line 1a
  taxableInterest: 'topmostSubform[0].Page1[0].f1_33[0]', // Line 2a
  ordinaryDividends: 'topmostSubform[0].Page1[0].f1_35[0]', // Line 3a
  capitalGain: 'topmostSubform[0].Page1[0].f1_43[0]', // Line 7
  otherIncome: 'topmostSubform[0].Page1[0].f1_44[0]', // Line 8
  totalIncome: 'topmostSubform[0].Page1[0].f1_45[0]', // Line 9
  adjustedGrossIncome: 'topmostSubform[0].Page1[0].f1_57[0]', // Line 11 (AGI)

  // Deductions / taxable income
  standardDeductionAmount: 'topmostSubform[0].Page1[0].f1_58[0]', // Line 12
  taxableIncome: 'topmostSubform[0].Page1[0].f1_60[0]', // Line 15

  // Page 2 payments + balance
  federalTaxWithheld: 'topmostSubform[0].Page2[0].f2_01[0]', // Line 25d (approx)
  earnedIncomeCredit: 'topmostSubform[0].Page2[0].f2_03[0]', // EIC
  additionalChildTaxCredit: 'topmostSubform[0].Page2[0].f2_04[0]', // ACTC (Sch 8812)
  otherCredits: 'topmostSubform[0].Page2[0].f2_07[0]', // other refundable credits (approx bucket)
  totalPayments: 'topmostSubform[0].Page2[0].f2_08[0]',
  taxOwed: 'topmostSubform[0].Page2[0].f2_09[0]',
  overpayment: 'topmostSubform[0].Page2[0].f2_10[0]',
  amountOwed: 'topmostSubform[0].Page2[0].f2_12[0]'
};

export function mapFormDataToFields(
  formData: Record<string, unknown>,
  fieldMappings: Record<string, string>
): Map<string, unknown> {
  const fieldValues = new Map<string, unknown>();
  for (const [dataKey, fieldName] of Object.entries(fieldMappings)) {
    const value = (formData as any)[dataKey];
    if (value === undefined || value === null) continue;
    fieldValues.set(fieldName, value);
  }
  return fieldValues;
