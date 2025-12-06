import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Settings } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import WorkflowPipeline from "@/components/dashboard/workflow-pipeline";
import AlertsBanner from "@/components/dashboard/alerts-banner";
import DemoModeButton from "@/components/dashboard/demo-mode-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: attorney, isLoading: attorneyLoading } = useQuery({
    queryKey: ["/api/attorneys/profile"],
  });

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["/api/cases"],
  });

  const { data: redFlags, isLoading: redFlagsLoading } = useQuery({
    queryKey: ["/api/red-flags"],
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const urgentRedFlags = (redFlags as any[])?.filter((flag: any) => 
    flag.severity === 'critical' || flag.severity === 'high'
  ) || [];

  if (attorneyLoading) {
    return (
      <div className="min-h-screen bg-primary-dark">
        <div className="bg-primary-light h-24 border-b border-accent-gold">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="bg-card-dark rounded-xl p-8 shadow-xl border border-border-gray">
            <Skeleton className="h-12 w-96 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header attorney={attorney as any} />
      
      {/* Critical Alerts Section */}
      {urgentRedFlags.length > 0 && (
        <div className="bg-status-critical bg-opacity-20 border-b border-status-critical px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <AlertsBanner redFlags={urgentRedFlags} />
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Quick Actions Bar */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <DemoModeButton />
            <Link href="/settings">
              <Button className="bg-gold hover:bg-gold/90 text-slate-900 w-full sm:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Assembly Line Workflow Pipeline - LexFiat's Core */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-card-dark rounded-xl p-4 sm:p-6 lg:p-8 shadow-xl border border-border-gray">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">
                  Legal Intelligence Assembly Line
                </h1>
                <p className="text-secondary text-lg">
                  Active: Johnson v Johnson (Wayne County Family Division)
                </p>
                <p className="text-accent-gold text-sm font-semibold mt-1">
                  Emergency TRO Response • 24-hour deadline
                </p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-sm text-secondary font-medium">DEADLINE</div>
                  <div className="text-3xl font-bold text-status-critical font-mono">47:23:15</div>
                  <div className="text-xs text-accent-gold">Hours remaining</div>
                </div>
                <div className="lex-fiat-logo">
                  <Lightbulb className="lightbulb-icon" />
                </div>
              </div>
            </div>

            {/* Workflow Pipeline */}
            <WorkflowPipeline 
              cases={cases as any}
              redFlags={redFlags as any}
              dashboardStats={dashboardStats as any}
              isLoading={casesLoading || redFlagsLoading || statsLoading}
            />
          </div>
        </div>

        {/* Bottom Widgets - Performance, Good Counsel, Today's Focus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance Widget (Blue) */}
          <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-1 h-8 bg-status-processing rounded-full"></div>
              <h3 className="text-lg font-bold text-primary">Performance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary text-sm">Time saved today</span>
                <span className="text-primary font-bold font-mono">4.7h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary text-sm">Automation success</span>
                <span className="text-primary font-bold font-mono">91%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary text-sm">Documents processed</span>
                <span className="text-primary font-bold font-mono">247</span>
              </div>
            </div>
          </div>
          
          {/* Good Counsel Widget (Green) */}
          <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-1 h-8 bg-status-success rounded-full"></div>
              <h3 className="text-lg font-bold text-primary">Good Counsel</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-card-light p-3 rounded border-l-4 border-status-success">
                <p className="text-sm text-primary">No contact with James Hartley in 18 days</p>
                <p className="text-xs text-accent-gold mt-1">Probate hearing Dec 14</p>
              </div>
              <div className="bg-card-light p-3 rounded border-l-4 border-status-warning">
                <p className="text-sm text-primary">Take 10 minutes - Step outside for fresh air</p>
                <p className="text-xs text-secondary mt-1">You've been focused for 2.5 hours</p>
              </div>
            </div>
          </div>
          
          {/* Today's Focus Widget (Purple) */}
          <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-1 h-8 bg-status-purple rounded-full"></div>
              <h3 className="text-lg font-bold text-primary">Today's Focus</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-card-light p-3 rounded border-l-4 border-status-critical">
                <p className="text-sm text-primary font-semibold">TRO Response - Johnson v Johnson</p>
                <p className="text-xs text-secondary">Wayne County • Due 5 PM tomorrow</p>
              </div>
              <div className="bg-card-light p-3 rounded border-l-4 border-status-processing">
                <p className="text-sm text-primary">Discovery Response - Hartley Estate</p>
                <p className="text-xs text-secondary">Oakland County • Due Friday</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
