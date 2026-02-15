/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from "react";
import { BetaTestingIcon } from "@cyrano/shared-assets/icon-components";
import "@/styles/dashboard-html.css";

interface TestingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestingSidebar({ isOpen, onClose }: TestingSidebarProps) {
  const [selectedIssue, setSelectedIssue] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [aiDiagnosis, setAiDiagnosis] = useState<string>("");
  const [userAgrees, setUserAgrees] = useState<boolean | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedIssue || !description) return;
    
    setIsAnalyzing(true);
    try {
      // Call AI service for preliminary diagnosis
      // Using auto-select for best model (no user choice)
      const response = await fetch('/api/ai/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedIssue,
          description: description,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiDiagnosis(data.diagnosis || "Analysis complete. Please review.");
      } else {
        setAiDiagnosis("Unable to analyze at this time. Please proceed with your report.");
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiDiagnosis("Analysis service unavailable. Please proceed with your report.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedIssue) return;
    
    // Store in localStorage
    const reports = JSON.parse(localStorage.getItem('betaReports') || '[]');
    reports.push({
      id: Date.now(),
      type: selectedIssue,
      description,
      aiDiagnosis,
      userAgrees,
      additionalInfo,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('betaReports', JSON.stringify(reports));
    
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedIssue("");
      setDescription("");
      setAiDiagnosis("");
      setUserAgrees(null);
      setAdditionalInfo("");
    }, 2000);
  };

  return (
    <>
      {/* Persistent Tab - slides out when mouse approaches right edge */}
      {!isOpen && (
        <div 
          className="testing-sidebar-tab"
          onMouseEnter={() => {
            const event = new Event('open-testing-sidebar');
            window.dispatchEvent(event);
          }}
        >
          <div className="testing-tab-content">
            <BetaTestingIcon size={20} className="ui-icon" />
            <span>Testing</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`testing-sidebar ${isOpen ? 'open' : ''}`}
        onMouseLeave={() => isOpen && onClose()}
      >
        <div className="testing-sidebar-header">
          <h3>
            <BetaTestingIcon size={20} className="ui-icon" />
            What's Happening?
          </h3>
          <button className="close-testing-sidebar" onClick={onClose}>×</button>
        </div>
        
        <div className="testing-sidebar-content">
          {submitted ? (
            <div className="testing-success">
              <p>Report Submitted!</p>
              <p className="testing-success-sub">Thank you for your feedback</p>
            </div>
          ) : (
            <>
              <div className="beta-checklist">
                <label className="beta-item">
                  <input 
                    type="radio" 
                    name="beta-issue" 
                    value="error"
                    checked={selectedIssue === "error"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                  />
                  Error
                </label>
                <label className="beta-item">
                  <input 
                    type="radio" 
                    name="beta-issue" 
                    value="ui-malfunction"
                    checked={selectedIssue === "ui-malfunction"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                  />
                  UI Malfunction
                </label>
                <label className="beta-item">
                  <input 
                    type="radio" 
                    name="beta-issue" 
                    value="disconnected-service"
                    checked={selectedIssue === "disconnected-service"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                  />
                  Disconnected Service
                </label>
                <label className="beta-item">
                  <input 
                    type="radio" 
                    name="beta-issue" 
                    value="suggestion"
                    checked={selectedIssue === "suggestion"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                  />
                  Make Suggestion
                </label>
                <label className="beta-item">
                  <input 
                    type="radio" 
                    name="beta-issue" 
                    value="question"
                    checked={selectedIssue === "question"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                  />
                  Ask Question
                </label>
                <label className="beta-item">
                  <input 
                    type="radio" 
                    name="beta-issue" 
                    value="other"
                    checked={selectedIssue === "other"}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                  />
                  Other Issue
                </label>
              </div>
              
              {selectedIssue && (
                <>
                  <label className="beta-label">Describe in your own words what the glitch or problem is:</label>
                <textarea
                  className="beta-description"
                    placeholder="Describe the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
                  
                  {description && (
                    <button 
                      className="beta-go-btn" 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze"}
                    </button>
                  )}
                  
                  {aiDiagnosis && (
                    <>
                      <div className="ai-diagnosis-box">
                        <h4>AI Preliminary Diagnosis:</h4>
                        <p>{aiDiagnosis}</p>
                      </div>
                      
                      <label className="beta-label">Do you agree?</label>
                      <div className="beta-checklist">
                        <label className="beta-item">
                          <input 
                            type="radio" 
                            name="user-agrees" 
                            value="yes"
                            checked={userAgrees === true}
                            onChange={() => setUserAgrees(true)}
                          />
                          Yes
                        </label>
                        <label className="beta-item">
                          <input 
                            type="radio" 
                            name="user-agrees" 
                            value="no"
                            checked={userAgrees === false}
                            onChange={() => setUserAgrees(false)}
                          />
                          No
                        </label>
                      </div>
                      
                      <label className="beta-label">Is there more you want to share?</label>
                      <textarea
                        className="beta-description"
                        placeholder="Additional information..."
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        rows={3}
                      />
                    </>
                  )}
                  
                  <div className="beta-actions">
              <button 
                className="beta-go-btn" 
                onClick={handleSubmit}
                      disabled={!selectedIssue || !description}
              >
                      Submit
                    </button>
                    <button 
                      className="beta-back-btn" 
                      onClick={() => {
                        setSelectedIssue("");
                        setDescription("");
                        setAiDiagnosis("");
                        setUserAgrees(null);
                        setAdditionalInfo("");
                      }}
                    >
                      Back
              </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

}
)
}