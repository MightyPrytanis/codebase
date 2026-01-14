/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect } from "react";
// Card components removed - using gc-card styling instead
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Heart, Lightbulb, Shield, Sparkles, Send, RefreshCw, CheckCircle, TrendingUp, Target, BookOpen, Settings, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { SiLighthouse } from "react-icons/si";
import { RiUserVoiceLine } from "react-icons/ri";
import { useMutation, useQuery } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { showAIOfflineError } from "@/lib/ai-error-helper";
import ExpandedPanel from "./expanded-panel";
import { GoodCounselJournaling } from "./goodcounsel-journaling";
import { GoodCounselMeditation } from "./goodcounsel-meditation";
import { GuidedSetup, GoodCounselSetupData } from "./goodcounsel-guided-setup";
import { PrivacyAssurance } from "./goodcounsel-privacy-assurance";

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
  const [activeTab, setActiveTab] = useState<string>("philosophy");
  const [showGuidedSetup, setShowGuidedSetup] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupData, setSetupData] = useState<GoodCounselSetupData | null>(null);
  const [showMeditation, setShowMeditation] = useState(false);

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
      const result = await executeCyranoTool("goodcounsel_engine", {
        action: "client_recommendations",
        input: {
          context: context || "general practice overview",
        },
        userId: "default-user", // TODO: Get from auth
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

  const counselMutation = useMutation<string, Error, {
    context: string;
    ai_provider: string;
    user_state?: string;
    time_pressure: string;
    ethical_concerns?: string[];
  }>({
    mutationFn: async (data) => {
      const result = await executeCyranoTool("goodcounsel_engine", {
        action: "wellness_check",
        input: {
          context: data.context,
          user_state: data.user_state,
          time_pressure: data.time_pressure,
          ethical_concerns: data.ethical_concerns,
          ai_provider: data.ai_provider,
        },
        userId: "default-user", // TODO: Get from auth
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
          // TODO: Get firstName from user context when available
          showAIOfflineError();
          throw new Error('AI service unavailable');
        }
        
        throw new Error(errorText || 'AI service error');
      }
      
      // Extract text content from result
      const textContent = result.content?.[0]?.text || '';
      return textContent;
    },
  });

  const handleRequestGuidance = () => {
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
      title="GoodCounsel"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-6xl"
    >
      <div className="goodcounsel-redesign">
        {/* Header Section */}
        <div className="gc-header">
          <div className="gc-header-content">
            <div className="gc-title-group">
              <h1 className="gc-title">The Things That Matter</h1>
              <p className="gc-subtitle">A sanctuary for what matters in your practice</p>
            </div>
            <PrivacyAssurance />
          </div>
        </div>
        {/* Hero Section - Philosophy */}
        <div className="bg-gradient-to-br from-accent-gold/20 via-status-success/10 to-transparent p-6 rounded-lg border border-accent-gold/30">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-gold/20 flex items-center justify-center border-2 border-accent-gold">
              <Heart className="w-8 h-8 text-accent-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary mb-3 flex items-center gap-2">
                <Heart className="w-6 h-6 text-status-success" />
                A Sanctuary for What Matters
              </h2>
              <div className="space-y-3 text-secondary">
                <p className="font-medium text-primary">
                  <strong>GoodCounsel exists to affirm, not to alarm.</strong>
                </p>
                <p>
                  In a legal practice management system filled with deadlines, red flags, urgent alerts, and critical warnings—because that is the nature of legal work—GoodCounsel is the one space that deliberately stands apart. It is not another monitoring system. It is not another warning light telling you you're failing.
                </p>
                <p className="text-status-success font-medium">
                  <strong>GoodCounsel is a sanctuary.</strong> A place of unconditional support, recalibration, and renewal.
                </p>
                <div className="mt-4 p-4 bg-black/20 rounded-lg border-l-4 border-accent-gold">
                  <p className="text-sm italic">
                    "You are not your caseload. Your worth is not measured by billable hours. Your clients are not just files; you are not just a machine. You are doing work that matters. You matter."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Assurance Banner */}
        <PrivacyAssurance />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gc-tabs">
          <TabsList className="gc-tabs-list">
            <TabsTrigger value="philosophy">
              <Brain className="w-4 h-4" />
              <span>Philosophy</span>
            </TabsTrigger>
            <TabsTrigger value="counsel">
              <SiLighthouse className="w-4 h-4" />
              <span>Request Guidance</span>
            </TabsTrigger>
            <TabsTrigger value="ethics">
              <Shield className="w-4 h-4" />
              <span>Ethics Resources</span>
            </TabsTrigger>
            <TabsTrigger value="journal">
              <RiUserVoiceLine className="w-4 h-4" />
              <span>Out Loud</span>
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Lightbulb className="w-4 h-4" />
              <span>Insights</span>
            </TabsTrigger>
            <TabsTrigger value="wellness">
              <Heart className="w-4 h-4" />
              <span>Wellness</span>
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Philosophy Tab */}
          <TabsContent value="philosophy" className="gc-tab-content">
            <div className="gc-section">
              <h2 className="gc-section-title">Our Philosophy</h2>
              
              <div className="gc-card">
                <h3 className="gc-card-title">Against the Legacy</h3>
                <p className="gc-text">
                  The legal profession has a long, damaging history of punishing attorneys for showing weakness or being human. The culture valorizes overwork, demands stoicism in the face of stress, and treats burnout as a personal failure rather than a systemic issue.
                </p>
                <p className="gc-text gc-text-emphasis">
                  GoodCounsel rejects this legacy entirely.
                </p>
              </div>

              <div className="gc-card">
                <h3 className="gc-card-title">The Alternative Vision</h3>
                <p className="gc-text">
                  LexFiat's other modules can—and must—have their red flags, urgent badges, critical alerts, and countdown timers. Deadlines are real. Consequences are real. The practice of law involves high stakes and genuine urgency.
                </p>
                <p className="gc-text gc-text-emphasis">
                  But GoodCounsel is different.
                </p>
              </div>

              <div className="gc-card gc-card-highlight">
                <h3 className="gc-card-title">What GoodCounsel Does</h3>
                <ul className="gc-list gc-list-features">
                  <li><strong>Monitors patterns</strong> — work habits, stress indicators, time management</li>
                  <li><strong>Provides insights</strong> — workflow optimizations, delegation opportunities, time for breaks</li>
                  <li><strong>Offers ethical guidance</strong> — case priority alignment, professional boundaries, conflict awareness</li>
                  <li><strong>Supports wellness</strong> — reminders to rest, celebrate wins, maintain work-life balance</li>
                  <li><strong>Facilitates growth</strong> — identifies learning opportunities, skill development, process improvements</li>
                </ul>
              </div>

              <div className="gc-card">
                <h3 className="gc-card-title">What GoodCounsel Does NOT Do</h3>
                <ul className="gc-list">
                  <li><strong>Judge or shame</strong> — No "you should have" or "why didn't you"</li>
                  <li><strong>Add to the pressure</strong> — No urgent countdowns, no crisis language</li>
                  <li><strong>Treat attorneys as machines</strong> — Recognizes humanity, limitations, need for rest</li>
                  <li><strong>Operate from scarcity</strong> — Does not frame recommendations as "you're not doing enough"</li>
                  <li><strong>Use AI to practice law</strong> — AI assists; attorney decides. All outputs are drafts for review.</li>
                </ul>
              </div>

              <div className="gc-quote">
                <p className="gc-quote-text" style={{ fontStyle: 'normal', fontWeight: '600' }}>
                  <strong>You are doing work that matters. You matter.</strong>
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Request Guidance Tab */}
          <TabsContent value="counsel" className="gc-tab-content">
            <div className="gc-section">
              <h2 className="gc-section-title">Request Guidance</h2>
              
              <div className="gc-form">
                <div className="gc-form-group">
                  <label className="gc-label">AI Provider</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="gc-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="gc-provider-option">
                            <span>{provider.icon}</span>
                            <span>{provider.name}</span>
                            <span className="gc-provider-status">{provider.status}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="gc-form-group">
                  <label className="gc-label">Legal Context or Situation *</label>
                  <Textarea
                    value={context}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
                    placeholder="Describe the legal case, workflow issue, or situation requiring guidance..."
                    className="gc-textarea"
                    rows={6}
                  />
                </div>

                <div className="gc-form-group">
                  <label className="gc-label">Your Current State (Optional)</label>
                  <Textarea
                    value={userState}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserState(e.target.value)}
                    placeholder="How are you feeling? Any stress, time pressure, or focus issues?"
                    className="gc-textarea"
                    rows={4}
                  />
                </div>

                <div className="gc-form-group">
                  <label className="gc-label">Ethical Concerns (Optional)</label>
                  <Textarea
                    value={ethicalConcerns}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEthicalConcerns(e.target.value)}
                    placeholder="Any ethical issues or concerns (comma-separated)..."
                    className="gc-textarea"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleRequestGuidance}
                  disabled={!context.trim() || counselMutation.isPending}
                  className="gc-button gc-button-primary"
                >
                  {counselMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Requesting Guidance...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Request Guidance
                    </>
                  )}
                </Button>

                {counselMutation.isError && (
                  <div className="gc-error">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Error requesting guidance. Please try again.</span>
                  </div>
                )}

                {counselMutation.isSuccess && counselMutation.data && (
                  <div className="gc-response">
                    <h3 className="gc-response-title">Guidance Response</h3>
                    <div className="gc-response-content">
                      {counselMutation.data}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Ethics Resources Tab */}
          <TabsContent value="ethics" className="gc-tab-content">
            <div className="gc-section">
              <h2 className="gc-section-title">Ethics Resources</h2>
              
              <div className="gc-card">
                <h3 className="gc-card-title">Professional Standards</h3>
                <ul className="gc-list gc-list-links">
                  <li>
                    <a href="https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/" target="_blank" rel="noopener noreferrer">
                      ABA Model Rules of Professional Conduct
                      <ExternalLink className="w-3 h-3 ml-1 inline" />
                    </a>
                  </li>
                  <li>
                    <a href="https://www.americanbar.org/groups/professional_responsibility/" target="_blank" rel="noopener noreferrer">
                      ABA Center for Professional Responsibility
                      <ExternalLink className="w-3 h-3 ml-1 inline" />
                    </a>
                  </li>
                  <li>
                    <a href="https://www.michbar.org/professional/ethics" target="_blank" rel="noopener noreferrer">
                      State Bar of Michigan - Ethics & Professional Standards
                      <ExternalLink className="w-3 h-3 ml-1 inline" />
                    </a>
                  </li>
                  <li>
                    <a href="https://www.michbar.org/professional/ethics/ethics-opinions" target="_blank" rel="noopener noreferrer">
                      Michigan Ethics Opinions
                      <ExternalLink className="w-3 h-3 ml-1 inline" />
                    </a>
                  </li>
                  <li>
                    <a href="https://innsofcourt.org/" target="_blank" rel="noopener noreferrer">
                      American Inns of Court
                      <ExternalLink className="w-3 h-3 ml-1 inline" />
                    </a>
                  </li>
                </ul>
                <p className="gc-text" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                  <strong>Note:</strong> Check your state bar association website for jurisdiction-specific ethics rules and opinions.
                </p>
              </div>

              <div className="gc-card gc-card-warning">
                <h3 className="gc-card-title">Attorney Assistance Programs</h3>
                <p className="gc-text">
                  Many state bar associations offer attorney assistance programs. These programs vary in their approach, structure, and confidentiality policies. Some programs may have reporting requirements to disciplinary authorities, and the level of confidentiality may differ from program to program.
                </p>
                <p className="gc-text gc-text-warning">
                  <strong>Consider carefully</strong> before engaging with any assistance program. Review program policies regarding confidentiality and reporting requirements. Consult with a trusted colleague or attorney to understand your options and rights before participating.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="gc-tab-content">
            <div className="gc-section">
              <h2 className="gc-section-title">Practice Insights</h2>
              <div className="gc-card">
                <p className="gc-text">Insights feature coming soon.</p>
                    </div>
                  </div>
          </TabsContent>

          {/* Wellness Tab */}
          <TabsContent value="wellness" className="gc-tab-content">
            <div className="gc-section">
              <h2 className="gc-section-title">Wellness & Balance</h2>
              <div className="gc-card">
                <p className="gc-text">Wellness feature coming soon.</p>
                  </div>
                </div>
          </TabsContent>

          {/* Journal Tab */}
          <TabsContent value="journal" className="gc-tab-content">
            <div className="gc-section">
            <GoodCounselJournaling />
            </div>
          </TabsContent>

          {/* Meditation Tab */}
          <TabsContent value="meditation" className="gc-tab-content">
            {showMeditation ? (
              <GoodCounselMeditation
                onClose={() => setShowMeditation(false)}
                onComplete={() => {
                  setShowMeditation(false);
                  setActiveTab('journal');
                }}
              />
            ) : (
              <div className="gc-section">
                <h2 className="gc-section-title">Centering & Reflection</h2>
                <div className="gc-card">
                  <p className="gc-text">
                    Take a moment to center yourself with a guided breathing exercise. 
                    This meditation feature helps reduce stress and improve focus.
                  </p>
                  <Button
                    onClick={() => setShowMeditation(true)}
                    className="gc-button gc-button-primary"
                    style={{ marginTop: '1rem' }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Start Meditation Session
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="gc-tab-content">
            <div className="gc-section">
              <h2 className="gc-section-title">Settings</h2>
              
              <div className="gc-card">
                <h3 className="gc-card-title">Privacy Protections</h3>
                    <PrivacyAssurance />
                  </div>

              <div className="gc-card">
                <h3 className="gc-card-title">Ethical Guidance</h3>
                <ul className="gc-list">
                  <li><strong>Confidentiality</strong> — All client information is protected and secure</li>
                  <li><strong>Competence</strong> — AI tools supplement, not replace, attorney judgment</li>
                  <li><strong>Diligence</strong> — Always verify AI-generated content</li>
                </ul>
                      </div>

                  {setupData && (
                <div className="gc-card">
                  <h3 className="gc-card-title">Your Profile</h3>
                  <p className="gc-text">
                        Setup completed on {new Date(localStorage.getItem('goodcounsel-setup-date') || '').toLocaleDateString()}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowGuidedSetup(true)}
                    className="gc-button"
                    style={{ marginTop: '1rem' }}
                      >
                        Update Profile
                      </Button>
                    </div>
                  )}
                </div>
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


}
)