/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Clock, Loader2, CheckCircle, AlertCircle, Calendar, FileText } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { WorkflowArchaeology, WorkflowArchaeologyResult } from "@/components/time-tracking/workflow-archaeology";
import { TimelineVisualization } from "@/components/time-tracking/timeline-visualization";
import { EvidenceChain } from "@/components/time-tracking/evidence-chain";

type ChronometricAction = 
  | 'execute_workflow'
  | 'execute_module'
  | 'list_workflows'
  | 'identify_gaps'
  | 'collect_artifacts'
  | 'reconstruct_time'
  | 'check_duplicates'
  | 'recollection_support'
  | 'pre_fill'
  | 'track_provenance'
  | 'generate_report'
  | 'setup_baseline'
  | 'learn_patterns'
  | 'analyze_profitability'
  | 'estimate_cost'
  | 'generate_reconciliation_report'
  | 'compare_with_clio';

export default function TimeTracking() {
  const [action, setAction] = useState<ChronometricAction>('identify_gaps');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [matterId, setMatterId] = useState('');
  const [includeArtifacts, setIncludeArtifacts] = useState<string[]>([]);
  const [workflowResult, setWorkflowResult] = useState<WorkflowArchaeologyResult | null>(null);
  const [userId] = useState('user-1'); // TODO: Get from auth context

  const chronometricMutation = useMutation({
    mutationFn: async (params: any) => {
      const result = await executeCyranoTool('chronometric_module', params);
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Time tracking operation failed');
      }
      
      const parsed = typeof result.content[0]?.text === 'string' 
        ? JSON.parse(result.content[0].text) 
        : result.content[0]?.text;
      
      return parsed;
    },
  });

  const handleExecute = () => {
    const params: any = { action };
    
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (matterId) params.matter_id = matterId;
    if (includeArtifacts.length > 0) params.include_artifacts = includeArtifacts;
    
    chronometricMutation.mutate(params);
  };

  const toggleArtifact = (artifact: string) => {
    setIncludeArtifacts(prev => 
      prev.includes(artifact) 
        ? prev.filter(a => a !== artifact)
        : [...prev, artifact]
    );
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary flex items-center gap-3">
            <Clock className="w-10 h-10 text-accent-gold" />
            Time Tracking
          </h1>
          <p className="text-secondary">
            Forensic Time Capture - Reconstruct lost or unentered billable time using Chronometric Engine
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
                <h2 className="text-xl font-bold text-primary mb-4">Chronometric Operations</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Action
                  </label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as ChronometricAction)}
                    className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                  >
                    <optgroup label="Time Reconstruction">
                      <option value="identify_gaps">Identify Gaps</option>
                      <option value="collect_artifacts">Collect Artifacts</option>
                      <option value="reconstruct_time">Reconstruct Time</option>
                      <option value="check_duplicates">Check Duplicates</option>
                      <option value="recollection_support">Recollection Support</option>
                      <option value="pre_fill">Pre-fill Entries</option>
                      <option value="track_provenance">Track Provenance</option>
                    </optgroup>
                    <optgroup label="Pattern Learning & Analytics">
                      <option value="setup_baseline">Setup Baseline</option>
                      <option value="learn_patterns">Learn Patterns</option>
                      <option value="analyze_profitability">Analyze Profitability</option>
                    </optgroup>
                    <optgroup label="Cost Estimation">
                      <option value="estimate_cost">Estimate Cost</option>
                    </optgroup>
                    <optgroup label="Billing Reconciliation">
                      <option value="generate_reconciliation_report">Generate Reconciliation Report</option>
                      <option value="compare_with_clio">Compare with Clio</option>
                    </optgroup>
                    <optgroup label="Engine Actions">
                      <option value="execute_workflow">Execute Workflow</option>
                      <option value="execute_module">Execute Module</option>
                      <option value="list_workflows">List Workflows</option>
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Matter ID (optional)
                  </label>
                  <input
                    type="text"
                    value={matterId}
                    onChange={(e) => setMatterId(e.target.value)}
                    placeholder="Enter matter ID..."
                    className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Include Artifacts
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['email', 'calendar', 'documents', 'calls'].map(artifact => (
                      <button
                        key={artifact}
                        onClick={() => toggleArtifact(artifact)}
                        className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                          includeArtifacts.includes(artifact)
                            ? 'bg-accent-gold text-slate-900 border-accent-gold'
                            : 'bg-primary-dark text-secondary border-border-gray hover:border-accent-gold'
                        }`}
                      >
                        {artifact}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={chronometricMutation.isPending}
                  className="w-full bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {chronometricMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5" />
                      Execute Operation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {chronometricMutation.data && (
              <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-status-success" />
                  Results
                </h3>
                <div className="space-y-4">
                  {/* Format results based on action type */}
                  {action === 'list_workflows' && chronometricMutation.data.workflows ? (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-primary">Available Workflows:</h4>
                      <ul className="list-disc list-inside space-y-1 text-secondary">
                        {chronometricMutation.data.workflows.map((wf: any) => (
                          <li key={wf.id}>
                            <span className="font-medium">{wf.name}</span>: {wf.description} ({wf.steps} steps)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <pre className="text-xs text-secondary overflow-auto max-h-96 bg-primary-dark p-4 rounded border border-border-gray">
                      {JSON.stringify(chronometricMutation.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {chronometricMutation.isError && (
              <div className="bg-status-critical/20 border border-status-critical rounded-lg p-4">
                <div className="flex items-center gap-2 text-status-critical mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Operation Failed</span>
                </div>
                <p className="text-sm text-secondary">
                  {chronometricMutation.error instanceof Error 
                    ? chronometricMutation.error.message 
                    : 'Unknown error occurred'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Workflow Archaeology Section */}
        <div className="space-y-6">
          <WorkflowArchaeology
            userId={userId}
            onReconstruct={(result) => {
              setWorkflowResult(result);
            }}
          />

          {workflowResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimelineVisualization
                result={workflowResult}
                onTimeEntrySuggestion={(entry) => {
                  // TODO: Integrate with time entry creation flow
                  console.log('Time entry suggestion:', entry);
                  alert(`Time Entry Suggestion:\nDate: ${entry.date}\nHours: ${entry.hours}\nDescription: ${entry.description}\nConfidence: ${entry.confidence}`);
                }}
              />
              <EvidenceChain result={workflowResult} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

