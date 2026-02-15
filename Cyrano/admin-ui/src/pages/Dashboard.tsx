/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from '@tanstack/react-query';
import { Activity, Wrench, Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { getSystemStatus, getHealth } from '../lib/cyrano-admin-api';

export default function Dashboard() {
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => getSystemStatus(true),
    refetchInterval: 30000,
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30000,
  });

  if (statusLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-warm-white/70">Loading dashboard...</div>
      </div>
    );
  }

  const uptimeHours = health?.uptime ? Math.floor(health.uptime / 3600) : 0;
  const uptimeMinutes = health?.uptime ? Math.floor((health.uptime % 3600) / 60) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-warm-white mb-2">Dashboard</h1>
        <p className="text-warm-white/70">Overview of Cyrano MCP Server status and metrics</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-aqua" />
            <div className={`px-2 py-1 rounded text-xs font-semibold ${
              systemStatus?.system?.status === 'running' 
                ? 'bg-light-green/20 text-light-green' 
                : 'bg-alert-red/20 text-alert-red'
            }`}>
              {systemStatus?.system?.status || 'Unknown'}
            </div>
          </div>
          <h3 className="text-sm text-warm-white/70 mb-1">System Status</h3>
          <p className="text-2xl font-bold text-warm-white">
            {systemStatus?.system?.version || 'N/A'}
          </p>
        </div>

        <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Wrench className="w-8 h-8 text-accent-gold" />
          </div>
          <h3 className="text-sm text-warm-white/70 mb-1">Total Tools</h3>
          <p className="text-2xl font-bold text-warm-white">
            {health?.tools_count || systemStatus?.tools?.total_tools || 0}
          </p>
        </div>

        <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-light-green" />
          </div>
          <h3 className="text-sm text-warm-white/70 mb-1">Uptime</h3>
          <p className="text-2xl font-bold text-warm-white">
            {uptimeHours}h {uptimeMinutes}m
          </p>
        </div>

        <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 text-aqua" />
            <div className={`px-2 py-1 rounded text-xs font-semibold ${
              systemStatus?.ai_integration?.functional_ai 
                ? 'bg-light-green/20 text-light-green' 
                : 'bg-alert-red/20 text-alert-red'
            }`}>
              {systemStatus?.ai_integration?.functional_ai ? 'Active' : 'Limited'}
            </div>
          </div>
          <h3 className="text-sm text-warm-white/70 mb-1">AI Integration</h3>
          <p className="text-2xl font-bold text-warm-white">
            {systemStatus?.ai_integration?.available_providers?.length || 0} / {systemStatus?.ai_integration?.total_providers || 0}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {systemStatus?.warnings && systemStatus.warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-300 mb-2">Warnings</h3>
              <ul className="space-y-1 text-sm text-yellow-200/80">
                {systemStatus.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* AI Providers Status */}
      <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-warm-white mb-4">AI Providers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemStatus?.ai_integration?.available_providers?.map((provider: string) => (
            <div key={provider} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-light-green" />
              <span className="text-sm text-warm-white">{provider}</span>
            </div>
          ))}
          {systemStatus?.ai_integration?.missing_providers?.map((provider: string) => (
            <div key={provider} className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-alert-red" />
              <span className="text-sm text-warm-white/50">{provider}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
}
)