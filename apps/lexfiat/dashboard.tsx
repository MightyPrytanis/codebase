import { useQuery } from "@tanstack/react-query";
import { Settings, Clock, FileText, Users, Zap, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import Header from "@/components/layout/header";
import { GoodCounselWidget } from "@/components/dashboard/good-counsel-widget";
import { EthicsGuidanceWidget } from "@/components/dashboard/ethics-guidance-widget";
import { GoodCounsel } from "@/components/dashboard/good-counsel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  
  const { data: attorney, isLoading: attorneyLoading } = useQuery({
    queryKey: ["/api/attorneys/profile"],
  });

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["/api/cases"],
  });

  const { data: redFlags, isLoading: redFlagsLoading } = useQuery({
    queryKey: ["/api/red-flags"],
  });

  if (attorneyLoading) {
    return (
      <div className="min-h-screen">
        <div className="bg-primary-light h-24 border-b border-accent-gold">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Detailed panel overlay
  if (activePanel === "goodcounsel") {
    return (
      <div className="min-h-screen">
        <Header attorney={attorney as any} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Button 
            onClick={() => setActivePanel(null)}
            variant="outline"
            className="mb-6"
          >
            ← Back to Dashboard
          </Button>
          <GoodCounsel />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header attorney={attorney as any} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header with Logo */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="lg" variant="full" />
            <div>
              <h1 className="text-2xl font-bold text-primary panel-heading">Legal Intelligence Assembly Line</h1>
              <p className="text-sm text-secondary panel-text-secondary">Automated workflow • Human oversight</p>
            </div>
          </div>
          <Link href="/settings">
            <Button className="swim-button good-counsel-button">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>

        {/* Widget Grid - Assembly Line Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Active Cases Widget */}
          <Card className="swim-panel stat-card cursor-pointer hover:border-accent-gold transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base panel-heading">
                <FileText className="w-4 h-4 text-status-processing" />
                Active Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary font-mono">12</div>
                  <p className="text-xs text-secondary panel-text-secondary">Total active</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-border-gray">
                  <div>
                    <div className="text-sm font-bold text-status-critical">3</div>
                    <p className="text-xs text-secondary">Urgent</p>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-status-warning">5</div>
                    <p className="text-xs text-secondary">High</p>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-status-processing">4</div>
                    <p className="text-xs text-secondary">Normal</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deadline Tracker Widget */}
          <Card className="swim-panel stat-card cursor-pointer hover:border-accent-gold transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base panel-heading">
                <Clock className="w-4 h-4 text-status-warning" />
                Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Next 24 hours</span>
                  <Badge variant="destructive" className="text-xs">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">This week</span>
                  <Badge variant="default" className="text-xs">7</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Next 30 days</span>
                  <Badge variant="secondary" className="text-xs">18</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Automation Widget */}
          <Card className="swim-panel stat-card cursor-pointer hover:border-accent-gold transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base panel-heading">
                <Zap className="w-4 h-4 text-accent-gold" />
                Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-gold font-mono">247</div>
                  <p className="text-xs text-secondary panel-text-secondary">Docs processed today</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-border-gray">
                  <div>
                    <div className="text-sm font-bold text-primary">4.7h</div>
                    <p className="text-xs text-secondary">Time saved</p>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary">91%</div>
                    <p className="text-xs text-secondary">Success rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Good Counsel Widget */}
          <GoodCounselWidget onClick={() => setActivePanel("goodcounsel")} />

          {/* Client Communications Widget */}
          <Card className="swim-panel stat-card cursor-pointer hover:border-accent-gold transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base panel-heading">
                <Users className="w-4 h-4 text-status-success" />
                Communications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Awaiting response</span>
                  <Badge variant="default" className="text-xs">8</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Draft emails</span>
                  <Badge variant="secondary" className="text-xs">5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Scheduled calls</span>
                  <Badge variant="secondary" className="text-xs">3</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Tasks Widget */}
          <Card className="swim-panel stat-card cursor-pointer hover:border-accent-gold transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base panel-heading">
                <Shield className="w-4 h-4 text-status-processing" />
                Research
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Active queries</span>
                  <Badge variant="default" className="text-xs">12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Pending review</span>
                  <Badge variant="secondary" className="text-xs">6</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Completed today</span>
                  <Badge variant="secondary" className="text-xs">18</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case Status Widget */}
          <Card className="swim-panel stat-card cursor-pointer hover:border-accent-gold transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base panel-heading">
                <AlertCircle className="w-4 h-4 text-status-warning" />
                Status Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-critical"></div>
                  <span className="text-sm text-secondary flex-1">Filing deadline approaching</span>
                  <span className="text-xs text-status-critical font-mono">18h</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-warning"></div>
                  <span className="text-sm text-secondary flex-1">Discovery response due</span>
                  <span className="text-xs text-status-warning font-mono">3d</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-processing"></div>
                  <span className="text-sm text-secondary flex-1">Client meeting scheduled</span>
                  <span className="text-xs text-status-processing font-mono">5d</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Widget */}
          <Card className="swim-panel stat-card cursor-pointer hover:border-accent-gold transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base panel-heading">
                <TrendingUp className="w-4 h-4 text-status-success" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-status-success font-mono">↑ 23%</div>
                  <p className="text-xs text-secondary panel-text-secondary">Productivity this month</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-border-gray">
                  <div>
                    <div className="text-sm font-bold text-primary">127</div>
                    <p className="text-xs text-secondary">Tasks done</p>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary">89%</div>
                    <p className="text-xs text-secondary">On time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GoodCounsel Widget */}
          <GoodCounselWidget onClick={() => setActivePanel("goodcounsel")} />

          {/* Ethics Guidance Widget */}
          <EthicsGuidanceWidget onClick={() => setActivePanel("ethics")} />

        </div>
      </main>
    </div>
  );
}
