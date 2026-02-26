/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { FileText, Upload, TrendingUp, CheckCircle, Clock, FileCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats] = useState({
    totalFiles: 127,
    processed: 98,
    processing: 5,
    failed: 3,
    insights: 456,
    today: 12,
  });

  const recentFiles = [
    { id: 1, name: 'Contract_Agreement.pdf', status: 'completed', date: '2025-11-26', insights: 12 },
    { id: 2, name: 'Discovery_Response.docx', status: 'processing', date: '2025-11-26', insights: 0 },
    { id: 3, name: 'Client_Email.eml', status: 'completed', date: '2025-11-25', insights: 8 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C3E50' }}>Arkiver Dashboard</h1>
          <p style={{ color: '#5B8FA3' }}>Document processing and insight extraction</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8" style={{ color: '#D89B6A' }} />
              <span className="text-2xl font-bold" style={{ color: '#5B8FA3' }}>{stats.totalFiles}</span>
            </div>
            <p className="text-sm" style={{ color: '#5B8FA3' }}>Total Files</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold" style={{ color: '#5B8FA3' }}>{stats.processed}</span>
            </div>
            <p className="text-sm" style={{ color: '#5B8FA3' }}>Processed</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold" style={{ color: '#5B8FA3' }}>{stats.processing}</span>
            </div>
            <p className="text-sm" style={{ color: '#5B8FA3' }}>Processing</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Sparkles className="w-8 h-8" style={{ color: '#D89B6A' }} />
              <span className="text-2xl font-bold" style={{ color: '#D89B6A' }}>{stats.insights}</span>
            </div>
            <p className="text-sm" style={{ color: '#5B8FA3' }}>Total Insights</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2C3E50' }}>Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/extractor"
              className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors text-white"
              style={{ backgroundColor: '#D89B6A' }}
            >
              <Upload className="w-5 h-5" />
              Upload & Process
            </Link>
            <Link
              to="/insights"
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 font-semibold rounded-lg transition-colors"
              style={{ color: '#2C3E50' }}
            >
              <TrendingUp className="w-5 h-5" />
              View Insights
            </Link>
            <Link
              to="/visualizations"
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 font-semibold rounded-lg transition-colors"
              style={{ color: '#2C3E50' }}
            >
              <FileCheck className="w-5 h-5" />
              Visualizations
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#2C3E50' }}>Recent Files</h2>
            <Link to="/extractor" className="text-sm" style={{ color: '#5B8FA3' }}>
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: '#D89B6A' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#2C3E50' }}>{file.name}</p>
                    <p className="text-sm" style={{ color: '#5B8FA3' }}>{file.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {file.status === 'completed' && (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {file.insights} insights
                    </span>
                  )}
                  {file.status === 'processing' && (
                    <span className="flex items-center gap-1 text-blue-600 text-sm">
                      <Clock className="w-4 h-4 animate-spin" />
                      Processing
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${
                      file.status === 'completed'
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-blue-100 text-blue-700 border-blue-300'
                    }`}
                  >
                    {file.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

}
