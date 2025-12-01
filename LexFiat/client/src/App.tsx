import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IconSprite } from "@/components/ui/icon-sprite";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import PerformancePage from "@/pages/performance";
import TodaysFocusPage from "@/pages/todays-focus";
import ResearchPage from "@/pages/research";
import ClioIntegrationPage from "@/pages/clio-integration";
import TimeTrackingPage from "@/pages/time-tracking";
import ComplianceCheckerPage from "@/pages/compliance-checker";
import CitationToolsPage from "@/pages/citation-tools";
import DocumentComparisonPage from "@/pages/document-comparison";
import IconPreviewPage from "@/pages/icon-preview";
import MaeWorkflowsPage from "@/pages/mae-workflows";

function Router() {
  return (
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
