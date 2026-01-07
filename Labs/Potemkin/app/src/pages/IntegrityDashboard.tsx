/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Shield, AlertTriangle, FileText, RefreshCw, Loader2 } from 'lucide-react';
import { potemkinService } from '../services/potemkinService';

export default function IntegrityDashboard() {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['integrity-metrics'],
    queryFn: () => potemkinService.getIntegrityMetrics(),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    );
  }

  const overallScore = (metrics as any)?.overallScore || 0;
  const documentsVerified = (metrics as any)?.documentsVerified || 0;
  const issuesDetected = (metrics as any)?.issuesDetected || 0;
  const recentAlerts = (metrics as any)?.recentAlerts || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-warm-white mb-2">Integrity Dashboard</h1>
          <p className="text-warm-white/70">Monitor AI output quality and integrity over time</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-charcoal hover:bg-gray-700 rounded-lg text-warm-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-aqua" />
          </div>
          <h3 className="text-sm text-warm-white/70 mb-1">Overall Integrity Score</h3>
          <p className="text-3xl font-bold text-warm-white">
            {(overallScore * 100).toFixed(0)}%
          </p>
          <div className="mt-2 bg-primary-dark rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                overallScore > 0.8 ? 'bg-light-green' :
                overallScore > 0.5 ? 'bg-yellow-500' : 'bg-alert-red'
              }`}
              style={{ width: `${overallScore * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-accent-gold" />
          </div>
          <h3 className="text-sm text-warm-white/70 mb-1">Documents Verified</h3>
          <p className="text-3xl font-bold text-warm-white">{documentsVerified}</p>
        </div>

        <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-alert-red" />
          </div>
          <h3 className="text-sm text-warm-white/70 mb-1">Issues Detected</h3>
          <p className="text-3xl font-bold text-warm-white">{issuesDetected}</p>
        </div>

        <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 text-light-green" />
          </div>
          <h3 className="text-sm text-warm-white/70 mb-1">Success Rate</h3>
          <p className="text-3xl font-bold text-warm-white">
            {documentsVerified > 0
              ? `${(((documentsVerified - issuesDetected) / documentsVerified) * 100).toFixed(0)}%`
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-warm-white mb-4">Recent Alerts</h2>
        {recentAlerts.length > 0 ? (
          <div className="space-y-3">
            {recentAlerts.map((alert: any, idx: number) => (
              <div key={idx} className="p-4 bg-primary-dark rounded-lg border border-gray-700">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-warm-white font-semibold">{alert.message || alert}</p>
                    {alert.timestamp && (
                      <p className="text-sm text-warm-white/50 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-warm-white/70">
            <Shield className="w-12 h-12 mx-auto mb-4 text-warm-white/30" />
            <p>No recent alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
