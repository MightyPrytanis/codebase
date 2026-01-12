import { useState } from "react";
import { Mail, Brain, FileText, CheckCircle, Maximize2, X, Settings } from "lucide-react";
import DraftApproval from "./draft-approval";
import WorkflowCustomizer from "./workflow-customizer";

interface WorkflowPipelineProps {
  cases: any[];
  redFlags: any[];
  dashboardStats: any;
  intakeMetrics?: { today: number; pending: number };
  isLoading: boolean;
}

interface WorkflowStage {
  id: string;
  title: string;
  description: string;
  icon: typeof Mail;
  type: 'intake' | 'analysis' | 'review' | 'output';
  metrics: {
    label: string;
    value: string | number;
  }[];
}

export default function WorkflowPipeline({ 
  cases, 
  redFlags, 
  dashboardStats, 
  intakeMetrics,
  isLoading 
}: WorkflowPipelineProps) {
  const [showDraftApproval, setShowDraftApproval] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-card-light rounded animate-pulse"></div>
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 h-64 bg-card-light rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Use real data from Cyrano when available, fallback to defaults
  const workflowStages: WorkflowStage[] = [
    {
      id: 'intake',
      title: 'Document Intake',
      description: 'Email monitoring and document capture',
      icon: Mail,
      type: 'intake',
      metrics: [
        { label: 'Today', value: intakeMetrics?.today || dashboardStats?.intake_today || 24 },
        { label: 'Pending', value: intakeMetrics?.pending || dashboardStats?.intake_pending || 3 }
      ]
    },
    {
      id: 'analysis',
      title: 'AI Analysis',
      description: 'Document review and red flag detection',
      icon: Brain,
      type: 'analysis',
      metrics: [
        { label: 'Processing', value: dashboardStats?.analysis_processing || redFlags.length || 5 },
        { label: 'Red Flags', value: redFlags.length || dashboardStats?.red_flags_count || 2 }
      ]
    },
    {
      id: 'draft-prep',
      title: 'Draft Preparation',
      description: 'AI-generated draft responses',
      icon: FileText,
      type: 'review',
      metrics: [
        { label: 'Drafts Ready', value: dashboardStats?.drafts_ready || 6 },
        { label: 'In Progress', value: dashboardStats?.drafts_in_progress || 3 }
      ]
    },
    {
      id: 'attorney-review',
      title: 'Attorney Review',
      description: 'Final review and approval',
      icon: CheckCircle,
      type: 'output',
      metrics: [
        { label: 'Awaiting', value: dashboardStats?.awaiting_review || 8 },
        { label: 'Urgent', value: dashboardStats?.urgent_review || redFlags.filter((f: any) => f.priority === 'critical').length || 1 }
      ]
    }
  ];

  const getStageClasses = (type: string) => {
    switch (type) {
      case 'intake':
        return 'workflow-stage-intake border-l-4 border-[#3B82F6]';
      case 'analysis':
        return 'workflow-stage-analysis border-l-4 border-[#A855F7]';
      case 'review':
        return 'workflow-stage-review border-l-4 border-[#10B981]';
      case 'output':
        return 'workflow-stage-output border-l-4 border-[#F59E0B]';
      default:
        return '';
    }
  };

  const handleExpand = (stageId: string) => {
    setExpandedStage(expandedStage === stageId ? null : stageId);
  };

  return (
    <div className="workflow-area">
      {/* Workflow Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light tracking-wide text-chrome">Workflow</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCustomizer(true)}
            className="flex items-center gap-2 px-4 py-2 bg-ocean-mid/70 border border-panel-border text-white hover:bg-accent-glow hover:border-glass-blue transition-all text-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Customize</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-ocean-mid/70 border border-panel-border text-white hover:bg-accent-glow hover:border-glass-blue transition-all text-sm">
            <span className="text-lg font-bold">+</span>
            <span>Add Stage</span>
          </button>
        </div>
      </div>

      {/* Workflow Pipeline - Horizontal Layout */}
      <div className="workflow-pipeline relative flex gap-4 items-stretch pb-16 overflow-x-auto">
        {/* Track Elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#10B981] opacity-60"></div>
        
        {workflowStages.map((stage, index) => {
          const IconComponent = stage.icon;
          const isLast = index === workflowStages.length - 1;
          
          return (
            <div key={stage.id} className="relative flex-shrink-0" style={{ minWidth: '250px', maxWidth: '400px', flex: '1 1 250px' }}>
              {/* Workflow Stage Card */}
              <div
                className={`workflow-stage ${getStageClasses(stage.type)} relative bg-gradient-to-br from-white/12 via-white/8 to-white/6 backdrop-blur-[60px] border-2 border-white/15 border-t-4 border-t-white/25 rounded-none p-4 cursor-move transition-all hover:-translate-y-1 hover:shadow-2xl mt-16`}
                style={{
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.4),
                    0 4px 16px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3),
                    inset 1px 0 0 rgba(255, 255, 255, 0.1),
                    inset -1px 0 0 rgba(0, 0, 0, 0.2)
                  `
                }}
              >
                {/* Track Connector */}
                <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 w-[30px] h-[60px] bg-gradient-to-b from-[#8B4513] via-[#A0522D] to-[#8B4513] rounded-t-[15px] border-2 border-[#8B4513] shadow-lg z-[1000]"></div>
                <div className="absolute -top-[55px] left-1/2 -translate-x-1/2 w-[28px] h-[10px] bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#8B4513] rounded z-[1001]"></div>
                
                {/* Glass Surface Effects */}
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-white/40 via-white/22 to-transparent pointer-events-none z-10 rounded-none"></div>
                <div className="absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-transparent via-white/70 to-transparent shadow-[0_2px_8px_rgba(255,255,255,0.5)] pointer-events-none z-[11]"></div>
                
                {/* Control Buttons */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExpand(stage.id);
                  }}
                  className="absolute top-4 right-4 bg-black/30 border border-panel-border p-2 text-chrome hover:bg-accent-glow hover:border-glass-blue transition-all z-20"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Remove widget functionality
                  }}
                  className="absolute top-4 right-12 bg-red-500/20 border border-red-500 p-2 text-red-500 hover:bg-red-500/40 transition-all z-20 text-xs w-6 h-6 flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Stage Content */}
                <div className="relative z-12">
                  {/* Stage Icon */}
                  <div className="mb-4">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>

                  {/* Stage Title */}
                  <h3 className="text-lg font-medium mb-2 text-white tracking-wide">{stage.title}</h3>
                  <p className="text-sm text-steel-gray mb-4">{stage.description}</p>

                  {/* Stage Metrics */}
                  <div className="space-y-2">
                    {stage.metrics.map((metric, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-steel-gray">{metric.label}</span>
                        <span className="font-semibold font-mono text-white">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resize Handle */}
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-tl from-transparent via-white/30 to-transparent cursor-se-resize opacity-0 hover:opacity-100 transition-opacity z-20"></div>
              </div>

              {/* Connector Arrow */}
              {!isLast && (
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                  <div className="w-10 h-[3px] bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#10B981] opacity-60"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[#3B82F6] text-2xl">→</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Draft Approval Modal */}
      {showDraftApproval && (
        <DraftApproval 
          isOpen={showDraftApproval}
          onClose={() => setShowDraftApproval(false)} 
        />
      )}

      {/* Workflow Customizer Modal */}
      {showCustomizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4">
            <WorkflowCustomizer
              currentStages={workflowStages.map((s, idx) => ({
                id: s.id,
                name: s.title,
                agent: s.type,
                description: s.description,
                order: idx,
              }))}
              onSave={(stages) => {
                // Update workflow stages
                console.log('Workflow customized:', stages);
                setShowCustomizer(false);
              }}
              onClose={() => setShowCustomizer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );

}
)
}