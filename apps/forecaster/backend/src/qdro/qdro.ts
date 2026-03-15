/**
 * QDRO Calculation - Re-exported from Cyrano
 *
 * This file imports from Cyrano's shared QDRO calculation formulas
 * to ensure both the standalone backend and Cyrano HTTP bridge use
 * the same implementation.
 */

// Import from Cyrano's shared QDRO formulas
import {
  calculateQDRO,
  calculateDefinedContributionQDRO,
  calculateDefinedBenefitQDRO,
  type QDROInput,
  type QDROCalculation,
  type PlanType,
} from '../../../../../Cyrano/src/modules/forecast/formulas/qdro-formulas.js';

// Re-export for use in backend routes
export type { QDROInput, QDROCalculation, PlanType };
export { calculateQDRO, calculateDefinedContributionQDRO, calculateDefinedBenefitQDRO };
