/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileText, Loader2, CheckCircle, AlertCircle, FileSearch, Shield, Verified } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";
import ExpandedPanel from "@/components/dashboard/expanded-panel";

interface DocumentAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  documentText?: string;
}

export default function DocumentAnalyzer({ isOpen, onClose, documentText = "" }: DocumentAnalyzerProps) {
  const [text, setText] = useState(documentText);
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'summary' | 'key_points' | 'metadata'>('comprehensive');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [focusInput, setFocusInput] = useState('');
  const [verifyDocument, setVerifyDocument] = useState(false);

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const result = await executeCyranoTool('document_analyzer', {
        document_text: text,
        analysis_type: analysisType,
        focus_areas: focusAreas.length > 0 ? focusAreas : undefined,
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Analysis failed');
      }
      
      const parsed = typeof result.content[0]?.text === 'string' 
        ? JSON.parse(result.content[0].text) 
        : result.content[0]?.text;
      
      return parsed;
    },
  });

  const verificationMutation = useMutation({
    mutationFn: async () => {
      // Use Potemkin engine for document verification
      const result = await executeCyranoTool('potemkin_engine', {
        action: 'verify_document',
        content: text,
        documentId: `doc_${Date.now()}`,
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Verification failed');
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
    <ExpandedPanel
      title="Document Analyzer"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-accent-gold/20 via-status-success/10 to-transparent p-6 rounded-lg border border-accent-gold/30">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-gold/20 flex items-center justify-center border-2 border-accent-gold">
              <FileSearch className="w-8 h-8 text-accent-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary mb-2">Analyze Legal Documents</h2>
              <p className="text-secondary">
                Extract key information, metadata, and insights from legal documents using AI analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
              <h3 className="text-lg font-bold text-primary mb-4">Document Text</h3>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type the document text to analyze..."
                className="w-full h-64 bg-primary-dark border border-border-gray rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold resize-none"
              />
              <div className="mt-2 text-sm text-secondary">
                {text.split(' ').length} words, {text.split('\n').length} lines
              </div>
            </div>

            <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
              <h3 className="text-lg font-bold text-primary mb-4">Analysis Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Analysis Type
                  </label>
                  <select
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value as typeof analysisType)}
                    className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                  >
                    <option value="comprehensive">Comprehensive - Full analysis</option>
                    <option value="summary">Summary - Brief overview</option>
                    <option value="key_points">Key Points - Main takeaways</option>
                    <option value="metadata">Metadata - Document structure</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={verifyDocument}
                      onChange={(e) => setVerifyDocument(e.target.checked)}
                      className="w-4 h-4 rounded border-border-gray text-accent-gold focus:ring-accent-gold"
                    />
                    <span className="text-sm font-medium text-primary flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Verify document with Potemkin engine (facts, citations, claims)
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Focus Areas (optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={focusInput}
                      onChange={(e) => setFocusInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFocusArea()}
                      placeholder="Add focus area..."
                      className="flex-1 bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                    <button
                      onClick={handleAddFocusArea}
                      className="px-4 py-2 bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {focusAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {focusAreas.map((area) => (
                        <span
                          key={area}
                          className="flex items-center gap-1 px-3 py-1 bg-accent-gold/20 text-accent-gold rounded-full text-sm border border-accent-gold/30"
                        >
                          {area}
                          <button
                            onClick={() => handleRemoveFocusArea(area)}
                            className="hover:text-status-critical"
                          >
                            <AlertCircle className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => analysisMutation.mutate()}
                disabled={!text.trim() || analysisMutation.isPending}
                className="flex-1 bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {analysisMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileSearch className="w-5 h-5" />
                    Analyze Document
                  </>
                )}
              </button>
              
              {verifyDocument && (
                <button
                  onClick={() => verificationMutation.mutate()}
                  disabled={!text.trim() || verificationMutation.isPending}
                  className="flex-1 bg-status-success hover:bg-status-success/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {verificationMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Verify Document
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {analysisMutation.data && (
              <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-status-success" />
                  Analysis Results
                </h3>
                <div className="space-y-4">
                  {analysisMutation.data.summary && (
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Summary</h4>
                      <p className="text-secondary text-sm whitespace-pre-wrap">{analysisMutation.data.summary}</p>
                    </div>
                  )}
                  {analysisMutation.data.key_points && (
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Key Points</h4>
                      <ul className="list-disc list-inside text-secondary text-sm space-y-1">
                        {analysisMutation.data.key_points.map((point: string, i: number) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisMutation.data.metadata && (
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Metadata</h4>
                      <div className="text-secondary text-sm space-y-1">
                        {Object.entries(analysisMutation.data.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {verificationMutation.data && (
              <div className="bg-card-dark rounded-lg p-6 border border-status-success">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <Verified className="w-5 h-5 text-status-success" />
                  Verification Results
                </h3>
                <div className="space-y-4">
                  {verificationMutation.data.verification_score !== undefined && (
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Verification Score</h4>
                      <div className="text-2xl font-bold text-status-success">
                        {Math.round(verificationMutation.data.verification_score * 100)}%
                      </div>
                    </div>
                  )}
                  {verificationMutation.data.report && (
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Verification Report</h4>
                      <p className="text-secondary text-sm whitespace-pre-wrap">{verificationMutation.data.report}</p>
                    </div>
                  )}
                  {verificationMutation.data.recommendations && verificationMutation.data.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside text-secondary text-sm space-y-1">
                        {verificationMutation.data.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {analysisMutation.isError && (
              <div className="bg-status-critical/20 border border-status-critical rounded-lg p-4">
                <div className="flex items-center gap-2 text-status-critical mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Analysis Failed</span>
                </div>
                <p className="text-sm text-secondary">
                  {analysisMutation.error instanceof Error 
                    ? analysisMutation.error.message 
                    : 'Unknown error occurred'}
                </p>
              </div>
            )}

            {verificationMutation.isError && (
              <div className="bg-status-critical/20 border border-status-critical rounded-lg p-4">
                <div className="flex items-center gap-2 text-status-critical mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Verification Failed</span>
                </div>
                <p className="text-sm text-secondary">
                  {verificationMutation.error instanceof Error 
                    ? verificationMutation.error.message 
                    : 'Unknown error occurred'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ExpandedPanel>
  );
