import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IconSprite } from "@/components/ui/icon-sprite";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Loader2 } from "lucide-react";
import "@/styles/ad-astra.css";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Settings = lazy(() => import("@/pages/settings"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PerformancePage = lazy(() => import("@/pages/performance"));
const TodaysFocusPage = lazy(() => import("@/pages/todays-focus"));
const ResearchPage = lazy(() => import("@/pages/research"));
const ClioIntegrationPage = lazy(() => import("@/pages/clio-integration"));
const TimeTrackingPage = lazy(() => import("@/pages/time-tracking"));
const ComplianceCheckerPage = lazy(() => import("@/pages/compliance-checker"));
const CitationToolsPage = lazy(() => import("@/pages/citation-tools"));
const DocumentComparisonPage = lazy(() => import("@/pages/document-comparison"));
const IconPreviewPage = lazy(() => import("@/pages/icon-preview"));
const MaeWorkflowsPage = lazy(() => import("@/pages/mae-workflows"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-primary-dark">
    <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
        <Route path="/performance" component={PerformancePage} />
        <Route path="/todays-focus" component={TodaysFocusPage} />
        <Route path="/research" component={ResearchPage} />
        <Route path="/clio" component={ClioIntegrationPage} />
        <Route path="/time-tracking" component={TimeTrackingPage} />
        <Route path="/compliance" component={ComplianceCheckerPage} />
        <Route path="/citations" component={CitationToolsPage} />
        <Route path="/compare" component={DocumentComparisonPage} />
        <Route path="/icon-preview" component={IconPreviewPage} />
        <Route path="/mae-workflows" component={MaeWorkflowsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="control-room">
        <TooltipProvider>
          <div className="piquette-theme dark min-h-screen">
            <IconSprite />
            <DemoModeBanner />
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
