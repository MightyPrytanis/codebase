import { useState } from "react";
import { Mail, Brain, FileText, Check, Send, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import DraftApproval from "./draft-approval";

interface WorkflowPipelineProps {
  cases: any[];
  redFlags: any[];
  dashboardStats: any;
  isLoading: boolean;
}

export default function WorkflowPipeline({ cases, redFlags, dashboardStats, isLoading }: WorkflowPipelineProps) {
  const [showDraftApproval, setShowDraftApproval] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-card-light rounded animate-pulse"></div>
        <div className="grid grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-card-light rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Assembly Line Stages
  const assemblyStages = [
    {
      id: 1,
      title: "Intake",
      description: "Gmail monitoring",
      icon: Mail,
      color: "success",
      count: 12,
      detail: "emails analyzed today",
      status: "active"
    },
    {
      id: 2,
      title: "Processing", 
      description: "Claude AI analysis",
      icon: Brain,
      color: "processing",
      count: 8,
      detail: "documents in progress",
      status: "processing"
    },
    {
      id: 3,
      title: "Output & Delivery",
      description: "Review & approval",
      icon: Check,
      color: "purple",
      count: 3,
      detail: "awaiting attorney review",
      status: "pending"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return {
          bg: 'bg-status-success',
          text: 'text-status-success',
          border: 'border-status-success'
        };
      case 'processing':
        return {
          bg: 'bg-status-processing',
          text: 'text-status-processing', 
          border: 'border-status-processing'
        };
      case 'purple':
        return {
          bg: 'bg-status-purple',
          text: 'text-status-purple',
          border: 'border-status-purple'
        };
      default:
        return {
          bg: 'bg-border-gray',
          text: 'text-secondary',
          border: 'border-border-gray'
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Assembly Line Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-accent-gold rounded-full"></div>
          <h2 className="text-xl font-bold text-primary">Assembly Line Workflow</h2>
        </div>
        <div className="text-sm text-secondary font-mono">
          Last update: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Conveyor Belt Animation */}
      <div className="relative">
        <div className="flow-line mb-8"></div>
      </div>

      {/* Three-Stage Assembly Line */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {assemblyStages.map((stage, index) => {
          const colors = getColorClasses(stage.color);
          const IconComponent = stage.icon;
          
          return (
            <div key={stage.id} className="relative">
              {/* Stage Card */}
              <div className={`bg-card-light rounded-lg p-6 border-t-4 ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300`}>
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${colors.bg} bg-opacity-20 rounded-full flex items-center justify-center border-2 ${colors.border}`}>
                    <IconComponent className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  {stage.status === 'processing' && (
                    <div className="animate-spin w-4 h-4 border-2 border-status-processing border-t-transparent rounded-full"></div>
                  )}
                </div>

                {/* Stage Title */}
                <h3 className="text-lg font-bold text-primary mb-1">{stage.title}</h3>
                <p className="text-sm text-secondary mb-4">{stage.description}</p>

                {/* Progress Metrics */}
                <div className="bg-card-dark p-4 rounded-lg border border-border-gray">
                  <div className={`text-3xl font-bold ${colors.text} font-mono mb-1`}>
                    {stage.count}
                  </div>
                  <div className="text-xs text-secondary">
                    {stage.detail}
                  </div>
                </div>

                {/* Active Items List */}
                <div className="mt-4 space-y-2">
                  {stage.id === 1 && (
                    <div className="workflow-item priority-high">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-primary font-medium">TRO Motion received</span>
                        <Clock className="h-4 w-4 text-status-warning" />
                      </div>
                      <p className="text-xs text-secondary mt-1">Johnson v Johnson • 2 min ago</p>
                    </div>
                  )}
                  
                  {stage.id === 2 && (
                    <div className="workflow-item priority-critical">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-primary font-medium">TRO analysis 87% complete</span>
                        <div className="progress-fill bg-status-processing h-1 w-16 rounded-full"></div>
                      </div>
                      <p className="text-xs text-secondary mt-1">ETA: 3 minutes</p>
                    </div>
                  )}
                  
                  {stage.id === 3 && (
                    <div className="workflow-item priority-critical">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-primary font-medium">2 drafts ready for review</span>
                        <AlertTriangle className="h-4 w-4 text-status-warning animate-bounce" />
                      </div>
                      <p className="text-xs text-secondary mt-1">Response due: 47 hours</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Conveyor Belt Connector */}
              {index < assemblyStages.length - 1 && (
                <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-10">
                  <ChevronRight className="h-8 w-8 text-accent-gold" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-border-gray">
        <button 
          onClick={() => setShowDraftApproval(true)}
          className="bg-status-critical hover:bg-accent-gold text-white hover:text-primary-dark font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg"
        >
          <FileText className="h-5 w-5" />
          <span>REVIEW 2 URGENT DRAFTS</span>
        </button>
        
        <button className="bg-accent-gold hover:bg-status-processing text-primary-dark hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg">
          <Send className="h-5 w-5" />
          <span>AUTO-SEND APPROVED</span>
        </button>
        
        <button className="bg-status-processing hover:bg-accent-gold text-white hover:text-primary-dark font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg">
          <Brain className="h-5 w-5" />
          <span>VIEW AI ANALYSIS</span>
        </button>
      </div>

      {/* Cases Overview - Standard Examples */}
      <div className="bg-card-light rounded-lg p-6 border border-border-gray">
        <h3 className="text-lg font-bold text-primary mb-4 flex items-center space-x-2">
          <div className="w-1 h-6 bg-accent-gold rounded-full"></div>
          <span>Active Cases</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Johnson v Johnson - Emergency TRO */}
          <div className="workflow-item priority-critical">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-primary">Johnson v Johnson</h4>
              <span className="text-xs bg-status-critical text-white px-2 py-1 rounded font-bold">CRITICAL</span>
            </div>
            <p className="text-sm text-secondary mb-2">Wayne County Family Division</p>
            <p className="text-xs text-accent-gold font-semibold">Emergency TRO • 24h deadline</p>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-secondary">Client: Mark Johnson</span>
              <span className="text-status-warning font-mono">47:23:15</span>
            </div>
          </div>

          {/* Hartley Estate - Probate */}
          <div className="workflow-item priority-normal">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-primary">Hartley Estate</h4>
              <span className="text-xs bg-status-processing text-white px-2 py-1 rounded font-bold">NORMAL</span>
            </div>
            <p className="text-sm text-secondary mb-2">Oakland County Probate</p>
            <p className="text-xs text-accent-gold font-semibold">Letters of Authority</p>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-secondary">Client: James Hartley</span>
              <span className="text-status-warning">No contact 18 days</span>
            </div>
          </div>

          {/* Towne v Michigan Dept of AG */}
          <div className="workflow-item priority-high">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-primary">Towne v Michigan Dept</h4>
              <span className="text-xs bg-status-warning text-white px-2 py-1 rounded font-bold">HIGH</span>
            </div>
            <p className="text-sm text-secondary mb-2">Employment Law</p>
            <p className="text-xs text-accent-gold font-semibold">Summary Disposition Motion</p>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-secondary">Client: David Towne</span>
              <span className="text-status-success">Strong position</span>
            </div>
          </div>
        </div>
      </div>

      {/* Draft Approval Modal */}
      {showDraftApproval && (
        <DraftApproval 
          isOpen={showDraftApproval}
          onClose={() => setShowDraftApproval(false)} 
        />
      )}
    </div>
  );
}