/**
 * Federal Tax Calculation - Re-exported from Cyrano
 * 
 * This file now imports from Cyrano's shared tax calculation formulas
 * to ensure both the standalone backend and Cyrano HTTP bridge use
 * the same implementation with complete credit calculations.
 */

// Import from Cyrano's shared tax formulas
import {
  calculateFederal,
  type FederalTaxInput,
  type FederalTaxResult,
  type FilingStatus,
} from '../../../../../Cyrano/src/modules/forecast/formulas/tax-formulas.js';

// Re-export for backward compatibility
export type { FederalTaxInput, FederalTaxResult, FilingStatus };
export { calculateFederal };
