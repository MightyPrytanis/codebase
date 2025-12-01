/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, AlertTriangle, FileText } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { getCases } from "@/lib/cyrano-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TodaysFocusPage() {
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
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

  const urgentCases = cases.filter((c: any) => 
    c.priority === 'critical' || c.priority === 'high' || c.deadline
  );

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Today's Focus</h1>
            <p className="text-secondary">Priority tasks and deadlines for today</p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {urgentCases.length > 0 ? (
          <div className="space-y-4">
            {urgentCases.map((caseItem: any, idx: number) => (
              <Card key={idx} className="bg-card-dark border-border-gray hover:border-accent-gold transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-accent-gold" />
                      {caseItem.case_name || caseItem.name || 'Case'}
                    </CardTitle>
                    <Badge 
                      variant={caseItem.priority === 'critical' ? 'destructive' : 'default'}
                      className={
                        caseItem.priority === 'critical' 
                          ? 'bg-status-critical' 
                          : caseItem.priority === 'high'
                          ? 'bg-status-warning'
                          : 'bg-status-processing'
                      }
                    >
                      {caseItem.priority?.toUpperCase() || 'NORMAL'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-secondary">
                      <Calendar className="h-4 w-4" />
                      <span>{caseItem.court || caseItem.jurisdiction || 'No location specified'}</span>
                    </div>
                    {caseItem.deadline && (
                      <div className="flex items-center gap-2 text-accent-gold">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">Due: {caseItem.deadline}</span>
                      </div>
                    )}
                    {caseItem.description && (
                      <p className="text-sm text-secondary mt-2">{caseItem.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card-dark border-border-gray">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-secondary mx-auto mb-4" />
              <p className="text-secondary text-lg">No urgent cases or deadlines for today</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

