import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Settings, AlertTriangle } from "lucide-react";
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
      
      {/* Priority Alerts Ticker Widget */}
      <div className="bg-card-dark rounded-lg p-4 shadow-lg border border-red-500 mb-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-1 h-6 bg-red-500 rounded-full"></div>
          <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Priority Alerts</span>
          </h3>
        </div>
        <div className="space-y-2">
          <div className="bg-red-900 bg-opacity-30 p-3 rounded border-l-4 border-red-500 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-white font-medium">Johnson v Johnson - Emergency Motion Filed</span>
            </div>
            <span className="text-red-200 text-sm">2 min ago</span>
          </div>
          <div className="bg-orange-900 bg-opacity-30 p-3 rounded border-l-4 border-orange-500 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-white font-medium">Hartley Estate - Court Hearing Notice</span>
            </div>
            <span className="text-orange-200 text-sm">15 min ago</span>
          </div>
        </div>
      </div>
      
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

        {/* Three Main Widgets - Matching HTML Reference */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Today's Focus Widget (Purple) */}
          <div className="bg-card-dark rounded-lg p-4 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-white">Today's Focus</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-red-900 bg-opacity-30 p-3 rounded border-l-4 border-red-500">
                <p className="text-sm text-white font-semibold">TRO Response - Johnson v Johnson</p>
                <p className="text-xs text-gray-300">Wayne County • Due 5 PM tomorrow</p>
              </div>
              <div className="bg-blue-900 bg-opacity-30 p-3 rounded border-l-4 border-blue-500">
                <p className="text-sm text-white">Discovery Response - Hartley Estate</p>
                <p className="text-xs text-gray-300">Oakland County • Due Friday</p>
              </div>
            </div>
          </div>
          
          {/* GoodCounsel Widget (Gold) */}
          <div className="bg-card-dark rounded-lg p-4 shadow-lg border-l-4 border-yellow-500">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-white">GoodCounsel</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-green-900 bg-opacity-30 p-3 rounded border-l-4 border-green-500">
                <p className="text-sm text-white flex items-center space-x-2">
                  <span>💡</span>
                  <span>No contact with James Hartley in 18 days</span>
                </p>
                <p className="text-xs text-yellow-300 mt-1">Probate hearing Dec 14</p>
              </div>
              <div className="bg-green-900 bg-opacity-30 p-3 rounded border-l-4 border-green-500">
                <p className="text-sm text-white flex items-center space-x-2">
                  <span>💡</span>
                  <span>Take 10 minutes - Step outside for fresh air</span>
                </p>
                <p className="text-xs text-gray-300 mt-1">You've been focused for 2.5 hours</p>
              </div>
            </div>
          </div>
          
          {/* Testing Widget (Blue with Radio Buttons) */}
          <div className="bg-card-dark rounded-lg p-4 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-white">Testing</h3>
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-white cursor-pointer">
                <input type="radio" name="beta-issue" value="error" className="text-blue-500" />
                <span>Error</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-white cursor-pointer">
                <input type="radio" name="beta-issue" value="ui-malfunction" className="text-blue-500" />
                <span>UI Malfunction</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-white cursor-pointer">
                <input type="radio" name="beta-issue" value="disconnected-service" className="text-blue-500" />
                <span>Disconnected Service</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-white cursor-pointer">
                <input type="radio" name="beta-issue" value="suggestion" className="text-blue-500" />
                <span>Make Suggestion</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-white cursor-pointer">
                <input type="radio" name="beta-issue" value="question" className="text-blue-500" />
                <span>Ask Question</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-white cursor-pointer">
                <input type="radio" name="beta-issue" value="other" className="text-blue-500" />
                <span>Other Issue</span>
              </label>
              <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm">
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="bg-card-dark rounded-lg p-6 shadow-lg border border-border-gray">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Workflow</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
              + Widgets
            </button>
          </div>
          
          {/* Four Connected Workflow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Document Intake */}
            <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs">📄</span>
                </div>
                <h3 className="text-white font-semibold">Document Intake</h3>
              </div>
              <p className="text-gray-300 text-sm mb-2">Email monitoring and document capture.</p>
              <div className="text-xs text-gray-400">
                <div>Today 24</div>
                <div>Pending 3</div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-purple-500">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs">🤖</span>
                </div>
                <h3 className="text-white font-semibold">AI Analysis</h3>
              </div>
              <p className="text-gray-300 text-sm mb-2">Document review and red flag detection.</p>
              <div className="text-xs text-gray-400">
                <div>Processing 5</div>
                <div>Red Flags 2</div>
              </div>
            </div>

            {/* Draft Preparation */}
            <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs">📝</span>
                </div>
                <h3 className="text-white font-semibold">Draft Preparation</h3>
              </div>
              <p className="text-gray-300 text-sm mb-2">AI-generated draft responses.</p>
              <div className="text-xs text-gray-400">
                <div>Drafts Ready 6</div>
                <div>In Progress 3</div>
              </div>
            </div>

            {/* Attorney Review */}
            <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-yellow-500">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs">⚖️</span>
                </div>
                <h3 className="text-white font-semibold">Attorney Review</h3>
              </div>
              <p className="text-gray-300 text-sm mb-2">Final review and approval.</p>
              <div className="text-xs text-gray-400">
                <div>Awaiting 8</div>
                <div>Urgent 1</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
