/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useCallback, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Play, 
  Save, 
  X, 
  Settings,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Brain,
  FileText,
  Users,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkflowStep, WorkflowStepType, WorkflowTemplate } from "@/lib/workflow-templates";
import { useToast } from "@/hooks/use-toast";

interface VisualWorkflowBuilderProps {
  workflow?: WorkflowTemplate;
  onSave: (workflow: WorkflowTemplate) => void;
  onClose: () => void;
}

interface NodePosition {
  x: number;
  y: number;
}

const STEP_TYPE_ICONS: Record<WorkflowStepType, typeof Brain> = {
  module: FileText,
  tool: Zap,
  ai: Brain,
  condition: AlertCircle,
  approval: CheckCircle,
  notification: Users,
  integration: Settings,
};

const STEP_TYPE_COLORS: Record<WorkflowStepType, string> = {
  module: 'bg-blue-500',
  tool: 'bg-purple-500',
  ai: 'bg-green-500',
  condition: 'bg-yellow-500',
  approval: 'bg-orange-500',
  notification: 'bg-pink-500',
  integration: 'bg-gray-500',
};

const AVAILABLE_AGENTS = [
  'document_analyzer',
  'legal_reviewer',
  'risk_analyst',
  'draft_generator',
  'quality_checker',
  'compliance_checker',
  'red_flag_finder',
  'contract_analyzer',
  'legal_researcher',
  'case_assessor',
  'trend_analyst',
  'strategic_advisor',
];

const AVAILABLE_TOOLS = [
  'document_processor',
  'case_data_collector',
  'financial_aggregator',
  'executive_dashboard_generator',
  'deadline_tracker',
  'matter_creator',
  'template_selector',
  'document_formatter',
];

export default function VisualWorkflowBuilder({ 
  workflow, 
  onSave, 
  onClose 
}: VisualWorkflowBuilderProps) {
  const [workflowName, setWorkflowName] = useState(workflow?.name || '');
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '');
  const [workflowCategory, setWorkflowCategory] = useState<string>(workflow?.category || 'custom');
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps || []);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const addStep = useCallback(() => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: 'New Step',
      type: 'ai',
      description: '',
      config: {},
    };
    setSteps(prev => [...prev, newStep]);
    setSelectedStep(newStep.id);
    
    // Set initial position
    setNodePositions(prev => ({
      ...prev,
      [newStep.id]: {
        x: 100 + (steps.length * 250),
        y: 200,
      },
    }));
  }, [steps.length]);

  const removeStep = useCallback((stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId));
    setSelectedStep(null);
    setNodePositions(prev => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s));
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, stepId: string) => {
    setDraggedStep(stepId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedStep || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodePositions(prev => ({
      ...prev,
      [draggedStep]: { x, y },
    }));
    setDraggedStep(null);
  }, [draggedStep]);

  const handleSave = useCallback(() => {
    if (!workflowName.trim()) {
      toast({
        title: "Validation Error",
        description: "Workflow name is required",
        variant: "destructive",
      });
      return;
    }

    if (steps.length === 0) {
      toast({
        title: "Validation Error",
        description: "Workflow must have at least one step",
        variant: "destructive",
      });
      return;
    }

    const savedWorkflow: WorkflowTemplate = {
      id: workflow?.id || `workflow_${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory as any,
      steps: steps,
      estimatedTime: '5-20 minutes',
      useCases: [],
      tags: [],
      isCWorkflow: workflowCategory === 'c-workflows',
    };

    onSave(savedWorkflow);
    toast({
      title: "Workflow Saved",
      description: `Workflow "${workflowName}" has been saved successfully`,
    });
  }, [workflowName, workflowDescription, workflowCategory, steps, workflow, onSave, toast]);

  const selectedStepData = steps.find(s => s.id === selectedStep);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl h-[90vh] flex flex-col bg-slate-900 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Visual Workflow Builder</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="bg-gold hover:bg-gold/90 text-slate-900"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Workflow
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex gap-4 p-4">
          {/* Left Panel - Workflow Info & Steps List */}
          <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            {/* Workflow Metadata */}
            <div className="space-y-4 bg-slate-800 p-4 rounded-lg">
              <div>
                <Label className="text-slate-300 mb-2 block">Workflow Name</Label>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">Description</Label>
                <Textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter workflow description"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">Category</Label>
                <Select value={workflowCategory} onValueChange={setWorkflowCategory}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="c-workflows">C Workflows</SelectItem>
                    <SelectItem value="document-review">Document Review</SelectItem>
                    <SelectItem value="litigation">Litigation</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="client-intake">Client Intake</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="drafting">Drafting</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Workflow Steps</Label>
                <Button
                  size="sm"
                  onClick={addStep}
                  className="bg-gold hover:bg-gold/90 text-slate-900"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {steps.map((step, index) => {
                  const Icon = STEP_TYPE_ICONS[step.type];
                  return (
                    <div
                      key={step.id}
                      onClick={() => setSelectedStep(step.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedStep === step.id
                          ? 'border-gold bg-gold/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 ${STEP_TYPE_COLORS[step.type]} rounded flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{step.name}</div>
                            <div className="text-xs text-slate-400">{step.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {index + 1}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStep(step.id);
                            }}
                            className="h-6 w-6 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {steps.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No steps yet. Click "Add Step" to begin.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Panel - Visual Canvas */}
          <div className="flex-1 flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-slate-300">Visual Flow</Label>
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                {steps.length} step{steps.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div
              ref={canvasRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg relative overflow-auto"
              style={{ minHeight: '400px' }}
            >
              {/* Grid Background */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />
              
              {/* Step Nodes */}
              {steps.map((step, index) => {
                const Icon = STEP_TYPE_ICONS[step.type];
                const position = nodePositions[step.id] || { x: 100 + (index * 250), y: 200 };
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.id}>
                    {/* Connection Line */}
                    {!isLast && (
                      <svg
                        className="absolute pointer-events-none"
                        style={{
                          left: `${position.x + 100}px`,
                          top: `${position.y + 40}px`,
                          width: '150px',
                          height: '2px',
                        }}
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="150"
                          y2="0"
                          stroke="rgba(255, 255, 255, 0.3)"
                          strokeWidth="2"
                        />
                        <polygon
                          points="140,0 150,0 145,5"
                          fill="rgba(255, 255, 255, 0.3)"
                        />
                      </svg>
                    )}

                    {/* Step Node */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, step.id)}
                      onClick={() => setSelectedStep(step.id)}
                      className={`absolute cursor-move ${
                        selectedStep === step.id ? 'ring-2 ring-gold' : ''
                      }`}
                      style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                      }}
                    >
                      <Card className={`w-48 bg-slate-800 border-2 ${
                        selectedStep === step.id ? 'border-gold' : 'border-slate-700'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-10 h-10 ${STEP_TYPE_COLORS[step.type]} rounded-lg flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{step.name}</div>
                              <div className="text-xs text-slate-400">{step.type}</div>
                            </div>
                            <GripVertical className="w-4 h-4 text-slate-500" />
                          </div>
                          {step.description && (
                            <div className="text-xs text-slate-400 line-clamp-2">
                              {step.description}
                            </div>
                          )}
                          <Badge variant="outline" className="mt-2 text-xs border-slate-600 text-slate-400">
                            Step {index + 1}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}

              {steps.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No workflow steps</p>
                    <p className="text-sm">Add steps from the left panel to build your workflow</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Step Configuration */}
          <div className="w-80 bg-slate-800 rounded-lg p-4 overflow-y-auto">
            {selectedStepData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-lg">Step Configuration</Label>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSelectedStep(null)}
                    className="h-6 w-6 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Step Name</Label>
                  <Input
                    value={selectedStepData.name}
                    onChange={(e) => updateStep(selectedStepData.id, { name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Step Type</Label>
                  <Select
                    value={selectedStepData.type}
                    onValueChange={(value) => updateStep(selectedStepData.id, { type: value as WorkflowStepType })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="module">Module</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="ai">AI Agent</SelectItem>
                      <SelectItem value="condition">Condition</SelectItem>
                      <SelectItem value="approval">Approval</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Description</Label>
                  <Textarea
                    value={selectedStepData.description}
                    onChange={(e) => updateStep(selectedStepData.id, { description: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>

                {selectedStepData.type === 'ai' && (
                  <div>
                    <Label className="text-slate-300 mb-2 block">AI Agent</Label>
                    <Select
                      value={selectedStepData.agent || ''}
                      onValueChange={(value) => updateStep(selectedStepData.id, { agent: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {AVAILABLE_AGENTS.map(agent => (
                          <SelectItem key={agent} value={agent}>
                            {agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(selectedStepData.type === 'module' || selectedStepData.type === 'tool') && (
                  <div>
                    <Label className="text-slate-300 mb-2 block">Tool/Module</Label>
                    <Select
                      value={selectedStepData.tool || ''}
                      onValueChange={(value) => updateStep(selectedStepData.id, { tool: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select tool" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {AVAILABLE_TOOLS.map(tool => (
                          <SelectItem key={tool} value={tool}>
                            {tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedStepData.type === 'approval' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedStepData.requiresApproval || false}
                      onCheckedChange={(checked) => 
                        updateStep(selectedStepData.id, { requiresApproval: checked === true })
                      }
                    />
                    <Label className="text-slate-300">Requires Approval</Label>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Select a step to configure
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

}
)
)
}
}
)
}
}
)
)
}
}
)
}