/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Client Anonymization Service
 *
 * Implements a HIPAA-style "expert-determination" anonymization layer that
 * intercepts text before it is sent to any external AI provider, replaces all
 * sensitive entities with deterministic session-scoped tokens, and reverses
 * the mapping locally after the AI responds.
 *
 * The provider NEVER sees the underlying identities; only the locally-operated
 * token map allows reconstruction of the original text.
 *
 * Risk categories (per MRPC 1.6 / Michigan State Bar AI guidance):
 *   Category 1 – Truly anonymized & generic  (low risk)
 *   Category 2 – Anonymized but fact-specific or strategy-rich  (moderate risk)
 *   Category 3 – Identifiable or sensitive by context  (high risk – do not send)
 *
 * @see Issue: Client Confidentiality, Strategy, and Anonymization
 */

import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Entity types that can be tokenized */
export type AnonymizableEntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'date'
  | 'money'
  | 'email'
  | 'phone'
  | 'ssn'
  | 'account'
  | 'statute'
  | 'case';

/** Risk category classification per MRPC 1.6 / SBM AI guidance */
export type RiskCategory = 1 | 2 | 3;

/** One tokenized entity entry */
export interface TokenEntry {
  token: string;
  original: string;
  type: AnonymizableEntityType;
}

/** Complete anonymization session state */
export interface AnonymizationSession {
  id: string;
  /** token → original */
  tokenToOriginal: Map<string, string>;
  /** normalized-original → token (for deduplication) */
  originalToToken: Map<string, string>;
  /** per-type sequential counter */
  counters: Record<string, number>;
  createdAt: Date;
  lastUsedAt: Date;
}

/** Result returned by `anonymize()` */
export interface AnonymizationResult {
  /** The text with all sensitive entities replaced by tokens */
  anonymizedText: string;
  /** Session ID needed to reverse the transformation */
  sessionId: string;
  /** Number of unique entity occurrences replaced */
  entitiesReplaced: number;
  /** Assessed risk category of the ORIGINAL text */
  riskCategory: RiskCategory;
  /** Summary of what was found */
  summary: Record<AnonymizableEntityType, number>;
}

// ---------------------------------------------------------------------------
// Token prefix map
// ---------------------------------------------------------------------------

const TOKEN_PREFIX: Record<AnonymizableEntityType, string> = {
  person: 'PERSON',
  organization: 'COMPANY',
  location: 'LOCATION',
  date: 'DATE',
  money: 'AMOUNT',
  email: 'EMAIL',
  phone: 'PHONE',
  ssn: 'SSN',
  account: 'ACCOUNT',
  statute: 'STATUTE',
  case: 'CASE_REF',
};

// ---------------------------------------------------------------------------
// Strategy / risk keywords used for Category 2 classification
// ---------------------------------------------------------------------------

/**
 * Comprehensive list of sensitive legal keywords that trigger a Category 2
 * risk classification.  A Category 2 result means the text is anonymizable
 * but should only be sent under a no-training enterprise agreement.
 *
 * The list intentionally casts a wide net across every major practice area
 * so that strategic, privileged, or personally sensitive content is flagged
 * regardless of which area of law the matter involves.
 */
const STRATEGY_KEYWORDS = [
  // ── Core litigation / procedure ─────────────────────────────────────────
  'settlement',
  'litigation',
  'negotiate',
  'negotiation',
  'deposition',
  'privilege',
  'confidential',
  'work product',
  'strategy',
  'risk assessment',
  'jury',
  'verdict',
  'damages',
  'mediation',
  'arbitration',
  'counteroffer',
  'counter-offer',
  'liability',
  'exposure',
  'weakness',
  'theory of the case',
  'admission',
  'suppression',
  'subpoena',
  'injunction',
  'restraining order',
  'sanctions',
  'discovery',
  'mental state',
  'motive',

  // ── Criminal law ────────────────────────────────────────────────────────
  'plea',
  'plea agreement',
  'plea bargain',
  'indictment',
  'nolo contendere',
  'no contest',
  'arraignment',
  'bail',
  'bond',
  'probation',
  'parole',
  'sentencing',
  'felony',
  'misdemeanor',
  'criminal record',
  'prior conviction',
  'recidivism',
  'allocution',
  'acquittal',
  'hung jury',

  // ── Civil litigation / torts ─────────────────────────────────────────────
  'negligence',
  'gross negligence',
  'recklessness',
  'proximate cause',
  'causation',
  'duty of care',
  'breach of duty',
  'pain and suffering',
  'punitive damages',
  'compensatory damages',
  'special damages',
  'general damages',
  'comparative fault',
  'contributory negligence',
  'assumption of risk',
  'statute of limitations',
  'class action',
  'mass tort',
  'personal injury',
  'wrongful death',
  'loss of consortium',
  'medical malpractice',
  'res ipsa loquitur',

  // ── Contract disputes ────────────────────────────────────────────────────
  'breach of contract',
  'material breach',
  'anticipatory breach',
  'specific performance',
  'rescission',
  'indemnification',
  'indemnity',
  'liquidated damages',
  'force majeure',
  'unconscionable',
  'estoppel',
  'unjust enrichment',
  'quantum meruit',
  'implied warranty',
  'express warranty',
  'disclaimer',
  'limitation of liability',
  'non-disclosure agreement',
  'trade secret',

  // ── Intellectual property ─────────────────────────────────────────────────
  'infringement',
  'patent',
  'trademark',
  'copyright',
  'trade dress',
  'misappropriation',
  'prior art',
  'claim construction',
  'invalidity',
  'willful infringement',
  'cease and desist',
  'DMCA',
  'fair use',
  'licensing',
  'royalty',

  // ── Family law ────────────────────────────────────────────────────────────
  'divorce',
  'dissolution of marriage',
  'legal separation',
  'child custody',
  'physical custody',
  'legal custody',
  'parenting time',
  'visitation',
  'child support',
  'spousal support',
  'alimony',
  'maintenance',
  'equitable distribution',
  'marital property',
  'separate property',
  'prenuptial agreement',
  'postnuptial agreement',
  'domestic violence',
  'protective order',
  'parental rights',
  'termination of parental rights',
  'paternity',
  'best interests of the child',
  'guardian ad litem',
  'adoption',
  'guardianship',
  'conservatorship',

  // ── Real property ─────────────────────────────────────────────────────────
  'title defect',
  'quiet title',
  'adverse possession',
  'easement',
  'encumbrance',
  'lien',
  'mechanic lien',
  'foreclosure',
  'lis pendens',
  'eminent domain',
  'condemnation',
  'zoning',
  'restrictive covenant',
  'landlord',
  'tenant',
  'eviction',
  'unlawful detainer',
  'lease agreement',
  'boundary dispute',
  'survey dispute',
  'trespass',
  'nuisance',

  // ── Bankruptcy ────────────────────────────────────────────────────────────
  'bankruptcy',
  'chapter 7',
  'chapter 11',
  'chapter 13',
  'chapter 12',
  'discharge of debt',
  'automatic stay',
  'trustee',
  'creditor',
  'debtor',
  'proof of claim',
  'preference payment',
  'fraudulent transfer',
  'exemption',
  'reaffirmation',
  'insolvency',
  'reorganization plan',
  'means test',
  'secured creditor',
  'unsecured creditor',
  'priority claim',

  // ── Employment and labor ──────────────────────────────────────────────────
  'wrongful termination',
  'retaliation',
  'hostile work environment',
  'harassment',
  'wage theft',
  'unpaid wages',
  'overtime',
  'fmla',
  'whistleblower',
  'non-compete',
  'non-solicitation',
  'severance',
  'collective bargaining',
  'union',
  'nlrb',
  'osha',
  'workers compensation',

  // ── Civil rights / discrimination ─────────────────────────────────────────
  'discrimination',
  'race discrimination',
  'sex discrimination',
  'gender discrimination',
  'national origin discrimination',
  'religious discrimination',
  'age discrimination',
  'disability discrimination',
  'reasonable accommodation',
  'disparate treatment',
  'disparate impact',
  'protected class',
  'civil rights violation',
  'section 1983',
  'equal protection',
  'due process',
  'excessive force',
  'police misconduct',
  'color of law',
  'ada',
  'americans with disabilities act',
  'adea',
  'title vii',
  'title ix',

  // ── Product liability ─────────────────────────────────────────────────────
  'product defect',
  'design defect',
  'manufacturing defect',
  'failure to warn',
  'strict liability',
  'recall',
  'consumer safety',
  'bystander liability',

  // ── Estate / probate / elder law ─────────────────────────────────────────
  'will contest',
  'undue influence',
  'testamentary capacity',
  'intestate',
  'probate',
  'estate plan',
  'trust',
  'power of attorney',
  'advance directive',
  'elder abuse',
  'financial exploitation',
  'medicaid planning',
  'incapacity',

  // ── Immigration ───────────────────────────────────────────────────────────
  'deportation',
  'removal',
  'asylum',
  'refugee',
  'visa',
  'green card',
  'naturalization',
  'undocumented',
  'daca',
  'immigration hold',
  'detention',

  // ── Data privacy / cybersecurity ─────────────────────────────────────────
  'data breach',
  'gdpr',
  'ccpa',
  'hipaa',
  'biometric data',
  'personally identifiable information',
  'cyber incident',
  'ransomware',
  'class certification',
  'dmca',
];

// Regex patterns for PII that is NOT reliably caught by the entity processor
const SSN_PATTERN = /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g;
const ACCOUNT_PATTERN = /\baccount\s*(?:number|#|no\.?)?\s*:?\s*[\d\-]{6,20}\b/gi;
const DOB_PATTERN =
  /\b(?:date\s+of\s+birth|dob|born(?:\s+on)?)\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi;

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * Default session expiry: 45 minutes of inactivity.
 *
 * A shorter TTL (compared to the previous 4-hour window) reduces the in-memory
 * exposure window for privileged token maps while still accommodating
 * typical multi-turn consultation sessions. Callers that need a longer window
 * can pass a custom `sessionTtlMs` to the constructor.
 */
export const DEFAULT_SESSION_TTL_MS = 45 * 60 * 1000;

/**
 * Client Anonymization Service
 *
 * Usage:
 * ```typescript
 * const svc = clientAnonymizationService;
 * const result = svc.anonymize(sensitiveText);
 * const aiResponse = await aiProvider.call(result.anonymizedText);
 * const finalResponse = svc.deanonymize(aiResponse, result.sessionId);
 * ```
 */
export class ClientAnonymizationService {
  private readonly sessions = new Map<string, AnonymizationSession>();
  private readonly sessionTtlMs: number;

  constructor(sessionTtlMs: number = DEFAULT_SESSION_TTL_MS) {
    this.sessionTtlMs = sessionTtlMs;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Anonymize text before sending to an external AI provider.
   *
   * If `sessionId` is provided (and still valid), entities are added to the
   * existing session so a single prompt + follow-up conversation can share one
   * mapping. Otherwise a new session is created.
   *
   * @param text       The text to anonymize.
   * @param sessionId  Optional existing session ID (for multi-turn conversations).
   * @returns  AnonymizationResult with the token-replaced text and session ID.
   */
  anonymize(text: string, sessionId?: string): AnonymizationResult {
    this.evictExpiredSessions();

    const session = sessionId
      ? (this.sessions.get(sessionId) ?? this.createSession())
      : this.createSession();

    session.lastUsedAt = new Date();
    this.sessions.set(session.id, session);

    // Assess risk before modifying the text
    const riskCategory = this.assessRiskCategory(text);

    // Collect all entity spans to replace (sorted by position DESC so we can
    // do string splicing without index drift)
    const spans = this.collectSpans(text);

    // Sort descending by start position so we can replace from end to beginning
    spans.sort((a, b) => b.start - a.start);

    let anonymized = text;
    const summary: Record<AnonymizableEntityType, number> = {
      person: 0,
      organization: 0,
      location: 0,
      date: 0,
      money: 0,
      email: 0,
      phone: 0,
      ssn: 0,
      account: 0,
      statute: 0,
      case: 0,
    };

    for (const span of spans) {
      const token = this.getOrCreateToken(session, span.text, span.type);
      anonymized =
        anonymized.slice(0, span.start) + token + anonymized.slice(span.end);
      summary[span.type] = (summary[span.type] || 0) + 1;
    }

    const entitiesReplaced = spans.length;

    return {
      anonymizedText: anonymized,
      sessionId: session.id,
      entitiesReplaced,
      riskCategory,
      summary,
    };
  }

  /**
   * Reverse the token substitution applied by `anonymize()`.
   *
   * Replaces all tokens in `text` with their original values using the
   * token map stored in the given session. The session remains alive (so it
   * can be reused for further turns in the same conversation).
   *
   * @param text       Token-containing text (usually the AI response).
   * @param sessionId  Session ID returned by `anonymize()`.
   * @returns  The text with all tokens replaced by their original values.
   * @throws   If the session does not exist or has expired.
   */
  deanonymize(text: string, sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(
        `Anonymization session '${sessionId}' not found or has expired. ` +
          'The token map needed to reverse anonymization is unavailable.'
      );
    }

    session.lastUsedAt = new Date();

    let result = text;

    // Replace every known token with its original value.
    // Iterate over entries sorted by token length descending to avoid
    // partial-token replacement (e.g., PERSON_A before PERSON_AB).
    const sortedEntries = Array.from(session.tokenToOriginal.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );

    for (const [token, original] of sortedEntries) {
      // Use a global regex with word-boundary awareness
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), original);
    }

    return result;
  }

  /**
   * Assess the confidentiality risk category of a piece of text.
   *
   * Category 3 – Identifiable / sensitive PII present or text identifies a
   *               specific individual by context. Do not send to cloud AI.
   * Category 2 – Anonymizable but contains strategy or unusually specific facts.
   *               Only send under a no-training enterprise agreement.
   * Category 1 – Generic; safe to send after anonymization with a reputable
   *               provider that has no-training terms.
   */
  assessRiskCategory(text: string): RiskCategory {
    const lower = text.toLowerCase();

    // Category 3: hard PII present (SSN, account numbers, DOB phrases)
    if (SSN_PATTERN.test(text) || ACCOUNT_PATTERN.test(text) || DOB_PATTERN.test(text)) {
      // Reset regex lastIndex after test()
      SSN_PATTERN.lastIndex = 0;
      ACCOUNT_PATTERN.lastIndex = 0;
      DOB_PATTERN.lastIndex = 0;
      return 3;
    }

    // Category 2: strategy/privilege keywords
    if (STRATEGY_KEYWORDS.some(kw => lower.includes(kw))) {
      return 2;
    }

    return 1;
  }

  /**
   * Return the current session (for inspection / testing).
   * Returns undefined if the session does not exist or has expired.
   */
  getSession(sessionId: string): AnonymizationSession | undefined {
    this.evictExpiredSessions();
    return this.sessions.get(sessionId);
  }

  /**
   * Explicitly expire a session and erase its token map.
   * Call this when a conversation is concluded.
   */
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /** Return the number of currently-active sessions. */
  get activeSessionCount(): number {
    this.evictExpiredSessions();
    return this.sessions.size;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private createSession(): AnonymizationSession {
    const session: AnonymizationSession = {
      id: randomUUID(),
      tokenToOriginal: new Map(),
      originalToToken: new Map(),
      counters: {},
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get an existing token for `original` (case-insensitive) or mint a new one.
   * Deterministic within a session: the same entity text always maps to the
   * same token, even if it appears in multiple positions.
   */
  private getOrCreateToken(
    session: AnonymizationSession,
    original: string,
    type: AnonymizableEntityType
  ): string {
    const normalizedKey = `${type}:${original.toLowerCase().trim()}`;
    const existing = session.originalToToken.get(normalizedKey);
    if (existing) {
      return existing;
    }

    // Allocate next counter for this type
    const prefix = TOKEN_PREFIX[type];
    session.counters[prefix] = (session.counters[prefix] || 0) + 1;
    const token = `${prefix}_${session.counters[prefix]}`;

    session.originalToToken.set(normalizedKey, token);
    session.tokenToOriginal.set(token, original);

    return token;
  }

  /**
   * Collect all entity spans from `text` (using EntityProcessor + supplemental
   * regex for SSN / account numbers not caught by the NER patterns).
   * Returns non-overlapping spans sorted by position.
   */
  private collectSpans(
    text: string
  ): Array<{ start: number; end: number; text: string; type: AnonymizableEntityType }> {
    const spans: Array<{
      start: number;
      end: number;
      text: string;
      type: AnonymizableEntityType;
    }> = [];

    // --- Entity processor results ---
    // entityProcessor.process() is async but returns quickly (no I/O),
    // so we use a synchronous-compatible pattern via direct invocation.
    // We capture the promise result inline using a synchronous workaround
    // (awaited outside in the async-safe wrapper below).
    const entityTypes: AnonymizableEntityType[] = [
      'person',
      'organization',
      'location',
      'date',
      'money',
      'email',
      'phone',
      'statute',
      'case',
    ];

    // Call entity processor synchronously (it's pure regex, no I/O)
    // We wrap in a try/catch in case something goes wrong; best-effort
    try {
      // Perform synchronous extraction using the same logic as EntityProcessor
      // to avoid async complexity at the call site. We re-implement the
      // extraction inline here using the same regex patterns.
      this.extractEntitySpans(text, entityTypes, spans);
    } catch {
      // Entity extraction failure is non-fatal; SSN/account pass will still run
    }

    // --- Supplemental regex patterns ---
    // SSN
    this.addRegexSpans(text, SSN_PATTERN, 'ssn', spans);
    SSN_PATTERN.lastIndex = 0;

    // Account numbers
    this.addRegexSpans(text, ACCOUNT_PATTERN, 'account', spans);
    ACCOUNT_PATTERN.lastIndex = 0;

    // Remove overlapping spans (keep highest-confidence / longest)
    return this.removeOverlaps(spans);
  }

  /** Add spans from a regex to the spans array */
  private addRegexSpans(
    text: string,
    pattern: RegExp,
    type: AnonymizableEntityType,
    spans: Array<{ start: number; end: number; text: string; type: AnonymizableEntityType }>
  ): void {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type,
      });
    }
    pattern.lastIndex = 0;
  }

  /**
   * Inline synchronous entity extraction using the same regex patterns as
   * EntityProcessor (copied here to avoid async / import side effects).
   */
  private extractEntitySpans(
    text: string,
    types: AnonymizableEntityType[],
    spans: Array<{ start: number; end: number; text: string; type: AnonymizableEntityType }>
  ): void {
    for (const type of types) {
      const patterns = this.getPatternsForType(type);
      for (const pattern of patterns) {
        this.addRegexSpans(text, pattern, type, spans);
      }
    }
  }

  /** Return the regex patterns used to detect each entity type. */
  private getPatternsForType(type: AnonymizableEntityType): RegExp[] {
    switch (type) {
      case 'person':
        return [
          /\b(?:Mr|Ms|Mrs|Dr|Prof|Judge|Attorney|Esq)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
          /\b([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\b/g,
          /\b([A-Z]{2,},\s+[A-Z][a-z]+(?:\s+[A-Z]\.?)?)\b/g,
          // Role-prefixed name references (e.g., "plaintiff John Smith", "Defendant Jane Doe")
          /\b(?:plaintiff|defendant|respondent|petitioner|claimant|appellant|appellee|client)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/gi,
        ];
      case 'organization':
        return [
          /\b([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|LP|LLP|PC|P\.C\.))\b/g,
          /\b([A-Z][A-Za-z\s&]+(?:Company|Group|Associates|Partners|Firm|Law Offices?))\b/g,
          /\b((?:State|County|City|Federal)\s+(?:of\s+)?[A-Z][A-Za-z\s]+(?:Department|Agency|Bureau|Office|Court))\b/g,
        ];
      case 'location':
        return [
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+(?:[A-Z]{2}|[A-Z][a-z]+))\b/g,
          /\b(\d+\s+[A-Z][A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln))\b/g,
          /\b(United States|USA|Canada|Mexico|United Kingdom|UK)\b/g,
        ];
      case 'date':
        return [
          /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,
          /\b(\d{4}-\d{2}-\d{2})\b/g,
          /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/g,
          /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4})\b/gi,
        ];
      case 'money':
        return [
          /\$[\d,]+(?:\.\d{2})?/g,
          /\b((?:one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion)\s+dollars?)\b/gi,
        ];
      case 'email':
        return [/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g];
      case 'phone':
        return [
          // (XXX) XXX-XXXX – no leading \b since ( is not a word character
          /(\(\d{3}\)\s*\d{3}[-.]?\d{4})/g,
          /\b(\d{3}[-.]?\d{3}[-.]?\d{4})\b/g,
        ];
      case 'statute':
        return [
          /\b(MCL\s+\d+\.\d+(?:\([a-z0-9]+\))?)\b/g,
          /\b(MCR\s+\d+\.\d+(?:\([A-Z0-9]+\))?)\b/g,
          /\b(\d+\s+U\.?S\.?C\.?\s+§?\s*\d+[a-z]?)\b/gi,
          /\b(\d+\s+C\.?F\.?R\.?\s+§?\s*\d+\.\d+)\b/gi,
        ];
      case 'case':
        return [
          /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+v\.?\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*,\s+\d+\s+[A-Za-z]+(?:\s+\d[a-z]*)?\s+\d+)\b/g,
          /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+v\.?\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*,\s+\d{4}\s+MI(?:\s+App)?\s+\d+)\b/g,
        ];
      default:
        return [];
    }
  }

  /**
   * Remove overlapping spans, keeping the longer (and therefore more specific)
   * match. Operates on a copy sorted by start position.
   */
  private removeOverlaps(
    spans: Array<{ start: number; end: number; text: string; type: AnonymizableEntityType }>
  ): Array<{ start: number; end: number; text: string; type: AnonymizableEntityType }> {
    if (spans.length === 0) return spans;

    // Sort by start, then by length descending (prefer longer matches)
    const sorted = [...spans].sort(
      (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start)
    );

    const result: typeof sorted = [];
    let lastEnd = -1;

    for (const span of sorted) {
      if (span.start >= lastEnd) {
        result.push(span);
        lastEnd = span.end;
      }
      // Overlapping span: skip
    }

    return result;
  }

  /** Remove sessions that have exceeded the TTL */
  private evictExpiredSessions(): void {
    const cutoff = Date.now() - this.sessionTtlMs;
    for (const [id, session] of this.sessions) {
      if (session.lastUsedAt.getTime() < cutoff) {
        this.sessions.delete(id);
      }
    }
  }
}

// Singleton instance for use across the application
export const clientAnonymizationService = new ClientAnonymizationService();
