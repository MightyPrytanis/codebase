/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, FileX, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PrivacyAssuranceProps {
  onAcknowledge?: () => void;
}

/**
 * HIPAA-Level Privacy Protections and Assurances Component
 * 
 * This component displays comprehensive privacy protections for GoodCounsel,
 * assuring users that their data will never be used to report on performance
 * or problems unless legally obligated or to prevent serious harm.
 */
export function PrivacyAssurance({ onAcknowledge }: PrivacyAssuranceProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    // Store acknowledgment in localStorage
    localStorage.setItem('goodcounsel-privacy-acknowledged', 'true');
    localStorage.setItem('goodcounsel-privacy-acknowledged-date', new Date().toISOString());
    onAcknowledge?.();
  };

  return (
    <Card className="bg-card-dark border-2 border-accent-gold/30">
      <CardHeader className="bg-gradient-to-r from-accent-gold/20 to-status-success/10 border-b border-accent-gold/30">
        <CardTitle className="flex items-center gap-3 text-primary">
          <Shield className="w-6 h-6 text-accent-gold" />
          <span>HIPAA-Level Privacy Protections</span>
          <Badge className="ml-auto bg-status-success/20 text-status-success border-status-success">
            <Lock className="w-3 h-3 mr-1" />
            Protected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Core Promise */}
        <div className="bg-card-light p-4 rounded-lg border-l-4 border-accent-gold">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-primary mb-2">Our Core Promise</h3>
              <p className="text-secondary text-sm leading-relaxed">
                GoodCounsel will <strong className="text-primary">never</strong> be used to report on your performance, 
                problems, or personal information to bosses, courts, clients, the bar, or anyone else—<strong>unless</strong> 
                we are legally obligated to do so, or to prevent serious and permanent physical or psychological harm to you or others.
              </p>
            </div>
          </div>
        </div>

        {/* What We Protect */}
        <div className="space-y-3">
          <h4 className="font-semibold text-primary flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent-gold" />
            What We Protect
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-card-light p-3 rounded border border-border-gray">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-accent-gold" />
                <span className="font-medium text-sm text-primary">Personal Information</span>
              </div>
              <p className="text-xs text-secondary">Mood, stress levels, personal goals, values, relationships</p>
            </div>
            <div className="bg-card-light p-3 rounded border border-border-gray">
              <div className="flex items-center gap-2 mb-1">
                <FileX className="w-4 h-4 text-accent-gold" />
                <span className="font-medium text-sm text-primary">Professional Challenges</span>
              </div>
              <p className="text-xs text-secondary">Workflow issues, ethical concerns, practice difficulties</p>
            </div>
            <div className="bg-card-light p-3 rounded border border-border-gray">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-accent-gold" />
                <span className="font-medium text-sm text-primary">Health Information</span>
              </div>
              <p className="text-xs text-secondary">PHQ-9 assessments, wellness data, mental health insights</p>
            </div>
            <div className="bg-card-light p-3 rounded border border-border-gray">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-accent-gold" />
                <span className="font-medium text-sm text-primary">Journal Entries</span>
              </div>
              <p className="text-xs text-secondary">Private reflections, thoughts, and personal notes</p>
            </div>
          </div>
        </div>

        {/* What We Never Do */}
        <div className="bg-status-critical/10 border border-status-critical/30 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-critical mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-primary mb-2">What We Never Do</h4>
              <ul className="space-y-2 text-sm text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-status-critical">✗</span>
                  <span>Report to employers, supervisors, or firm management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-critical">✗</span>
                  <span>Share with courts, bar associations, or regulatory bodies (unless legally required)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-critical">✗</span>
                  <span>Disclose to clients or third parties</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-critical">✗</span>
                  <span>Use for performance evaluation or disciplinary purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-critical">✗</span>
                  <span>Share for marketing, research, or analytics without explicit consent</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Limited Exceptions */}
        <div className="bg-card-light p-4 rounded-lg border border-border-gray">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent-gold mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-primary mb-2">Limited Exceptions</h4>
              <p className="text-sm text-secondary mb-3">
                We may disclose information only in these extremely limited circumstances:
              </p>
              <ol className="space-y-2 text-sm text-secondary list-decimal list-inside">
                <li>
                  <strong className="text-primary">Legal Obligation:</strong> If required by law, court order, 
                  or valid subpoena (we will notify you when legally permitted)
                </li>
                <li>
                  <strong className="text-primary">Prevent Serious Harm:</strong> If we have a good faith belief 
                  that disclosure is necessary to prevent serious and permanent physical or psychological harm 
                  to you or others, and we will disclose only the minimum necessary information
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Technical Protections */}
        <div className="space-y-3">
          <h4 className="font-semibold text-primary flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent-gold" />
            Technical Protections
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-card-light p-3 rounded border border-border-gray text-center">
              <div className="text-status-success text-2xl mb-2">🔐</div>
              <p className="text-xs font-medium text-primary">End-to-End Encryption</p>
              <p className="text-xs text-secondary mt-1">All data encrypted in transit and at rest</p>
            </div>
            <div className="bg-card-light p-3 rounded border border-border-gray text-center">
              <div className="text-status-success text-2xl mb-2">🔑</div>
              <p className="text-xs font-medium text-primary">Access Controls</p>
              <p className="text-xs text-secondary mt-1">Strict authentication and authorization</p>
            </div>
            <div className="bg-card-light p-3 rounded border border-border-gray text-center">
              <div className="text-status-success text-2xl mb-2">📋</div>
              <p className="text-xs font-medium text-primary">Audit Logging</p>
              <p className="text-xs text-secondary mt-1">Complete access and modification logs</p>
            </div>
          </div>
        </div>

        {/* Acknowledgment */}
        {!acknowledged && (
          <div className="bg-accent-gold/10 border-2 border-accent-gold/30 p-4 rounded-lg">
            <p className="text-sm text-secondary mb-3">
              By acknowledging this privacy protection statement, you confirm that you understand 
              how your GoodCounsel data is protected and used.
            </p>
            <button
              onClick={handleAcknowledge}
              className="w-full bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold py-2 px-4 rounded transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              I Understand and Acknowledge
            </button>
          </div>
        )}

        {acknowledged && (
          <div className="bg-status-success/10 border border-status-success/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-status-success">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Privacy protections acknowledged</span>
            </div>
            <p className="text-xs text-secondary mt-2">
              Acknowledged on {new Date().toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

