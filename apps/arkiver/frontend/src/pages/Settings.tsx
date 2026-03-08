/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { Settings as SettingsIcon, Download, Trash2, Bell, User, Shield, Activity } from 'lucide-react';
import { isAdminSync } from '../lib/admin-auth';
import { CustodianSettings } from '../components/CustodianSettings';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'account' | 'alerts' | 'export' | 'data' | 'admin'>('account');
  const isAdmin = isAdminSync();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2" style={{ color: '#2C3E50' }}>
            <SettingsIcon className="w-8 h-8" style={{ color: '#D89B6A' }} />
            Settings
          </h1>
          <p style={{ color: '#5B8FA3' }}>Manage your account, preferences, and data</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'account' as const, label: 'Account', icon: User },
              { id: 'alerts' as const, label: 'Alerts', icon: Bell },
              { id: 'export' as const, label: 'Export', icon: Download },
              { id: 'data' as const, label: 'Data', icon: Trash2 },
              ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin', icon: Activity }] : []),
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'account' && <AccountSettings />}
            {activeTab === 'alerts' && <AlertSettings />}
            {activeTab === 'export' && <ExportSettings />}
            {activeTab === 'data' && <DataSettings />}
            {activeTab === 'admin' && isAdmin && <CustodianSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>User Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue="user@example.com"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              defaultValue="User"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#2C3E50' }}>
          <Shield className="w-5 h-5" style={{ color: '#D89B6A' }} />
          AI Integrity Monitoring
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-gray-700">Enable proactive integrity monitoring</span>
          </label>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Drift Threshold</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="75"
              className="w-full"
            />
            <span className="text-sm text-gray-600">75%</span>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Bias Threshold</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              className="w-full"
            />
            <span className="text-sm text-gray-600">80%</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Method</label>
            <select className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="in_app">In-App Only</option>
              <option value="email">Email</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
      </div>

      <button className="text-white font-semibold px-6 py-2 rounded-lg transition-colors" style={{ backgroundColor: '#D89B6A' }}>
        Save Changes
      </button>
    </div>
  );
}

function AlertSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>Alert Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-gray-700">Enable email notifications</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-gray-700">Enable in-app notifications</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Check Frequency</label>
            <select className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="hourly">Hourly</option>
              <option value="daily" selected>Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>

      <button className="text-white font-semibold px-6 py-2 rounded-lg transition-colors" style={{ backgroundColor: '#D89B6A' }}>
        Save Alert Settings
      </button>
    </div>
  );
}

function ExportSettings() {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>Export Data</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF Report</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700">Include all insights</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700">Include file metadata</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700">Include integrity test results</span>
            </label>
          </div>
        </div>
      </div>

      <button className="text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2" style={{ backgroundColor: '#D89B6A' }}>
        <Download className="w-5 h-5" />
        Export Data
      </button>
    </div>
  );
}

function DataSettings() {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4 text-red-600">Danger Zone</h3>
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Delete All Data</h4>
            <p className="text-sm text-gray-700 mb-4">
              This will permanently delete all uploaded files, insights, and test results. This action cannot be undone.
            </p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete All Data
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-600 font-semibold">
                  Are you sure? Type "DELETE" to confirm.
                </p>
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  className="w-full bg-white border border-red-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-2">
                  <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                    Confirm Deletion
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}
