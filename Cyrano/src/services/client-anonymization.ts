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
  | 'case'
  | 'vehicle';

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
  vehicle: 'VEHICLE',
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
// US state / territory names
// ---------------------------------------------------------------------------

/**
 * All 50 US states plus DC and the populated territories.  Used to extend the
 * `location` NER pattern so that single-word state names ("Michigan", "Arizona")
 * are caught even though they contain only one capitalised word and would
 * otherwise slip past the person-name pattern.
 *
 * State names are intentionally NOT placed on the `PROPER_NOUN_ALLOWLIST`:
 * while a single state mention is harmless, a specific *combination* of states
 * in a brief (e.g., Michigan + North Carolina + Arizona in a custody matter)
 * can fingerprint a matter and re-identify the parties.  Masking every state
 * reference and restoring them locally is the conservative, privacy-first choice.
 *
 * Each entry is a plain string; spaces are replaced with `\\s+` when the regex
 * is constructed so that "New York" matches across any whitespace.
 */
const US_STATE_NAMES: readonly string[] = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
  // Federal district & territories
  'District of Columbia', 'Puerto Rico', 'Guam', 'American Samoa',
  'United States Virgin Islands',
];

// ---------------------------------------------------------------------------
// Proper-noun allow-list (whitelist)
// ---------------------------------------------------------------------------

/**
 * Well-known, entirely-public proper nouns that carry NO re-identification risk
 * and do NOT need to be anonymized.
 *
 * Any span whose normalised (lowercase + trimmed) text appears here is silently
 * dropped from the token-substitution pipeline even if it matched a broad NER
 * pattern such as the two-capitalised-words person heuristic.
 *
 * Inclusion criteria:
 *   - The phrase refers to a publicly known institutional entity (court, agency,
 *     legislative body) that appears routinely in legal writing.
 *   - Knowing that a brief mentions "Supreme Court" or "Department of Labor"
 *     reveals nothing about the identity of the client or the specific matter.
 *
 * Exclusion criteria:
 *   - State and city names are NOT listed here; see `US_STATE_NAMES` comment.
 *   - Acronyms are handled via `STRATEGY_KEYWORDS` / direct regex patterns
 *     and are not duplicated here.
 */
const PROPER_NOUN_ALLOWLIST: ReadonlySet<string> = new Set([
  // ── US federal courts ───────────────────────────────────────────────────────
  'supreme court', 'united states supreme court',
  'court of appeals', 'united states court of appeals',
  'district court', 'united states district court',
  'circuit court', 'circuit court of appeals',
  'bankruptcy court', 'tax court', 'united states tax court',
  'court of federal claims', 'united states court of federal claims',
  'court of international trade', 'court of claims',
  'immigration court',
  // Numbered circuits
  'first circuit', 'second circuit', 'third circuit', 'fourth circuit',
  'fifth circuit', 'sixth circuit', 'seventh circuit', 'eighth circuit',
  'ninth circuit', 'tenth circuit', 'eleventh circuit', 'dc circuit',
  'federal circuit',
  // ── US government bodies ────────────────────────────────────────────────────
  'united states', 'united states of america',
  'congress', 'united states congress',
  'senate', 'united states senate',
  'house of representatives', 'united states house of representatives',
  'federal government', 'white house',
  'executive branch', 'legislative branch', 'judicial branch',
  // ── Federal departments ─────────────────────────────────────────────────────
  'department of justice', 'department of labor',
  'department of education', 'department of health and human services',
  'department of homeland security', 'department of the treasury',
  'department of defense', 'department of commerce',
  'department of housing and urban development',
  'department of veterans affairs',
  // ── Federal agencies (full names) ───────────────────────────────────────────
  'federal bureau of investigation', 'internal revenue service',
  'social security administration', 'national labor relations board',
  'equal employment opportunity commission',
  'occupational safety and health administration',
  'securities and exchange commission', 'federal trade commission',
  'consumer financial protection bureau', 'drug enforcement administration',
  'bureau of prisons', 'immigration and customs enforcement',
  'customs and border protection',
  'bureau of alcohol tobacco firearms and explosives',
  'centers for disease control and prevention',
  'food and drug administration',
  // ── International courts / bodies ───────────────────────────────────────────
  'international court of justice', 'european court of human rights',
  'international criminal court', 'united nations',
  // ── Non-US countries & common geographic groupings ─────────────────────────
  // (Only the handful that appear most often in US legal writing without
  // carrying case-specific identifying information.)
  'united kingdom', 'european union', 'canada', 'mexico',
  // ── Common legal document labels ────────────────────────────────────────────
  'exhibit a', 'exhibit b', 'exhibit c', 'exhibit d', 'exhibit e',
  'exhibit f', 'exhibit g', 'exhibit h',
]);

// Common English function words that should never be the first word of a
// person-name span.  The general two-capitalised-words heuristic can produce
// false positives like "The Supreme" or "The Court" when an article precedes a
// proper noun.  Filtering on the first token of every person-type span prevents
// those false matches without needing a negative lookahead in the regex itself.
const PERSON_NAME_FUNCTION_WORDS: ReadonlySet<string> = new Set([
  // Articles / determiners
  'the', 'a', 'an', 'this', 'that', 'these', 'those', 'all', 'any', 'each',
  // Prepositions
  'in', 'on', 'at', 'by', 'of', 'to', 'for', 'as', 'with', 'from',
  'into', 'over', 'under', 'above', 'below', 'between',
  // Conjunctions
  'or', 'and', 'but', 'nor', 'so', 'yet',
  // Auxiliary verbs
  'is', 'was', 'are', 'were', 'has', 'have', 'had', 'be', 'been', 'being',
  // Pronouns
  'it', 'its', 'my', 'our', 'your', 'his', 'her', 'we', 'i', 'you', 'he',
  'she', 'they',
  // Other high-frequency non-name starters
  'not', 'no', 'if', 'such', 'both',
]);

// ---------------------------------------------------------------------------
// Vehicle make list
// ---------------------------------------------------------------------------

/**
 * Curated list of vehicle manufacturer names used to anchor the vehicle NER
 * pattern.  A fully generic "model-year + two capitalised words" pattern
 * produces too many false positives in legal text (e.g. "2024 Supreme Court").
 * Anchoring on known makes keeps precision high while covering the vehicles
 * that realistically appear in legal disputes.
 *
 * Each entry is a regex fragment (special chars already escaped); entries are
 * joined with `|` inside a non-capturing group at match time.
 */
const VEHICLE_MAKES: string[] = [
  'Acura', 'Alfa\\s*Romeo', 'Aston\\s*Martin', 'Audi', 'Bentley', 'BMW', 'Bugatti',
  'Buick', 'Cadillac', 'Can-Am', 'Chevrolet', 'Chevy', 'Chrysler', 'Daewoo', 'Dodge',
  'Ducati', 'Ferrari', 'Fiat', 'Ford', 'Freightliner', 'Geo', 'GMC',
  'Harley(?:-Davidson)?', 'Honda', 'Hummer', 'Hyundai', 'Indian', 'Infiniti',
  'International', 'Isuzu', 'Jaguar', 'Jeep', 'Kawasaki', 'Kenworth', 'Kia',
  'Lamborghini', 'Land\\s*Rover', 'Lexus', 'Lincoln', 'Lucid', 'Mack', 'Maserati',
  'Mazda', 'McLaren', 'Mercedes(?:-Benz)?', 'Mercury', 'Mitsubishi', 'Nissan',
  'Oldsmobile', 'Pagani', 'Peterbilt', 'Plymouth', 'Polaris', 'Pontiac', 'Porsche',
  'Ram', 'Range\\s*Rover', 'Renault', 'Rivian', 'Rolls-Royce', 'Saturn', 'Saab',
  'Scion', 'Sea-Doo', 'Shelby', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Triumph',
  'Volkswagen', 'Volvo', 'VW', 'Yamaha',
];

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
      vehicle: 0,
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
      // Location runs BEFORE person so that multi-word geographic proper nouns
      // (e.g. "North Carolina", "New York") are typed as LOCATION rather than
      // being misclassified as person names by the two-capitalised-words heuristic.
      // Single-word state names ("Michigan", "Arizona") are only caught here.
      'location',
      'person',
      'organization',
      'date',
      'money',
      'email',
      'phone',
      'statute',
      'case',
      'vehicle',
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
    const deduped = this.removeOverlaps(spans);

    // Apply the proper-noun allow-list: drop any span whose normalised text is
    // a well-known, entirely-public proper noun that carries no re-identification
    // risk (e.g. "Supreme Court", "United States", "Department of Justice").
    // Also drop person-type spans whose first word is a common English function
    // word (e.g. "The Supreme", "The Court") — those are false positives from
    // the two-capitalised-words heuristic.
    return deduped.filter(s => {
      const lower = s.text.toLowerCase().trim();
      if (PROPER_NOUN_ALLOWLIST.has(lower)) return false;
      if (s.type === 'person') {
        const firstWord = lower.split(/\s+/)[0];
        if (PERSON_NAME_FUNCTION_WORDS.has(firstWord)) return false;
      }
      return true;
    });
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
          // Role-prefixed name references — role word can be lower, Title, or ALL-CAPS.
          // NOTE: The /i flag is intentionally absent; using it would make [A-Z]
          // match lowercase letters and cause the capture group to consume non-name
          // words like "resides" or "filed".  Role-word casings are enumerated
          // explicitly so only the captured name stays case-sensitive.
          /\b(?:plaintiff|Plaintiff|PLAINTIFF|defendant|Defendant|DEFENDANT|respondent|Respondent|RESPONDENT|petitioner|Petitioner|PETITIONER|claimant|Claimant|CLAIMANT|appellant|Appellant|APPELLANT|appellee|Appellee|APPELLEE|client|Client|CLIENT)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
        ];
      case 'organization':
        return [
          /\b([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|LP|LLP|PC|P\.C\.))\b/g,
          /\b([A-Z][A-Za-z\s&]+(?:Company|Group|Associates|Partners|Firm|Law Offices?))\b/g,
          /\b((?:State|County|City|Federal)\s+(?:of\s+)?[A-Z][A-Za-z\s]+(?:Department|Agency|Bureau|Office|Court))\b/g,
        ];
      case 'location':
        return [
          // City, State (e.g. "Detroit, Michigan" or "Detroit, MI")
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+(?:[A-Z]{2}|[A-Z][a-z]+))\b/g,
          // Street addresses
          /\b(\d+\s+[A-Z][A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln))\b/g,
          // Common country names (also on PROPER_NOUN_ALLOWLIST, so filtered after matching)
          /\b(United States|USA|Canada|Mexico|United Kingdom|UK)\b/g,
          // All 50 US states + DC + territories — single and multi-word.
          // These are deliberately NOT on PROPER_NOUN_ALLOWLIST: the specific
          // combination of states in a brief can fingerprint a matter.
          new RegExp(
            `\\b(${US_STATE_NAMES.map(s => s.replace(/ /g, '\\s+')).join('|')})\\b`,
            'g'
          ),
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
      case 'vehicle':
        // ── Vehicle / conveyance identifiers ─────────────────────────────────
        //
        // Catches two distinct patterns:
        //
        // 1. Model-year + make (+ optional model / trim words)
        //    e.g. "1978 Ford Granada", "2019 Toyota Camry XLE",
        //         "2003 Harley-Davidson Softail", "1965 Shelby GT350"
        //
        //    The make list is intentional: a fully generic "year + two
        //    capitalised words" pattern produces too many false positives
        //    in legal text ("2024 Supreme Court", "1994 Amendment Act").
        //    Using known makes keeps precision high while covering the
        //    vehicles that realistically appear in legal disputes.
        //
        // 2. 17-character VINs (North-American standard; I, O, Q excluded
        //    per FMVSS 115 / ISO 3779).
        return [
          // Year + make + optional model/trim — captured as a unit.
          // Model/trim words must start uppercase or be a digit/code (e.g.
          // "Granada", "Camry XLE", "GT350", "F-150") so that lowercase
          // sentence words ("was", "towed") are never absorbed.
          new RegExp(
            `\\b((?:19|20)\\d{2}\\s+(?:${VEHICLE_MAKES.join('|')})` +
              '(?:\\s+[A-Z0-9][A-Za-z0-9\\-]*){0,4})\\b',
            'g'
          ),
          // VIN – 17 chars, chars I/O/Q excluded (per ISO 3779)
          /\b([A-HJ-NPR-Z0-9]{17})\b/g,
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
