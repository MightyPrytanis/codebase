/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { Database, Filter, Download } from 'lucide-react';

export default function Logs() {
  const [logLevel, setLogLevel] = useState<string>('all');

  // Placeholder for log data - in a real implementation, this would fetch from an API
  const logs: Array<{ timestamp: string; level: string; message: string }> = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-warm-white mb-2">Logs</h1>
          <p className="text-warm-white/70">View system logs and activity</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value)}
            className="px-4 py-2 bg-charcoal border border-gray-700 rounded-lg text-warm-white focus:outline-none focus:ring-2 focus:ring-accent-gold"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-charcoal hover:bg-gray-700 rounded-lg text-warm-white transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-charcoal rounded-lg border border-gray-700">
        <div className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-warm-white/70">
              <Database className="w-12 h-12 mx-auto mb-4 text-warm-white/30" />
              <p>No logs available</p>
              <p className="text-sm mt-2">Logs will appear here when the system generates log entries</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, idx) => (
                <div key={idx} className="p-3 bg-primary-dark rounded text-sm font-mono">
                  <span className="text-warm-white/50">{log.timestamp}</span>
                  <span className={`ml-4 px-2 py-1 rounded text-xs ${
                    log.level === 'error' ? 'bg-alert-red/20 text-alert-red' :
                    log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-aqua/20 text-aqua'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="ml-4 text-warm-white">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

}