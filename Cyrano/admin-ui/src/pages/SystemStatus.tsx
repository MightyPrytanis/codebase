/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from '@tanstack/react-query';
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, Server } from 'lucide-react';
import { getSystemStatus, getHealth } from '../lib/cyrano-admin-api';

export default function SystemStatus() {
  const { data: systemStatus, isLoading, refetch } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => getSystemStatus(true),
    refetchInterval: 30000,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-warm-white/70">Loading system status...</div>
      </div>
    );
  }

  const uptimeHours = health?.uptime ? Math.floor(health.uptime / 3600) : 0;
  const uptimeMinutes = health?.uptime ? Math.floor((health.uptime % 3600) / 60) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-warm-white mb-2">System Status</h1>
          <p className="text-warm-white/70">Detailed system information and health metrics</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-charcoal hover:bg-gray-700 rounded-lg text-warm-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System Information */}
      <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-6 h-6 text-aqua" />
          <h2 className="text-xl font-semibold text-warm-white">System Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Name</div>
            <div className="text-warm-white font-semibold">{systemStatus?.system?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Version</div>
            <div className="text-warm-white font-semibold">{systemStatus?.system?.version || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Status</div>
            <div className="flex items-center gap-2">
              {systemStatus?.system?.status === 'running' ? (
                <CheckCircle2 className="w-4 h-4 text-light-green" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-alert-red" />
              )}
              <span className="text-warm-white font-semibold">{systemStatus?.system?.status || 'Unknown'}</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Uptime</div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-aqua" />
              <span className="text-warm-white font-semibold">{uptimeHours}h {uptimeMinutes}m</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Demo Mode</div>
            <div className="text-warm-white font-semibold">
              {systemStatus?.system?.demo_mode ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Last Updated</div>
            <div className="text-warm-white font-semibold">
              {systemStatus?.system?.timestamp 
                ? new Date(systemStatus.system.timestamp).toLocaleString()
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Integration */}
      <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-warm-white mb-4">AI Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Status</div>
            <div className="flex items-center gap-2">
              {systemStatus?.ai_integration?.functional_ai ? (
                <CheckCircle2 className="w-4 h-4 text-light-green" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-alert-red" />
              )}
              <span className="text-warm-white font-semibold">
                {systemStatus?.ai_integration?.status || 'Unknown'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Configured Providers</div>
            <div className="text-warm-white font-semibold">
              {systemStatus?.ai_integration?.available_providers?.length || 0} / {systemStatus?.ai_integration?.total_providers || 0}
            </div>
          </div>
        </div>
        {systemStatus?.ai_integration?.available_providers && systemStatus.ai_integration.available_providers.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-warm-white/70 mb-2">Available Providers</div>
            <div className="flex flex-wrap gap-2">
              {systemStatus.ai_integration.available_providers.map((provider: string) => (
                <span key={provider} className="px-3 py-1 bg-light-green/20 text-light-green rounded text-sm">
                  {provider}
                </span>
              ))}
            </div>
          </div>
        )}
        {systemStatus?.ai_integration?.missing_providers && systemStatus.ai_integration.missing_providers.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-warm-white/70 mb-2">Missing Providers</div>
            <div className="flex flex-wrap gap-2">
              {systemStatus.ai_integration.missing_providers.map((provider: string) => (
                <span key={provider} className="px-3 py-1 bg-alert-red/20 text-alert-red rounded text-sm">
                  {provider}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tools Summary */}
      <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-warm-white mb-4">Tools Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Total Tools</div>
            <div className="text-2xl font-bold text-warm-white">
              {systemStatus?.tools?.total_tools || health?.tools_count || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-warm-white/70 mb-1">AI Tools</div>
            <div className="text-2xl font-bold text-warm-white">
              {systemStatus?.tools?.ai_tools || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-warm-white/70 mb-1">Data Processing Tools</div>
            <div className="text-2xl font-bold text-warm-white">
              {systemStatus?.tools?.data_processing_tools || 'N/A'}
            </div>
          </div>
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
    </div>
  );
}
