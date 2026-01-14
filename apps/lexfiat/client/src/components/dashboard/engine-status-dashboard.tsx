/*
 * Engine Status Dashboard
 * Displays status and health of all Cyrano engines
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

interface EngineStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  version?: string;
  lastCheck?: string;
  metrics?: {
    cpu_usage?: number;
    memory_usage?: number;
    response_time?: number;
  };
  issues?: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    description: string;
  }>;
}

export function EngineStatusDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: custodianStatus, isLoading, refetch } = useQuery({
    queryKey: ["custodian-status"],
    queryFn: async () => {
      const result = await executeCyranoTool("custodian_engine", {
        action: "status",
      });
      if (result.isError) {
        throw new Error(result.content?.[0]?.text || "Failed to fetch Custodian status");
      }
      return JSON.parse(result.content?.[0]?.text || "{}");
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: healthCheck } = useQuery({
    queryKey: ["custodian-health"],
    queryFn: async () => {
      const result = await executeCyranoTool("custodian_engine", {
        action: "health_check",
      });
      if (result.isError) {
        throw new Error(result.content?.[0]?.text || "Failed to fetch health check");
      }
      return JSON.parse(result.content?.[0]?.text || "{}");
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch()]);
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Engine Status
        </h2>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Custodian Engine Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(custodianStatus?.monitoring_active ? 'healthy' : 'unknown')}
            Custodian Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading status...</p>
          ) : custodianStatus ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`font-semibold ${getStatusColor(custodianStatus.monitoring_active ? 'healthy' : 'unknown')}`}>
                    {custodianStatus.monitoring_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-semibold">{custodianStatus.version || '1.0.0'}</p>
                </div>
                {custodianStatus.last_health_check && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Health Check</p>
                    <p className="font-semibold">
                      {new Date(custodianStatus.last_health_check).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {healthCheck && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h4 className="font-semibold mb-2">System Health</h4>
                  <div className="space-y-2">
                    {healthCheck.metrics && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">CPU Usage</p>
                          <p className="font-semibold">{healthCheck.metrics.cpu_usage?.toFixed(1) || 'N/A'}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Memory Usage</p>
                          <p className="font-semibold">{healthCheck.metrics.memory_usage?.toFixed(1) || 'N/A'}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Response Time</p>
                          <p className="font-semibold">{healthCheck.metrics.response_time || 'N/A'}ms</p>
                        </div>
                      </div>
                    )}
                    
                    {healthCheck.issues && healthCheck.issues.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-yellow-500">Issues Detected:</p>
                        {healthCheck.issues.map((issue: any, index: number) => (
                          <div key={index} className="p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-sm">
                            <p className="font-semibold">{issue.type}</p>
                            <p className="text-muted-foreground">{issue.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to fetch status</p>
          )}
        </CardContent>
      </Card>

      {/* Other Engines */}
      <Card>
        <CardHeader>
          <CardTitle>Other Engines</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Status monitoring for other engines (MAE, GoodCounsel, Potemkin, Forecast, Chronometric) coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

}
)