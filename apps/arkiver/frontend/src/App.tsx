/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Extractor from './pages/Extractor';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Visualizations from './pages/Visualizations';
import AiAssistant from './pages/AiAssistant';
import AiIntegrity from './pages/AiIntegrity';
import HomePage from './pages/HomePage';
import Onboarding from './pages/onboarding';
import { Upload, Lightbulb, Settings as SettingsIcon, BarChart3, Shield, Home, HelpCircle } from 'lucide-react';
import { AIIcon } from './components/AIIcon';
import { ToastProvider } from './components/ui/toast';
import { CyranoChatDrawer } from './components/CyranoChatDrawer';
import { NavigationHelpTooltip } from './components/NavigationHelpTooltip';
import HelpMenu from './components/help-menu';
import arkiverLogo from './Arkiver Main.png';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Navigation() {
  const location = useLocation();
  const [showHelpMenu, setShowHelpMenu] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, description: 'Overview of key metrics and recent activity.' },
    { path: '/extractor', label: 'Extractor', icon: Upload, description: 'Upload and process documents for structured extraction.' },
    { path: '/insights', label: 'Insights', icon: Lightbulb, description: 'Review AI-generated insights from processed documents.' },
    { path: '/visualizations', label: 'Visualizations', icon: BarChart3, description: 'Explore charts and visual summaries of your data.' },
    { path: '/ai-assistant', label: 'AI Assistant', icon: AIIcon, description: 'Chat with the Cyrano Pathfinder about Arkiver.' },
    { path: '/ai-integrity', label: 'AI Integrity', icon: Shield, description: 'Run integrity and drift checks on AI outputs.' },
    { path: '/settings', label: 'Settings', icon: SettingsIcon, description: 'Configure Arkiver and integration settings.' },
  ];

  // Check if current path matches (handle root redirect)
  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === path;
  };

  return (
    <nav style={{ backgroundColor: '#2C3E50', borderBottom: '1px solid #e0e0e0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img 
              src={arkiverLogo} 
              alt="Arkiver" 
              style={{ height: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }}
            />
          </div>
          <div className="flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const isAIIcon = Icon === AIIcon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    active
                      ? 'bg-white text-gray-900'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  style={active ? {} : { color: '#D89B6A' }}
                >
                  {isAIIcon ? (
                    <AIIcon size={16} style={{ color: active ? '#2C3E50' : '#D89B6A' }} />
                  ) : (
                    <Icon className="w-4 h-4" style={{ color: active ? '#2C3E50' : '#D89B6A' }} />
                  )}
                  <span className="hidden sm:inline">
                    <NavigationHelpTooltip label={item.label} description={item.description} />
                  </span>
                </Link>
              );
            })}
            <button
              onClick={() => setShowHelpMenu(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-gray-300 hover:text-white"
              style={{ color: '#D89B6A' }}
              aria-label="Open help menu"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Help</span>
            </button>
          </div>
        </div>
      </div>
      {showHelpMenu && <HelpMenu onClose={() => setShowHelpMenu(false)} />}
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <Router>
        <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/extractor" element={<Extractor />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/visualizations" element={<Visualizations />} />
              <Route path="/ai-assistant" element={<AiAssistant />} />
              <Route path="/ai-integrity" element={<AiIntegrity />} />
            </Routes>
          </main>
          <CyranoChatDrawer app="arkiver" />
        </div>
      </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;

}