/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Calendar, Network, FileText } from 'lucide-react';
import { queryInsights } from '../lib/arkiver-api';

export default function Visualizations() {
  const [view, setView] = useState<'timeline' | 'topics' | 'sources' | 'network'>('timeline');

  const { data: insightsData } = useQuery({
    queryKey: ['insights-for-visualizations'],
    queryFn: () => queryInsights({ pagination: { limit: 1000, offset: 0 } }),
  });

  const insights = insightsData?.insights || [];

  const timelineData = processTimelineData(insights);
  const topicData = processTopicData(insights);
  const sourceData = processSourceData(insights);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C3E50' }}>Visualizations</h1>
          <p style={{ color: '#5B8FA3' }}>Explore insights through timelines, graphs, and patterns</p>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
            { id: 'topics' as const, label: 'Topics', icon: BarChart3 },
            { id: 'sources' as const, label: 'Sources', icon: FileText },
            { id: 'network' as const, label: 'Network', icon: Network },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                view === v.id
                  ? 'text-white'
                  : 'bg-white hover:bg-gray-50 border border-gray-300'
              }`}
              style={view === v.id ? { backgroundColor: '#D89B6A' } : { color: '#2C3E50' }}
            >
              <v.icon className="w-4 h-4" />
              {v.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          {view === 'timeline' && <TimelineView data={timelineData} />}
          {view === 'topics' && <TopicsView data={topicData} />}
          {view === 'sources' && <SourcesView data={sourceData} />}
          {view === 'network' && <NetworkView insights={insights} />}
        </div>
      </div>
    </div>
  );
}

function processTimelineData(insights: any[]) {
  const byDate: Record<string, number> = {};
  insights.forEach(insight => {
    const date = new Date(insight.createdAt).toLocaleDateString();
    byDate[date] = (byDate[date] || 0) + 1;
  });
  return Object.entries(byDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function processTopicData(insights: any[]) {
  const topics: Record<string, number> = {};
  insights.forEach(insight => {
    (insight.tags || []).forEach((tag: string) => {
      topics[tag] = (topics[tag] || 0) + 1;
    });
  });
  return Object.entries(topics)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function processSourceData(insights: any[]) {
  const sources: Record<string, number> = {};
  insights.forEach(insight => {
    const source = insight.sourceLLM || 'Unknown';
    sources[source] = (sources[source] || 0) + 1;
  });
  return Object.entries(sources)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

function TimelineView({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#2C3E50' }}>
        <Calendar className="w-6 h-6" style={{ color: '#D89B6A' }} />
        Insight Timeline
      </h2>
      <div className="space-y-3">
          {data.length === 0 ? (
            <p className="text-center py-8" style={{ color: '#5B8FA3' }}>No timeline data available</p>
        ) : (
          data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-24 text-sm" style={{ color: '#5B8FA3' }}>{item.date}</div>
              <div className="flex-1 bg-gray-100 rounded h-8 relative overflow-hidden border border-gray-200">
                <div
                  className="bg-blue-600 h-full rounded transition-all"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold" style={{ color: '#2C3E50' }}>
                  {item.count} insight{item.count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TopicsView({ data }: { data: { topic: string; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#2C3E50' }}>
        <BarChart3 className="w-6 h-6" style={{ color: '#D89B6A' }} />
        Top Topics
      </h2>
      <div className="space-y-3">
          {data.length === 0 ? (
            <p className="text-center py-8" style={{ color: '#5B8FA3' }}>No topic data available</p>
        ) : (
          data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium" style={{ color: '#2C3E50' }}>{item.topic}</div>
              <div className="flex-1 bg-gray-100 rounded h-8 relative overflow-hidden border border-gray-200">
                <div
                  className="bg-blue-600 h-full rounded transition-all"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-end pr-4 text-sm font-semibold" style={{ color: '#2C3E50' }}>
                  {item.count}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SourcesView({ data }: { data: { source: string; count: number }[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#2C3E50' }}>
        <FileText className="w-6 h-6" style={{ color: '#D89B6A' }} />
        Insights by Source
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.length === 0 ? (
          <p className="text-center py-8 col-span-full" style={{ color: '#5B8FA3' }}>No source data available</p>
        ) : (
          data.map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-lg font-bold mb-1" style={{ color: '#2C3E50' }}>{item.source}</div>
              <div className="text-2xl font-bold" style={{ color: '#5B8FA3' }}>{item.count}</div>
              <div className="text-sm" style={{ color: '#5B8FA3' }}>insights</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NetworkView({ insights }: { insights: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#2C3E50' }}>
        <Network className="w-6 h-6" style={{ color: '#D89B6A' }} />
        Knowledge Network
      </h2>
      <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
        <Network className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="mb-2" style={{ color: '#5B8FA3' }}>Knowledge network visualization</p>
        <p className="text-sm" style={{ color: '#5B8FA3' }}>
          {insights.length} insight{insights.length !== 1 ? 's' : ''} available for network analysis
        </p>
        <p className="text-xs mt-4" style={{ color: '#5B8FA3' }}>
          Network graph visualization coming soon
        </p>
      </div>
    </div>
  );
}

}
}
}