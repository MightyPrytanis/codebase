/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Clock, CheckCircle, FileText, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/header";
import { getWorkflowData } from "@/lib/cyrano-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PerformancePage() {
  const { data: workflowData, isLoading } = useQuery({
    queryKey: ['workflow-data'],
    queryFn: getWorkflowData,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-dark">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Performance Analytics</h1>
            <p className="text-secondary">Track your productivity and automation metrics</p>
          </div>
          <Link to="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card-dark border-border-gray">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-status-processing" />
                Time Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-processing font-mono">
                {workflowData?.time_saved || '0.0'}h
              </div>
              <p className="text-sm text-secondary mt-2">Today</p>
            </CardContent>
          </Card>

          <Card className="bg-card-dark border-border-gray">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-status-success" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-success font-mono">
                {workflowData?.success_rate || '0'}%
              </div>
              <p className="text-sm text-secondary mt-2">Automation accuracy</p>
            </CardContent>
          </Card>

          <Card className="bg-card-dark border-border-gray">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-accent-gold" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent-gold font-mono">
                {workflowData?.documents_processed || '0'}
              </div>
              <p className="text-sm text-secondary mt-2">Processed today</p>
            </CardContent>
          </Card>

          <Card className="bg-card-dark border-border-gray">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-status-purple" />
                Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-purple font-mono">
                {workflowData?.efficiency_score || '0'}%
              </div>
              <p className="text-sm text-secondary mt-2">Overall efficiency</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card-dark border-border-gray">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-status-processing" />
              Detailed Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-card-light rounded-lg">
                <span className="text-secondary">Tasks completed this week</span>
                <span className="text-primary font-bold font-mono">
                  {workflowData?.tasks_completed || '0'}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-card-light rounded-lg">
                <span className="text-secondary">Average response time</span>
                <span className="text-primary font-bold font-mono">
                  {workflowData?.avg_response_time || '0'}ms
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-card-light rounded-lg">
                <span className="text-secondary">AI operations performed</span>
                <span className="text-primary font-bold font-mono">
                  {workflowData?.ai_operations || '0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

