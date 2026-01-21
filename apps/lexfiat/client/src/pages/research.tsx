/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, BookOpen, Loader2, FileText, ExternalLink, AlertCircle } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";

export default function Research() {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [expandQuery, setExpandQuery] = useState(true);
  const [rerank, setRerank] = useState(true);

  const researchMutation = useMutation({
    mutationFn: async () => {
      const result = await executeCyranoTool('rag_query', {
        action: 'query',
        query,
        topK,
        expandQuery,
        rerank,
        includeSourceInfo: true,
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Research query failed');
      }
      
      const parsed = typeof result.content[0]?.text === 'string' 
        ? JSON.parse(result.content[0].text) 
        : result.content[0]?.text;
      
      return parsed;
    },
  });

  return (
    <div className="min-h-screen bg-primary-dark">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-accent-gold" />
            Research
          </h1>
          <p className="text-secondary">
            Query the RAG system to retrieve relevant context from ingested documents
          </p>
          <div className="mt-4 p-4 bg-status-processing/20 border border-status-processing rounded-lg">
            <p className="text-sm text-secondary">
              <strong>Data Source Notice:</strong> This tool retrieves information from documents that have been ingested into the system. 
              Sources may include user-uploaded documents, email attachments, Clio integration, CourtListener, Westlaw, and manually entered documents. 
              All retrieved information includes source attribution for transparency and verification.
            </p>
          </div>
        </div>

        <div className="bg-card-dark rounded-lg p-6 border border-border-gray mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Research Query
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !researchMutation.isPending && researchMutation.mutate()}
                  placeholder="Enter your research question..."
                  className="w-full pl-10 pr-4 py-3 bg-primary-dark border border-border-gray rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Results (topK)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
                  className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={expandQuery}
                  onChange={(e) => setExpandQuery(e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm text-secondary">Expand Query</label>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={rerank}
                  onChange={(e) => setRerank(e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm text-secondary">Rerank Results</label>
              </div>
            </div>

            <button
              onClick={() => researchMutation.mutate()}
              disabled={!query.trim() || researchMutation.isPending}
              className="w-full bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {researchMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {researchMutation.data && (
          <div className="space-y-4">
            <div className="bg-card-dark rounded-lg p-4 border border-border-gray">
              <p className="text-sm text-secondary">
                Found {researchMutation.data.results?.length || 0} relevant result{researchMutation.data.results?.length !== 1 ? 's' : ''}
              </p>
            </div>

            {researchMutation.data.results?.map((result: any, idx: number) => (
              <div key={idx} className="bg-card-dark rounded-lg p-6 border border-border-gray">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary mb-2">
                      Result {idx + 1}
                      {result.score !== undefined && (
                        <span className="ml-2 text-sm font-normal text-secondary">
                          (Score: {Math.round(result.score * 100)}%)
                        </span>
                      )}
                    </h3>
                    <p className="text-secondary whitespace-pre-wrap">{result.content || result.text}</p>
                  </div>
                </div>

                {result.source && (
                  <div className="mt-4 pt-4 border-t border-border-gray">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-accent-gold" />
                      <span className="text-secondary">Source:</span>
                      <span className="text-primary font-medium">{result.source}</span>
                      {result.sourceType && (
                        <span className="px-2 py-1 bg-accent-gold/20 text-accent-gold rounded text-xs">
                          {result.sourceType}
                        </span>
                      )}
                    </div>
                    {result.metadata && (
                      <div className="mt-2 text-xs text-secondary">
                        {Object.entries(result.metadata).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            <strong>{key}:</strong> {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {researchMutation.isError && (
          <div className="bg-status-critical/20 border border-status-critical rounded-lg p-4">
            <div className="flex items-center gap-2 text-status-critical mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Query Failed</span>
            </div>
            <p className="text-sm text-secondary">
              {researchMutation.error instanceof Error 
                ? researchMutation.error.message 
                : 'Unknown error occurred'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
