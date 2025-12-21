/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Scale, Loader2, CheckCircle, AlertCircle, FileText, Users, Calendar, Search, Briefcase } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";

type ClioAction = 
  | 'get_item_tracking'
  | 'get_matter_info'
  | 'get_workflow_status'
  | 'get_client_info'
  | 'get_document_info'
  | 'get_calendar_events'
  | 'search_matters'
  | 'get_red_flags'
  | 'get_tasks'
  | 'get_contacts'
  | 'get_case_status'
  | 'search_documents';

export default function ClioIntegration() {
  const [action, setAction] = useState<ClioAction>('search_matters');
  const [matterId, setMatterId] = useState('');
  const [clientId, setClientId] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const clioMutation = useMutation({
    mutationFn: async (params: any) => {
      const result = await executeCyranoTool('clio_integration', params);
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Clio operation failed');
      }
      
      const parsed = typeof result.content[0]?.text === 'string' 
        ? JSON.parse(result.content[0].text) 
        : result.content[0]?.text;
      
      return parsed;
    },
  });

  const handleExecute = () => {
    const params: any = { action };
    
    if (matterId) params.matter_id = matterId;
    if (clientId) params.client_id = clientId;
    if (documentId) params.document_id = documentId;
    if (searchQuery) params.parameters = { query: searchQuery };
    
    clioMutation.mutate(params);
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary flex items-center gap-3">
            <Scale className="w-10 h-10 text-accent-gold" />
            Clio Integration
          </h1>
          <p className="text-secondary">
            Access Clio practice management data: matters, clients, documents, and workflows
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
              <h2 className="text-xl font-bold text-primary mb-4">Clio Operations</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Action
                  </label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as ClioAction)}
                    className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                  >
                    <optgroup label="Matters">
                      <option value="search_matters">Search Matters</option>
                      <option value="get_matter_info">Get Matter Info</option>
                      <option value="get_case_status">Get Case Status</option>
                    </optgroup>
                    <optgroup label="Clients">
                      <option value="get_client_info">Get Client Info</option>
                      <option value="get_contacts">Get Contacts</option>
                    </optgroup>
                    <optgroup label="Documents">
                      <option value="search_documents">Search Documents</option>
                      <option value="get_document_info">Get Document Info</option>
                    </optgroup>
                    <optgroup label="Workflow">
                      <option value="get_workflow_status">Get Workflow Status</option>
                      <option value="get_tasks">Get Tasks</option>
                      <option value="get_red_flags">Get Red Flags</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="get_calendar_events">Get Calendar Events</option>
                      <option value="get_item_tracking">Get Item Tracking</option>
                    </optgroup>
                  </select>
                </div>

                {(action === 'get_matter_info' || action === 'get_case_status' || action === 'get_workflow_status') && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Matter ID
                    </label>
                    <input
                      type="text"
                      value={matterId}
                      onChange={(e) => setMatterId(e.target.value)}
                      placeholder="Enter matter ID..."
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                )}

                {action === 'get_client_info' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Enter client ID..."
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                )}

                {action === 'get_document_info' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Document ID
                    </label>
                    <input
                      type="text"
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                      placeholder="Enter document ID..."
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                )}

                {(action === 'search_matters' || action === 'search_documents') && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Search Query
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter search query..."
                      className="w-full bg-primary-dark border border-border-gray rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    />
                  </div>
                )}

                <button
                  onClick={handleExecute}
                  disabled={clioMutation.isPending}
                  className="w-full bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {clioMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Scale className="w-5 h-5" />
                      Execute Clio Operation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {clioMutation.data && (
              <div className="bg-card-dark rounded-lg p-6 border border-border-gray">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-status-success" />
                  Results
                </h3>
                <div className="space-y-4">
                  <pre className="text-xs text-secondary overflow-auto max-h-96 bg-primary-dark p-4 rounded border border-border-gray">
                    {JSON.stringify(clioMutation.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {clioMutation.isError && (
              <div className="bg-status-critical/20 border border-status-critical rounded-lg p-4">
                <div className="flex items-center gap-2 text-status-critical mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Operation Failed</span>
                </div>
                <p className="text-sm text-secondary">
                  {clioMutation.error instanceof Error 
                    ? clioMutation.error.message 
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

