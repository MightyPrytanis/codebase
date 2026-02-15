import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IconSprite } from "@/components/ui/icon-sprite";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ViewModeProvider } from "@/lib/view-mode-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CyranoChatDrawer } from "@/components/cyrano-chat-drawer";
import { Loader2 } from "lucide-react";
import "@/styles/ad-astra.css";

// Lazy load pages for code splitting with error handling
const Dashboard = lazy(() => 
  import("@/pages/dashboard").catch((error) => {
    console.error("Failed to load Dashboard:", error);
    // Return a fallback component
    return {
      default: () => (
        <div style={{ padding: "20px", color: "white" }}>
          <h1>Failed to load dashboard</h1>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      ),
    };
  })
;
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
const WorkflowLibraryPage = lazy(() => import("@/pages/workflow-library"));
const LibraryPage = lazy(() => import("@/pages/library"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const EthicsPage = lazy(() => import("@/pages/ethics"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-primary-dark">
    <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
  </div>
);

function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/todays-focus" element={<TodaysFocusPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/clio" element={<ClioIntegrationPage />} />
          <Route path="/time-tracking" element={<TimeTrackingPage />} />
          <Route path="/compliance" element={<ComplianceCheckerPage />} />
          <Route path="/citations" element={<CitationToolsPage />} />
          <Route path="/compare" element={<DocumentComparisonPage />} />
          <Route path="/icon-preview" element={<IconPreviewPage />} />
          <Route path="/mae-workflows" element={<MaeWorkflowsPage />} />
          <Route path="/workflows" element={<WorkflowLibraryPage />} />
          <Route path="/workflow-library" element={<WorkflowLibraryPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/ethics" element={<EthicsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="control-room">
          <ViewModeProvider>
            <TooltipProvider>
              <div className="piquette-theme dark min-h-screen">
                <IconSprite />
                <DemoModeBanner />
                <Toaster />
                <ErrorBoundary>
                  <Router />
                </ErrorBoundary>
                <CyranoChatDrawer app="lexfiat" />
              </div>
            </TooltipProvider>
          </ViewModeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
