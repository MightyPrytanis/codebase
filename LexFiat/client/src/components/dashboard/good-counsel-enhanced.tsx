/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Heart, Lightbulb, Shield, Sparkles, Send, RefreshCw, CheckCircle, TrendingUp, Target, BookOpen, Settings } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { showAIOfflineError } from "@/lib/ai-error-helper";
import ExpandedPanel from "./expanded-panel";
import { GoodCounselJournaling } from "./goodcounsel-journaling";
import { GuidedSetup, GoodCounselSetupData } from "./goodcounsel-guided-setup";
import { PrivacyAssurance } from "./goodcounsel-privacy-assurance";
import { useState, useEffect } from "react";

interface GoodCounselEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  caseContext?: string;
  timePressure?: "low" | "medium" | "high" | "critical";
}

export function GoodCounselEnhanced({ 
  isOpen, 
  onClose, 
  caseContext = "", 
  timePressure = "medium" 
}: GoodCounselEnhancedProps) {
  const [context, setContext] = useState(caseContext);
  const [selectedProvider, setSelectedProvider] = useState<string>("provider-1");
  const [userState, setUserState] = useState<string>("");
  const [ethicalConcerns, setEthicalConcerns] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("counsel");
  const [showGuidedSetup, setShowGuidedSetup] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupData, setSetupData] = useState<GoodCounselSetupData | null>(null);

  // Check if setup is complete on mount
  useEffect(() => {
    const setupCompleteFlag = localStorage.getItem('goodcounsel-setup-complete');
    const storedData = localStorage.getItem('goodcounsel-setup-data');
    
    if (setupCompleteFlag === 'true' && storedData) {
      setSetupComplete(true);
      setSetupData(JSON.parse(storedData));
    } else if (isOpen) {
      // Show guided setup if not completed
      setShowGuidedSetup(true);
    }
  }, [isOpen]);

  const providers = [
    { id: "provider-1", name: "AI Provider A", status: "✅ Working", icon: "🔍" },
    { id: "provider-2", name: "AI Provider B", status: "✅ Working", icon: "🧠" },
    { id: "provider-3", name: "AI Provider C", status: "✅ Working", icon: "🤖" },
    { id: "provider-4", name: "AI Provider D", status: "❌ Needs API Key", icon: "💎" },
  ];

  // Fetch insights and recommendations
  const { data: insights, refetch: refetchInsights } = useQuery({
    queryKey: ["goodcounsel-insights"],
    queryFn: async () => {
      const result = await executeCyranoTool("good_counsel", {
        action: "get_insights",
        context: context || "general practice overview",
      });
      
      // Check for AI service errors
      if (result.isError) {
        const errorText = result.content?.[0]?.text || '';
        const isNetworkError = errorText.includes('unavailable') || 
                              errorText.includes('network') ||
                              errorText.includes('timeout') ||
                              errorText.includes('not configured');
        
        if (isNetworkError) {
          // Show HAL-inspired error message
          showAIOfflineError();
          throw new Error('AI service unavailable');
        }
        
        throw new Error(errorText || 'AI service error');
      }
      
      return result.content?.[0]?.text ? JSON.parse(result.content[0].text) : null;
    },
    enabled: false, // Manual fetch
  });

  const counselMutation = useMutation({
    mutationFn: async (data: {
      context: string;
      ai_provider: string;
      user_state?: string;
      time_pressure: string;
      ethical_concerns?: string[];
    }) => {
      const result = await executeCyranoTool("good_counsel", data);
      
      // Check for AI service errors
      if (result.isError) {
        const errorText = result.content?.[0]?.text || '';
        const isNetworkError = errorText.includes('unavailable') || 
                              errorText.includes('network') ||
                              errorText.includes('timeout') ||
                              errorText.includes('not configured');
        
        if (isNetworkError) {
          // Show HAL-inspired error message
          // TODO: Get firstName from user context when available
          showAIOfflineError();
          throw new Error('AI service unavailable');
        }
        
        throw new Error(errorText || 'AI service error');
      }
      
      return result;
    },
  });

  const handleGetCounsel = () => {
    if (!context.trim()) return;

    const ethicalConcernsArray = ethicalConcerns
      .split(",")
      .map((c: string) => c.trim())
      .filter((c: string) => c.length > 0);

    counselMutation.mutate({
      context: context.trim(),
      ai_provider: selectedProvider,
      user_state: userState.trim() || undefined,
      time_pressure: timePressure,
      ethical_concerns: ethicalConcernsArray.length > 0 ? ethicalConcernsArray : undefined,
    });
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  return (
    <ExpandedPanel
      title="GoodCounsel - Your Legal Intelligence Companion"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-5xl"
    >
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-accent-gold/20 via-status-success/10 to-transparent p-6 rounded-lg border border-accent-gold/30">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-gold/20 flex items-center justify-center border-2 border-accent-gold">
              <Brain className="w-8 h-8 text-accent-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
                <Heart className="w-6 h-6 text-status-success" />
                The Heart and Soul of LexFiat
              </h2>
              <p className="text-secondary">
                GoodCounsel provides ethical guidance, professional responsibility support, client care insights, and wellness counsel 
                to help you practice law with excellence, balance, and integrity. Your well-being and ethical practice are our priorities.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Assurance Banner */}
        <PrivacyAssurance />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-card-light">
            <TabsTrigger value="counsel" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Get Counsel
            </TabsTrigger>
            <TabsTrigger value="journal" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Journal
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="wellness" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Wellness
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Get Counsel Tab */}
          <TabsContent value="counsel" className="space-y-4 mt-6">
            <Card className="bg-card-dark border-border-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-5 h-5 text-accent-gold" />
                  Request AI Counsel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">AI Provider</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="bg-primary-dark border-border-gray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card-dark border-border-gray">
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id} className="text-white">
                          <div className="flex items-center gap-2">
                            <span>{provider.icon}</span>
                            <span>{provider.name}</span>
                            <span className={`ml-auto px-2 py-1 rounded text-xs ${provider.status.includes("✅") ? "bg-status-success/20 text-status-success" : "bg-status-critical/20 text-status-critical"}`}>
                              {provider.status}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">
                    Legal Context or Situation *
                  </label>
                  <Textarea
                    value={context}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
                    placeholder="Describe the legal case, workflow issue, or situation requiring guidance..."
                    className="bg-primary-dark border-border-gray min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">
                    Your Current State (Optional)
                  </label>
                  <Textarea
                    value={userState}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserState(e.target.value)}
                    placeholder="How are you feeling? Any stress, time pressure, or focus issues?"
                    className="bg-primary-dark border-border-gray min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">
                    Ethical Concerns (Optional)
                  </label>
                  <Textarea
                    value={ethicalConcerns}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEthicalConcerns(e.target.value)}
                    placeholder="Any ethical issues or concerns (comma-separated)..."
                    className="bg-primary-dark border-border-gray resize-none"
                  />
                </div>

                <Button
                  onClick={handleGetCounsel}
                  disabled={!context.trim() || counselMutation.isPending}
                  className="w-full bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold"
                >
                  {counselMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Getting AI Counsel...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Get AI Counsel
                    </>
                  )}
                </Button>

                {counselMutation.isSuccess && counselMutation.data && (
                  <div className="p-4 bg-status-success/20 border border-status-success rounded-lg">
                    <div className="flex items-center gap-2 text-status-success mb-3">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">AI Counsel Received</span>
                    </div>
                    <div className="bg-primary-dark/50 p-3 rounded border border-border-gray text-secondary whitespace-pre-wrap">
                      {counselMutation.data.content?.[0]?.text || "No response received"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4 mt-6">
            <Card className="bg-card-dark border-border-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Lightbulb className="w-5 h-5 text-accent-gold" />
                  Practice Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-card-light rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-status-success" />
                      <div>
                        <p className="font-semibold text-primary">Ethical Practice</p>
                        <p className="text-sm text-secondary">Maintaining professional standards</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-card-light rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-accent-gold" />
                      <div>
                        <p className="font-semibold text-primary">Client Care</p>
                        <p className="text-sm text-secondary">Regular communication maintained</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-card-light rounded-lg">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-status-processing" />
                      <div>
                        <p className="font-semibold text-primary">Well-Being</p>
                        <p className="text-sm text-secondary">Sustainable practice patterns</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => refetchInsights()}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wellness Tab */}
          <TabsContent value="wellness" className="space-y-4 mt-6">
            <Card className="bg-card-dark border-border-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Heart className="w-5 h-5 text-status-success" />
                  Wellness & Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-card-light rounded-lg border-l-4 border-status-success">
                    <p className="font-semibold text-primary mb-2">Work-Life Balance</p>
                    <p className="text-sm text-secondary">Your balance score: 72% - Good!</p>
                  </div>
                  <div className="p-4 bg-card-light rounded-lg border-l-4 border-status-warning">
                    <p className="font-semibold text-primary mb-2">Stress Level</p>
                    <p className="text-sm text-secondary">Moderate - Consider taking a break</p>
                  </div>
                  <div className="p-4 bg-card-light rounded-lg border-l-4 border-accent-gold">
                    <p className="font-semibold text-primary mb-2">Sustainable Growth</p>
                    <p className="text-sm text-secondary">Building for the long-term</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Journal Tab */}
          <TabsContent value="journal" className="space-y-4 mt-6">
            <GoodCounselJournaling />
          </TabsContent>

          {/* Ethics Tab - Moved to Settings */}
          <TabsContent value="settings" className="space-y-4 mt-6">
            <Card className="bg-card-dark border-border-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Settings className="w-5 h-5 text-accent-gold" />
                  GoodCounsel Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-card-light rounded-lg">
                    <p className="font-semibold text-primary mb-2">Privacy Protections</p>
                    <p className="text-sm text-secondary mb-3">Review your privacy protections and assurances</p>
                    <PrivacyAssurance />
                  </div>
                  <div className="p-4 bg-card-light rounded-lg">
                    <p className="font-semibold text-primary mb-2">Ethical Guidance</p>
                    <div className="space-y-3 mt-3">
                      <div>
                        <p className="font-medium text-primary mb-1">Confidentiality</p>
                        <p className="text-sm text-secondary">All client information is protected and secure</p>
                      </div>
                      <div>
                        <p className="font-medium text-primary mb-1">Competence</p>
                    <p className="text-sm text-secondary">AI tools supplement, not replace, attorney judgment</p>
                  </div>
                      <div>
                        <p className="font-medium text-primary mb-1">Diligence</p>
                    <p className="text-sm text-secondary">Always verify AI-generated content</p>
                      </div>
                    </div>
                  </div>
                  {setupData && (
                    <div className="p-4 bg-card-light rounded-lg">
                      <p className="font-semibold text-primary mb-2">Your Profile</p>
                      <p className="text-sm text-secondary">
                        Setup completed on {new Date(localStorage.getItem('goodcounsel-setup-date') || '').toLocaleDateString()}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowGuidedSetup(true)}
                        className="mt-3"
                      >
                        Update Profile
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Guided Setup Modal */}
      {showGuidedSetup && (
        <GuidedSetup
          onComplete={(data) => {
            setSetupData(data);
            setSetupComplete(true);
            setShowGuidedSetup(false);
          }}
          onCancel={() => {
            if (setupComplete) {
              setShowGuidedSetup(false);
            }
          }}
        />
      )}
    </ExpandedPanel>
  );
}

