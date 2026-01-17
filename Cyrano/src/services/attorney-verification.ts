/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Attorney Verification Service
 * 
 * Implements attorney verification workflows to satisfy MRPC 5.1 and 5.3 supervision requirements.
 * Requires attorney review before AI-generated work product is used or delivered.
 * 
 * Features:
 * - Graduated review intensity (minimal for non-confidential, intensive for court filings)
 * - Review documentation (reviewer identity, date, verification performed)
 * - Integration with all AI-generated outputs
 */

export type ReviewIntensity = 'minimal' | 'standard' | 'intensive';
export type WorkProductType = 'non-confidential' | 'confidential' | 'court_filing' | 'client_communication' | 'other';

export interface AttorneyReview {
  id: string;
  workProductId: string;
  workProductType: WorkProductType;
  reviewerId: string;
  reviewerName: string;
  reviewDate: number;
  intensity: ReviewIntensity;
  verified: boolean;
  verificationNotes?: string;
  aiGenerated: boolean;
  originalContent?: string;
  reviewedContent?: string;
}

export interface VerificationRequirement {
  workProductType: WorkProductType;
  intensity: ReviewIntensity;
  required: boolean;
  description: string;
}

/**
 * Verification requirements by work product type
 */
const VERIFICATION_REQUIREMENTS: Record<WorkProductType, VerificationRequirement> = {
  'non-confidential': {
    workProductType: 'non-confidential',
    intensity: 'minimal',
    required: true,
    description: 'Minimal review required for non-confidential AI-generated content'
  },
  'confidential': {
    workProductType: 'confidential',
    intensity: 'standard',
    required: true,
    description: 'Standard review required for confidential AI-generated content'
  },
  'court_filing': {
    workProductType: 'court_filing',
    intensity: 'intensive',
    required: true,
    description: 'Intensive review required for court filings - verify all facts, citations, and legal arguments'
  },
  'client_communication': {
    workProductType: 'client_communication',
    intensity: 'standard',
    required: true,
    description: 'Standard review required for client communications - ensure accuracy and appropriate tone'
  },
  'other': {
    workProductType: 'other',
    intensity: 'standard',
    required: true,
    description: 'Standard review required for AI-generated work product'
  }
};

/**
 * Attorney verification store (in-memory for now, should be database-backed in production)
 */
class AttorneyVerificationStore {
  private reviews: Map<string, AttorneyReview> = new Map();
  private pendingReviews: Map<string, AttorneyReview> = new Map();

  /**
   * Create a review requirement
   */
  createReview(
    workProductId: string,
    workProductType: WorkProductType,
    aiGenerated: boolean = true,
    originalContent?: string
  ): AttorneyReview {
    const requirement = VERIFICATION_REQUIREMENTS[workProductType];
    
    const review: AttorneyReview = {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workProductId,
      workProductType,
      reviewerId: '', // Will be set when reviewed
      reviewerName: '', // Will be set when reviewed
      reviewDate: 0, // Will be set when reviewed
      intensity: requirement.intensity,
      verified: false,
      aiGenerated,
      originalContent
    };

    this.pendingReviews.set(workProductId, review);
    return review;
  }

  /**
   * Complete a review
   */
  completeReview(
    workProductId: string,
    reviewerId: string,
    reviewerName: string,
    verified: boolean,
    verificationNotes?: string,
    reviewedContent?: string
  ): { review: AttorneyReview; error?: string } {
    const review = this.pendingReviews.get(workProductId);
    if (!review) {
      return {
        review: {} as AttorneyReview,
        error: `No pending review found for work product ${workProductId}`
      };
    }

    review.reviewerId = reviewerId;
    review.reviewerName = reviewerName;
    review.reviewDate = Date.now();
    review.verified = verified;
    review.verificationNotes = verificationNotes;
    review.reviewedContent = reviewedContent;

    this.pendingReviews.delete(workProductId);
    this.reviews.set(review.id, review);

    return { review };
  }

  /**
   * Get pending review
   */
  getPendingReview(workProductId: string): AttorneyReview | undefined {
    return this.pendingReviews.get(workProductId);
  }

  /**
   * Get completed review
   */
  getReview(reviewId: string): AttorneyReview | undefined {
    return this.reviews.get(reviewId);
  }

  /**
   * Get all pending reviews
   */
  getAllPendingReviews(): AttorneyReview[] {
    return Array.from(this.pendingReviews.values());
  }

  /**
   * Get all reviews for a work product
   */
  getReviewsForWorkProduct(workProductId: string): AttorneyReview[] {
    const allReviews = Array.from(this.reviews.values());
    return allReviews.filter(r => r.workProductId === workProductId);
  }

  /**
   * Check if work product requires verification
   */
  requiresVerification(workProductType: WorkProductType): boolean {
    return VERIFICATION_REQUIREMENTS[workProductType].required;
  }

  /**
   * Get verification requirement for work product type
   */
  getVerificationRequirement(workProductType: WorkProductType): VerificationRequirement {
    return VERIFICATION_REQUIREMENTS[workProductType];
  }
}

// Singleton verification store
export const attorneyVerificationStore = new AttorneyVerificationStore();

/**
 * Require attorney verification for AI-generated work product
 */
export function requireAttorneyVerification(
  workProductId: string,
  workProductType: WorkProductType,
  originalContent?: string
): AttorneyReview {
  return attorneyVerificationStore.createReview(workProductId, workProductType, true, originalContent);
}

/**
 * Complete attorney verification
 */
export function completeAttorneyVerification(
  workProductId: string,
  reviewerId: string,
  reviewerName: string,
  verified: boolean,
  verificationNotes?: string,
  reviewedContent?: string
): { review: AttorneyReview; error?: string } {
  return attorneyVerificationStore.completeReview(
    workProductId,
    reviewerId,
    reviewerName,
    verified,
    verificationNotes,
    reviewedContent
  );
}

/**
 * Check if work product is verified
 */
export function isWorkProductVerified(workProductId: string): boolean {
  const review = attorneyVerificationStore.getPendingReview(workProductId);
  if (!review) {
    // Check completed reviews
    const reviews = attorneyVerificationStore.getReviewsForWorkProduct(workProductId);
    return reviews.some(r => r.verified);
  }
  return review.verified;
}

/**
 * Get verification requirement for work product type
 */
export function getVerificationRequirement(workProductType: WorkProductType): VerificationRequirement {
  return attorneyVerificationStore.getVerificationRequirement(workProductType);
}

/**
 * Determine review intensity based on work product type
 */
export function getReviewIntensity(workProductType: WorkProductType): ReviewIntensity {
  return VERIFICATION_REQUIREMENTS[workProductType].intensity;
