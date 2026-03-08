/*
 * Custodian Settings Component
 * Admin-only settings for Cyrano Custodian Engine
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export function CustodianSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
      toast({
        title: "Configuration Updated",
        description: "Custodian settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!config) return;
    updateConfigMutation.mutate(config);
  };

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
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custodian Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading configuration...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Custodian Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Failed to load configuration: {error instanceof Error ? error.message : "Unknown error"}</p>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Custodian Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monitoring Interval */}
        <div className="space-y-2">
          <Label htmlFor="monitoring-interval">Monitoring Interval</Label>
          <Select
            value={config.monitoring_interval_minutes.toString()}
            onValueChange={(value) => {
              updateConfigMutation.mutate({
                monitoring_interval_minutes: parseInt(value, 10) as 10 | 20 | 30,
              });
            }}
          >
            <SelectTrigger id="monitoring-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="20">20 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How often Custodian checks system health and applies fixes
          </p>
        </div>

        {/* Admin Contacts */}
        <div className="space-y-4">
          <Label>Admin Contact Methods</Label>
          <div className="space-y-3">
            {config.admin_contacts.map((contact, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                <Select
                  value={contact.method}
                  onValueChange={(value) =>
                    handleUpdateContact(index, { method: value as AdminContactPreference['method'] })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="instant_message">Instant Message</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="console">Console</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={contact.contact_info}
                  onChange={(e) => handleUpdateContact(index, { contact_info: e.target.value })}
                  placeholder="Contact info (email, phone, URL, etc.)"
                  className="flex-1"
                />
                <Select
                  value={contact.priority}
                  onValueChange={(value) =>
                    handleUpdateContact(index, { priority: value as AdminContactPreference['priority'] })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Switch
                  checked={contact.enabled}
                  onCheckedChange={(checked) => handleUpdateContact(index, { enabled: checked })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveContact(index)}
                  className="text-red-500"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Add New Contact */}
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
            <Select
              value={newContact.method || 'email'}
              onValueChange={(value) => setNewContact({ ...newContact, method: value as AdminContactPreference['method'] })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="instant_message">Instant Message</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="console">Console</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={newContact.contact_info || ''}
              onChange={(e) => setNewContact({ ...newContact, contact_info: e.target.value })}
              placeholder="Contact info"
              className="flex-1"
            />
            <Select
              value={newContact.priority || 'medium'}
              onValueChange={(value) => setNewContact({ ...newContact, priority: value as AdminContactPreference['priority'] })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddContact} size="sm">
              Add
            </Button>
          </div>
        </div>

        {/* Auto-Fix Settings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-fix">Auto-Fix Enabled</Label>
            <Switch
              id="auto-fix"
              checked={config.auto_fix_enabled}
              onCheckedChange={(checked) =>
                updateConfigMutation.mutate({ auto_fix_enabled: checked })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Allow Custodian to automatically fix common issues
          </p>
        </div>

        {/* Auto-Update Settings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-update">Auto-Update Enabled</Label>
            <Switch
              id="auto-update"
              checked={config.auto_update_enabled}
              onCheckedChange={(checked) =>
                updateConfigMutation.mutate({ auto_update_enabled: checked })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Allow Custodian to automatically update dependencies
          </p>
        </div>

        {/* FAILSAFE Settings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="failsafe">FAILSAFE Protocol Enabled</Label>
            <Switch
              id="failsafe"
              checked={config.failsafe_enabled}
              onCheckedChange={(checked) =>
                updateConfigMutation.mutate({ failsafe_enabled: checked })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enable automatic security lockdown on breach detection
          </p>
        </div>

        {/* Status */}
        {updateConfigMutation.isSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-500">Configuration saved successfully</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

}