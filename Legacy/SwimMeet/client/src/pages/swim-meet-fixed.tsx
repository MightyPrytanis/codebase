import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthForm } from "@/components/AuthForm";
import { StandardFileUpload } from "@/components/StandardFileUpload";
import { CloudStorageSettings } from "@/components/CloudStorageSettings";
import { AdminPanel } from "@/components/AdminPanel";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { Download, FileText, Upload, Play, GitBranch, Users, BarChart3, Settings, Menu, X, Activity, Shield, ThumbsUp, ThumbsDown, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import "../styles/glass-ocean.css";
import { PerformanceOverlay } from "../components/PerformanceOverlay";
import logoImage from '@assets/SwimMeet Logo 3_1755934092349.png';

// Types
interface AIProvider {
  id: string;
  name: string;
  company: string;
  status: 'connected' | 'setup_required' | 'error' | 'disabled';
  requiresApiKey: boolean;
}

interface AIResponse {
  id: string;
  aiProvider: string;
  content: string;
  status: 'pending' | 'complete' | 'error';
  responseTime?: number;
  rating?: 'positive' | 'negative';
  ratingSaved?: boolean;
  metadata?: any;
}

interface QueryRequest {
  query: string;
  selectedAIs: string[];
  mode: 'dive' | 'turn' | 'work';
  attachedFiles?: any[];
}

interface WorkflowStep {
  stepNumber: number;
  assignedAI: string;
  objective: string;
  completed: boolean;
  status: 'pending' | 'complete' | 'error';
}

interface WorkflowStatus {
  status: 'no_workflow' | 'active';
  totalSteps: number;
  currentStep: number;
  completedSteps: number;
  steps: WorkflowStep[];
  collaborativeDoc: string;
}

export default function SwimMeetFixed() {
  // ALL STATE HOOKS FIRST - NO CONDITIONAL LOGIC BEFORE HOOKS
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);
  const [mode, setMode] = useState<'dive' | 'turn' | 'work'>('dive');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedVerifier, setSelectedVerifier] = useState<string>("anthropic");
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [workflowMode, setWorkflowMode] = useState<'preset' | 'custom'>('preset');

  // Remove duplicate - handled below

  // Custom icons for different modes
  const ShallowDiveIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {/* Gently arcing line with arrow - arrow point level with arc start */}
      <path d="M4 16 Q12 8 20 16" strokeLinecap="round" fill="none" />
      <path d="M18 14 L20 16 L18 18" strokeLinecap="round" fill="none" />
    </svg>
  );

  const FlipTurnIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {/* U-shape line with arrow - rotated 90 degrees counterclockwise */}
      <path d="M16 6 Q8 6 8 12 Q8 18 16 18" strokeLinecap="round" fill="none" />
      <path d="M18 16 L16 18 L14 16" strokeLinecap="round" fill="none" />
    </svg>
  );

  const WorkTeamIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {/* Four arrows pointing inward to center - rotated 45 degrees from cardinal */}
      <path d="M18.5 5.5 L13.5 10.5" strokeLinecap="round" />
      <path d="M15.5 8.5 L13.5 10.5 L15.5 12.5" strokeLinecap="round" fill="none" />
      <path d="M5.5 18.5 L10.5 13.5" strokeLinecap="round" />
      <path d="M8.5 15.5 L10.5 13.5 L12.5 15.5" strokeLinecap="round" fill="none" />
      <path d="M18.5 18.5 L13.5 13.5" strokeLinecap="round" />
      <path d="M15.5 15.5 L13.5 13.5 L15.5 11.5" strokeLinecap="round" fill="none" />
      <path d="M5.5 5.5 L10.5 10.5" strokeLinecap="round" />
      <path d="M8.5 8.5 L10.5 10.5 L12.5 8.5" strokeLinecap="round" fill="none" />
    </svg>
  );

  // Helper function for mode icons
  const getModeIcon = () => {
    switch (mode) {
      case 'dive': return <ShallowDiveIcon size={20} />;
      case 'turn': return <FlipTurnIcon size={20} />;
      case 'work': return <WorkTeamIcon size={20} />;
      default: return <ShallowDiveIcon size={20} />;
    }
  };

  // File upload handler
  const handleFilesSelected = async (files: FileList) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setAttachedFiles(prev => [...prev, ...result.files]);
      } else {
        alert('File upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed');
    }
  };

  // Helper function for authenticated requests
  const makeAuthenticatedRequest = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // ALL QUERIES AND MUTATIONS BEFORE CONDITIONAL LOGIC
  const { data: providers = [] } = useQuery<AIProvider[]>({
    queryKey: ['/api/providers'],
    queryFn: () => makeAuthenticatedRequest('/api/providers').then(res => res.json()),
    enabled: !!authToken,
    refetchInterval: 300000,
    staleTime: 240000,
  });

  const { data: providerStats = {} } = useQuery<Record<string, any>>({
    queryKey: ['/api/stats'],
    enabled: !!authToken,
    refetchInterval: 30000,
  });

  // WORK mode workflow status query
  const { data: workflowStatus } = useQuery<WorkflowStatus>({
    queryKey: [`/api/conversations/${conversationId}/workflow`],
    queryFn: () => makeAuthenticatedRequest(`/api/conversations/${conversationId}/workflow`).then(res => res.json()),
    enabled: !!authToken && !!conversationId && mode === 'work',
    refetchInterval: 2000, // Poll every 2 seconds for WORK mode
  });

  const queryMutation = useMutation({
    mutationFn: async (queryRequest: QueryRequest) => {
      setIsQuerying(true);
      const response = await makeAuthenticatedRequest('/api/query', {
        method: 'POST',
        body: JSON.stringify({
          ...queryRequest,
          attachedFiles
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResponses(data.responses || []);
      setConversationId(data.conversationId);
      setIsQuerying(false);
    },
    onError: () => {
      setIsQuerying(false);
    }
  });

  // Query to fetch updated responses for a conversation
  const { data: conversationResponses } = useQuery<AIResponse[]>({
    queryKey: [`/api/conversations/${conversationId}/responses`],
    queryFn: () => makeAuthenticatedRequest(`/api/conversations/${conversationId}/responses`).then(res => res.json()),
    enabled: !!authToken && !!conversationId,
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 0, // Always consider stale to fetch fresh data
  });

  // ALL EFFECTS BEFORE CONDITIONAL LOGIC
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setAuthToken(token);
          setUser({ id: data.id, username: data.username });
        } else {
          localStorage.removeItem('authToken');
        }
        setAuthLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Update responses when conversation data changes
  useEffect(() => {
    if (conversationResponses) {
      setResponses(conversationResponses);
    }
  }, [conversationResponses]);

  // EVENT HANDLERS
  const handleAuth = (token: string, userData: { id: string; username: string }) => {
    setAuthToken(token);
    setUser(userData);
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    queryClient.clear();
  };

  const toggleAISelection = (aiId: string) => {
    setSelectedAIs(prev => 
      prev.includes(aiId) 
        ? prev.filter(id => id !== aiId)
        : [...prev, aiId]
    );
  };

  const handleSubmitQuery = () => {
    if (!query.trim() || selectedAIs.length === 0) return;
    
    queryMutation.mutate({
      query: query.trim(),
      selectedAIs,
      mode,
      attachedFiles
    });
  };

  const handleFileUpload = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/objects/upload', {
        method: 'POST'
      });
      const { uploadURL } = await response.json();
      return { method: 'PUT' as const, url: uploadURL };
    } catch (error) {
      console.error('Failed to get upload URL:', error);
      throw error;
    }
  };

  const handleFileComplete = async (result: any) => {
    try {
      for (const file of result.successful) {
        const response = await makeAuthenticatedRequest('/api/objects/attach', {
          method: 'PUT',
          body: JSON.stringify({
            fileURL: file.uploadURL,
            fileName: file.name
          })
        });
        const data = await response.json();
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          path: data.objectPath,
          size: file.size
        }]);
      }
    } catch (error) {
      console.error('Error attaching files:', error);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const downloadFile = (content: string, filename: string) => {
    // Create blob with the content
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL
    URL.revokeObjectURL(url);
  };

  const getModeColor = () => {
    switch (mode) {
      case 'dive': return '#0ea5e9'; // Sky blue
      case 'turn': return '#8b5cf6'; // Purple  
      case 'work': return '#f59e0b'; // Amber
    }
  };

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#16a34a';
      case 'setup_required': return '#eab308';
      case 'disabled': return '#6b7280';
      default: return '#dc2626';
    }
  };

  const handleClearContent = () => {
    setQuery('');
    setResponses([]);
    setAttachedFiles([]);
    setConversationId(null);
    console.log('✓ Content cleared - ready for new query');
  };

  const handleRateResponse = (responseId: string, rating: string) => {
    console.log(`Rating ${rating} for response ${responseId}`);
    
    // Optimistically update UI
    setResponses(prev => 
      prev.map(r => r.id === responseId ? { ...r, rating: rating as any, ratingSaved: false } : r)
    );
    
    // Save to backend (using existing mutation)
    fetch(`/api/responses/${responseId}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating })
    }).then(() => {
      setResponses(prev => 
        prev.map(r => r.id === responseId ? { ...r, ratingSaved: true } : r)
      );
    }).catch(console.error);
  };

  // TURN validation handler - enhanced for all modes
  const handleTurnValidation = async (responseId: string) => {
    try {
      // Find the response to validate
      const targetResponse = responses.find(r => r.id === responseId);
      if (!targetResponse) {
        alert('Response not found for validation');
        return;
      }

      console.log(`Starting TURN validation for response ${responseId} from ${targetResponse.aiProvider} in ${mode} mode`);

      const response = await fetch(`/api/turn-validate/${responseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verifierAI: selectedVerifier || 'anthropic',
          conversationId: conversationId,
          sourceMode: mode,
          attachedFiles: attachedFiles // Include file context for validation
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('TURN validation response:', result);
        
        // Show success message with better context
        alert(`TURN validation started for ${targetResponse.aiProvider} response! The verifier AI (${selectedVerifier || 'anthropic'}) will fact-check this content. Results will appear in your responses.`);
        
        // Refresh responses to see validation after a moment
        setTimeout(() => {
          if (conversationId) {
            queryClient.invalidateQueries({
              queryKey: [`/api/conversations/${conversationId}/responses`]
            });
          }
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('TURN validation failed:', errorData);
        alert(`TURN validation failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('TURN validation error:', error);
      alert('TURN validation failed due to network error');
    }
  };

  // Handle custom workflow execution
  const handleCustomWorkflowExecution = async (workflow: any) => {
    try {
      setIsQuerying(true);
      setResponses([]);
      setConversationId(null);
      
      if (!workflow || !workflow.nodes || workflow.nodes.length === 0) {
        throw new Error('Please create a workflow with at least one node');
      }
      
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          workflow,
          initialInput: query
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Custom Workflow executed:', data);
      
      // Convert workflow steps to response format
      const workflowResponses = data.steps?.map((step: any, index: number) => ({
        id: `workflow-step-${index}`,
        aiProvider: step.nodeTitle || 'Custom Node',
        content: step.result || step.error || 'No output',
        status: step.status === 'completed' ? 'complete' : step.status,
        responseTime: step.executionTime,
        metadata: { nodeId: step.nodeId, workflowStep: true }
      })) || [];
      
      setConversationId(data.conversationId);
      setResponses(workflowResponses);
      
    } catch (error: any) {
      console.error('❌ Workflow execution error:', error);
      setResponses([{
        id: 'workflow-error',
        aiProvider: 'system',
        content: `Error: ${error.message}`,
        status: 'error' as const
      }]);
    } finally {
      setIsQuerying(false);
    }
  };

  const getProviderFeedbackInfo = (provider: string) => {
    switch (provider) {
      case 'google':
        return {
          name: 'Gemini Pro',
          process: 'Report through Gemini Apps (apps.google.com)',
          url: 'https://support.google.com/gemini/answer/13278668',
          steps: '1. Visit Gemini Apps\n2. Find the problematic response\n3. Use "Report" option\n4. Select "Incorrect information"'
        };
      case 'openai':
        return {
          name: 'ChatGPT-4',
          process: 'Report through OpenAI feedback system',
          url: 'https://help.openai.com/en/articles/6826213',
          steps: '1. Visit platform.openai.com\n2. Use feedback mechanism\n3. Report factual inaccuracies'
        };
      case 'anthropic':
        return {
          name: 'Claude 4',
          process: 'Report through Anthropic support',
          url: 'https://support.anthropic.com',
          steps: '1. Contact Anthropic support\n2. Describe the fabrication\n3. Provide conversation context'
        };
      case 'perplexity':
        return {
          name: 'Perplexity AI',
          process: 'Report through Perplexity support',
          url: 'https://www.perplexity.ai/support',
          steps: '1. Contact Perplexity support\n2. Report incorrect information\n3. Include response details'
        };
      default:
        return {
          name: provider.toUpperCase(),
          process: 'Contact provider support directly',
          url: 'Provider support website',
          steps: '1. Visit provider website\n2. Find support/feedback option\n3. Report fabrication'
        };
    }
  };

  const handleReportFabrication = (responseId: string, aiProvider: string) => {
    const providerInfo = getProviderFeedbackInfo(aiProvider);
    
    const confirmed = confirm(
      `Report ${providerInfo.name} for fabricating facts or lying?\n\nThis will:\n• Log the fabrication to our database\n• Track patterns for analysis\n• Provide guidance for official reporting\n\nTo report directly to ${providerInfo.name}:\n${providerInfo.steps}\n\nContinue with internal report?`
    );
    
    if (confirmed) {
      console.log(`🚨 FABRICATION REPORTED: ${aiProvider} response ${responseId}`);
      
      // Submit fabrication report to real backend endpoint
      makeAuthenticatedRequest(`/api/responses/${responseId}/fabrication-report`, {
        method: 'POST',
        body: JSON.stringify({ 
          aiProvider,
          reportType: 'fabrication',
          timestamp: new Date().toISOString(),
          providerFeedbackUrl: providerInfo.url
        })
      }).then(res => res.json()).then(data => {
        alert(`✓ Fabrication report logged for ${providerInfo.name}!\n\nInternal Report ID: ${data.reportId}\n\nNEXT STEP - Official Provider Reporting:\n${providerInfo.steps}\n\nFeedback URL: ${providerInfo.url}\n\nYour report helps improve AI accuracy across the ecosystem!`);
      }).catch(error => {
        console.error('Error submitting fabrication report:', error);
        alert(`❌ Failed to log fabrication report.\nYou can still report directly to ${providerInfo.name}:\n${providerInfo.url}`);
      });
    }
  };

  // NOW CONDITIONAL RENDERING IS SAFE
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#6b7280' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!authToken || !user) {
    return (
      <div className="swim-grid swim-grid--main" style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="swim-panel swim-panel--elevated" style={{ padding: 'calc(var(--grid-unit) * 4)', maxWidth: '400px', margin: '0 auto' }}>
          <AuthForm onAuth={handleAuth} />
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Underwater caustics effect */}
      <div className="caustics-layer"></div>
      {/* Glass header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-container">
              <img 
                src={logoImage} 
                alt="SwimMeet Logo" 
                style={{ height: '192px', width: 'auto', maxWidth: '900px', transform: 'scaleX(1.20)' }}
                onError={(e) => {
                  console.error('Logo failed to load, trying fallback');
                  e.currentTarget.src = '/logo.png';
                }}
              />
            </div>
            {user && <span className="user-info">Welcome, {user.username}</span>}
          </div>
          
          <div className="toolbar">
            <button
              className="toolbar-btn"
              onClick={() => setShowStats(!showStats)}
              data-testid="button-toggle-stats"
              title={showStats ? 'Hide Statistics' : 'Show Statistics'}
            >
              <BarChart3 size={16} />
            </button>
            
            <button
              className="toolbar-btn"
              onClick={() => setShowWorkflowBuilder(!showWorkflowBuilder)}
              data-testid="button-toggle-workflow"
              title={showWorkflowBuilder ? 'Hide Workflow Builder' : 'Show Workflow Builder'}
            >
              <GitBranch size={16} />
            </button>

            {(user?.username === 'davidtowne' || user?.username === 'demo') && (
              <button
                className="toolbar-btn"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                data-testid="button-toggle-admin"
                title={showAdminPanel ? 'Hide Admin Panel' : 'Show Admin Panel'}
              >
                <Shield size={16} />
              </button>
            )}
            
            <button
              className="toolbar-btn"
              onClick={() => setShowSettings(!showSettings)}
              data-testid="button-toggle-settings"
              title={showSettings ? 'Hide Cloud Storage' : 'Show Cloud Storage'}
            >
              <Settings size={16} />
            </button>
            
            <button
              className="toolbar-btn"
              onClick={handleLogout}
              data-testid="button-logout"
              title="Logout"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Modernist Statistics Panel */}
      {showStats && (
        <section className="glass-panel-large swim-section">
          <h3 className="panel-heading">AI Provider Statistics</h3>
          <div className="swim-grid swim-grid--three-col">
            {Object.entries(providerStats).map(([providerId, stats]: [string, any]) => (
              <div key={providerId} className="swim-panel" data-testid={`stats-${providerId}`}>
                <div className="swim-provider-name" style={{ marginBottom: 'var(--panel-gap)' }}>
                  {providerId.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--grid-unit) / 2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="swim-caption">Success Rate:</span>
                    <span className={`swim-status ${stats.successRate >= 90 ? 'swim-status--connected' : 'swim-status--setup-required'}`}>
                      {stats.successRate}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="swim-caption">User Rating:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--grid-unit) / 2)' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: stats.positiveRating >= 75 ? '#16a34a' : 
                               stats.positiveRating >= 50 ? '#1f2937' : '#dc2626'
                      }}>
                        {stats.positiveRating || 0}% Positive
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modernist Cloud Storage Settings Panel */}
      {showSettings && (
        <section className="glass-panel-large swim-section">
          <CloudStorageSettings authToken={authToken} />
        </section>
      )}

      {/* Modernist Mode Selection - Distinctly Styled Panels */}
      <section className="swim-section">
        <h3 className="swim-subtitle">Workflow Mode</h3>
        <div className="swim-mode-selector">
          {[
            { id: 'dive', name: 'DIVE', desc: 'Multiple AIs respond simultaneously', icon: <ShallowDiveIcon size={20} /> },
            { id: 'turn', name: 'TURN', desc: 'AI fact-checking and critique', icon: <FlipTurnIcon size={20} /> },
            { id: 'work', name: 'WORK', desc: 'Multi-step collaborative solving', icon: <WorkTeamIcon size={20} /> }
          ].map(m => {
            const isActive = mode === m.id;
            const panelClass = `swim-mode-panel ${m.id}-panel ${isActive ? 'swim-mode-panel--active' : ''}`;
            
            return (
              <div
                key={m.id}
                className={`${panelClass} onboarding-tooltip`}
                onClick={() => setMode(m.id as 'dive' | 'turn' | 'work')}
                style={{ cursor: 'pointer' }}
                data-testid={`mode-${m.id}`}
                data-tip={`Click to switch to ${m.name} mode - ${m.desc}`}
              >
                <div className="mode-icon">
                  {m.icon}
                </div>
                <div className="mode-title">
                  {m.name}
                </div>
                <div className="mode-desc">
                  {m.desc}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mode-specific content areas with explanatory text */}
      <div className={`mode-themed-container ${mode}-mode`}>
        
        {/* WORK Mode Workflow Selection */}
        {mode === 'work' && (
          <section className="swim-section">
            <h3 className="panel-heading">Workflow Type</h3>
            <div className="swim-grid swim-grid--two-col" style={{ marginBottom: '20px' }}>
              <div 
                className={`swim-panel ${workflowMode === 'preset' ? 'swim-panel--active' : ''}`}
                onClick={() => setWorkflowMode('preset')}
                style={{ cursor: 'pointer', padding: '15px' }}
                data-testid="workflow-preset"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <WorkTeamIcon size={20} />
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>AI-Structured Workflow</span>
                </div>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  <em>AI automatically creates a collaborative workflow based on your query and selected providers</em>
                </p>
              </div>
              
              <div 
                className={`swim-panel ${workflowMode === 'custom' ? 'swim-panel--active' : ''}`}
                onClick={() => setWorkflowMode('custom')}
                style={{ cursor: 'pointer', padding: '15px' }}
                data-testid="workflow-custom"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <GitBranch size={20} style={{ color: '#8b5cf6' }} />
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>Custom Workflow Builder</span>
                </div>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  Design your own visual workflow with drag-drop nodes and custom AI configurations
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Custom Workflow Builder (only show in WORK mode with custom selected) */}
        {mode === 'work' && workflowMode === 'custom' && (
          <section className="swim-section">
            <div style={{ marginBottom: '20px' }}>
              <WorkflowBuilder onExecute={(workflow) => {
                if (!query.trim()) {
                  alert('Please enter a query before executing the workflow');
                  return;
                }
                handleCustomWorkflowExecution(workflow);
              }} />
            </div>
          </section>
        )}

        {/* AI Provider Selection with mode-specific explanation */}
        {(mode !== 'work' || workflowMode === 'preset') && (
          <section className="swim-section">
            <h3 className="panel-heading">Select AI Providers</h3>
            {mode === 'dive' && (
              <div className="mode-explanation dive-explanation">
                <strong>DIVE Mode:</strong> <em>Choose as many AI competitors as you like. Each AI will respond simultaneously to your query, giving you multiple perspectives at once.</em>
              </div>
            )}
            {mode === 'turn' && (
              <div className="mode-explanation turn-explanation">
                <strong>TURN Mode:</strong> <em>Choose primary AI providers, then select a verifier AI. The verifier will fact-check and critique the primary responses for accuracy.</em>
              </div>
            )}
            {mode === 'work' && (
              <div className="mode-explanation work-explanation">
                <strong>WORK Mode:</strong> <em>Choose AI team members for the project. They will agree on roles for each agent, or you can designate them yourself. Sequential collaboration on complex problems.</em>
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f8ff', borderLeft: '4px solid #007BFF', fontSize: '14px' }}>
                  <strong>Role Assignment:</strong> After selecting AIs, you can assign specific roles like "Analyst", "Designer", "Reviewer" by clicking the role button next to each selected AI.
                </div>
              </div>
            )}
          
          <div className="provider-grid">
            {providers.map((provider, index) => {
            const isSelected = selectedAIs.includes(provider.id);
            
            return (
              <div
                key={provider.id}
                className={`consistent-provider-card ${isSelected ? 'provider-selected' : ''}`}
                onClick={() => provider.status !== 'error' && toggleAISelection(provider.id)}
                style={{
                  cursor: provider.status === 'error' ? 'not-allowed' : 'pointer',
                  opacity: provider.status === 'error' ? 0.5 : 1,
                  position: 'relative',
                  margin: '8px', // Add margin to prevent overlap
                  padding: '16px',
                  background: isSelected ? 'linear-gradient(135deg, #007BFF15 0%, #0056D615 100%)' : '#f8f9fa',
                  border: isSelected ? '2px solid #007BFF' : '1px solid #e9ecef',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(0, 123, 255, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                  transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                }}
                data-testid={`provider-${provider.id}`}
                title={`Click to ${isSelected ? 'deselect' : 'select'} ${provider.name}. Status: ${provider.status.replace('_', ' ')}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                    {provider.name}
                    {isSelected && <span style={{ marginLeft: '8px', color: '#007BFF', fontSize: '16px' }}>✓</span>}
                  </div>
                  <div 
                    className={`swim-status swim-status--${provider.status}`}
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {provider.status.replace('_', ' ')}
                  </div>
                </div>
                
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{provider.company}</span>
                  {provider.id === 'microsoft' && (
                    <span style={{ fontSize: '10px', color: '#f59e0b', fontStyle: 'italic' }}>
                      *API Preview
                    </span>
                  )}
                </div>
                
                {/* User Favorability Rating */}
                {(providerStats as any)?.[provider.id]?.positiveRating !== undefined && (
                  <div style={{ 
                    fontSize: '11px', 
                    marginBottom: '6px',
                    color: (providerStats as any)[provider.id].positiveRating >= 75 ? '#16a34a' : 
                           (providerStats as any)[provider.id].positiveRating >= 50 ? '#1f2937' : '#dc2626',
                    fontWeight: '500'
                  }}>
                    👥 {(providerStats as any)[provider.id].positiveRating}% user approval
                  </div>
                )}
                
                <div style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                  {mode === 'dive' && '⚡ Simultaneous multi-AI analysis'}
                  {mode === 'turn' && '🔄 AI-to-AI fact verification'}
                  {mode === 'work' && '🤝 Sequential team collaboration'}
                </div>
              </div>
            );
            })}
          </div>

        </section>
        )}

        {/* WORK Mode Role Assignment Section */}
        {(mode === 'work' && workflowMode === 'preset') && selectedAIs.length > 0 && (
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff8f0', borderRadius: '8px', border: '2px solid #f59e0b' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} />
                Role Assignment
              </h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {selectedAIs.map((aiId, index) => {
                  const provider = providers?.find(p => p.id === aiId);
                  const roleOptions = ['Analyst', 'Designer', 'Reviewer', 'Strategist', 'Technical Lead', 'Auto-assign'];
                  
                  return (
                    <div key={aiId} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <strong>{provider?.name}</strong>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{provider?.company}</div>
                      </div>
                      <select 
                        defaultValue="Auto-assign"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                          fontSize: '14px'
                        }}
                        data-testid={`role-select-${aiId}`}
                      >
                        {roleOptions.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
        )}

        {/* File Upload Interface with mode-specific explanation */}
        <section className="swim-section">
          <div className="swim-feature-header">
            <Upload size={20} />
            <h3 className="panel-heading">File Attachments</h3>
          </div>
          
          {mode === 'dive' && (
            <div className="mode-explanation dive-explanation">
              <strong>File Support:</strong> Attach documents, images, or data files. All selected AIs will receive and analyze these files simultaneously.
            </div>
          )}
          {mode === 'turn' && (
            <div className="mode-explanation turn-explanation">
              <strong>File Support:</strong> Attach files for analysis. The verifier AI will also review file-based responses for accuracy and completeness.
            </div>
          )}
          {mode === 'work' && (
            <div className="mode-explanation work-explanation">
              <strong>File Support:</strong> Upload project files, specifications, or reference materials. AI team members will use these throughout the collaborative workflow.
            </div>
          )}
          
        <div style={{ display: 'flex', gap: 'var(--panel-gap)', alignItems: 'center', marginBottom: 'var(--section-gap)' }}>
          <StandardFileUpload
            onFilesSelected={handleFilesSelected}
            maxFiles={5}
            maxSizeBytes={50 * 1024 * 1024}
            disabled={isQuerying}
          />
          <span className="swim-caption">Max 5 files, 50MB each</span>
        </div>

          {attachedFiles.length > 0 && (
            <div className="swim-section--compact">
              <div className="swim-caption" style={{ marginBottom: 'calc(var(--grid-unit) / 2)' }}>
                Attached Files ({attachedFiles.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {attachedFiles.map((file, index) => (
                  <div key={index} className="swim-file-card">
                    <div className="swim-file-info">
                      <FileText size={16} style={{ color: 'hsl(var(--chrome-silver))' }} />
                      <span className="swim-caption">{file.name}</span>
                      <span className="swim-caption" style={{ color: 'hsl(var(--chrome-silver))' }}>
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <div className="swim-file-actions">
                      <button
                        onClick={() => {
                          // For attached files, we need to fetch the content first
                          fetch(file.path || `/api/files/${file.id}`)
                            .then(res => res.text())
                            .then(content => downloadFile(content, file.name))
                            .catch(() => {
                              // Fallback: try direct download
                              const link = document.createElement('a');
                              link.href = file.path || `/api/files/${file.id}`;
                              link.download = file.name;
                              link.click();
                            });
                        }}
                        className="swim-button swim-button--secondary"
                        style={{
                          padding: 'calc(var(--grid-unit) / 2) var(--grid-unit)',
                          fontSize: '12px',
                          minWidth: 'auto'
                        }}
                        data-testid={`button-download-${index}`}
                        title={`Download ${file.name}`}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => removeFile(index)}
                        className="swim-button swim-button--ghost"
                        style={{
                          padding: 'calc(var(--grid-unit) / 2) var(--grid-unit)',
                          fontSize: '12px',
                          color: '#dc2626',
                          minWidth: 'auto'
                        }}
                        data-testid={`button-remove-${index}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Query Input Section */}
        <section className="swim-section">
        <h3 className="panel-heading">Query Input</h3>
        <div className="swim-query-container">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--panel-gap)' }}>
            <div style={{ flex: 1 }}>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your query here..."
                data-testid="input-query"
                className="swim-textarea"
                style={{ width: '100%' }}
              />
              
              {/* Clear Content Button */}
              {(query.trim() || responses.length > 0) && (
                <button
                  onClick={handleClearContent}
                  className="swim-button swim-button--secondary"
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    minWidth: 'auto'
                  }}
                  data-testid="button-clear-content"
                  title="Clear query and responses to start fresh"
                >
                  <Trash2 size={14} style={{ marginRight: '4px' }} />
                  Clear Content
                </button>
              )}
            </div>
            
            <button
              onClick={handleSubmitQuery}
              disabled={!query.trim() || selectedAIs.length === 0 || isQuerying}
              data-testid="button-submit-query"
              className={`swim-button swim-button--primary swim-button--large ${isQuerying ? 'swim-button--disabled' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--grid-unit) / 2)' }}>
                {getModeIcon()}
                <span>{isQuerying ? 'Processing...' : `Submit to ${selectedAIs.length} AI${selectedAIs.length !== 1 ? 's' : ''}`}</span>
              </div>
            </button>
          </div>
        </div>
        </section>
      </div>

      <div className="steel-frame-divider"></div>

      <div>
        {/* WORK Mode Progress Monitor */}
        {mode === 'work' && workflowStatus?.status === 'active' && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '3px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Users className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <h3 style={{ margin: 0, color: '#f59e0b' }}>WORK Mode Progress</h3>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  Progress: {workflowStatus.completedSteps}/{workflowStatus.totalSteps} Steps Complete
                </span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {Math.round((workflowStatus.completedSteps / workflowStatus.totalSteps) * 100)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(workflowStatus.completedSteps / workflowStatus.totalSteps) * 100}%`,
                  height: '100%',
                  backgroundColor: '#f59e0b',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {workflowStatus.steps.map((step: any, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: step.completed ? '#dcfce7' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#fef3c7' : '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid ' + (step.completed ? '#16a34a' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#eab308' : '#e5e7eb')
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: step.completed ? '#16a34a' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#eab308' : '#6b7280',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: '12px'
                  }}>
                    {step.completed ? '✓' : step.stepNumber}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                      Step {step.stepNumber}: {step.assignedAI.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {step.objective}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: step.completed ? '#dcfce7' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#fef3c7' : '#f3f4f6',
                    color: step.completed ? '#16a34a' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#eab308' : '#6b7280',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {step.completed ? 'COMPLETE' : (step.status === 'pending' && index === workflowStatus.currentStep) ? 'IN PROGRESS' : 'WAITING'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responses */}
        {responses.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>
              {mode === 'work' ? 'Collaborative Results' : 'AI Responses'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {responses.map(response => (
                <div key={response.id} className="glass-panel-large swim-response-card">
                  <div className="swim-response-header">
                    <div className="panel-heading" style={{ margin: 0 }}>
                      {response.aiProvider.toUpperCase()}
                      {mode === 'work' && responses.indexOf(response) >= 0 && (
                        <span className="swim-caption" style={{ 
                          marginLeft: 'calc(var(--grid-unit) / 2)', 
                          color: 'hsl(var(--work-primary))'
                        }}>
                          (Step {responses.indexOf(response) + 1})
                        </span>
                      )}
                    </div>
                    <div className="swim-response-actions">
                      <div className={`swim-status swim-status--${response.status === 'complete' ? 'connected' : 'setup-required'}`}>
                        {response.status.toUpperCase()}
                      </div>
                      {response.status === 'complete' && (
                        <button
                          onClick={() => downloadFile(response.content, `${response.aiProvider}-response-${new Date().toISOString().slice(0,10)}.txt`)}
                          className="swim-button swim-button--secondary"
                          style={{
                            padding: 'calc(var(--grid-unit) / 2) var(--grid-unit)',
                            fontSize: '12px',
                            minWidth: 'auto'
                          }}
                          data-testid={`button-download-response-${response.id}`}
                          title={`Download ${response.aiProvider} response as text file`}
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="swim-response-content">
                    {response.content}
                  </div>
                  {response.responseTime && (
                    <div className="swim-response-time">
                      Response time: {(response.responseTime / 1000).toFixed(1)}s
                    </div>
                  )}
                  
                  {/* Rating Buttons and TURN Validation */}
                  {response.status === 'complete' && (
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginRight: '15px' }}>Rate Response:</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Thumbs Up */}
                        <button
                          onClick={() => handleRateResponse(response.id, 'positive')}
                          className={`swim-button ${response.rating === 'positive' ? 'swim-button--primary' : 'swim-button--secondary'}`}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            minWidth: 'auto',
                            backgroundColor: response.rating === 'positive' ? '#16a34a' : undefined,
                            color: response.rating === 'positive' ? 'white' : undefined
                          }}
                          data-testid={`button-thumbs-up-${response.id}`}
                        >
                          <ThumbsUp size={14} style={{ marginRight: '4px' }} />
                          Good
                        </button>
                        
                        {/* Thumbs Down */}
                        <button
                          onClick={() => handleRateResponse(response.id, 'negative')}
                          className={`swim-button ${response.rating === 'negative' ? 'swim-button--primary' : 'swim-button--secondary'}`}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            minWidth: 'auto',
                            backgroundColor: response.rating === 'negative' ? '#dc2626' : undefined,
                            color: response.rating === 'negative' ? 'white' : undefined
                          }}
                          data-testid={`button-thumbs-down-${response.id}`}
                        >
                          <ThumbsDown size={14} style={{ marginRight: '4px' }} />
                          Poor
                        </button>
                        
                        {/* Anti-Fabrication Button */}
                        <button
                          onClick={() => handleReportFabrication(response.id, response.aiProvider)}
                          className="swim-button swim-button--secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            minWidth: 'auto',
                            backgroundColor: '#f59e0b',
                            color: 'white'
                          }}
                          data-testid={`button-report-fabrication-${response.id}`}
                          title="Report this AI for making up facts or lying"
                        >
                          <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                          Report Fabrication
                        </button>
                        
                        {/* TURN Validation Button - available on all modes */}
                        {(mode === 'dive' || mode === 'turn' || mode === 'work') && (
                          <button
                            onClick={() => handleTurnValidation(response.id)}
                            className="swim-button swim-button--secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              minWidth: 'auto',
                              backgroundColor: '#8b5cf6',
                              color: 'white'
                            }}
                            data-testid={`button-turn-validate-${response.id}`}
                            title="Fact-check this response with AI verification"
                          >
                            <CheckCircle size={14} style={{ marginRight: '4px' }} />
                            TURN Validate
                          </button>
                        )}
                        
                        {/* Rating Status */}
                        {response.rating && (
                          <span style={{
                            fontSize: '11px',
                            color: response.ratingSaved ? '#16a34a' : '#eab308',
                            marginLeft: '8px'
                          }}>
                            {response.ratingSaved ? '✓ Saved' : '⏳ Saving...'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload - Only show when settings are visible */}
        {showSettings && (
          <StandardFileUpload
            onFilesSelected={handleFilesSelected}
          />
        )}

        {/* Cloud Storage Settings Panel */}
        {showSettings && (
          <CloudStorageSettings 
            authToken={authToken}
          />
        )}

        {/* Standalone Workflow Builder Demo (from header button) */}
        {showWorkflowBuilder && (
          <div style={{ marginBottom: '20px' }}>
            <WorkflowBuilder />
          </div>
        )}

        {/* Enhanced Admin Panel - Full User Management */}
        {showAdminPanel && (user?.username === 'davidtowne' || user?.username === 'demo') && (
          <AdminPanel authToken={authToken} />
        )}

        {/* Performance Monitoring Overlay - Temporarily Disabled */}
        {false && (
          <PerformanceOverlay 
            isVisible={showPerformanceOverlay}
            onClose={() => setShowPerformanceOverlay(false)}
          />
        )}
      </div> {/* End of container div */}
    </div>
  );
}