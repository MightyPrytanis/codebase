/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from 'react';
import { BookOpen, Filter, AlertCircle, CheckCircle, Plus, Search, ArrowUpDown } from 'lucide-react';
import Header from '@/components/layout/header';
import { fetchLibraryItems, getLibraryHealth, pinLibraryItem, ingestLibraryItem, getLibraryLocations, LibraryItem, LibraryStats, LibraryLocation } from '@/lib/library-api';
import { LibraryList } from '@/components/library/library-list';
import { LibraryDetailDrawer } from '@/components/library/library-detail-drawer';
import { AddLocationDialog } from '@/components/library/add-location-dialog';
import { UploadDocumentDialog } from '@/components/library/upload-document-dialog';

type SortOption = 'title' | 'createdAt' | 'dateModified' | 'sourceType';

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [locations, setLocations] = useState<LibraryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string[]>([]);
  const [countyFilter, setCountyFilter] = useState<string>('');
  const [courtFilter, setCourtFilter] = useState<string>('');
  const [ingestedFilter, setIngestedFilter] = useState<boolean | undefined>(undefined);
  const [pinnedFilter, setPinnedFilter] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    loadLibrary();
    loadHealth();
    loadLocations();
  }, [sourceTypeFilter, countyFilter, courtFilter, ingestedFilter, pinnedFilter]);

  const loadLocations = async () => {
    try {
      const data = await getLibraryLocations();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (sourceTypeFilter.length > 0) filters.sourceType = sourceTypeFilter;
      if (countyFilter) filters.county = countyFilter;
      if (courtFilter) filters.court = courtFilter;
      if (ingestedFilter !== undefined) filters.ingested = ingestedFilter;
      if (pinnedFilter !== undefined) filters.pinned = pinnedFilter;
      
      let data = await fetchLibraryItems(filters);
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        data = data.filter(item => 
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.filename.toLowerCase().includes(query) ||
          item.jurisdiction?.toLowerCase().includes(query) ||
          item.county?.toLowerCase().includes(query) ||
          item.court?.toLowerCase().includes(query) ||
          item.issueTags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // Apply sorting
      data.sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortBy) {
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'createdAt':
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case 'dateModified':
            aVal = a.dateModified ? new Date(a.dateModified).getTime() : 0;
            bVal = b.dateModified ? new Date(b.dateModified).getTime() : 0;
            break;
          case 'sourceType':
            aVal = a.sourceType;
            bVal = b.sourceType;
            break;
          default:
            return 0;
        }
        
        if (aVal < bVal) return sortAsc ? -1 : 1;
        if (aVal > bVal) return sortAsc ? 1 : -1;
        return 0;
      });
      
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
    try {
      const updatedItem = await pinLibraryItem(itemId);
      // Update the item in the list
      setItems(items.map(item => item.id === itemId ? updatedItem : item));
      // Update selected item if it's the one being pinned
      if (selectedItem?.id === itemId) {
        setSelectedItem(updatedItem);
      }
      // Reload library to refresh
      await loadLibrary();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleIngest = async (itemId: string) => {
    try {
      await ingestLibraryItem(itemId, 'normal');
      // Reload library and stats to reflect ingestion
      await loadLibrary();
      await loadHealth();
    } catch (err) {
      console.error('Failed to ingest item:', err);
    }
  };

  const handleOpen = (item: LibraryItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedItem(null);
  };

  const handleLocationAdded = () => {
    loadLocations();
    loadLibrary();
  };

  const handleDocumentUploaded = () => {
    loadLibrary();
    loadHealth();
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
          
          <div className="flex items-center gap-4">
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
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddLocationOpen(true)}
                className="px-4 py-2 bg-navy border border-gray-600 rounded-lg text-warm-white hover:border-aqua transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Location
              </button>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 bg-aqua text-primary-dark rounded-lg font-medium hover:bg-light-green transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Upload
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-warm-white/80 mb-6">
          Rules, standing orders, templates, and playbooks for your practice.
        </p>

        {/* Search and Sort */}
        <div className="bg-charcoal border border-gray-600 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library items..."
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 pl-10 text-sm text-warm-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-warm-white/50" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
              >
                <option value="createdAt">Date Created</option>
                <option value="dateModified">Date Modified</option>
                <option value="title">Title</option>
                <option value="sourceType">Type</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="px-3 py-2 bg-navy border border-gray-600 rounded text-sm text-warm-white hover:border-aqua transition-colors"
              >
                {sortAsc ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

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
        <LibraryList
          items={items}
          loading={loading}
          error={error}
          onItemClick={handleOpen}
          onPinToggle={handlePinToggle}
          onIngest={handleIngest}
        />
      </main>

      {/* Detail Drawer */}
      <LibraryDetailDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onPinToggle={handlePinToggle}
        onIngest={handleIngest}
      />

      {/* Add Location Dialog */}
      <AddLocationDialog
        isOpen={isAddLocationOpen}
        onClose={() => setIsAddLocationOpen(false)}
        onSuccess={handleLocationAdded}
      />

      {/* Upload Document Dialog */}
      <UploadDocumentDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleDocumentUploaded}
        locations={locations}
      />
    </div>
  );
}
