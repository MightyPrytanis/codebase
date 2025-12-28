/**
 * Core Values Definition
 * 
 * Fundamental values that guide The Ten Rules for Ethical AI/Human Interactions
 * Version 1.4 — Revised and updated 16 December 2025
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Core Values
 * 
 * We believe that the intended and best use of information technology, including 
 * devices (hardware) and applications (software), is the advancement of knowledge 
 * and the promotion of human flourishing by serving the needs of users. We are 
 * committed to creating and promoting technology that prioritizes:
 */
export const CORE_VALUES = {
  version: '1.4',
  revisionDate: '16 December 2025',
  values: [
    {
      id: 'truth',
      name: 'Truth and Factual Accuracy',
      description: 'Prioritize truth and factual accuracy in all interactions. Only assert verifiable facts.',
      principles: [
        'Observable, verifiable facts only',
        'No fabrication or hallucination',
        'Clear distinction between fact and speculation',
      ],
    },
    {
      id: 'user_sovereignty',
      name: 'User Sovereignty',
      description: 'Respect user autonomy and provide user control over their data and interactions.',
      principles: [
        'User autonomy and self-determination',
        'User control over data and interactions',
        'Avoid manipulation or coercion',
      ],
    },
    {
      id: 'transparency',
      name: 'Transparency',
      description: 'Disclose AI limitations, explain reasoning, and provide audit trails.',
      principles: [
        'Disclose AI limitations',
        'Explain AI reasoning processes',
        'Provide audit trails for decisions',
        'Transparent about conflicts of interest',
      ],
    },
    {
      id: 'portability',
      name: 'Portability',
      description: 'Enable users to move their data and interactions between systems.',
      principles: [
        'Data portability',
        'Interoperability',
        'User control over data migration',
      ],
    },
    {
      id: 'value',
      name: 'Value',
      description: 'Provide genuine value to users and avoid waste.',
      principles: [
        'Genuine value delivery',
        'Avoid waste and inefficiency',
        'Optimize for user benefit',
      ],
    },
    {
      id: 'sustainability',
      name: 'Sustainability',
      description: 'Consider environmental impact and optimize resource usage.',
      principles: [
        'Environmental responsibility',
        'Resource optimization',
        'Long-term sustainability',
      ],
    },
  ],
} as const;

/**
 * Get value by ID
 */
export function getValueById(id: string) {
  return CORE_VALUES.values.find(v => v.id === id);
}

/**
 * Get all value IDs
 */
export function getValueIds(): string[] {
  return CORE_VALUES.values.map(v => v.id);
}

/**
 * Export as JSON for use in modules
 */
export const VALUES_JSON = JSON.stringify(CORE_VALUES, null, 2);
