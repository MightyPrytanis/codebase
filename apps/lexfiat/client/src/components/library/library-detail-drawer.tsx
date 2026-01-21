/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { X, Pin, Download, FileText, Calendar, MapPin, Scale, Tag, CheckCircle } from 'lucide-react';
import { LibraryItem } from '@/lib/library-api';

interface LibraryDetailDrawerProps {
  item: LibraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPinToggle: (itemId: string) => void;
  onIngest: (itemId: string) => void;
}

export function LibraryDetailDrawer({
  item,
  isOpen,
  onClose,
  onPinToggle,
  onIngest,
}: LibraryDetailDrawerProps) {
  if (!isOpen || !item) return null;

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-primary-dark border-l border-gray-600 z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-primary-dark border-b border-gray-600 p-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-navy border border-aqua text-aqua text-xs rounded">
                {item.sourceType}
              </span>
              {item.ingested && (
                <span className="px-2 py-1 bg-light-green/20 text-light-green text-xs rounded flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ingested
                </span>
              )}
              {item.superseded && (
                <span className="px-2 py-1 bg-alert-red/20 text-alert-red text-xs rounded">
                  Superseded
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-warm-white mb-1">
              {item.title}
            </h2>
            <p className="text-sm text-warm-white/70">{item.filename}</p>
          </div>
          
          <button
            onClick={onClose}
            className="text-warm-white/70 hover:text-warm-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {item.description && (
            <div>
              <h3 className="text-sm font-semibold text-warm-white mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-aqua" />
                Description
              </h3>
              <p className="text-sm text-warm-white/80 leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Jurisdictional Information */}
          {(item.jurisdiction || item.county || item.court || item.judgeReferee) && (
            <div>
              <h3 className="text-sm font-semibold text-warm-white mb-3 flex items-center gap-2">
                <Scale className="h-4 w-4 text-aqua" />
                Jurisdictional Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {item.jurisdiction && (
                  <div>
                    <p className="text-xs text-warm-white/50 mb-1">Jurisdiction</p>
                    <p className="text-sm text-warm-white">{item.jurisdiction}</p>
                  </div>
                )}
                {item.county && (
                  <div>
                    <p className="text-xs text-warm-white/50 mb-1">County</p>
                    <p className="text-sm text-warm-white">{item.county}</p>
                  </div>
                )}
                {item.court && (
                  <div className="col-span-2">
                    <p className="text-xs text-warm-white/50 mb-1">Court</p>
                    <p className="text-sm text-warm-white">{item.court}</p>
                  </div>
                )}
                {item.judgeReferee && (
                  <div className="col-span-2">
                    <p className="text-xs text-warm-white/50 mb-1">Judge/Referee</p>
                    <p className="text-sm text-warm-white">{item.judgeReferee}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Practice Areas & Issue Tags */}
          <div>
            <h3 className="text-sm font-semibold text-warm-white mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-aqua" />
              Categories & Tags
            </h3>
            {item.practiceAreas.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-warm-white/50 mb-2">Practice Areas</p>
                <div className="flex flex-wrap gap-2">
                  {item.practiceAreas.map((area) => (
                    <span
                      key={area}
                      className="px-2 py-1 bg-navy text-warm-white text-xs rounded"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {item.issueTags.length > 0 && (
              <div>
                <p className="text-xs text-warm-white/50 mb-2">Issue Tags</p>
                <div className="flex flex-wrap gap-2">
                  {item.issueTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-aqua/20 text-aqua text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-semibold text-warm-white mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-aqua" />
              Dates
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {item.effectiveFrom && (
                <div>
                  <p className="text-xs text-warm-white/50 mb-1">Effective From</p>
                  <p className="text-sm text-warm-white">{formatDate(item.effectiveFrom)}</p>
                </div>
              )}
              {item.effectiveTo && (
                <div>
                  <p className="text-xs text-warm-white/50 mb-1">Effective To</p>
                  <p className="text-sm text-warm-white">{formatDate(item.effectiveTo)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-warm-white/50 mb-1">Created</p>
                <p className="text-sm text-warm-white">{formatDate(item.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-warm-white/50 mb-1">Modified</p>
                <p className="text-sm text-warm-white">{formatDate(item.dateModified)}</p>
              </div>
            </div>
          </div>

          {/* File Information */}
          <div>
            <h3 className="text-sm font-semibold text-warm-white mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-aqua" />
              File Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-warm-white/50 mb-1">File Type</p>
                <p className="text-sm text-warm-white">{item.fileType}</p>
              </div>
              <div>
                <p className="text-xs text-warm-white/50 mb-1">File Size</p>
                <p className="text-sm text-warm-white">{formatFileSize(item.fileSize)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-warm-white/50 mb-1">File Path</p>
                <p className="text-sm text-warm-white/70 font-mono text-xs break-all">
                  {item.filepath}
                </p>
              </div>
            </div>
          </div>

          {/* RAG Information */}
          {item.ingested && (
            <div>
              <h3 className="text-sm font-semibold text-warm-white mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-light-green" />
                RAG Integration
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-warm-white/50 mb-1">Ingested At</p>
                  <p className="text-sm text-warm-white">{formatDate(item.ingestedAt)}</p>
                </div>
                {item.vectorIds && item.vectorIds.length > 0 && (
                  <div>
                    <p className="text-xs text-warm-white/50 mb-1">Vector Count</p>
                    <p className="text-sm text-warm-white">{item.vectorIds.length} vectors</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="sticky bottom-0 bg-primary-dark border-t border-gray-600 p-6">
          <div className="flex gap-3">
            <button
              onClick={() => onPinToggle(item.id)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                item.pinned
                  ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold hover:bg-accent-gold/30'
                  : 'bg-navy text-warm-white border border-gray-600 hover:border-accent-gold'
              }`}
            >
              <Pin className={`h-4 w-4 ${item.pinned ? 'fill-accent-gold' : ''}`} />
              {item.pinned ? 'Unpin' : 'Pin'}
            </button>
            
            {!item.ingested && (
              <button
                onClick={() => onIngest(item.id)}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-aqua text-primary-dark hover:bg-light-green transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Ingest to RAG
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
