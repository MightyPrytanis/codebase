/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Shield, Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";

export default function ComplianceChecker() {
  const [documentText, setDocumentText] = useState('');
  const [regulations, setRegulations] = useState<string[]>([]);
  const [regulationInput, setRegulationInput] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [industry, setIndustry] = useState('');

  const complianceMutation = useMutation({
    mutationFn: async () => {
      const result = await executeCyranoTool('compliance_checker', {
        document_text: documentText,
        regulations: regulations.length > 0 ? regulations : undefined,
        jurisdiction: jurisdiction || undefined,
        industry: industry || undefined,
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Compliance check failed');
      }
      
      const parsed = typeof result.content[0]?.text === 'string' 
        ? JSON.parse(result.content[0].text) 
        : result.content[0]?.text;
      
      return parsed;
    },
  });

  const handleAddRegulation = () => {
    if (regulationInput.trim() && !regulations.includes(regulationInput.trim())) {
      setRegulations([...regulations, regulationInput.trim()]);
      setRegulationInput('');
    }
  };

  const handleRemoveRegulation = (reg: string) => {
    setRegulations(regulations.filter(r => r !== reg));
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary flex items-center gap-3">
            <Shield className="w-10 h-10 text-accent-gold" />
            Compliance Checker
          </h1>
          <p className="text-secondary">
            Check documents for regulatory compliance and identify violations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
              <h2 className="text-xl font-bold text-primary mb-4">Document</h2>
              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste or type the document to check..."
                className="w-full h-64 bg-primary-dark border border-border-gray rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold resize-none"
              />
            </div>

            <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
              <h2 className="text-xl font-bold text-primary mb-4">Compliance Settings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Jurisdiction
                    </label>
                    <input
                      type="text"
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value)}
                      placeholder="e.g., Michigan, Federal"
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., Healthcare, Finance"
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Specific Regulations (optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={regulationInput}
                      onChange={(e) => setRegulationInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddRegulation()}
                      placeholder="Add regulation..."
                      className="flex-1 bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                    <button
                      onClick={handleAddRegulation}
                      className="px-4 py-2 bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {regulations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {regulations.map((reg) => (
                        <span
                          key={reg}
                          className="flex items-center gap-1 px-3 py-1 bg-accent-gold/20 text-accent-gold rounded-full text-sm border border-accent-gold/30"
                        >
                          {reg}
                          <button
                            onClick={() => handleRemoveRegulation(reg)}
                            className="hover:text-status-critical"
                          >
                            <AlertCircle className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => complianceMutation.mutate()}
              disabled={!documentText.trim() || complianceMutation.isPending}
              className="w-full bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {complianceMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Check Compliance
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {complianceMutation.data && (
              <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-status-success" />
                  Results
                </h3>
                <div className="space-y-4">
                  {complianceMutation.data.violations && (
                    <div>
                      <h4 className="font-semibold text-status-critical mb-2">Violations</h4>
                      <ul className="list-disc list-inside text-secondary text-sm space-y-1">
                        {complianceMutation.data.violations.map((v: string, i: number) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {complianceMutation.data.recommendations && (
                    <div>
                      <h4 className="font-semibold text-status-success mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside text-secondary text-sm space-y-1">
                        {complianceMutation.data.recommendations.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <pre className="text-xs text-secondary overflow-auto max-h-96 bg-primary-dark p-4 rounded border border-border-gray">
                    {JSON.stringify(complianceMutation.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {complianceMutation.isError && (
              <div className="bg-status-critical/20 border border-status-critical rounded-lg p-4">
                <div className="flex items-center gap-2 text-status-critical mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Check Failed</span>
                </div>
                <p className="text-sm text-secondary">
                  {complianceMutation.error instanceof Error 
                    ? complianceMutation.error.message 
                    : 'Unknown error occurred'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

