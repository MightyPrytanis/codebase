/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from '@tanstack/react-query';
import { Shield, CheckCircle2, XCircle, Lock, AlertTriangle } from 'lucide-react';
import { getSecurityStatus, getHealth } from '../lib/cyrano-admin-api';

export default function Security() {
  const { data: securityStatus, isLoading } = useQuery({
    queryKey: ['security-status'],
    queryFn: getSecurityStatus,
    refetchInterval: 60000,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-warm-white/70">Loading security status...</div>
      </div>
    );
  }

  const securityFeatures = [
    {
      name: 'CSRF Protection',
      enabled: securityStatus?.csrfProtection ?? health?.security?.csrfProtection ?? false,
      description: 'Protects against Cross-Site Request Forgery attacks',
    },
    {
      name: 'Rate Limiting',
      enabled: securityStatus?.rateLimiting ?? health?.security?.rateLimiting ?? false,
      description: 'Prevents abuse by limiting request frequency',
    },
    {
      name: 'Authentication',
      enabled: securityStatus?.authentication ?? false,
      description: 'User authentication and session management',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-warm-white mb-2">Security</h1>
        <p className="text-warm-white/70">Security settings and status</p>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {securityFeatures.map((feature) => (
          <div key={feature.name} className="bg-charcoal rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-8 h-8 text-aqua" />
              {feature.enabled ? (
                <CheckCircle2 className="w-6 h-6 text-light-green" />
              ) : (
                <XCircle className="w-6 h-6 text-alert-red" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-warm-white mb-1">{feature.name}</h3>
            <p className="text-sm text-warm-white/70 mb-2">{feature.description}</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold ${
              feature.enabled
                ? 'bg-light-green/20 text-light-green'
                : 'bg-alert-red/20 text-alert-red'
            }`}>
              {feature.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        ))}
      </div>

      {/* Security Recommendations */}
      <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-semibold text-warm-white">Security Recommendations</h2>
        </div>
        <ul className="space-y-2 text-sm text-warm-white/70">
          <li className="flex items-start gap-2">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-aqua" />
            <span>Ensure all API keys are stored securely in environment variables</span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-aqua" />
            <span>Regularly rotate API keys and access tokens</span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-aqua" />
            <span>Monitor access logs for suspicious activity</span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-aqua" />
            <span>Keep Cyrano server updated to the latest version</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
}