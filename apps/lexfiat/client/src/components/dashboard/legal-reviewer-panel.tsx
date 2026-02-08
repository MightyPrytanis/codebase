/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Scale, Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";
import ExpandedPanel from "./expanded-panel";

interface LegalReviewerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentText?: string;
}

export default function LegalReviewerPanel({ isOpen, onClose, documentText = "" }: LegalReviewerPanelProps) {
  const [text, setText] = useState(documentText);
  const [reviewType, setReviewType] = useState<'compliance' | 'accuracy' | 'completeness' | 'comprehensive'>('comprehensive');
  const [jurisdiction, setJurisdiction] = useState('');
  const [practiceArea, setPracticeArea] = useState('');

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const result = await executeCyranoTool('legal_reviewer', {
        document_text: text,
        review_type: reviewType,
        jurisdiction: jurisdiction || undefined,
        practice_area: practiceArea || undefined,
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Legal review failed');
      }
      
      const parsed = typeof result.content[0]?.text === 'string' 
        ? JSON.parse(result.content[0].text) 
        : result.content[0]?.text;
      
      return parsed;
    },
  });

  return (
    <ExpandedPanel
      title="Legal Reviewer"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-accent-gold/20 via-status-success/10 to-transparent p-6 rounded-lg border border-accent-gold/30">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-gold/20 flex items-center justify-center border-2 border-accent-gold">
              <Scale className="w-8 h-8 text-accent-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary mb-2">Legal Document Review</h2>
              <p className="text-secondary">
                Review legal documents for compliance, accuracy, and completeness using AI analysis.
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
                placeholder="Paste or type the legal document to review..."
                className="w-full h-64 bg-primary-dark border border-border-gray rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold resize-none"
              />
              <div className="mt-2 text-sm text-secondary">
                {text.split(' ').length} words, {text.split('\n').length} lines
              </div>
            </div>

            <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
              <h3 className="text-lg font-bold text-primary mb-4">Review Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Review Type
                  </label>
                  <select
                    value={reviewType}
                    onChange={(e) => setReviewType(e.target.value as typeof reviewType)}
                    className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                  >
                    <option value="comprehensive">Comprehensive - Full review</option>
                    <option value="compliance">Compliance - Legal compliance check</option>
                    <option value="accuracy">Accuracy - Factual accuracy review</option>
                    <option value="completeness">Completeness - Document completeness check</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Jurisdiction (optional)
                    </label>
                    <input
                      type="text"
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value)}
                      placeholder="e.g., Michigan, Federal"
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Practice Area (optional)
                    </label>
                    <input
                      type="text"
                      value={practiceArea}
                      onChange={(e) => setPracticeArea(e.target.value)}
                      placeholder="e.g., Corporate, Litigation"
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => reviewMutation.mutate()}
              disabled={!text.trim() || reviewMutation.isPending}
              className="w-full bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Reviewing...
                </>
              ) : (
                <>
                  <Scale className="w-5 h-5" />
                  Review Document
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {reviewMutation.data && (
              <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-status-success" />
                  Review Results
                </h3>
                <div className="space-y-4">
                  {reviewMutation.data.summary && (
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Summary</h4>
                      <p className="text-secondary text-sm whitespace-pre-wrap">{reviewMutation.data.summary}</p>
                    </div>
                  )}
                  {reviewMutation.data.issues && reviewMutation.data.issues.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-status-critical mb-2">Issues Found</h4>
                      <ul className="list-disc list-inside text-secondary text-sm space-y-1">
                        {reviewMutation.data.issues.map((issue: string, i: number) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {reviewMutation.data.recommendations && reviewMutation.data.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-status-success mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside text-secondary text-sm space-y-1">
                        {reviewMutation.data.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {reviewMutation.data.compliance_score !== undefined && (
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Compliance Score</h4>
                      <div className="text-2xl font-bold text-status-success">
                        {Math.round(reviewMutation.data.compliance_score * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {reviewMutation.isError && (
              <div className="bg-status-critical/20 border border-status-critical rounded-lg p-4">
                <div className="flex items-center gap-2 text-status-critical mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Review Failed</span>
                </div>
                <p className="text-sm text-secondary">
                  {reviewMutation.error instanceof Error 
                    ? reviewMutation.error.message 
                    : 'Unknown error occurred'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ExpandedPanel>
  );

}