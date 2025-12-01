import React, { useState } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { VerificationResults } from './components/VerificationResults';
import { IntegrityDashboard } from './components/IntegrityDashboard';
import { Settings } from './components/Settings';
import './App.css';

/**
 * Potemkin Standalone App
 * 
 * Main application component for the Potemkin verification and integrity engine.
 * Provides UI for:
 * - Document upload and verification
 * - Verification results display
 * - Integrity monitoring dashboard
 * - Settings and configuration
 */
function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'results' | 'dashboard' | 'settings'>('upload');
  const [verificationResults, setVerificationResults] = useState<any[]>([]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Potemkin</h1>
        <p className="subtitle">Verification and Integrity Engine</p>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => setActiveTab('upload')}
        >
          Upload & Verify
        </button>
        <button
          className={activeTab === 'results' ? 'active' : ''}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'upload' && (
          <DocumentUpload onVerificationComplete={(result) => {
            setVerificationResults([...verificationResults, result]);
            setActiveTab('results');
          }} />
        )}
        {activeTab === 'results' && (
          <VerificationResults results={verificationResults} />
        )}
        {activeTab === 'dashboard' && (
          <IntegrityDashboard />
        )}
        {activeTab === 'settings' && (
          <Settings />
        )}
      </main>
    </div>
  );
}

export default App;

