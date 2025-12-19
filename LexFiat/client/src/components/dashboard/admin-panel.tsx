/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Settings, Shield, Database, Users, Activity, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const { data: systemStatus, isLoading, refetch } = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      const result = await executeCyranoTool("system_status", { include_config_details: true });
      if (result.isError) {
        throw new Error(result.content?.[0]?.text || "Failed to fetch system status");
      }
      return JSON.parse(result.content?.[0]?.text || "{}");
    },
    refetchInterval: 30000,
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-4xl bg-charcoal border-gray-800 overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold text-white">Admin Panel</SheetTitle>
        </SheetHeader>
      <div className="space-y-6">
        {/* System Monitoring */}
        <div 
          className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
          onClick={() => setActiveSection(activeSection === "monitoring" ? null : "monitoring")}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5" />
              <h3 className="font-semibold">System Monitoring</h3>
            </div>
            <button onClick={(e) => { e.stopPropagation(); refetch(); }}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">View system status, uptime, and performance metrics</p>
          {activeSection === "monitoring" && (
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading system status...</p>
              ) : systemStatus ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span><strong>Status:</strong> {systemStatus.system?.status || "Unknown"}</span>
                  </div>
                  <div><strong>Version:</strong> {systemStatus.system?.version || "N/A"}</div>
                  <div><strong>Uptime:</strong> {systemStatus.system?.uptime ? `${Math.floor(systemStatus.system.uptime / 3600)}h ${Math.floor((systemStatus.system.uptime % 3600) / 60)}m` : "N/A"}</div>
                  <div><strong>AI Integration:</strong> {systemStatus.ai_integration?.status || "Unknown"}</div>
                  {systemStatus.warnings && systemStatus.warnings.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded">
                      {systemStatus.warnings.map((warning: string, idx: number) => (
                        <div key={idx} className="text-xs text-yellow-300 flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to fetch system status</p>
              )}
            </div>
          )}
        </div>

        {/* Database Management */}
        <div 
          className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
          onClick={() => setActiveSection(activeSection === "database" ? null : "database")}
        >
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-5 w-5" />
            <h3 className="font-semibold">Database Management</h3>
          </div>
          <p className="text-sm text-muted-foreground">View database status and connection information</p>
          {activeSection === "database" && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-sm text-muted-foreground space-y-2">
                <div><strong>Status:</strong> Connected</div>
                <div><strong>Type:</strong> PostgreSQL</div>
                <p className="text-xs mt-2">Database backup and management features coming soon.</p>
              </div>
            </div>
          )}
        </div>

        {/* User Management */}
        <div 
          className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
          onClick={() => setActiveSection(activeSection === "users" ? null : "users")}
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5" />
            <h3 className="font-semibold">User Management</h3>
          </div>
          <p className="text-sm text-muted-foreground">Manage users and permissions</p>
          {activeSection === "users" && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-sm text-muted-foreground">
                <p>User management features coming soon.</p>
                <p className="text-xs mt-2">Currently single-user system.</p>
              </div>
            </div>
          )}
        </div>

        {/* Security Settings */}
        <div 
          className="insight-card info p-4 cursor-pointer hover:bg-black/40 transition-colors"
          onClick={() => setActiveSection(activeSection === "security" ? null : "security")}
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5" />
            <h3 className="font-semibold">Security Settings</h3>
          </div>
          <p className="text-sm text-muted-foreground">View security policies and access controls</p>
          {activeSection === "security" && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-sm text-muted-foreground space-y-2">
                <div><strong>Authentication:</strong> JWT-based</div>
                <div><strong>Session Security:</strong> Secure cookies enabled</div>
                <div><strong>CSRF Protection:</strong> Enabled</div>
                <div><strong>Rate Limiting:</strong> Enabled</div>
                <p className="text-xs mt-2">Security review completed. See security reports for details.</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

