/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const [mcpServerUrl, setMcpServerUrl] = useState(
    localStorage.getItem('potemkin_mcp_server_url') || import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3000'
  );
  const [autoVerify, setAutoVerify] = useState(
    localStorage.getItem('potemkin_auto_verify') === 'true'
  );
  const [alertThreshold, setAlertThreshold] = useState(
    parseFloat(localStorage.getItem('potemkin_alert_threshold') || '0.7')
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('potemkin_mcp_server_url', mcpServerUrl);
    localStorage.setItem('potemkin_auto_verify', String(autoVerify));
    localStorage.setItem('potemkin_alert_threshold', String(alertThreshold));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-warm-white mb-2">Settings</h1>
        <p className="text-warm-white/70">Configure Potemkin verification and integrity settings</p>
      </div>

      <div className="bg-charcoal rounded-lg p-6 border border-gray-700 space-y-6">
        {/* MCP Server URL */}
        <div>
          <label className="block text-sm font-semibold text-warm-white mb-2">
            MCP Server URL
          </label>
          <input
            type="text"
            value={mcpServerUrl}
            onChange={(e) => setMcpServerUrl(e.target.value)}
            placeholder="http://localhost:3000"
            className="w-full px-4 py-2 bg-primary-dark border border-gray-700 rounded-lg text-warm-white placeholder-warm-white/50 focus:outline-none focus:ring-2 focus:ring-accent-gold"
          />
          <p className="mt-2 text-sm text-warm-white/50">
            The URL of the Cyrano MCP server for API communication
          </p>
        </div>

        {/* Auto Verify */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoVerify}
              onChange={(e) => setAutoVerify(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 text-accent-gold focus:ring-2 focus:ring-accent-gold"
            />
            <div>
              <div className="text-sm font-semibold text-warm-white">Auto-verify uploaded documents</div>
              <div className="text-sm text-warm-white/50">
                Automatically verify documents when uploaded
              </div>
            </div>
          </label>
        </div>

        {/* Alert Threshold */}
        <div>
          <label className="block text-sm font-semibold text-warm-white mb-2">
            Alert Threshold: {alertThreshold.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-warm-white/50 mt-1">
            <span>0.0 (All alerts)</span>
            <span>1.0 (Critical only)</span>
          </div>
          <p className="mt-2 text-sm text-warm-white/50">
            Confidence threshold below which alerts will be generated
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-accent-gold hover:bg-accent-gold/90 text-charcoal font-semibold rounded-lg transition-colors"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Settings Saved
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-aqua/10 border border-aqua/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-aqua flex-shrink-0 mt-0.5" />
          <div className="text-sm text-aqua/80">
            <p className="font-semibold mb-1">Note</p>
            <p>Settings are stored locally in your browser. Changes to the MCP Server URL require a page refresh to take effect.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
