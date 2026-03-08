/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Heart, Shield, BookOpen, Lightbulb, Settings, Send, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";
import ExpandedPanel from "./expanded-panel";
import { PrivacyAssurance } from "./goodcounsel-privacy-assurance";

interface GoodCounselRedesignProps {
  isOpen: boolean;
  onClose: () => void;
  caseContext?: string;
}

export function GoodCounselRedesign({ 
  isOpen, 
  onClose, 
  caseContext = ""
}: GoodCounselRedesignProps) {
  const [context, setContext] = useState(caseContext);
  const [selectedProvider, setSelectedProvider] = useState<string>("provider-1");
  const [userState, setUserState] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("philosophy");

  const providers = [
    { id: "provider-1", name: "AI Provider A", status: "Working", icon: "🔍" },
    { id: "provider-2", name: "AI Provider B", status: "Working", icon: "🧠" },
    { id: "provider-3", name: "AI Provider C", status: "Working", icon: "🤖" },
  ];

  const counselMutation = useMutation({
    mutationFn: async (data: {
      context: string;
      userState?: string;
      provider: string;
    }) => {
      const result = await executeCyranoTool("goodcounsel_engine", {
        action: "wellness_check",
        input: {
          context: data.context,
          user_state: data.userState,
          ai_provider: data.provider,
        },
        userId: "default-user", // TODO: Get from auth
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || "Failed to request guidance");
      }
      
      return result.content[0]?.text || "";
    },
  });

  const handleRequestGuidance = () => {
    if (!context.trim()) return;
    
    counselMutation.mutate({
      context,
      userState,
      provider: selectedProvider,
    });
  };

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

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gc-tabs">
          <TabsList className="gc-tabs-list">
            <TabsTrigger value="philosophy">
              <Heart className="w-4 h-4" />
              <span>Philosophy</span>
            </TabsTrigger>
            <TabsTrigger value="guidance">
              <Brain className="w-4 h-4" />
              <span>Request Guidance</span>
            </TabsTrigger>
            <TabsTrigger value="ethics">
              <Shield className="w-4 h-4" />
              <span>Ethics Resources</span>
            </TabsTrigger>
            <TabsTrigger value="journal">
              <BookOpen className="w-4 h-4" />
              <span>Journal</span>
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Lightbulb className="w-4 h-4" />
              <span>Insights</span>
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
                <ul className="gc-list">
                  <li>You are not your caseload.</li>
                  <li>Your worth is not measured by billable hours.</li>
                  <li>Your clients are not just files; you are not just a machine.</li>
                  <li>You are doing work that matters. You matter.</li>
                  <li>Come. You aren't judged here. You are seen and supported—unconditionally.</li>
                </ul>
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
                <p className="gc-quote-text">
                  "Come. You aren't judged here. You are seen and supported—unconditionally. You are so much more than your job, and your clients are so much more than files. You are doing work that matters. You matter."
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Request Guidance Tab */}
          <TabsContent value="guidance" className="gc-tab-content">
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
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Describe the legal case, workflow issue, or situation requiring guidance..."
                    className="gc-textarea"
                    rows={6}
                  />
                </div>

                <div className="gc-form-group">
                  <label className="gc-label">Your Current State (Optional)</label>
                  <Textarea
                    value={userState}
                    onChange={(e) => setUserState(e.target.value)}
                    placeholder="How are you feeling? Any stress, time pressure, or focus issues?"
                    className="gc-textarea"
                    rows={4}
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
                </ul>
              </div>

              <div className="gc-card gc-card-warning">
                <h3 className="gc-card-title">Attorney Assistance Programs</h3>
                <p className="gc-text">
                  Many state bar associations offer attorney assistance programs. However, please be aware that these programs can be very harsh and not always helpful. They may report issues to disciplinary authorities, and participation may not be confidential.
                </p>
                <p className="gc-text gc-text-warning">
                  <strong>Use caution</strong> when considering these programs. Consult with a trusted colleague or attorney before engaging with any assistance program.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Other tabs - placeholder */}
          <TabsContent value="journal" className="gc-tab-content">
            <div className="gc-section">
              <p className="gc-text">Journal feature coming soon.</p>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="gc-tab-content">
            <div className="gc-section">
              <p className="gc-text">Insights feature coming soon.</p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="gc-tab-content">
            <div className="gc-section">
              <p className="gc-text">Settings feature coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ExpandedPanel>
  );

}