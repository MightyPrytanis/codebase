/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from '@tanstack/react-query';
import { Shield, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';

export default function VerificationResults() {
  const { data: results = [] } = useQuery({
    queryKey: ['verification-results'],
    initialData: [],
  });

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-warm-white mb-2">Verification Results</h1>
          <p className="text-warm-white/70">No verification results yet</p>
        </div>
        <div className="bg-charcoal rounded-lg p-12 border border-gray-700 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-warm-white/30" />
          <p className="text-warm-white/70">Upload a document to get started with verification</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-warm-white mb-2">Verification Results</h1>
        <p className="text-warm-white/70">{results.length} verification{results.length !== 1 ? 's' : ''} completed</p>
      </div>

      <div className="space-y-4">
        {results.map((result: any, index: number) => (
          <div key={index} className="bg-charcoal rounded-lg p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {result.status === 'verified' || result.confidence > 0.8 ? (
                  <CheckCircle2 className="w-6 h-6 text-light-green" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-alert-red" />
                )}
                <h3 className="text-xl font-semibold text-warm-white">Verification #{index + 1}</h3>
              </div>
              {result.timestamp && (
                <div className="flex items-center gap-2 text-sm text-warm-white/50">
                  <Clock className="w-4 h-4" />
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-warm-white/70 mb-1">Status</div>
                <div className="text-warm-white font-semibold">{result.status || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-sm text-warm-white/70 mb-1">Confidence Score</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-primary-dark rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (result.confidence || 0) > 0.8 ? 'bg-light-green' :
                        (result.confidence || 0) > 0.5 ? 'bg-yellow-500' : 'bg-alert-red'
                      }`}
                      style={{ width: `${((result.confidence || 0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-warm-white font-semibold">
                    {((result.confidence || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {result.issues && result.issues.length > 0 && (
              <div className="mt-4 p-4 bg-alert-red/10 border border-alert-red/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-alert-red" />
                  <h4 className="font-semibold text-alert-red">Issues Detected</h4>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-alert-red/80">
                  {result.issues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="mt-4 p-4 bg-aqua/10 border border-aqua/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-aqua" />
                  <h4 className="font-semibold text-aqua">Recommendations</h4>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-aqua/80">
                  {result.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
