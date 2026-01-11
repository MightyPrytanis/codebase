/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileText, Loader2, CheckCircle, AlertCircle, GitCompare, Scale } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";
import Header from "@/components/layout/header";

type ComparisonType = 
  | 'structural'
  | 'content'
  | 'risk_analysis'
  | 'obligations'
  | 'choice_of_law'
  | 'financial'
  | 'rights_remedies'
  | 'term_termination'
  | 'comprehensive';

export default function DocumentComparison() {
  const [doc1, setDoc1] = useState('');
  const [doc2, setDoc2] = useState('');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('comprehensive');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [focusInput, setFocusInput] = useState('');

  const comparisonMutation = useMutation({
    mutationFn: async () => {
      const result = await executeCyranoTool('contract_comparator', {
        document1: doc1,
        document2: doc2,
        comparison_type: comparisonType,
        focus_areas: focusAreas.length > 0 ? focusAreas : undefined,
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Document comparison failed');
      }
      
      const parsed = typeof result.content[0]?.text === 'string' 
        ? JSON.parse(result.content[0].text) 
        : result.content[0]?.text;
      
      return parsed;
    },
  });

  const handleAddFocusArea = () => {
    if (focusInput.trim() && !focusAreas.includes(focusInput.trim())) {
      setFocusAreas([...focusAreas, focusInput.trim()]);
      setFocusInput('');
    }
  };

  const handleRemoveFocusArea = (area: string) => {
    setFocusAreas(focusAreas.filter(a => a !== area));
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
              <GitCompare className="w-8 h-8 text-accent-gold" />
              Document Comparison
            </h1>
            <p className="text-secondary">
              Compare legal documents for differences, risks, and key terms
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Document 1 */}
            <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-aqua" />
                Document 1
              </h2>
              <textarea
                value={doc1}
                onChange={(e) => setDoc1(e.target.value)}
                placeholder="Paste first document text here..."
                className="w-full h-64 px-4 py-2 bg-navy border border-border-gray rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent-gold font-mono text-sm"
              />
              {doc1 && (
                <p className="text-secondary text-xs mt-2">
                  {doc1.length} characters
                </p>
              )}
            </div>

            {/* Document 2 */}
            <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-aqua" />
                Document 2
              </h2>
              <textarea
                value={doc2}
                onChange={(e) => setDoc2(e.target.value)}
                placeholder="Paste second document text here..."
                className="w-full h-64 px-4 py-2 bg-navy border border-border-gray rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent-gold font-mono text-sm"
              />
              {doc2 && (
                <p className="text-secondary text-xs mt-2">
                  {doc2.length} characters
                </p>
            </div>
          </div>

          {/* Comparison Settings */}
          <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray mb-6">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent-gold" />
              Comparison Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Comparison Type
                </label>
                <select
                  value={comparisonType}
                  onChange={(e) => setComparisonType(e.target.value as ComparisonType)}
                  className="w-full px-4 py-2 bg-navy border border-border-gray rounded-lg text-primary focus:outline-none focus:border-accent-gold"
                >
                  <option value="comprehensive">Comprehensive (All Analyses)</option>
                  <option value="structural">Structural Differences</option>
                  <option value="content">Content Differences</option>
                  <option value="risk_analysis">Risk Analysis</option>
                  <option value="obligations">Obligations Analysis</option>
                  <option value="choice_of_law">Choice of Law</option>
                  <option value="financial">Financial Terms</option>
                  <option value="rights_remedies">Rights & Remedies</option>
                  <option value="term_termination">Term & Termination</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Focus Areas (optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={focusInput}
                    onChange={(e) => setFocusInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFocusArea()}
                    placeholder="Enter focus area (e.g., 'payment terms')"
                    className="flex-1 px-4 py-2 bg-navy border border-border-gray rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent-gold"
                  />
                  <button
                    onClick={handleAddFocusArea}
                    className="px-4 py-2 bg-accent-gold text-navy rounded-lg hover:bg-gold-light transition-colors"
                  >
                    Add
                  </button>
                </div>
                {focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-navy border border-border-gray rounded-full text-sm text-primary"
                      >
                        {area}
                        <button
                          onClick={() => handleRemoveFocusArea(area)}
                          className="text-alert-red hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => comparisonMutation.mutate()}
              disabled={!doc1.trim() || !doc2.trim() || comparisonMutation.isPending}
              className="w-full mt-6 px-6 py-3 bg-accent-gold text-navy rounded-lg font-semibold hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {comparisonMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Comparing Documents...
                </>
              ) : (
                <>
                  <GitCompare className="w-5 h-5" />
                  Compare Documents
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {comparisonMutation.data && (
            <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray">
              <h2 className="text-xl font-bold text-primary mb-4">Comparison Results</h2>
              
              <div className="space-y-6">
                {comparisonMutation.data.similarity_score !== undefined && (
                  <div className="bg-navy rounded-lg p-4 border border-border-gray">
                    <h3 className="text-sm font-semibold text-primary mb-2">Similarity Score</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-accent-gold">
                        {Math.round(comparisonMutation.data.similarity_score * 100)}%
                      </div>
                      <div className="flex-1 bg-border-gray rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-accent-gold h-full transition-all"
                          style={{ width: `${comparisonMutation.data.similarity_score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {comparisonMutation.data.key_differences && (
                  <div className="bg-navy rounded-lg p-4 border border-border-gray">
                    <h3 className="text-sm font-semibold text-primary mb-3">Key Differences</h3>
                    <ul className="space-y-2">
                      {comparisonMutation.data.key_differences.map((diff: string, idx: number) => (
                        <li key={idx} className="text-secondary text-sm flex items-start gap-2">
                          <span className="text-alert-red mt-1">•</span>
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {comparisonMutation.data.risk_analysis && (
                  <div className="bg-navy rounded-lg p-4 border border-border-gray">
                    <h3 className="text-sm font-semibold text-primary mb-3">Risk Analysis</h3>
                    <div className="space-y-2 text-sm text-secondary">
                      {typeof comparisonMutation.data.risk_analysis === 'string' ? (
                        <p>{comparisonMutation.data.risk_analysis}</p>
                      ) : (
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {JSON.stringify(comparisonMutation.data.risk_analysis, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {comparisonMutation.data.recommendations && (
                  <div className="bg-navy rounded-lg p-4 border border-border-gray">
                    <h3 className="text-sm font-semibold text-primary mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {comparisonMutation.data.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-secondary text-sm flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-light-green mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {comparisonMutation.data.metadata && (
                  <div className="pt-4 border-t border-border-gray">
                    <p className="text-secondary text-xs">
                      Comparison completed at {new Date(comparisonMutation.data.metadata.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {comparisonMutation.isError && (
            <div className="bg-alert-red bg-opacity-20 border border-alert-red rounded-lg p-4">
              <div className="flex items-center gap-2 text-alert-red mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Error</span>
              </div>
              <p className="text-secondary text-sm">
                {comparisonMutation.error instanceof Error 
                  ? comparisonMutation.error.message
                  : 'An error occurred while comparing documents'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
