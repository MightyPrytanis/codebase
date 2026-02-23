/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Attorney Verification Integration Tests
 * Track Delta: Tests attorney verification workflows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  attorneyVerificationStore,
  requireAttorneyVerification,
  completeAttorneyVerification,
  isWorkProductVerified,
  getVerificationRequirement,
  getReviewIntensity,
} from '../../src/services/attorney-verification.js';

describe('Attorney Verification Integration (Track Delta)', () => {
  beforeEach(() => {
    // Clear stores before each test
    attorneyVerificationStore.getAllPendingReviews = vi.fn(() => []);
  });

  describe('Review Creation', () => {
    it('should create review requirement', () => {
      const review = requireAttorneyVerification(
        'work-product-123',
        'court_filing',
        'Original AI-generated content'
      );

      expect(review.id).toBeDefined();
      expect(review.workProductId).toBe('work-product-123');
      expect(review.workProductType).toBe('court_filing');
      expect(review.intensity).toBe('intensive');
      expect(review.verified).toBe(false);
      expect(review.aiGenerated).toBe(true);
      expect(review.originalContent).toBe('Original AI-generated content');
    });

    it('should set appropriate review intensity', () => {
      const courtFiling = requireAttorneyVerification('wp-1', 'court_filing');
      const confidential = requireAttorneyVerification('wp-2', 'confidential');
      const nonConfidential = requireAttorneyVerification('wp-3', 'non-confidential');

      expect(courtFiling.intensity).toBe('intensive');
      expect(confidential.intensity).toBe('standard');
      expect(nonConfidential.intensity).toBe('minimal');
    });
  });

  describe('Review Completion', () => {
    it('should complete review successfully', () => {
      const review = requireAttorneyVerification('work-product-123', 'court_filing');
      
      const result = completeAttorneyVerification(
        'work-product-123',
        'attorney-1',
        'John Doe',
        true,
        'All facts and citations verified',
        'Reviewed and approved content'
      );

      expect(result.review).toBeDefined();
      expect(result.review?.reviewerId).toBe('attorney-1');
      expect(result.review?.reviewerName).toBe('John Doe');
      expect(result.review?.verified).toBe(true);
      expect(result.review?.verificationNotes).toBe('All facts and citations verified');
      expect(result.review?.reviewedContent).toBe('Reviewed and approved content');
      expect(result.review?.reviewDate).toBeGreaterThan(0);
    });

    it('should reject non-existent work product', () => {
      const result = completeAttorneyVerification(
        'non-existent',
        'attorney-1',
        'John Doe',
        true
      );

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No pending review found');
    });
  });

  describe('Verification Status', () => {
    it('should check if work product is verified', () => {
      const review = requireAttorneyVerification('work-product-123', 'confidential');
      completeAttorneyVerification('work-product-123', 'attorney-1', 'John Doe', true);

      expect(isWorkProductVerified('work-product-123')).toBe(true);
    });

    it('should return false for unverified work product', () => {
      requireAttorneyVerification('work-product-123', 'confidential');
      expect(isWorkProductVerified('work-product-123')).toBe(false);
    });
  });

  describe('Verification Requirements', () => {
    it('should return requirement for work product type', () => {
      const requirement = getVerificationRequirement('court_filing');
      
      expect(requirement.workProductType).toBe('court_filing');
      expect(requirement.intensity).toBe('intensive');
      expect(requirement.required).toBe(true);
      expect(requirement.description).toContain('Intensive review required');
    });

    it('should require verification for all types', () => {
      expect(attorneyVerificationStore.requiresVerification('court_filing')).toBe(true);
      expect(attorneyVerificationStore.requiresVerification('confidential')).toBe(true);
      expect(attorneyVerificationStore.requiresVerification('non-confidential')).toBe(true);
    });
  });

  describe('Review Intensity', () => {
    it('should return correct intensity for work product types', () => {
      expect(getReviewIntensity('court_filing')).toBe('intensive');
      expect(getReviewIntensity('confidential')).toBe('standard');
      expect(getReviewIntensity('client_communication')).toBe('standard');
      expect(getReviewIntensity('non-confidential')).toBe('minimal');
    });
  });
});
