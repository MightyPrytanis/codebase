import React, { useState } from 'react';

/**
 * Settings Component
 * 
 * Provides configuration UI for Potemkin app settings:
 * - MCP server connection
 * - Verification preferences
 * - Alert thresholds
 * - Display options
 */
export function Settings() {
  const [mcpServerUrl, setMcpServerUrl] = useState('http://localhost:5002');
  const [autoVerify, setAutoVerify] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(0.7);

  const handleSave = () => {
    // TODO: Save settings
    console.log('Settings saved:', {
      mcpServerUrl,
      autoVerify,
      alertThreshold,
    });
    alert('Settings saved!');
  };

  return (
    <div className="settings">
      <h2>Settings</h2>
      
      <div className="setting-group">
        <label>
          MCP Server URL:
          <input
            type="text"
            value={mcpServerUrl}
            onChange={(e) => setMcpServerUrl(e.target.value)}
            placeholder="http://localhost:5002"
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={autoVerify}
            onChange={(e) => setAutoVerify(e.target.checked)}
          />
          Auto-verify uploaded documents
        </label>
      </div>

      <div className="setting-group">
        <label>
          Alert Threshold (0-1):
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
          />
        </label>
      </div>

      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
}

