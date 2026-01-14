/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, FileText, Tag, Calendar, X } from 'lucide-react';
import { queryInsights } from '../lib/arkiver-api';
import type { Insight } from '../lib/arkiver-api';

export default function Insights() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLLM, setSelectedLLM] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'confidence' | 'relevance'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['insights', searchQuery, selectedTags, selectedLLM, sortBy, sortOrder, page],
    queryFn: () => queryInsights({
      keywords: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      sourceLLM: selectedLLM || undefined,
      sort: { field: sortBy, order: sortOrder },
      pagination: { limit: pageSize, offset: page * pageSize },
    }),
    refetchInterval: 30000,
  });

  const insights = data?.insights || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const allTags = Array.from(new Set(insights.flatMap(i => i.tags || [])));
  const allLLMs = Array.from(new Set(insights.map(i => i.sourceLLM).filter(Boolean)));

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setPage(0);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C3E50' }}>Insights</h1>
          <p style={{ color: '#5B8FA3' }}>Search, filter, and explore extracted insights</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedLLM}
              onChange={(e) => {
                setSelectedLLM(e.target.value);
                setPage(0);
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All LLMs</option>
              {allLLMs.map(llm => (
                <option key={llm} value={llm}>{llm}</option>
              ))}
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as typeof sortBy);
                setSortOrder(order as typeof sortOrder);
                setPage(0);
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="confidence-desc">Highest Confidence</option>
              <option value="confidence-asc">Lowest Confidence</option>
              <option value="relevance-desc">Most Relevant</option>
            </select>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Tags:
              </span>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {(selectedTags.length > 0 || selectedLLM) && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  {tag}
                  <button onClick={() => toggleTag(tag)} className="hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedLLM && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  LLM: {selectedLLM}
                  <button onClick={() => setSelectedLLM('')} className="hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mb-4 text-sm" style={{ color: '#5B8FA3' }}>
          {isLoading ? (
            <span>Loading...</span>
          ) : error ? (
            <span className="text-red-600">Error loading insights</span>
          ) : (
            <span>Found {total} insight{total !== 1 ? 's' : ''}</span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-white rounded-lg p-12 border border-gray-200 shadow-sm text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: '#D89B6A' }} />
            <p style={{ color: '#5B8FA3' }}>No insights found. Upload and process files to generate insights.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <InsightCard key={insight.insightId} insight={insight} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-400 transition-colors"
            >
              Previous
            </button>
            <span style={{ color: '#5B8FA3' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-400 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const confidenceColor = insight.confidence >= 0.8 ? 'text-green-600' : 
                          insight.confidence >= 0.6 ? 'text-blue-600' : 
                          'text-red-600';

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2" style={{ color: '#2C3E50' }}>{insight.title}</h3>
          <p className="mb-4 line-clamp-3" style={{ color: '#5B8FA3' }}>{insight.content}</p>
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
          <span className={`text-sm font-semibold ${confidenceColor}`}>
            {Math.round(insight.confidence * 100)}% confidence
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#5B8FA3' }}>
        <span className="flex items-center gap-1">
          <FileText className="w-4 h-4" />
          {insight.sourceLLM}
        </span>
        {insight.tags && insight.tags.length > 0 && (
          <span className="flex items-center gap-1">
            <Tag className="w-4 h-4" />
            {insight.tags.join(', ')}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {new Date(insight.createdAt).toLocaleDateString()}
        </span>
        {insight.citations && insight.citations.length > 0 && (
          <span style={{ color: '#D89B6A' }}>
            {insight.citations.length} citation{insight.citations.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

        {insight.entities && Object.keys(insight.entities).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm mb-2" style={{ color: '#5B8FA3' }}>Entities:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(insight.entities).slice(0, 5).map(([key, value]) => (
                <span key={key} className="px-2 py-1 bg-gray-50 rounded text-xs" style={{ color: '#5B8FA3' }}>
                  {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

}
)
}
}
}
}