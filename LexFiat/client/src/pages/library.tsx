/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from 'react';
import { BookOpen, Filter, Pin, Download, AlertCircle, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/header';
import { fetchLibraryItems, getLibraryHealth, LibraryItem, LibraryStats } from '@/lib/library-api';

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string[]>([]);
  const [countyFilter, setCountyFilter] = useState<string>('');
  const [courtFilter, setCourtFilter] = useState<string>('');
  const [ingestedFilter, setIngestedFilter] = useState<boolean | undefined>(undefined);
  const [pinnedFilter, setPinnedFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    loadLibrary();
    loadHealth();
  }, [sourceTypeFilter, countyFilter, courtFilter, ingestedFilter, pinnedFilter]);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (sourceTypeFilter.length > 0) filters.sourceType = sourceTypeFilter;
      if (countyFilter) filters.county = countyFilter;
      if (courtFilter) filters.court = courtFilter;
      if (ingestedFilter !== undefined) filters.ingested = ingestedFilter;
      if (pinnedFilter !== undefined) filters.pinned = pinnedFilter;
      
      const data = await fetchLibraryItems(filters);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      const data = await getLibraryHealth();
      setStats(data);
    } catch (err) {
      console.error('Failed to load library health:', err);
    }
  };

  const handlePinToggle = async (itemId: string) => {
    // TODO: Implement pin toggle
    console.log('Toggle pin:', itemId);
  };

  const handleIngest = async (itemId: string) => {
    // TODO: Implement ingest
    console.log('Ingest:', itemId);
  };

  const handleOpen = (item: LibraryItem) => {
    // TODO: Implement open/view
    console.log('Open:', item);
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header with Health Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-accent-gold" />
            <h1 className="text-2xl font-bold text-warm-white">Legal Library</h1>
          </div>
          
          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                {stats.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-light-green" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-alert-red" />
                )}
                <span className="text-warm-white">{stats.status}</span>
              </div>
              <div className="text-warm-white">
                {stats.totalItems} items | {stats.ingestedItems} ingested
              </div>
              {stats.queueDepth > 0 && (
                <div className="text-aqua">
                  {stats.queueDepth} pending
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-warm-white/80 mb-6">
          Rules, standing orders, templates, and playbooks for your practice.
        </p>

        {/* Filters */}
        <div className="bg-charcoal border border-gray-600 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-aqua" />
            <h2 className="text-sm font-semibold text-warm-white">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-warm-white/70 mb-1">Source Type</label>
              <select
                multiple
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                value={sourceTypeFilter}
                onChange={(e) => setSourceTypeFilter(Array.from(e.target.selectedOptions, option => option.value))}
              >
                <option value="rule">Rules</option>
                <option value="standing-order">Standing Orders</option>
                <option value="template">Templates</option>
                <option value="playbook">Playbooks</option>
                <option value="case-law">Case Law</option>
                <option value="statute">Statutes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-warm-white/70 mb-1">County</label>
              <input
                type="text"
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                placeholder="Filter by county..."
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs text-warm-white/70 mb-1">Court</label>
              <input
                type="text"
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                placeholder="Filter by court..."
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm text-warm-white cursor-pointer">
              <input
                type="checkbox"
                checked={pinnedFilter === true}
                onChange={(e) => setPinnedFilter(e.target.checked ? true : undefined)}
              />
              Pinned Only
            </label>
            <label className="flex items-center gap-2 text-sm text-warm-white cursor-pointer">
              <input
                type="checkbox"
                checked={ingestedFilter === true}
                onChange={(e) => setIngestedFilter(e.target.checked ? true : undefined)}
              />
              Ingested Only
            </label>
          </div>
        </div>

        {/* Library Items */}
        {loading ? (
          <div className="text-center py-12 text-warm-white/70">Loading library...</div>
        ) : error ? (
          <div className="bg-alert-red/10 border border-alert-red rounded-lg p-4 text-alert-red">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-charcoal border border-gray-600 rounded-lg p-12 text-center">
            <BookOpen className="h-16 w-16 text-warm-white/30 mx-auto mb-4" />
            <p className="text-warm-white/70 mb-2">No library items found</p>
            <p className="text-warm-white/50 text-sm">
              Try adjusting your filters or add items to your library
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-charcoal border border-gray-600 rounded-lg p-4 hover:border-aqua transition-colors cursor-pointer"
                onClick={() => handleOpen(item)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-warm-white mb-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-warm-white/60 mb-2">
                      <span className="px-2 py-0.5 bg-navy rounded">{item.sourceType}</span>
                      {item.county && <span>{item.county}</span>}
                    </div>
                  </div>
                  {item.pinned && <Pin className="h-4 w-4 text-accent-gold fill-accent-gold" />}
                </div>
                
                {item.description && (
                  <p className="text-xs text-warm-white/70 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {item.issueTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-aqua/20 text-aqua text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.issueTags.length > 2 && (
                      <span className="px-2 py-0.5 bg-aqua/20 text-aqua text-xs rounded">
                        +{item.issueTags.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!item.ingested && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIngest(item.id);
                        }}
                        className="text-xs text-aqua hover:text-light-green"
                        title="Ingest to RAG"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
