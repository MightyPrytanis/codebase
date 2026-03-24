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

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClientAnonymizationService,
  clientAnonymizationService,
  DEFAULT_SESSION_TTL_MS,
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

    it('returns Category 1 for generic legal research questions', () => {
      expect(
        svc.assessRiskCategory('What are the elements of a valid offer and acceptance under Michigan contract law?')
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
  });

  // -------------------------------------------------------------------------
  // Singleton export
  // -------------------------------------------------------------------------

  describe('singleton export', () => {
    it('clientAnonymizationService is an instance of ClientAnonymizationService', () => {
      expect(clientAnonymizationService).toBeInstanceOf(ClientAnonymizationService);
    });
  });

  // -------------------------------------------------------------------------
  // Session TTL
  // -------------------------------------------------------------------------

  describe('session TTL', () => {
    it('DEFAULT_SESSION_TTL_MS is 45 minutes', () => {
      expect(DEFAULT_SESSION_TTL_MS).toBe(45 * 60 * 1000);
    });
  });

  // -------------------------------------------------------------------------
  // Expanded strategy keywords
  // -------------------------------------------------------------------------

  describe('assessRiskCategory() – expanded strategy keywords', () => {
    const category2Cases: [string, string][] = [
      // ── Previously added terms ────────────────────────────────────────────
      ['liability', 'The defendant has significant liability exposure.'],
      ['exposure', 'The client faces substantial exposure in this matter.'],
      ['plea', 'We are evaluating a plea agreement.'],
      ['indictment', 'The grand jury returned an indictment yesterday.'],
      ['theory of the case', 'Our theory of the case centers on negligence.'],
      ['plea agreement', 'The prosecutor offered a plea agreement.'],
      ['plea bargain', 'Counsel discussed a plea bargain with the DA.'],
      ['nolo contendere', 'Client may enter nolo contendere.'],
      ['no contest', 'A no contest plea was entered.'],
      ['suppression', 'We filed a motion for suppression of evidence.'],
      ['subpoena', 'A subpoena was issued for the financial records.'],
      ['injunction', 'We sought a preliminary injunction.'],
      ['restraining order', 'A restraining order was denied.'],
      ['sanctions', 'Opposing counsel is seeking sanctions.'],
      ['discovery', 'Discovery closes next month.'],
      ['weakness', 'A weakness in the opposing argument was identified.'],
      ['admission', 'The client made an admission during questioning.'],
      ['mental state', 'The mental state of the accused is at issue.'],
      ['motive', 'Prosecution must establish motive beyond a reasonable doubt.'],
      // ── Criminal law ─────────────────────────────────────────────────────
      ['arraignment', 'The arraignment is scheduled for Monday.'],
      ['bail', 'Counsel will argue for bail reduction.'],
      ['sentencing', 'Sentencing guidelines favor leniency here.'],
      ['felony', 'The charge has been upgraded to a felony.'],
      ['probation', 'The client is currently on probation.'],
      ['prior conviction', 'A prior conviction may enhance the sentence.'],
      // ── Civil litigation / torts ─────────────────────────────────────────
      ['negligence', 'The complaint alleges negligence on all counts.'],
      ['gross negligence', 'Gross negligence may support punitive damages.'],
      ['proximate cause', 'Proximate cause is disputed by the defense.'],
      ['punitive damages', 'We are seeking punitive damages for the conduct.'],
      ['comparative fault', 'Comparative fault will be argued at trial.'],
      ['wrongful death', 'The family filed a wrongful death action.'],
      ['medical malpractice', 'Medical malpractice is alleged in the complaint.'],
      ['personal injury', 'This is a personal injury matter.'],
      ['class action', 'A class action was certified last month.'],
      // ── Contract disputes ─────────────────────────────────────────────────
      ['breach of contract', 'The complaint alleges breach of contract.'],
      ['material breach', 'A material breach of the agreement occurred.'],
      ['specific performance', 'We will demand specific performance.'],
      ['indemnification', 'The indemnification clause is being disputed.'],
      ['force majeure', 'Force majeure was invoked by the counterparty.'],
      ['unjust enrichment', 'An unjust enrichment claim has been filed.'],
      ['trade secret', 'The trade secret misappropriation claim is strong.'],
      ['non-disclosure agreement', 'A non-disclosure agreement was breached.'],
      // ── Intellectual property ─────────────────────────────────────────────
      ['infringement', 'Patent infringement is alleged.'],
      ['patent', 'The patent covers the core technology.'],
      ['trademark', 'Trademark dilution is part of the claim.'],
      ['copyright', 'Copyright infringement is clear.'],
      ['misappropriation', 'Trade secret misappropriation was confirmed.'],
      ['cease and desist', 'A cease and desist letter was sent.'],
      ['willful infringement', 'Willful infringement may triple damages.'],
      // ── Family law ───────────────────────────────────────────────────────
      ['divorce', 'The client has filed for divorce.'],
      ['child custody', 'Child custody is the primary issue.'],
      ['child support', 'Child support arrears have accumulated.'],
      ['spousal support', 'Spousal support will be contested.'],
      ['equitable distribution', 'Equitable distribution of assets is needed.'],
      ['domestic violence', 'Domestic violence allegations are part of the case.'],
      ['prenuptial agreement', 'The prenuptial agreement is being challenged.'],
      ['parental rights', 'Parental rights termination is sought.'],
      ['best interests of the child', 'Best interests of the child must guide the ruling.'],
      ['paternity', 'Paternity has not been established.'],
      // ── Real property ─────────────────────────────────────────────────────
      ['foreclosure', 'Foreclosure proceedings have been initiated.'],
      ['easement', 'An easement dispute is at the center of this case.'],
      ['adverse possession', 'Adverse possession is claimed by the neighbor.'],
      ['eviction', 'The landlord filed for eviction.'],
      ['eminent domain', 'Eminent domain proceedings have been filed.'],
      ['lien', 'A mechanic lien was filed on the property.'],
      ['quiet title', 'A quiet title action is pending.'],
      ['boundary dispute', 'The boundary dispute dates back ten years.'],
      // ── Bankruptcy ────────────────────────────────────────────────────────
      ['bankruptcy', 'The client is considering filing for bankruptcy.'],
      ['chapter 7', 'A chapter 7 petition was filed yesterday.'],
      ['chapter 11', 'The company seeks chapter 11 reorganization.'],
      ['automatic stay', 'The automatic stay halted all collection actions.'],
      ['fraudulent transfer', 'A fraudulent transfer occurred before filing.'],
      ['discharge of debt', 'Discharge of debt was denied for that creditor.'],
      ['insolvency', 'The company faces insolvency and cannot pay its creditors.'],
      // ── Employment / labor ────────────────────────────────────────────────
      ['wrongful termination', 'The client claims wrongful termination.'],
      ['retaliation', 'Retaliation followed the whistleblower complaint.'],
      ['hostile work environment', 'A hostile work environment was documented.'],
      ['harassment', 'Sexual harassment allegations are central.'],
      ['wage theft', 'Wage theft amounting to thousands is alleged.'],
      ['non-compete', 'The non-compete clause is overly broad.'],
      ['whistleblower', 'The whistleblower was terminated the next day.'],
      ['workers compensation', 'A workers compensation claim was denied.'],
      // ── Civil rights / discrimination ─────────────────────────────────────
      ['discrimination', 'The complaint alleges racial discrimination.'],
      ['disability discrimination', 'Disability discrimination is the basis of the claim.'],
      ['reasonable accommodation', 'Reasonable accommodation was refused.'],
      ['disparate impact', 'Statistical evidence supports a disparate impact claim.'],
      ['civil rights violation', 'A civil rights violation under § 1983 is alleged.'],
      ['excessive force', 'Excessive force was used during the arrest.'],
      ['ada', 'The employer violated the ADA.'],
      ['title vii', 'Title VII protects against this form of discrimination.'],
      // ── Product liability ─────────────────────────────────────────────────
      ['product defect', 'A product defect caused the injury.'],
      ['design defect', 'The design defect was known to the manufacturer.'],
      ['failure to warn', 'Failure to warn is the primary theory.'],
      ['strict liability', 'Strict liability applies to this product.'],
      ['recall', 'The product recall was issued after the injury.'],
      // ── Estate / probate ─────────────────────────────────────────────────
      ['will contest', 'A will contest was filed by the disinherited heir.'],
      ['undue influence', 'Undue influence over the testator is alleged.'],
      ['elder abuse', 'Elder abuse and financial exploitation are alleged.'],
      ['conservatorship', 'Conservatorship proceedings are underway.'],
      ['testamentary capacity', 'Testamentary capacity is being challenged.'],
      // ── Immigration ───────────────────────────────────────────────────────
      ['deportation', 'Deportation proceedings have been initiated.'],
      ['asylum', 'The client is seeking asylum.'],
      ['removal', 'Removal has been ordered by the immigration court.'],
      ['detention', 'Immigration detention began last week.'],
      // ── Data privacy / cybersecurity ─────────────────────────────────────
      ['data breach', 'A data breach exposed client records.'],
      ['hipaa', 'The hospital violated HIPAA.'],
      ['gdpr', 'The company failed to comply with GDPR.'],
      ['biometric data', 'Biometric data was collected without consent.'],
    ];

    for (const [keyword, text] of category2Cases) {
      it(`returns Category 2 when "${keyword}" is present`, () => {
        expect(svc.assessRiskCategory(text)).toBe(2);
      });
    }
  });

  // -------------------------------------------------------------------------
  // Role-prefixed NER patterns
  // -------------------------------------------------------------------------

  describe('anonymize() – role-prefixed person detection', () => {
    it('tokenizes a person name preceded by "plaintiff"', () => {
      const result = svc.anonymize('plaintiff John Smith filed the complaint.');
      expect(result.anonymizedText).not.toContain('John Smith');
      expect(result.anonymizedText).toMatch(/PERSON_\d+/);
    });

    it('tokenizes a person name preceded by "defendant"', () => {
      const result = svc.anonymize('defendant Jane Doe responded to interrogatories.');
      expect(result.anonymizedText).not.toContain('Jane Doe');
      expect(result.anonymizedText).toMatch(/PERSON_\d+/);
    });

    it('tokenizes a person name preceded by "client"', () => {
      const result = svc.anonymize('client Robert Brown seeks damages.');
      expect(result.anonymizedText).not.toContain('Robert Brown');
      expect(result.anonymizedText).toMatch(/PERSON_\d+/);
    });

    it('tokenizes a person name preceded by "petitioner"', () => {
      const result = svc.anonymize('petitioner Mary Williams filed for divorce.');
      expect(result.anonymizedText).not.toContain('Mary Williams');
      expect(result.anonymizedText).toMatch(/PERSON_\d+/);
    });

    it('tokenizes a name with capitalized role prefix "Plaintiff"', () => {
      const result = svc.anonymize('Plaintiff John Smith moved for summary judgment.');
      expect(result.anonymizedText).not.toContain('John Smith');
      expect(result.anonymizedText).toMatch(/PERSON_\d+/);
    });

    it('tokenizes a name with uppercase role prefix "DEFENDANT"', () => {
      const result = svc.anonymize('DEFENDANT Jane Doe filed her answer.');
      expect(result.anonymizedText).not.toContain('Jane Doe');
      expect(result.anonymizedText).toMatch(/PERSON_\d+/);
    });
  });
});
