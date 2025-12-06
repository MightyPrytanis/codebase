import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthForm } from "@/components/AuthForm";

interface AIProvider {
  id: string;
  name: string;
  company: string;
  requiresApiKey: boolean;
  status: 'connected' | 'setup_required' | 'error';
}

interface AIResponse {
  id: string;
  aiProvider: string;
  content: string;
  status: 'pending' | 'complete' | 'error';
  timestamp: string;
  metadata?: Record<string, any>;
  rating?: 'positive' | 'negative';
  awardSaved?: boolean;
}

interface WorkflowState {
  currentStep: number;
  totalSteps: number;
  collaborativeDocument: string;
  stepHistory: {
    step: number;
    assignedAI: string;
    objective: string;
    completedAt?: string;
    output: string;
  }[];
  sharedContext: Record<string, any>;
}

interface QueryRequest {
  query: string;
  selectedAIs: string[];
  mode: 'dive' | 'turn' | 'work';
  attachedFiles?: Array<{
    id: string;
    filename: string;
    size: number;
    type: string;
    objectPath: string;
    uploadedAt: string;
  }>;
}

// WORK Mode Workflow Display Component
function WorkflowDisplay({ conversationId }: { conversationId: string }) {
  const { data: workflow } = useQuery<any>({
    queryKey: [`/api/conversations/${conversationId}/workflow`],
    refetchInterval: 3000,
    enabled: !!conversationId
  });

  const { data: workResponses = [] } = useQuery<AIResponse[]>({
    queryKey: [`/api/conversations/${conversationId}/responses`],
    refetchInterval: 2000,
    enabled: !!conversationId
  });

  if (!workflow?.workflowState) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Setting up collaborative workflow...
      </div>
    );
  }

  const { workflowState } = workflow;
  const collaborativeDoc = workflowState.collaborativeDoc || "";

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '2px solid #0ea5e9',
      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.1)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#374151', fontSize: '20px' }}>
          WORK Mode: Collaborative Analysis
        </h3>
        <div style={{
          marginLeft: 'auto',
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: 'bold'
        }}>
          Step {workflowState.currentStep + 1} of {workflowState.totalSteps}
        </div>
      </div>

      {/* Workflow Progress */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        alignItems: 'center',
        overflowX: 'auto'
      }}>
        {workflowState.steps?.map((step: any, index: number) => {
          const isActive = index === workflowState.currentStep;
          const isCompleted = step.completed;
          const isPending = index < workflowState.currentStep;
          
          return (
            <React.Fragment key={step.step}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: isCompleted ? '#16a34a' : isActive ? '#0c4a6e' : '#e5e7eb',
                color: isCompleted || isActive ? 'white' : '#6b7280',
                fontWeight: 'bold',
                fontSize: '12px',
                minWidth: '140px',
                textAlign: 'center',
                position: 'relative',
                border: isActive ? '2px solid #fbbf24' : 'none'
              }}>
                <div>Step {step.step}</div>
                <div style={{ fontSize: '10px', marginTop: '2px' }}>
                  {step.assignedAI}
                </div>
                <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: 'normal' }}>
                  {step.objective.substring(0, 25)}...
                </div>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#fbbf24',
                    border: '2px solid white',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </div>
              {index < workflowState.steps.length - 1 && (
                <div style={{
                  width: '20px',
                  height: '3px',
                  backgroundColor: isCompleted ? '#16a34a' : '#e5e7eb',
                  margin: '0 5px'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current Step Status */}
      {workflowState.currentStep < workflowState.steps?.length && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '2px solid #0c4a6e',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#0c4a6e', fontSize: '16px' }}>
            Current Task
          </h4>
          <p style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '14px' }}>
            <strong>{workflowState.steps[workflowState.currentStep]?.assignedAI}</strong> is working on:
          </p>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', fontStyle: 'italic' }}>
            {workflowState.steps[workflowState.currentStep]?.objective}
          </p>
        </div>
      )}

      {/* Latest Responses */}
      {workResponses.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>Latest AI Contributions</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {workResponses.slice(-2).map(response => (
              <div key={response.id} style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                marginBottom: '10px'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  color: '#6b7280',
                  marginBottom: '5px'
                }}>
                  {response.aiProvider} • Step {response.metadata?.workStep || '?'}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#374151',
                  lineHeight: '1.4'
                }}>
                  {response.content.substring(0, 200)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collaborative Document Preview */}
      {collaborativeDoc && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>
            Collaborative Document (Live)
          </h4>
          <div style={{
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#374151',
            whiteSpace: 'pre-wrap',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {collaborativeDoc}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SwimMeet() {
  // Authentication state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // App state
  const [query, setQuery] = useState("");
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);
  const [mode, setMode] = useState<'dive' | 'turn' | 'work'>('dive');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [verifyingStates, setVerifyingStates] = useState<Record<string, boolean>>({});
  const [sharingStates, setSharingStates] = useState<Record<string, boolean>>({});
  const [selectedVerifier, setSelectedVerifier] = useState<string>("anthropic");
  const [attachedFiles, setAttachedFiles] = useState<Array<{
    id: string;
    filename: string;
    size: number;
    type: string;
    objectPath: string;
    uploadedAt: string;
  }>>([]);
  
  // WORK mode state
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [stepPlanning, setStepPlanning] = useState<boolean>(false);
  const [collaborativeDoc, setCollaborativeDoc] = useState<string>("");

  // Set debug authentication
  const debugToken = authToken || "debug-token";
  const debugUser = user || { id: "debug-user", username: "debug" };

  // Helper function for authenticated requests
  const makeAuthenticatedRequest = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${debugToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  // Fetch available AI providers - MINIMAL API CALLS
  const { data: providers = [] } = useQuery<AIProvider[]>({
    queryKey: ['/api/providers'],
    queryFn: () => makeAuthenticatedRequest('/api/providers').then(res => res.json()),
    refetchInterval: 300000, // Refresh status every 5 minutes to minimize API costs
    staleTime: 240000, // Cache for 4 minutes
    enabled: true, // Always enabled for debugging
  });

  // Poll for response updates when we have an active conversation - MINIMAL COST
  const { data: updatedResponses } = useQuery<AIResponse[]>({
    queryKey: ['/api/conversations', conversationId, 'responses'],
    enabled: !!conversationId,
    refetchInterval: responses.some(r => r.status === 'pending' || verifyingStates[r.id]) ? 3000 : false,
  });

  // Update responses when polling returns new data
  useEffect(() => {
    if (updatedResponses) {
      setResponses(updatedResponses);
    }
  }, [updatedResponses]);

  // Fetch AI provider statistics
  const { data: providerStats = {} } = useQuery<Record<string, any>>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh stats every 30 seconds
  });

  // Fetch workflow state for WORK mode
  const { data: currentWorkflow } = useQuery<{ conversationId: string; workflowState: WorkflowState }>({
    queryKey: ['/api/conversations', conversationId, 'workflow'],
    enabled: mode === 'work' && !!conversationId,
    refetchInterval: 3000, // Check workflow progress every 3 seconds
  });

  useEffect(() => {
    if (currentWorkflow?.workflowState) {
      setWorkflowState(currentWorkflow.workflowState);
      setCollaborativeDoc(currentWorkflow.workflowState.collaborativeDocument);
    }
  }, [currentWorkflow]);

  // Multi-AI query mutation
  const queryMutation = useMutation({
    mutationFn: async (queryRequest: QueryRequest) => {
      const response = await makeAuthenticatedRequest('/api/query', {
        method: 'POST',
        body: JSON.stringify(queryRequest)
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResponses(data.responses || []);
      setConversationId(data.conversationId);
    }
  });

  // Award response mutation
  const awardMutation = useMutation({
    mutationFn: async ({ responseId, award }: { responseId: string, award: string }) => {
      const response = await fetch(`/api/responses/${responseId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ award })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/responses'] });
    }
  });

  const handleSubmitQuery = () => {
    if (!query.trim() || selectedAIs.length === 0) return;
    
    console.log(`Submitting ${mode.toUpperCase()} query to ${selectedAIs.length} AIs with ${attachedFiles.length} files at ${new Date().toLocaleTimeString()}`);
    
    queryMutation.mutate({
      query: query.trim(),
      selectedAIs,
      mode,
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined
    });
  };

  const handleFilesAttached = (result: any) => {
    console.log('Files uploaded:', result);
    
    // Process uploaded files
    const uploadedFiles = result.successful.map((file: any) => ({
      id: Math.random().toString(36),
      filename: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      objectPath: file.uploadURL, // This will be the path to the uploaded file
      uploadedAt: new Date().toISOString()
    }));

    setAttachedFiles(prev => [...prev, ...uploadedFiles]);
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleRateResponse = (responseId: string, rating: string) => {
    console.log(`Rating ${rating} for response ${responseId} at ${new Date().toLocaleTimeString()}`);
    
    // Optimistically update UI
    setResponses(prev => 
      prev.map(r => r.id === responseId ? { ...r, rating: rating as any, awardSaved: false } : r)
    );
    
    // Save to backend
    awardMutation.mutate({ responseId, rating }, {
      onSuccess: () => {
        setResponses(prev => 
          prev.map(r => r.id === responseId ? { ...r, awardSaved: true } : r)
        );
      }
    });
  };

  // TURN verification mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ responseId, verifierAI }: { responseId: string, verifierAI: string }) => {
      const response = await fetch(`/api/responses/${responseId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifierAI })
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      console.log('✅ TURN Verification completed:', data);
      
      // Force immediate UI update by updating local state
      if (data.responseMetadata) {
        setResponses(prev => prev.map(r => 
          r.id === variables.responseId 
            ? { ...r, metadata: data.responseMetadata }
            : r
        ));
      }
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'responses'] });
        queryClient.refetchQueries({ queryKey: ['/api/conversations', conversationId, 'responses'] });
      }
    }
  });

  // Share critique mutation  
  const shareCritiqueMutation = useMutation({
    mutationFn: async ({ responseId }: { responseId: string }) => {
      const response = await fetch(`/api/responses/${responseId}/share-critique`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to share critique');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      console.log('✅ Critique shared successfully:', data);
      
      // Update local state to show the AI's response to the critique
      if (data.aiResponse) {
        setResponses(prev => prev.map(r => 
          r.id === variables.responseId 
            ? { 
                ...r, 
                metadata: {
                  ...r.metadata,
                  critiqueResponse: data.aiResponse
                }
              }
            : r
        ));
      }
      
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'responses'] });
        queryClient.refetchQueries({ queryKey: ['/api/conversations', conversationId, 'responses'] });
      }
    },
    onError: (error) => {
      console.error('Failed to share critique:', error);
    }
  });

  const handleTurnVerification = async (response: AIResponse) => {
    if (verifyingStates[response.id] || response.metadata?.verificationStatus === 'pending') return;
    
    setVerifyingStates(prev => ({
      ...prev,
      [response.id]: true
    }));

    try {
      await verifyMutation.mutateAsync({ responseId: response.id, verifierAI: selectedVerifier });
    } catch (error) {
      console.error('Failed to verify response:', error);
    } finally {
      setVerifyingStates(prev => {
        const newState = { ...prev };
        delete newState[response.id];
        return newState;
      });
    }
  };

  const handleShareCritique = async (response: AIResponse) => {
    if (sharingStates[response.id]) return;
    
    setSharingStates(prev => ({ ...prev, [response.id]: true }));
    
    try {
      await shareCritiqueMutation.mutateAsync({ responseId: response.id });
    } catch (error) {
      console.error('Failed to share critique:', error);
    } finally {
      setSharingStates(prev => {
        const newState = { ...prev };
        delete newState[response.id];
        return newState;
      });
    }
  };

  const toggleAISelection = (aiId: string) => {
    setSelectedAIs(prev => 
      prev.includes(aiId) 
        ? prev.filter(id => id !== aiId)
        : [...prev, aiId]
    );
  };

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#16a34a'; // Green
      case 'setup_required': return '#eab308'; // Yellow
      case 'error': return '#dc2626'; // Red
      case 'loading': return '#9ca3af'; // Light gray for loading
      default: return '#6b7280'; // Gray
    }
  };

  const getAwardColor = (award?: string) => {
    switch (award) {
      case 'gold': return '#fbbf24';
      case 'silver': return '#e5e7eb';
      case 'bronze': return '#d97706';
      case 'finished': return '#16a34a';
      case 'quit': return '#6b7280';
      case 'titanic': return '#dc2626';
      default: return 'transparent';
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8fafc'
    }}>
      {/* User Authentication Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '12px 20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#16a34a',
            borderRadius: '50%'
          }}></div>
          <span style={{ color: '#374151', fontSize: '14px' }}>
            Logged in as <strong>{user.username}</strong>
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          data-testid="button-logout"
        >
          Logout
        </button>
      </div>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#0c4a6e',
        color: 'white',
        borderRadius: '12px'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '2.5rem', 
          fontWeight: 'bold',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '2px'
        }}>
          SWIM MEET
        </h1>
        <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
          AI Orchestration Platform • Multi-Agent Problem Solving
        </p>
        <button
          onClick={() => setShowStats(!showStats)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: showStats ? '#fbbf24' : 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {showStats ? 'Hide Stats Dashboard' : 'Show Stats Dashboard'}
        </button>
      </div>

      {/* Comprehensive Stats Dashboard */}
      {showStats && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          border: '2px solid #0ea5e9'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#0c4a6e', textAlign: 'center' }}>
            COMPREHENSIVE AI PROVIDER STATISTICS
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.entries(providerStats).map(([providerId, stats]) => {
              const provider = providers.find(p => p.id === providerId);
              if (!provider) return null;
              
              return (
                <div key={providerId} style={{
                  padding: '15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#374151', textAlign: 'center' }}>
                    {provider.name}
                  </h3>
                  
                  {/* Award Counts */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>AWARDS</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 6px', backgroundColor: '#fbbf24', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        GOLD {stats.awards.gold}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#e5e7eb', color: 'black', borderRadius: '4px', fontSize: '11px' }}>
                        SILVER {stats.awards.silver}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#d97706', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        BRONZE {stats.awards.bronze}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#16a34a', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        COMPLETE {stats.awards.finished}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#6b7280', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        QUIT {stats.awards.quit}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#dc2626', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        FAIL {stats.awards.titanic}
                      </span>
                    </div>
                  </div>
                  
                  {/* Performance Stats */}
                  <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Total Responses:</span>
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>{stats.totalResponses}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Success Rate:</span>
                      <span style={{ fontWeight: 'bold', color: stats.successRate >= 90 ? '#16a34a' : stats.successRate >= 70 ? '#eab308' : '#dc2626' }}>
                        {stats.successRate}%
                      </span>
                    </div>
                    {stats.avgResponseTimeMs && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Avg Response Time:</span>
                        <span style={{ fontWeight: 'bold', color: '#374151' }}>
                          {(stats.avgResponseTimeMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}
                    {stats.avgAccuracyScore && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Avg Accuracy:</span>
                        <span style={{ fontWeight: 'bold', color: stats.avgAccuracyScore >= 8 ? '#16a34a' : stats.avgAccuracyScore >= 6 ? '#eab308' : '#dc2626' }}>
                          {stats.avgAccuracyScore}/10
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Verified:</span>
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>
                        {stats.verificationRate}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {Object.keys(providerStats).length === 0 && (
            <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
              No statistics available yet. Submit some queries to generate data!
            </div>
          )}
        </div>
      )}

      {/* Mode Selection */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Workflow Mode</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { id: 'dive', name: 'DIVE (Competition)', desc: 'Multiple AIs respond simultaneously' },
            { id: 'turn', name: 'TURN (Verification)', desc: 'AI fact-checking and critique' },
            { id: 'work', name: 'WORK (Collaboration)', desc: 'Multi-step collaborative solving' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              style={{
                padding: '12px 16px',
                border: `2px solid ${mode === m.id ? '#0c4a6e' : '#e5e7eb'}`,
                backgroundColor: mode === m.id ? '#0c4a6e' : 'white',
                color: mode === m.id ? 'white' : '#374151',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                flex: '1',
                minWidth: '200px'
              }}
            >
              <div>{m.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {m.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Provider Selection */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Select AI Providers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
          {providers.map(provider => (
            <div
              key={provider.id}
              onClick={() => provider.status !== 'error' && toggleAISelection(provider.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: `2px solid ${selectedAIs.includes(provider.id) ? '#0c4a6e' : '#e5e7eb'}`,
                backgroundColor: selectedAIs.includes(provider.id) ? '#eff6ff' : 'white',
                borderRadius: '6px',
                cursor: provider.status === 'error' ? 'not-allowed' : 'pointer',
                opacity: provider.status === 'error' ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getProviderStatusColor(provider.status),
                  marginRight: '10px'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#374151' }}>{provider.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{provider.company}</div>
                {providerStats[provider.id] && (
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                    🏆 {providerStats[provider.id].awards.gold}G {providerStats[provider.id].awards.silver}S {providerStats[provider.id].awards.bronze}B
                    {providerStats[provider.id].avgResponseTimeMs && ` • ⏱️ ${(providerStats[provider.id].avgResponseTimeMs / 1000).toFixed(1)}s`}
                    {providerStats[provider.id].avgAccuracyScore && ` • 🎯 ${providerStats[provider.id].avgAccuracyScore}/10`}
                  </div>
                )}
              </div>
              {selectedAIs.includes(provider.id) && (
                <div style={{ color: '#0c4a6e', fontWeight: 'bold' }}>✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>
          {mode === 'work' ? 'Project Description' : 'Query'}
        </h3>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            mode === 'work' 
              ? "Describe your multi-AI project (e.g., 'Analyze these research documents and help prepare a comprehensive report')..."
              : "Enter your query for the AI agents..."
          }
          style={{
            width: '100%',
            height: '100px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
        
        {/* File Attachments - Coming Soon */}
        <div style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
              Documents & Files:
            </span>
            <button
              style={{
                padding: '6px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#6b7280',
                cursor: 'not-allowed',
                fontSize: '12px'
              }}
              disabled
              data-testid="button-attach-files"
            >
              📎 Attach Files (Coming Soon)
            </button>
          </div>
          
          {/* Display attached files */}
          {attachedFiles.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                {attachedFiles.length} file{attachedFiles.length === 1 ? '' : 's'} attached
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSubmitQuery}
          disabled={!query.trim() || selectedAIs.length === 0 || queryMutation.isPending}
          style={{
            marginTop: '10px',
            padding: '12px 24px',
            backgroundColor: queryMutation.isPending ? '#6b7280' : '#0c4a6e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: queryMutation.isPending ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
          data-testid="button-submit-query"
        >
          {queryMutation.isPending ? 'Processing...' : `Submit to ${selectedAIs.length} AIs`}
        </button>
      </div>

      {/* WORK Mode Workflow Display */}
      {mode === 'work' && conversationId && (
        <WorkflowDisplay conversationId={conversationId} />
      )}

      {/* AI Responses */}
      {responses.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>AI Responses</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {responses.map(response => (
              <div
                key={response.id}
                style={{
                  padding: '15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#374151' }}>
                    {response.aiProvider}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {response.timestamp}
                  </div>
                </div>
                
                <div style={{
                  color: '#374151',
                  lineHeight: '1.5',
                  marginBottom: '15px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {response.content}
                </div>

                {/* Award and Analysis Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                  {['gold', 'silver', 'bronze', 'finished', 'quit', 'titanic'].map(award => (
                    <button
                      key={award}
                      onClick={() => handleAwardResponse(response.id, award)}
                      style={{
                        padding: '6px 12px',
                        border: `2px solid ${response.award === award ? getAwardColor(award) : '#e5e7eb'}`,
                        backgroundColor: response.award === award ? getAwardColor(award) : 'white',
                        color: response.award === award && ['gold', 'bronze', 'titanic'].includes(award) ? 'white' : '#374151',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                    >
                      {award}
                    </button>
                  ))}
                  {response.award && (
                    <div style={{
                      marginLeft: '10px',
                      fontSize: '12px',
                      color: response.awardSaved ? '#16a34a' : '#eab308',
                      fontWeight: 'bold'
                    }}>
                      {response.awardSaved ? '✓ Saved' : '⏳ Saving...'}
                    </div>
                  )}
                </div>

                {/* DIVE-TURN Bridge: TURN Analysis Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => handleTurnVerification(response)}
                    disabled={verifyingStates[response.id]}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: response.metadata?.verificationStatus === 'complete' ? '#16a34a' : 
                                     verifyingStates[response.id] ? '#fbbf24' : '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: verifyingStates[response.id] ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {verifyingStates[response.id] ? '⏳ Analyzing...' : 
                     response.metadata?.verificationStatus === 'complete' ? '✓ TURN Verified' : '🔍 TURN Analysis'}
                  </button>

                  {response.metadata?.verificationStatus === 'complete' && (
                    <button
                      onClick={() => handleShareCritique(response)}
                      disabled={sharingStates[response.id]}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: sharingStates[response.id] ? '#94a3b8' : 
                                       response.metadata?.critiqueResponse ? '#16a34a' : '#7c3aed',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: sharingStates[response.id] ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        opacity: sharingStates[response.id] ? 0.7 : 1
                      }}
                    >
                      {sharingStates[response.id] ? '📨 Sharing...' :
                       response.metadata?.critiqueResponse ? '✓ Shared with AI' : '📤 Share Critique'}
                    </button>
                  )}

                  {/* Verifier AI Selector */}
                  <select
                    value={selectedVerifier}
                    onChange={(e) => setSelectedVerifier(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="anthropic">Claude Verifier</option>
                    <option value="openai">GPT Verifier</option>
                    <option value="google">Gemini Verifier</option>
                    <option value="perplexity">Perplexity Verifier</option>
                  </select>
                </div>


                
                {/* Enhanced TURN Analysis Results */}
                {response.metadata?.verificationResults && response.metadata.verificationResults.length > 0 && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '2px solid #0ea5e9'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0c4a6e', marginBottom: '10px' }}>
                      🔍 TURN Analysis by {response.metadata.verificationResults[0].verifiedBy}
                    </div>
                    <div style={{ fontSize: '12px', color: '#374151' }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#0ea5e9',
                        backgroundColor: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '8px'
                      }}>
                        🎯 Accuracy Score: {response.metadata.verificationResults[0].accuracyScore}/10
                      </div>
                      {response.metadata.verificationResults[0].factualErrors && response.metadata.verificationResults[0].factualErrors.length > 0 && (
                        <div style={{ color: '#dc2626', marginTop: '5px', backgroundColor: '#fef2f2', padding: '6px', borderRadius: '4px' }}>
                          ❌ Errors Found: {response.metadata.verificationResults[0].factualErrors.join(', ')}
                        </div>
                      )}
                      <div style={{ color: '#16a34a', marginTop: '5px', backgroundColor: '#f0fdf4', padding: '6px', borderRadius: '4px' }}>
                        ✅ Strengths: {response.metadata.verificationResults[0].strengths?.join(', ') || 'Analysis provided'}
                      </div>
                      {response.metadata.verificationResults[0].weaknesses && response.metadata.verificationResults[0].weaknesses.length > 0 && (
                        <div style={{ color: '#ea580c', marginTop: '5px', backgroundColor: '#fff7ed', padding: '6px', borderRadius: '4px' }}>
                          ⚠️ Areas to improve: {response.metadata.verificationResults[0].weaknesses.join(', ')}
                        </div>
                      )}
                      <div style={{ 
                        marginTop: '8px', 
                        fontStyle: 'italic', 
                        backgroundColor: '#f8fafc', 
                        padding: '8px', 
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0'
                      }}>
                        📋 Overall Assessment: {response.metadata.verificationResults[0].overallAssessment}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fallback display for debugging */}
                {response.metadata?.verificationStatus === 'complete' && (!response.metadata?.verificationResults || response.metadata.verificationResults.length === 0) && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '6px',
                    border: '1px solid #f59e0b',
                    fontSize: '11px'
                  }}>
                    ⚠️ Verification completed but results not displaying properly. Check console logs.
                  </div>
                )}

                {/* Display AI's Response to Critique */}
                {response.metadata?.critiqueResponse && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f3e8ff',
                    borderRadius: '6px',
                    border: '1px solid #7c3aed'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#7c3aed', marginBottom: '8px' }}>
                      🔄 {response.aiProvider.toUpperCase()}'s Response to TURN Critique:
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#374151', 
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.4',
                      backgroundColor: '#ffffff',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {response.metadata.critiqueResponse.aiResponse || response.metadata.critiqueResponse}
                    </div>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#9ca3af', 
                      marginTop: '5px',
                      fontStyle: 'italic'
                    }}>
                      Shared at {new Date(response.metadata.critiqueResponse.sharedAt || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Rating Summary */}
          {responses.some(r => r.rating) && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#0c4a6e' }}>User Ratings</h4>
              {responses.filter(r => r.rating).map(response => (
                <div key={response.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '5px 0'
                }}>
                  <span style={{ fontWeight: 'bold' }}>{response.aiProvider}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: response.rating === 'positive' ? '#16a34a' : '#dc2626',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {response.rating === 'positive' ? '👍 Positive' : '👎 Negative'}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: response.awardSaved ? '#16a34a' : '#eab308'
                    }}>
                      {response.awardSaved ? '✓' : '⏳'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}