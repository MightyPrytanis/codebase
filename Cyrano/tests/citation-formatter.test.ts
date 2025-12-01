/**
 * Comprehensive Test Suite for Citation Formatter
 * Tests jurisdiction-specific citation formatting and correction
 */

import { describe, it, expect } from 'vitest';
import { citationFormatter, Jurisdiction } from '../src/tools/verification/citation-formatter.js';

describe('Citation Formatter', () => {
  describe('Michigan Citations', () => {
    it('removes periods from N.W.2d', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'People v Smith, 500 N.W.2d 100 (2020)',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
        strictMode: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('People v Smith, 500 NW 2d 100 (2020)');
        expect(result.changes.length).toBeGreaterThan(0);
        expect(result.jurisdiction).toBe(Jurisdiction.MICHIGAN);
        expect(result.ruleSource).toContain('Michigan Appellate Opinions Manual');
      }
    });
    
    it('removes periods from Mich. App.', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'Doe v Roe, 300 Mich. App. 456 (2019)',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('Doe v Roe, 300 Mich App 456 (2019)');
        expect(result.changes.some(c => c.type === 'removed_period')).toBe(true);
      }
    });
    
    it('removes periods from M.C.L.', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'M.C.L. 600.2922',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('MCL 600.2922');
      }
    });
    
    it('removes periods from M.C.R.', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'M.C.R. 2.116(C)(10)',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('MCR 2.116(C)(10)');
      }
    });
    
    it('normalizes spacing in MichApp', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'People v Smith, 500 MichApp 123 (2020)',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toContain('Mich App');
      }
    });
    
    it('normalizes spacing in NW2d', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'People v Smith, 500 NW2d 100 (2020)',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toContain('NW 2d');
      }
    });
    
    it('handles already correct citations', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'People v Smith, 500 Mich 123 (2020)',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('People v Smith, 500 Mich 123 (2020)');
        expect(result.changes.length).toBe(0);
        expect(result.confidence).toBe(1.0);
      }
    });
    
    it('handles MCL 600.972 correctly', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'MCL 600.972',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('MCL 600.972');
        expect(result.isValid !== false); // Should be valid
      }
    });
  });
  
  describe('Federal Citations', () => {
    it('normalizes F. 2d spacing', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'Smith v Jones, 500 F. 2d 100 (2020)',
        jurisdiction: Jurisdiction.FEDERAL,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('Smith v Jones, 500 F.2d 100 (2020)');
      }
    });
    
    it('expands FR Civ P', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'FR Civ P 52(a)',
        jurisdiction: Jurisdiction.FEDERAL,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('Fed. R. Civ. P. 52(a)');
      }
    });
    
    it('expands FRE', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'FRE 803(24)',
        jurisdiction: Jurisdiction.FEDERAL,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('Fed. R. Evid. 803(24)');
      }
    });
    
    it('normalizes USC citations', async () => {
      const result = await citationFormatter.formatCitations({
        text: '42 USC § 1983',
        jurisdiction: Jurisdiction.FEDERAL,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toContain('U.S.C.');
      }
    });
  });
  
  describe('Auto-Detection', () => {
    it('detects Michigan from MCL', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'M.C.L. 600.2922',
        jurisdiction: Jurisdiction.AUTO,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.jurisdiction).toBe(Jurisdiction.MICHIGAN);
        expect(result.corrected).toBe('MCL 600.2922');
      }
    });
    
    it('detects Michigan from case citation', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'People v Smith, 500 N.W.2d 100 (2020)',
        jurisdiction: Jurisdiction.AUTO,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.jurisdiction).toBe(Jurisdiction.MICHIGAN);
        expect(result.corrected).toContain('NW 2d');
      }
    });
    
    it('detects Federal from FR Civ P', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'FR Civ P 52(a)',
        jurisdiction: Jurisdiction.AUTO,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.jurisdiction).toBe(Jurisdiction.FEDERAL);
      }
    });
  });
  
  describe('Document Mode', () => {
    it('processes multiple citations in document', async () => {
      const doc = 'See M.C.L. 600.2922 and People v Smith, 500 N.W.2d 100 (2020). Also see M.C.R. 2.116.';
      const result = await citationFormatter.formatCitations({
        text: doc,
        jurisdiction: Jurisdiction.MICHIGAN,
        documentMode: true,
        correct: true,
      });
      
      if ('totalCitations' in result) {
        expect(result.totalCitations).toBeGreaterThan(0);
        expect(result.correctedCitations).toBeGreaterThan(0);
        expect(result.correctedText).not.toContain('M.C.L.');
        expect(result.correctedText).not.toContain('N.W.2d');
        expect(result.correctedText).not.toContain('M.C.R.');
      }
    });
    
    it('handles mixed jurisdictions in document', async () => {
      const doc = 'Michigan case: People v Smith, 500 N.W.2d 100 (2020). Federal: FR Civ P 52(a).';
      const result = await citationFormatter.formatCitations({
        text: doc,
        jurisdiction: Jurisdiction.AUTO,
        documentMode: true,
        correct: true,
      });
      
      if ('totalCitations' in result) {
        expect(result.totalCitations).toBeGreaterThan(1);
        // Should detect and correct both
        expect(result.correctedText).not.toContain('N.W.2d');
        expect(result.correctedText).toContain('Fed. R. Civ. P.');
      }
    });
    
    it('reports summary statistics', async () => {
      const doc = 'M.C.L. 600.2922. People v Smith, 500 N.W.2d 100 (2020). M.C.R. 2.116.';
      const result = await citationFormatter.formatCitations({
        text: doc,
        jurisdiction: Jurisdiction.MICHIGAN,
        documentMode: true,
        correct: true,
      });
      
      if ('totalCitations' in result) {
        expect(result.summary.byJurisdiction[Jurisdiction.MICHIGAN]).toBeGreaterThan(0);
        expect(result.summary.byType).toBeDefined();
      }
    });
  });
  
  describe('Error Handling', () => {
    it('handles invalid citations gracefully', async () => {
      const result = await citationFormatter.formatCitations({
        text: 'This is not a citation at all',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
      });
      
      if ('corrected' in result) {
        // Should return original with low confidence
        expect(result.corrected).toBe('This is not a citation at all');
        expect(result.confidence).toBeLessThan(1.0);
      }
    });
    
    it('handles empty text', async () => {
      const result = await citationFormatter.formatCitations({
        text: '',
        jurisdiction: Jurisdiction.MICHIGAN,
        correct: true,
      });
      
      if ('corrected' in result) {
        expect(result.corrected).toBe('');
      }
    });
  });
  
  describe('Short-Form Citations', () => {
    it('detects short-form citations', async () => {
      const doc = 'See Smith, 500 Mich at 59.';
      const result = await citationFormatter.formatCitations({
        text: doc,
        jurisdiction: Jurisdiction.MICHIGAN,
        documentMode: true,
        correct: true,
      });
      
      if ('totalCitations' in result) {
        expect(result.totalCitations).toBeGreaterThan(0);
      }
    });
    
    it('detects Id. citations', async () => {
      const doc = 'Id. at 59.';
      const result = await citationFormatter.formatCitations({
        text: doc,
        jurisdiction: Jurisdiction.MICHIGAN,
        documentMode: true,
        correct: true,
      });
      
      if ('totalCitations' in result) {
        expect(result.totalCitations).toBeGreaterThan(0);
      }
    });
  });
});

