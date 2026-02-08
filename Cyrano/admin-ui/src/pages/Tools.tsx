/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { listTools } from '../lib/cyrano-admin-api';

export default function Tools() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: listTools,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-warm-white/70">Loading tools...</div>
      </div>
    );
  }

  // Group tools by category
  const toolsByCategory = (tools || []).reduce((acc: Record<string, any[]>, tool: any) => {
    const category = tool.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {});

  // Filter tools based on search query
  const filteredCategories = Object.entries(toolsByCategory).filter(([category, categoryTools]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return category.toLowerCase().includes(query) ||
      categoryTools.some((tool: any) => 
        tool.name?.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query)
      );
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-warm-white mb-2">Tools</h1>
        <p className="text-warm-white/70">Browse and manage available MCP tools</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-warm-white/50" />
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-charcoal border border-gray-700 rounded-lg text-warm-white placeholder-warm-white/50 focus:outline-none focus:ring-2 focus:ring-accent-gold"
        />
      </div>

      {/* Tools by Category */}
      <div className="space-y-4">
        {filteredCategories.map(([category, categoryTools]) => {
          const isExpanded = expandedCategories.has(category);
          const filteredTools = categoryTools.filter((tool: any) => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return tool.name?.toLowerCase().includes(query) ||
              tool.description?.toLowerCase().includes(query);
          });

          return (
            <div key={category} className="bg-charcoal rounded-lg border border-gray-700">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-warm-white/70" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-warm-white/70" />
                  )}
                  <Wrench className="w-5 h-5 text-accent-gold" />
                  <h2 className="text-lg font-semibold text-warm-white">{category}</h2>
                  <span className="px-2 py-1 bg-gray-700 rounded text-sm text-warm-white/70">
                    {filteredTools.length}
                  </span>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-gray-700 p-4 space-y-3">
                  {filteredTools.map((tool: any) => (
                    <div key={tool.name} className="bg-primary-dark rounded-lg p-4 border border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-warm-white">{tool.name}</h3>
                      </div>
                      <p className="text-sm text-warm-white/70 mb-3">{tool.description}</p>
                      {tool.inputSchema && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-warm-white/50 hover:text-warm-white">
                            View Schema
                          </summary>
                          <pre className="mt-2 p-3 bg-charcoal rounded text-xs text-warm-white/80 overflow-x-auto">
                            {JSON.stringify(tool.inputSchema, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-warm-white/70">
          No tools found matching your search.
        </div>
      )}
    </div>
  );
}