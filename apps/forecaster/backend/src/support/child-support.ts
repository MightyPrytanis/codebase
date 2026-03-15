/**
 * Child Support Calculation - Re-exported from Cyrano
 *
 * This file imports from Cyrano's shared child support calculation formulas
 * to ensure both the standalone backend and Cyrano HTTP bridge use
 * the same implementation.
 */

// Import from Cyrano's shared child support formulas
import {
  calculateChildSupport,
  calculateMichiganChildSupport,
  type ChildSupportInput,
  type ChildSupportCalculation,
  type Jurisdiction,
} from '../../../../../Cyrano/src/modules/forecast/formulas/child-support-formulas.js';

// Re-export for use in backend routes
export type { ChildSupportInput, ChildSupportCalculation, Jurisdiction };
export { calculateChildSupport, calculateMichiganChildSupport };
