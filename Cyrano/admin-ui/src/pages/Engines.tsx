/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { executeTool } from '../lib/cyrano-admin-api';

const engines = [
  { name: 'MAE', description: 'Multi-Agent Engine', tool: 'mae_engine' },
  { name: 'GoodCounsel', description: 'Legal AI Engine', tool: 'goodcounsel_engine' },
  { name: 'Potemkin', description: 'Verification and Integrity Engine', tool: 'potemkin_engine' },
  { name: 'Forecast', description: 'Forecast Engine', tool: 'forecast_engine' },
  { name: 'Chronometric', description: 'Time Tracking Engine', tool: 'chronometric_module' },
];

export default function Engines() {
  const { data: engineStatuses, isLoading } = useQuery({
    queryKey: ['engines-status'],
    queryFn: async () => {
      const statuses = await Promise.allSettled(
        engines.map(async (engine) => {
          try {
            const result = await executeTool(engine.tool, { action: 'get_status' });
            return { ...engine, status: 'active', info: result };
          } catch (error) {
            return { ...engine, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
          }
        })
      );
      return statuses.map((result, idx) => ({
        ...engines[idx],
        ...(result.status === 'fulfilled' ? result.value : { status: 'error', error: 'Failed to fetch status' }),
      }));
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-warm-white/70">Loading engines...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-warm-white mb-2">Engines</h1>
        <p className="text-warm-white/70">Monitor and manage Cyrano engines</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(engineStatuses || engines).map((engine: any) => (
          <div key={engine.name} className="bg-charcoal rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-aqua" />
              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                engine.status === 'active' 
                  ? 'bg-light-green/20 text-light-green' 
                  : 'bg-alert-red/20 text-alert-red'
              }`}>
                {engine.status === 'active' ? 'Active' : 'Error'}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-warm-white mb-1">{engine.name}</h3>
            <p className="text-sm text-warm-white/70 mb-4">{engine.description}</p>
            {engine.error && (
              <div className="mt-4 p-3 bg-alert-red/10 border border-alert-red/50 rounded text-sm text-alert-red">
                {engine.error}
              </div>
            )}
            {engine.info && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-warm-white/50 hover:text-warm-white">
                  View Details
                </summary>
                <pre className="mt-2 p-3 bg-primary-dark rounded text-xs text-warm-white/80 overflow-x-auto">
                  {JSON.stringify(engine.info, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}