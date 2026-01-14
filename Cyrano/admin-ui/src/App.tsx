/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Settings, Shield, Database, Wrench, BarChart3, Home } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import SystemStatus from './pages/SystemStatus';
import Security from './pages/Security';
import Engines from './pages/Engines';
import Logs from './pages/Logs';

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/system', label: 'System Status', icon: Activity },
    { path: '/tools', label: 'Tools', icon: Wrench },
    { path: '/engines', label: 'Engines', icon: BarChart3 },
    { path: '/security', label: 'Security', icon: Shield },
    { path: '/logs', label: 'Logs', icon: Database },
  ];

  return (
    <nav className="bg-charcoal border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-accent-gold">Cyrano</div>
            <div className="text-sm text-warm-white/70">Admin</div>
          </div>
          <div className="flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path || 
                (item.path === '/' && location.pathname === '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    active
                      ? 'bg-accent-gold text-charcoal'
                      : 'text-warm-white/70 hover:text-warm-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-primary-dark">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/system" element={<SystemStatus />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/engines" element={<Engines />} />
            <Route path="/security" element={<Security />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

}
}
)