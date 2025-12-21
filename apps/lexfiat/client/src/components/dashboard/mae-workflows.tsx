import { useState } from "react";
import { FileText, MessageSquareText, Users, Settings, Play, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface MaeWorkflowsProps {
  isLoading?: boolean;
}

interface MaeWorkflowTemplate {
  id: string;
  name: string;
  type: 'compare' | 'critique' | 'collaborate' | 'custom';
  description: string;
  icon: string;
  config: any;
  isDefault: boolean;
}

export default function MaeWorkflows({ isLoading = false }: MaeWorkflowsProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<MaeWorkflowTemplate | null>(null);
  const [isWorkflowBuilderOpen, setIsWorkflowBuilderOpen] = useState(false);

  // MAE Workflow Templates (adapted from SwimMeet)
  const maeWorkflows: MaeWorkflowTemplate[] = [
    {
      id: 'compare',
      name: 'Compare',
      type: 'compare',
      description: 'Multi-agent document comparison and analysis workflow',
      icon: 'FileText',
      config: {
        agents: ['document_analyzer', 'legal_comparator', 'fact_checker'],
        steps: 3,
        estimatedTime: '5-10 minutes'
      },
      isDefault: true
    },
    {
      id: 'critique',
      name: 'Critique', 
      type: 'critique',
      description: 'Legal document review and critique workflow',
      icon: 'MessageSquareText',
      config: {
        agents: ['legal_reviewer', 'compliance_checker', 'quality_assessor'],
        steps: 3,
        estimatedTime: '8-15 minutes'
      },
      isDefault: true
    },
    {
      id: 'collaborate',
      name: 'Collaborate',
      type: 'collaborate', 
      description: 'Multi-party collaboration workflow',
      icon: 'Users',
      config: {
        agents: ['collaboration_coordinator', 'task_manager', 'communication_facilitator'],
        steps: 3,
        estimatedTime: '10-20 minutes'
      },
      isDefault: true
    },
    {
      id: 'custom',
      name: 'Custom Workflow',
      type: 'custom',
      description: 'Build your own custom workflow',
      icon: 'Settings',
      config: {
        agents: [],
        steps: 0,
        estimatedTime: 'Variable'
      },
      isDefault: false
    }
  ];

  const getWorkflowIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return FileText;
      case 'MessageSquareText':
        return MessageSquareText;
      case 'Users':
        return Users;
      case 'Settings':
        return Settings;
      default:
        return Settings;
    }
  };

  const getWorkflowColor = (type: string) => {
    switch (type) {
      case 'compare':
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          button: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'critique':
        return {
          border: 'border-purple-500',
          bg: 'bg-purple-500/20',
          text: 'text-purple-400',
          button: 'bg-purple-500 hover:bg-purple-600'
        };
      case 'collaborate':
        return {
          border: 'border-green-500',
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          button: 'bg-green-500 hover:bg-green-600'
        };
      case 'custom':
        return {
          border: 'border-gray-500',
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          button: 'bg-gray-500 hover:bg-gray-600'
        };
      default:
        return {
          border: 'border-gray-500',
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          button: 'bg-gray-500 hover:bg-gray-600'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-1 h-8 bg-accent-gold rounded-full"></div>
          <h2 className="text-xl font-bold text-primary">Multi-Agent Engine (MAE) Workflows</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MAE Workflows Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-accent-gold rounded-full"></div>
          <h2 className="text-xl font-bold text-primary">Multi-Agent Engine (MAE) Workflows</h2>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Adapted from SwimMeet
        </Badge>
      </div>

      {/* MAE Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {maeWorkflows.map((workflow) => {
          const IconComponent = getWorkflowIcon(workflow.icon);
          const colors = getWorkflowColor(workflow.type);
          
          return (
            <div 
              key={workflow.id} 
              className={`bg-card-light rounded-lg p-6 border-l-4 ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              {/* Workflow Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`h-6 w-6 ${colors.text}`} />
                </div>
                {workflow.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>

              {/* Workflow Info */}
              <h3 className="text-lg font-bold text-primary mb-2">{workflow.name}</h3>
              <p className="text-sm text-secondary mb-4 h-12">{workflow.description}</p>

              {/* Workflow Stats */}
              <div className="bg-card-dark p-3 rounded-lg border border-border-gray mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Agents:</span>
                    <span className={`font-mono ${colors.text}`}>
                      {workflow.config.agents?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Steps:</span>
                    <span className={`font-mono ${colors.text}`}>
                      {workflow.config.steps}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Time:</span>
                    <span className={`font-mono ${colors.text}`}>
                      {workflow.config.estimatedTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {workflow.type === 'custom' ? (
                  <Dialog open={isWorkflowBuilderOpen} onOpenChange={setIsWorkflowBuilderOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className={`w-full ${colors.button} text-white transition-colors`}
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Build Workflow
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Custom Workflow Builder</DialogTitle>
                      </DialogHeader>
                      <CustomWorkflowBuilder 
                        workflow={selectedWorkflow}
                        onClose={() => setIsWorkflowBuilderOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <>
                    <Button 
                      className={`w-full ${colors.button} text-white transition-colors`}
                      onClick={() => handleExecuteWorkflow(workflow)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Execute Workflow
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-secondary border-border-gray hover:bg-card-dark"
                      onClick={() => handleConfigureWorkflow(workflow)}
                    >
                      Configure
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Executions Section */}
      <div className="bg-card-light rounded-lg p-6 border border-border-gray">
        <h3 className="text-lg font-bold text-primary mb-4 flex items-center space-x-2">
          <div className="w-1 h-6 bg-accent-gold rounded-full"></div>
          <span>Active MAE Executions</span>
        </h3>
        
        <div className="space-y-3">
          {/* Example active execution */}
          <div className="flex items-center justify-between p-3 bg-card-dark rounded-lg border border-border-gray">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-primary">Compare: Johnson v Johnson Documents</h4>
                <p className="text-xs text-secondary">Step 2 of 3 • Comparative Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-status-warning" />
                <span className="text-xs text-status-warning font-mono">2:34 remaining</span>
              </div>
              <div className="w-16 h-2 bg-border-gray rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Example completed execution */}
          <div className="flex items-center justify-between p-3 bg-card-dark rounded-lg border border-border-gray opacity-75">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <MessageSquareText className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-primary">Critique: Settlement Agreement Draft</h4>
                <p className="text-xs text-secondary">Completed • 3 recommendations generated</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-status-success" />
              <span className="text-xs text-status-success font-mono">Complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function handleExecuteWorkflow(workflow: MaeWorkflowTemplate) {
    // TODO: Implement workflow execution logic
    console.log('Executing workflow:', workflow.name);
  }

  function handleConfigureWorkflow(workflow: MaeWorkflowTemplate) {
    // TODO: Implement workflow configuration logic
    console.log('Configuring workflow:', workflow.name);
  }
}

// Custom Workflow Builder Component
function CustomWorkflowBuilder({ 
  workflow, 
  onClose 
}: { 
  workflow: MaeWorkflowTemplate | null; 
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">Custom Workflow Builder</h3>
        <p className="text-secondary">
          Build custom workflows by defining agents, steps, and triggers.
          This feature adapts SwimMeet's workflow builder for LexFiat's legal context.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-primary">Available Agents</h4>
          <div className="space-y-2">
            {['document_analyzer', 'legal_comparator', 'fact_checker', 'legal_reviewer', 'compliance_checker'].map((agent) => (
              <div key={agent} className="p-2 bg-card-dark rounded border border-border-gray">
                <span className="text-sm text-primary">{agent.replace('_', ' ').toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-primary">Workflow Steps</h4>
          <div className="text-sm text-secondary">
            Drag and drop agents to build your custom workflow...
          </div>
          <div className="border-2 border-dashed border-border-gray rounded-lg p-8 text-center">
            <p className="text-secondary">Custom workflow builder coming soon</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-accent-gold hover:bg-accent-gold/90 text-primary-dark">
          Create Workflow
        </Button>
      </div>
    </div>
  );
}