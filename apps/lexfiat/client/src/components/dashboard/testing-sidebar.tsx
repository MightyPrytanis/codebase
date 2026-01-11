/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from "react";
import { Bug, X, AlertCircle, AlertTriangle, HelpCircle, MessageSquare, Lightbulb, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TestingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestingSidebar({ isOpen, onClose }: TestingSidebarProps) {
  const [selectedIssue, setSelectedIssue] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const issueTypes = [
    { value: "error", label: "Error", icon: XCircle, description: "System or application error" },
    { value: "ui-malfunction", label: "UI Malfunction", icon: AlertTriangle, description: "Interface not working correctly" },
    { value: "disconnected-service", label: "Disconnected Service", icon: AlertCircle, description: "Service connection issue" },
    { value: "suggestion", label: "Make Suggestion", icon: Lightbulb, description: "Feature or improvement idea" },
    { value: "question", label: "Ask Question", icon: HelpCircle, description: "Need help or clarification" },
    { value: "other", label: "Other Issue", icon: MessageSquare, description: "Something else" },
  ];

  const handleSubmit = () => {
    if (!selectedIssue) return;
    
    // Store in localStorage
    const reports = JSON.parse(localStorage.getItem('betaReports') || '[]');
    reports.push({
      id: Date.now(),
      type: selectedIssue,
      description,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('betaReports', JSON.stringify(reports));
    
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedIssue("");
      setDescription("");
    }, 2000);
  };

  return (
    <>
      {/* Persistent Tab */}
      {!isOpen && (
        <div 
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 cursor-pointer group"
          style={{ 
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
        >
          <div className="bg-accent-gold/80 hover:bg-accent-gold text-slate-900 px-3 py-6 rounded-l-lg shadow-lg transition-all flex items-center gap-2">
            <Bug className="w-4 h-4" style={{ transform: 'rotate(90deg)' }} />
            <span className="font-semibold text-sm">Testing</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-card-dark border-l-2 border-accent-gold shadow-2xl z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Card className="h-full flex flex-col bg-transparent border-0 rounded-none">
          <CardHeader className="border-b border-border-gray pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Bug className="w-5 h-5 text-accent-gold" />
                Beta Tester Report
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto pt-6">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-status-success/20 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-status-success" />
                </div>
                <p className="text-primary font-semibold">Report Submitted!</p>
                <p className="text-secondary text-sm">Thank you for your feedback</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <Label className="text-secondary mb-3 block">Select Issue Type</Label>
                  <RadioGroup value={selectedIssue} onValueChange={setSelectedIssue}>
                    {issueTypes.map((issue) => {
                      const IconComponent = issue.icon;
                      return (
                        <div key={issue.value} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-card-light transition-colors">
                          <RadioGroupItem value={issue.value} id={issue.value} className="mt-1" />
                          <Label htmlFor={issue.value} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <IconComponent className="w-4 h-4 text-accent-gold" />
                              <span className="font-medium text-primary">{issue.label}</span>
                            </div>
                            <p className="text-xs text-secondary">{issue.description}</p>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                {selectedIssue && (
                  <div>
                    <Label htmlFor="description" className="text-secondary mb-2 block">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide additional details..."
                      className="bg-primary-dark border-border-gray min-h-[100px] resize-none"
                    />
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!selectedIssue}
                  className="w-full bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold"
                >
                  Submit Report
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}


}