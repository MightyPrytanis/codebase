/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileText, Loader2, CheckCircle, AlertCircle, BookOpen, Search } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";
import Header from "@/components/layout/header";

export default function CitationTools() {
  const [documentText, setDocumentText] = useState('');
  const [citations, setCitations] = useState<string[]>([]);
  const [citationInput, setCitationInput] = useState('');
  const [verifyFormat, setVerifyFormat] = useState(true);
  const [verifySource, setVerifySource] = useState(false);
  const [strictMode, setStrictMode] = useState(false);

  const citationMutation = useMutation({
    mutationFn: async () => {
      const citationsToCheck = citations.length > 0 ? citations : [];
      
      const result = await executeCyranoTool('citation_checker', {
        citations: citationsToCheck,
        documentContext: documentText || undefined,
        verifyFormat: verifyFormat,
        verifySource: verifySource,
        strictMode: strictMode,
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Citation check failed');
      }
      
      const parsed = typeof result.content[0]?.text === 'string' 
        ? JSON.parse(result.content[0].text) 
        : result.content[0]?.text;
      
      return parsed;
    },
  });

  const handleAddCitation = () => {
    if (citationInput.trim() && !citations.includes(citationInput.trim())) {
      setCitations([...citations, citationInput.trim()]);
      setCitationInput('');
    }
  };

  const handleRemoveCitation = (citation: string) => {
    setCitations(citations.filter(c => c !== citation));
  };

  const handleExtractCitations = () => {
    if (!documentText.trim()) return;
    
    // Simple extraction pattern for legal citations
    const legalCitationRegex = /\d+\s+[A-Z][A-Za-z.]+\s+\d+(?:,\s+\d+)?/g;
    const found = documentText.match(legalCitationRegex) || [];
    const unique = Array.from(new Set(found));
    setCitations([...citations, ...unique.filter(c => !citations.includes(c))]);
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-accent-gold" />
              Citation Tools
            </h1>
            <p className="text-secondary">
              Verify and validate citations in legal documents
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray">
              <h2 className="text-xl font-bold text-primary mb-4">Document & Citations</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Document Text (optional context)
                  </label>
                  <textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="Paste document text here for context checking..."
                    className="w-full h-48 px-4 py-2 bg-navy border border-border-gray rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent-gold"
                  />
                  {documentText.trim() && (
                    <button
                      onClick={handleExtractCitations}
                      className="mt-2 text-sm text-accent-gold hover:text-gold-light flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Extract citations from document
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Citations to Check
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={citationInput}
                      onChange={(e) => setCitationInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCitation()}
                      placeholder="Enter citation (e.g., 123 U.S. 456)"
                      className="flex-1 px-4 py-2 bg-navy border border-border-gray rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent-gold"
                    />
                    <button
                      onClick={handleAddCitation}
                      className="px-4 py-2 bg-accent-gold text-navy rounded-lg hover:bg-gold-light transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {citations.length > 0 && (
                    <div className="space-y-2">
                      {citations.map((citation, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-navy px-3 py-2 rounded border border-border-gray">
                          <span className="text-primary text-sm">{citation}</span>
                          <button
                            onClick={() => handleRemoveCitation(citation)}
                            className="text-alert-red hover:text-red-400 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-border-gray">
                  <h3 className="text-sm font-medium text-primary">Validation Options</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifyFormat}
                      onChange={(e) => setVerifyFormat(e.target.checked)}
                      className="w-4 h-4 text-accent-gold rounded focus:ring-accent-gold"
                    />
                    <span className="text-secondary text-sm">Verify citation format</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifySource}
                      onChange={(e) => setVerifySource(e.target.checked)}
                      className="w-4 h-4 text-accent-gold rounded focus:ring-accent-gold"
                    />
                    <span className="text-secondary text-sm">Verify source accessibility</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strictMode}
                      onChange={(e) => setStrictMode(e.target.checked)}
                      className="w-4 h-4 text-accent-gold rounded focus:ring-accent-gold"
                    />
                    <span className="text-secondary text-sm">Use strict validation rules</span>
                  </label>
                </div>

                <button
                  onClick={() => citationMutation.mutate()}
                  disabled={citations.length === 0 || citationMutation.isPending}
                  className="w-full px-6 py-3 bg-accent-gold text-navy rounded-lg font-semibold hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {citationMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking Citations...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Check Citations
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray">
              <h2 className="text-xl font-bold text-primary mb-4">Validation Results</h2>
              
              {citationMutation.isPending && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
                </div>
              )}

              {citationMutation.isError && (
                <div className="bg-alert-red bg-opacity-20 border border-alert-red rounded-lg p-4">
                  <div className="flex items-center gap-2 text-alert-red mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Error</span>
                  </div>
                  <p className="text-secondary text-sm">
                    {citationMutation.error instanceof Error 
                      ? citationMutation.error.message
                      : 'An error occurred while checking citations'}
                  </p>
                </div>
              )}

              {citationMutation.data && (
                <div className="space-y-4">
                  {citationMutation.data.summary && (
                    <div className="bg-navy rounded-lg p-4 border border-border-gray">
                      <h3 className="text-sm font-semibold text-primary mb-3">Summary</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-secondary">Total:</span>
                          <span className="text-primary font-bold ml-2">{citationMutation.data.summary.total}</span>
                        </div>
                        <div>
                          <span className="text-light-green">Valid:</span>
                          <span className="text-primary font-bold ml-2">{citationMutation.data.summary.valid}</span>
                        </div>
                        <div>
                          <span className="text-alert-red">Invalid:</span>
                          <span className="text-primary font-bold ml-2">{citationMutation.data.summary.invalid}</span>
                        </div>
                        <div>
                          <span className="text-yellow-400">Partial:</span>
                          <span className="text-primary font-bold ml-2">{citationMutation.data.summary.partial}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {citationMutation.data.validations && citationMutation.data.validations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-primary">Individual Validations</h3>
                      {citationMutation.data.validations.map((validation: any, idx: number) => (
                        <div key={idx} className="bg-navy rounded-lg p-4 border border-border-gray">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-primary font-medium text-sm">{validation.citation}</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              validation.status === 'valid' ? 'bg-light-green bg-opacity-20 text-light-green' :
                              validation.status === 'invalid' ? 'bg-alert-red bg-opacity-20 text-alert-red' :
                              validation.status === 'partial' ? 'bg-yellow-400 bg-opacity-20 text-yellow-400' :
                              'bg-gray-600 bg-opacity-20 text-gray-400'
                            }`}>
                              {validation.status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          </div>
                          {validation.errors && validation.errors.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {validation.errors.map((error: string, errIdx: number) => (
                                <p key={errIdx} className="text-alert-red text-xs">• {error}</p>
                              ))}
                            </div>
                          )}
                          {validation.warnings && validation.warnings.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {validation.warnings.map((warning: string, warnIdx: number) => (
                                <p key={warnIdx} className="text-yellow-400 text-xs">⚠ {warning}</p>
                              ))}
                            </div>
                          )}
                          {validation.format && (
                            <p className="text-secondary text-xs mt-2">Format: {validation.format}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {citationMutation.data.metadata && (
                    <div className="mt-4 pt-4 border-t border-border-gray">
                      <p className="text-secondary text-xs">
                        Processing time: {citationMutation.data.metadata.processingTime}ms
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!citationMutation.data && !citationMutation.isPending && !citationMutation.isError && (
                <div className="text-center py-12 text-secondary">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Add citations and click "Check Citations" to validate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

