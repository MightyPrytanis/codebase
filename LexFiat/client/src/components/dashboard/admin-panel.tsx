/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React from "react";
import ExpandedPanel from "./expanded-panel";
import { Settings, Shield, Database, Users, Activity } from "lucide-react";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  return (
    <ExpandedPanel
      title="Admin Panel"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Database className="h-5 w-5" />
              <h3 className="font-semibold">Database Management</h3>
            </div>
            <p className="text-sm text-muted-foreground">Manage database connections and backups</p>
          </div>
          <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5" />
              <h3 className="font-semibold">User Management</h3>
            </div>
            <p className="text-sm text-muted-foreground">Manage users and permissions</p>
          </div>
          <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5" />
              <h3 className="font-semibold">System Monitoring</h3>
            </div>
            <p className="text-sm text-muted-foreground">View system logs and performance metrics</p>
          </div>
          <div className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5" />
              <h3 className="font-semibold">Security Settings</h3>
            </div>
            <p className="text-sm text-muted-foreground">Configure security policies and access controls</p>
          </div>
        </div>
      </div>
    </ExpandedPanel>
  );
}

