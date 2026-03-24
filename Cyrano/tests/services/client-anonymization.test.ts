/**
 * Client Anonymization Service Tests
 *
 * Validates the token-based PII anonymization layer that intercepts text
 * before it reaches an external AI provider and reverses the mapping locally
 * after the response is received.
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClientAnonymizationService,
  clientAnonymizationService,
} from '../../src/services/client-anonymization.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh service instance per test to avoid session bleed */
function makeSvc() {
  return new ClientAnonymizationService();
}

// ---------------------------------------------------------------------------
// Core anonymize / deanonymize round-trip
// ---------------------------------------------------------------------------

describe('ClientAnonymizationService', () => {
  let svc: ClientAnonymizationService;

  beforeEach(() => {
    svc = makeSvc();
  });

  describe('anonymize() – basic entity replacement', () => {
    it('replaces a person name with a deterministic token', () => {
      const result = svc.anonymize('Please review the matter for John Smith.');
      expect(result.anonymizedText).not.toContain('John Smith');
      expect(result.anonymizedText).toMatch(/PERSON_\d+/);
    });

    it('replaces an email address with a token', () => {
      const result = svc.anonymize('Contact alice@example.com for details.');
      expect(result.anonymizedText).not.toContain('alice@example.com');
      expect(result.anonymizedText).toMatch(/EMAIL_\d+/);
    });

    it('replaces a phone number with a token', () => {
      const result = svc.anonymize('Call (313) 555-1234 to schedule.');
      expect(result.anonymizedText).not.toContain('(313) 555-1234');
      expect(result.anonymizedText).toMatch(/PHONE_\d+/);
    });

    it('replaces a dollar amount with a token', () => {
      const result = svc.anonymize('The settlement offer is $125,000.00.');
      expect(result.anonymizedText).not.toContain('$125,000.00');
      expect(result.anonymizedText).toMatch(/AMOUNT_\d+/);
    });

    it('replaces a date with a token', () => {
      const result = svc.anonymize('The hearing is scheduled for 03/15/2025.');
      expect(result.anonymizedText).not.toContain('03/15/2025');
      expect(result.anonymizedText).toMatch(/DATE_\d+/);
    });

    it('replaces an SSN with a token', () => {
      const result = svc.anonymize('Client SSN: 123-45-6789.');
      expect(result.anonymizedText).not.toContain('123-45-6789');
      expect(result.anonymizedText).toMatch(/SSN_\d+/);
    });

    it('reports entitiesReplaced count', () => {
      const result = svc.anonymize('Contact john@law.com or call (313) 555-1234.');
      expect(result.entitiesReplaced).toBeGreaterThan(0);
    });

    it('returns a non-empty sessionId', () => {
      const result = svc.anonymize('Some text.');
      expect(result.sessionId).toBeTruthy();
      expect(result.sessionId.length).toBeGreaterThan(10);
    });
  });

  // -------------------------------------------------------------------------
  // Determinism within a session
  // -------------------------------------------------------------------------

  describe('deterministic token assignment within a session', () => {
    it('assigns the same token for the same entity appearing twice', () => {
      const text = 'John Smith met with John Smith again.';
      const result = svc.anonymize(text);
      // There should be exactly one unique person token used (deduplicated)
      const tokens = [...result.anonymizedText.matchAll(/PERSON_\d+/g)].map(m => m[0]);
      const unique = new Set(tokens);
      expect(unique.size).toBe(1);
    });

    it('re-uses the existing token mapping when sessionId is provided', () => {
      const first = svc.anonymize('John Smith filed the motion.');
      const second = svc.anonymize('The court granted John Smith relief.', first.sessionId);

      // Extract person token from first anonymization
      const tokenMatch = first.anonymizedText.match(/PERSON_\d+/);
      expect(tokenMatch).not.toBeNull();
      const token = tokenMatch?.[0] ?? '';
      expect(token).toBeTruthy();

      // The same token should appear in the second anonymization
      expect(second.anonymizedText).toContain(token);
      // Session should be the same
      expect(second.sessionId).toBe(first.sessionId);
    });
  });

  // -------------------------------------------------------------------------
  // Expanded detection (NER + role-based heuristics)
  // -------------------------------------------------------------------------

  describe('expanded entity detection', () => {
    it('captures role-based person references', () => {
      const text = 'The plaintiff met with the defendant and my client yesterday.';
      const result = svc.anonymize(text);
      expect(result.anonymizedText).not.toContain('plaintiff');
      expect(result.anonymizedText).toMatch(/PERSON_\d+/);
      expect(result.summary.person).toBeGreaterThan(0);
    });

    it('uses local NER to detect locations beyond capitalization regex', () => {
      const text = 'the team met in detroit to plan next steps.';
      const result = svc.anonymize(text);
      expect(result.anonymizedText.toLowerCase()).not.toContain('detroit');
      expect(result.summary.location).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // De-anonymization round-trip
  // -------------------------------------------------------------------------

  describe('deanonymize() – round-trip fidelity', () => {
    it('restores original text after anonymization', () => {
      const original = 'The client Jane Doe can be reached at jane@doe.com.';
      const { anonymizedText, sessionId } = svc.anonymize(original);
      const restored = svc.deanonymize(anonymizedText, sessionId);
      expect(restored).toBe(original);
    });

    it('deanonymizes a simulated AI response containing tokens', () => {
      const { sessionId } = svc.anonymize('The matter concerns John Smith.');
      // Simulate an AI response that echoes the token
      const aiResponse = 'Based on the case, PERSON_1 should file a motion to dismiss.';
      const deanonymized = svc.deanonymize(aiResponse, sessionId);
      expect(deanonymized).toContain('John Smith');
    });

    it('throws when sessionId is invalid', () => {
      expect(() =>
        svc.deanonymize('PERSON_1 filed a motion.', 'nonexistent-session-id')
      ).toThrow(/not found or has expired/);
    });

    it('leaves text unchanged when no tokens are present', () => {
      const { anonymizedText, sessionId } = svc.anonymize('No sensitive data here.');
      const restored = svc.deanonymize(anonymizedText, sessionId);
      expect(restored).toBe('No sensitive data here.');
    });
  });

  // -------------------------------------------------------------------------
  // Risk category assessment
  // -------------------------------------------------------------------------

  describe('assessRiskCategory()', () => {
    it('returns Category 3 when SSN is present', () => {
      expect(svc.assessRiskCategory('SSN: 123-45-6789')).toBe(3);
    });

    it('returns Category 3 when account number phrase is present', () => {
      expect(svc.assessRiskCategory('Account number: 9876543210')).toBe(3);
    });

    it('returns Category 2 when strategy keywords are present', () => {
      expect(svc.assessRiskCategory('We should discuss settlement strategy.')).toBe(2);
    });

    it('returns Category 2 for litigation-related content', () => {
      expect(svc.assessRiskCategory('Deposition scheduled for next week.')).toBe(2);
    });

    it('returns Category 2 for theory-of-the-case language', () => {
      expect(
        svc.assessRiskCategory('We need to revisit our theory of the case and liability exposure.')
      ).toBe(2);
    });

    it('returns Category 1 for generic legal research questions', () => {
      expect(
        svc.assessRiskCategory('What is the statute of limitations for breach of contract in Michigan?')
      ).toBe(1);
    });

    it('riskCategory is reflected in anonymize() result', () => {
      const result = svc.anonymize('SSN: 000-00-0000 is in the record.');
      expect(result.riskCategory).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Session management
  // -------------------------------------------------------------------------

  describe('session management', () => {
    it('getSession() returns the session after anonymize()', () => {
      const { sessionId } = svc.anonymize('Test text.');
      const session = svc.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session!.id).toBe(sessionId);
    });

    it('destroySession() removes the session', () => {
      const { sessionId } = svc.anonymize('Test text.');
      svc.destroySession(sessionId);
      expect(svc.getSession(sessionId)).toBeUndefined();
    });

    it('deanonymize() throws after destroySession()', () => {
      const { anonymizedText, sessionId } = svc.anonymize('John Doe filed.');
      svc.destroySession(sessionId);
      expect(() => svc.deanonymize(anonymizedText, sessionId)).toThrow();
    });

    it('expired sessions are evicted', () => {
      // Create a service with a very short TTL (1 ms)
      const shortLivedSvc = new ClientAnonymizationService(1);
      const { sessionId } = shortLivedSvc.anonymize('Temp text.');
      // Wait a tiny bit so TTL expires
      const waitUntil = Date.now() + 5;
      while (Date.now() < waitUntil) {
        // busy-wait for determinism in unit tests
      }
      // Accessing activeSessionCount triggers eviction
      expect(shortLivedSvc.activeSessionCount).toBe(0);
      expect(shortLivedSvc.getSession(sessionId)).toBeUndefined();
    });

    it('activeSessionCount increments when sessions are created', () => {
      expect(svc.activeSessionCount).toBe(0);
      svc.anonymize('First text.');
      expect(svc.activeSessionCount).toBe(1);
      svc.anonymize('Second text.'); // new session
      expect(svc.activeSessionCount).toBe(2);
    });

    it('persists and restores sessions when a secret is configured', () => {
      const tmpPath = path.join('/tmp', `anon-session-${Date.now()}.enc`);
      const prevSecret = process.env.CLIENT_ANON_SECRET;
      const prevPath = process.env.CLIENT_ANON_SESSION_PATH;
      process.env.CLIENT_ANON_SECRET = 'test-secret';
      process.env.CLIENT_ANON_SESSION_PATH = tmpPath;

      try {
        const firstSvc = new ClientAnonymizationService();
        const { anonymizedText, sessionId } = firstSvc.anonymize(
          'Jane Doe will attend the hearing.'
        );
        const token = anonymizedText.match(/PERSON_\d+/)?.[0] ?? '';
        expect(token).toBeTruthy();
        expect(fs.existsSync(tmpPath)).toBe(true);

        // Simulate restart by creating a fresh service that should reload the session
        const secondSvc = new ClientAnonymizationService();
        const restored = secondSvc.deanonymize(`Hello ${token}`, sessionId);
        expect(restored).toContain('Jane Doe');
      } finally {
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath);
        }
        process.env.CLIENT_ANON_SECRET = prevSecret;
        process.env.CLIENT_ANON_SESSION_PATH = prevPath;
      }
    });
  });

  // -------------------------------------------------------------------------
  // Singleton export
  // -------------------------------------------------------------------------

  describe('singleton export', () => {
    it('clientAnonymizationService is an instance of ClientAnonymizationService', () => {
      expect(clientAnonymizationService).toBeInstanceOf(ClientAnonymizationService);
    });
  });
});
