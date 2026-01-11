/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Pin, Download, BookOpen } from 'lucide-react';
import { LibraryItem } from '@/lib/library-api';

interface LibraryListProps {
  items: LibraryItem[];
  loading: boolean;
  error: string | null;
  onItemClick: (item: LibraryItem) => void;
  onPinToggle: (itemId: string) => void;
  onIngest: (itemId: string) => void;
}

export function LibraryList({
  items,
  loading,
  error,
  onItemClick,
  onPinToggle,
  onIngest,
}: LibraryListProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-warm-white/70">
        Loading library...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-alert-red/10 border border-alert-red rounded-lg p-4 text-alert-red">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-charcoal border border-gray-600 rounded-lg p-12 text-center">
        <BookOpen className="h-16 w-16 text-warm-white/30 mx-auto mb-4" />
        <p className="text-warm-white/70 mb-2">No library items found</p>
        <p className="text-warm-white/50 text-sm">
          Try adjusting your filters or add items to your library
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-charcoal border border-gray-600 rounded-lg p-4 hover:border-aqua transition-colors cursor-pointer"
          onClick={() => onItemClick(item)}
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
            {item.pinned && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPinToggle(item.id);
                }}
                className="hover:opacity-70 transition-opacity"
                title="Unpin item"
              >
                <Pin className="h-4 w-4 text-accent-gold fill-accent-gold" />
              </button>
            )}
          </div>
          
          {item.description && (
            <p className="text-xs text-warm-white/70 mb-3 line-clamp-2">
              {item.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
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
              {!item.pinned && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinToggle(item.id);
                  }}
                  className="text-xs text-warm-white/50 hover:text-accent-gold transition-colors"
                  title="Pin item"
                >
                  <Pin className="h-3 w-3" />
                </button>
              )}
              {!item.ingested && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onIngest(item.id);
                  }}
                  className="text-xs text-aqua hover:text-light-green transition-colors"
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
  );
}

}
}
)