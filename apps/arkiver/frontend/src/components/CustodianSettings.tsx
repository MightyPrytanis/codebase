/*
 * Custodian Settings Component
 * Admin-only settings for Cyrano Custodian Engine
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_CYRANO_API_URL || 'http://localhost:5002';

interface AdminContactPreference {
  method: 'email' | 'sms' | 'instant_message' | 'webhook' | 'console';
  contact_info: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface CustodianConfig {
  monitoring_interval_minutes: 10 | 20 | 30;
  admin_contacts: AdminContactPreference[];
  auto_fix_enabled: boolean;
  auto_update_enabled: boolean;
  failsafe_enabled: boolean;
  health_check_thresholds: {
    cpu_warning: number;
    cpu_critical: number;
    memory_warning: number;
    memory_critical: number;
    disk_warning: number;
    disk_critical: number;
  };
}

async function executeCyranoTool(tool: string, input: any) {
  const response = await fetch(`${API_URL}/mcp/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, input }),
  });
  return response.json();
}

export function CustodianSettings() {
  const queryClient = useQueryClient();
  const [newContact, setNewContact] = useState<Partial<AdminContactPreference>>({
    method: 'email',
    enabled: true,
    priority: 'medium',
  });

  const { data: config, isLoading, error } = useQuery({
    queryKey: ["custodian-config"],
    queryFn: async () => {
      const result = await executeCyranoTool("custodian_engine", {
        action: "get_config",
      });
      if (result.isError) {
        throw new Error(result.content?.[0]?.text || "Failed to fetch Custodian configuration");
      }
      return JSON.parse(result.content?.[0]?.text || "{}") as CustodianConfig;
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<CustodianConfig>) => {
      const result = await executeCyranoTool("custodian_engine", {
        action: "update_config",
        options: updates,
      });
      if (result.isError) {
        throw new Error(result.content?.[0]?.text || "Failed to update configuration");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custodian-config"] });
    },
  });

  const handleAddContact = () => {
    if (!config || !newContact.contact_info) return;
    
    const updatedConfig = {
      ...config,
      admin_contacts: [
        ...config.admin_contacts,
        {
          method: newContact.method || 'email',
          contact_info: newContact.contact_info,
          enabled: newContact.enabled ?? true,
          priority: newContact.priority || 'medium',
        },
      ],
    };
    
    updateConfigMutation.mutate(updatedConfig);
    setNewContact({ method: 'email', enabled: true, priority: 'medium' });
  };

  const handleRemoveContact = (index: number) => {
    if (!config) return;
    const updatedConfig = {
      ...config,
      admin_contacts: config.admin_contacts.filter((_, i) => i !== index),
    };
    updateConfigMutation.mutate(updatedConfig);
  };

  const handleUpdateContact = (index: number, updates: Partial<AdminContactPreference>) => {
    if (!config) return;
    const updatedConfig = {
      ...config,
      admin_contacts: config.admin_contacts.map((contact, i) =>
        i === index ? { ...contact, ...updates } : contact
      ),
    };
    updateConfigMutation.mutate(updatedConfig);
  };

  if (isLoading) {
    return <div className="text-sm" style={{ color: '#5B8FA3' }}>Loading configuration...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">Failed to load configuration: {error instanceof Error ? error.message : "Unknown error"}</div>;
  }

  if (!config) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#2C3E50' }}>Custodian Engine Settings</h3>
        
        {/* Monitoring Interval */}
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-gray-700">Monitoring Interval</label>
          <select
            value={config.monitoring_interval_minutes}
            onChange={(e) => {
              updateConfigMutation.mutate({
                monitoring_interval_minutes: parseInt(e.target.value, 10) as 10 | 20 | 30,
              });
            }}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </div>

        {/* Admin Contacts */}
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-gray-700">Admin Contact Methods</label>
          {config.admin_contacts.map((contact, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg">
              <select
                value={contact.method}
                onChange={(e) => handleUpdateContact(index, { method: e.target.value as AdminContactPreference['method'] })}
                className="w-40 bg-white border border-gray-300 rounded px-2 py-1"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="instant_message">IM</option>
                <option value="webhook">Webhook</option>
                <option value="console">Console</option>
              </select>
              <input
                type="text"
                value={contact.contact_info}
                onChange={(e) => handleUpdateContact(index, { contact_info: e.target.value })}
                placeholder="Contact info"
                className="flex-1 bg-white border border-gray-300 rounded px-2 py-1"
              />
              <select
                value={contact.priority}
                onChange={(e) => handleUpdateContact(index, { priority: e.target.value as AdminContactPreference['priority'] })}
                className="w-32 bg-white border border-gray-300 rounded px-2 py-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={contact.enabled}
                  onChange={(e) => handleUpdateContact(index, { enabled: e.target.checked })}
                />
                <span className="text-sm">Enabled</span>
              </label>
              <button
                onClick={() => handleRemoveContact(index)}
                className="text-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          
          {/* Add New Contact */}
          <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
            <select
              value={newContact.method || 'email'}
              onChange={(e) => setNewContact({ ...newContact, method: e.target.value as AdminContactPreference['method'] })}
              className="w-40 bg-white border border-gray-300 rounded px-2 py-1"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="instant_message">IM</option>
              <option value="webhook">Webhook</option>
              <option value="console">Console</option>
            </select>
            <input
              type="text"
              value={newContact.contact_info || ''}
              onChange={(e) => setNewContact({ ...newContact, contact_info: e.target.value })}
              placeholder="Contact info"
              className="flex-1 bg-white border border-gray-300 rounded px-2 py-1"
            />
            <button
              onClick={handleAddContact}
              className="text-white font-semibold px-4 py-1 rounded transition-colors"
              style={{ backgroundColor: '#D89B6A' }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.auto_fix_enabled}
              onChange={(e) => updateConfigMutation.mutate({ auto_fix_enabled: e.target.checked })}
            />
            <span className="text-sm text-gray-700">Auto-Fix Enabled</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.auto_update_enabled}
              onChange={(e) => updateConfigMutation.mutate({ auto_update_enabled: e.target.checked })}
            />
            <span className="text-sm text-gray-700">Auto-Update Enabled</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.failsafe_enabled}
              onChange={(e) => updateConfigMutation.mutate({ failsafe_enabled: e.target.checked })}
            />
            <span className="text-sm text-gray-700">FAILSAFE Protocol Enabled</span>
          </label>
        </div>

        {updateConfigMutation.isSuccess && (
          <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-700">
            Configuration saved successfully
          </div>
        )}
      </div>
    </div>
  );

}
)
}