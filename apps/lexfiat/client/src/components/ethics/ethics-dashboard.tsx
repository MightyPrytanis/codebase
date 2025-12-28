/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Ethics Dashboard Component
 * 
 * Displays comprehensive ethics compliance information:
 * - Ethics checks performed
 * - Compliance scores
 * - Blocked/modified recommendations
 * - Audit trail
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  FileText,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { executeCyranoTool } from '@/lib/cyrano-api';

interface EthicsCheck {
  id: string;
  timestamp: string;
  toolName: string;
  engine: string;
  app: string;
  passed: boolean;
  blocked: boolean;
  complianceScore: number;
  warnings: string[];
  checkDetails?: any;
}

interface EthicsDashboardProps {
  userId?: string;
}

export function EthicsDashboard({ userId = 'default-user' }: EthicsDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'passed' | 'blocked' | 'warnings'>('all');

  // Fetch ethics audit trail
  const { data: auditData, isLoading, refetch } = useQuery<{ checks: EthicsCheck[] }>({
    queryKey: ['ethics-audit', userId],
    queryFn: async () => {
      const result = await executeCyranoTool('get_ethics_audit', {
        userId,
        limit: 100,
      });
      
      if (result.isError) {
        return { checks: [] };
      }
      
      try {
        const parsed = typeof result.content[0]?.text === 'string'
          ? JSON.parse(result.content[0].text)
          : result.content[0]?.text;
        return parsed || { checks: [] };
      } catch {
        return { checks: [] };
      }
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch compliance statistics
  const { data: stats } = useQuery({
    queryKey: ['ethics-stats', userId],
    queryFn: async () => {
      const result = await executeCyranoTool('get_ethics_stats', { userId });
      
      if (result.isError) {
        return {
          totalChecks: 0,
          passedChecks: 0,
          blockedChecks: 0,
          averageScore: 100,
          recentScore: 100,
        };
      }
      
      try {
        const parsed = typeof result.content[0]?.text === 'string'
          ? JSON.parse(result.content[0].text)
          : result.content[0]?.text;
        return parsed || {
          totalChecks: 0,
          passedChecks: 0,
          blockedChecks: 0,
          averageScore: 100,
          recentScore: 100,
        };
      } catch {
        return {
          totalChecks: 0,
          passedChecks: 0,
          blockedChecks: 0,
          averageScore: 100,
          recentScore: 100,
        };
      }
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const checks = auditData?.checks || [];
  
  // Filter checks
  const filteredChecks = checks.filter(check => {
    if (filter === 'passed') return check.passed && !check.blocked;
    if (filter === 'blocked') return check.blocked;
    if (filter === 'warnings') return check.warnings.length > 0;
    return true;
  });

  // Calculate statistics
  const totalChecks = stats?.totalChecks || checks.length;
  const passedChecks = stats?.passedChecks || checks.filter(c => c.passed && !c.blocked).length;
  const blockedChecks = stats?.blockedChecks || checks.filter(c => c.blocked).length;
  const averageScore = stats?.averageScore || 
    (checks.length > 0 
      ? Math.round(checks.reduce((sum, c) => sum + c.complianceScore, 0) / checks.length)
      : 100);
  const recentScore = stats?.recentScore || 
    (checks.length > 0 ? checks[0].complianceScore : 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Ethics Compliance Dashboard
          </h1>
          <p className="text-secondary text-sm mt-1">
            Monitor ethics checks, compliance scores, and audit trail
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Total Checks</p>
                <p className="text-2xl font-bold text-primary">{totalChecks}</p>
              </div>
              <FileText className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Passed</p>
                <p className="text-2xl font-bold text-status-success">{passedChecks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-status-success/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Blocked</p>
                <p className="text-2xl font-bold text-status-critical">{blockedChecks}</p>
              </div>
              <XCircle className="w-8 h-8 text-status-critical/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Avg Score</p>
                <p className="text-2xl font-bold text-primary">{averageScore}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-secondary">Current Score</span>
                <span className="text-2xl font-bold text-primary">{recentScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    recentScore >= 90 ? 'bg-status-success' :
                    recentScore >= 70 ? 'bg-status-warning' :
                    'bg-status-critical'
                  }`}
                  style={{ width: `${recentScore}%` }}
                />
              </div>
            </div>
            <Badge
              variant={
                recentScore >= 90 ? 'default' :
                recentScore >= 70 ? 'secondary' :
                'destructive'
              }
            >
              {recentScore >= 90 ? 'Excellent' :
               recentScore >= 70 ? 'Good' :
               'Needs Improvement'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Audit Trail</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'passed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('passed')}
              >
                Passed
              </Button>
              <Button
                variant={filter === 'blocked' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('blocked')}
              >
                Blocked
              </Button>
              <Button
                variant={filter === 'warnings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('warnings')}
              >
                Warnings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-secondary">Loading audit trail...</div>
          ) : filteredChecks.length === 0 ? (
            <div className="text-center py-8 text-secondary">No ethics checks found</div>
          ) : (
            <div className="space-y-4">
              {filteredChecks.map((check) => (
                <div
                  key={check.id}
                  className="border border-border-gray rounded-lg p-4 hover:bg-navy/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {check.blocked ? (
                          <XCircle className="w-5 h-5 text-status-critical" />
                        ) : check.passed ? (
                          <CheckCircle className="w-5 h-5 text-status-success" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-status-warning" />
                        )}
                        <span className="font-semibold text-primary">{check.toolName}</span>
                        <Badge variant="outline" className="text-xs">
                          {check.engine}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {check.app}
                        </Badge>
                      </div>
                      <p className="text-sm text-secondary mb-2">
                        {new Date(check.timestamp).toLocaleString()}
                      </p>
                      {check.warnings.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-semibold text-status-warning mb-1">Warnings:</p>
                          <ul className="list-disc list-inside text-sm text-secondary">
                            {check.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{check.complianceScore}%</div>
                      <Badge
                        variant={
                          check.complianceScore >= 90 ? 'default' :
                          check.complianceScore >= 70 ? 'secondary' :
                          'destructive'
                        }
                        className="mt-1"
                      >
                        {check.blocked ? 'Blocked' :
                         check.complianceScore >= 90 ? 'Passed' :
                         check.complianceScore >= 70 ? 'Warning' :
                         'Failed'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
