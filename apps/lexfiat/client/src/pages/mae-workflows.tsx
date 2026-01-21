/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Play, List, Edit, Save, X, Info, Zap } from "lucide-react";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type AIProvider = 'openai' | 'anthropic' | 'perplexity' | 'google' | 'xai' | 'deepseek' | 'auto';

interface WorkflowStep {
  id: string;
  type: 'module' | 'tool' | 'ai' | 'condition';
  target: string;
  input?: any;
  onSuccess?: string;
  onFailure?: string;
  provider?: AIProvider; // For AI steps
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export default function MaeWorkflowsPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [editingSteps, setEditingSteps] = useState<Record<string, WorkflowStep>>({});
  const [maeDefaultProvider, setMaeDefaultProvider] = useState<AIProvider>('perplexity');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch workflows
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ['mae-workflows'],
    queryFn: async () => {
      const result = await executeCyranoTool('mae_engine', {
        action: 'list_workflows',
      });
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Failed to load workflows');
      }
      const parsed = JSON.parse(result.content[0]?.text || '{}');
      return parsed.workflows || [];
    },
  });

  // Fetch MAE default provider
  const { data: defaultProviderData } = useQuery({
    queryKey: ['mae-default-provider'],
    queryFn: async () => {
      const result = await executeCyranoTool('mae_engine', {
        action: 'get_default_provider',
      });
      if (result.isError) {
        return { default_provider: 'perplexity' };
      }
      return JSON.parse(result.content[0]?.text || '{}');
    },
    onSuccess: (data) => {
      if (data.default_provider) {
        setMaeDefaultProvider(data.default_provider);
      }
    },
  });

  // Update MAE default provider
  const updateDefaultProvider = useMutation({
    mutationFn: async (provider: AIProvider) => {
      const result = await executeCyranoTool('mae_engine', {
        action: 'set_default_provider',
        provider,
      });
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Failed to update default provider');
      }
      return JSON.parse(result.content[0]?.text || '{}');
    },
    onSuccess: (data) => {
      setMaeDefaultProvider(data.default_provider);
      queryClient.invalidateQueries({ queryKey: ['mae-default-provider'] });
      toast({
        title: "Default Provider Updated",
        description: `MAE default provider set to ${data.default_provider}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update default provider',
        variant: "destructive",
      });
    },
  });

  // Execute workflow
  const executeWorkflow = useMutation({
    mutationFn: async (workflowId: string) => {
      const result = await executeCyranoTool('mae_engine', {
        action: 'execute_workflow',
        workflow_id: workflowId,
        input: {},
      });
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Failed to execute workflow');
      }
      return JSON.parse(result.content[0]?.text || '{}');
    },
    onSuccess: () => {
      toast({
        title: "Workflow Executed",
        description: "Workflow execution completed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : 'Failed to execute workflow',
        variant: "destructive",
      });
    },
  });

  const workflows: Workflow[] = workflowsData || [];
  const selected = workflows.find(w => w.id === selectedWorkflow);

  const handleEditStep = (stepId: string, step: WorkflowStep) => {
    setEditingSteps(prev => ({ ...prev, [stepId]: { ...step } }));
  };

  const handleSaveStep = (stepId: string) => {
    // In a real implementation, this would update the workflow via API
    toast({
      title: "Step Updated",
      description: "Step provider selection saved (workflow update API pending)",
    });
    setEditingSteps(prev => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  };

  const handleCancelEdit = (stepId: string) => {
    setEditingSteps(prev => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gold mb-2">MAE Workflow Management</h1>
          <p className="text-slate-300">
            Manage Multi-Agent Engine workflows and configure AI provider selection per step
          </p>
        </div>

        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="workflows" className="data-[state=active]:bg-slate-700">
              <List className="w-4 h-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            {/* MAE Default Provider Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-gold flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  MAE Default Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm mb-4">
                  The MAE orchestrator uses this provider when no provider is specified for auto-select.
                  This ensures the service does not stall without a provider. You can change this at any time.
                </p>
                <div className="flex items-center gap-4">
                  <Label className="text-slate-300">Current Default:</Label>
                  <Badge variant="outline" className="border-gold text-gold">
                    {maeDefaultProvider}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Workflows List */}
            {workflowsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : workflows.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-8 text-center text-slate-400">
                  No workflows available
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {workflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className={`bg-slate-800 border-slate-700 cursor-pointer transition-all ${
                      selectedWorkflow === workflow.id ? 'border-gold' : ''
                    }`}
                    onClick={() => setSelectedWorkflow(workflow.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>{workflow.name}</span>
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          {workflow.steps.length} steps
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-400 text-sm mb-4">{workflow.description}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            executeWorkflow.mutate(workflow.id);
                          }}
                          disabled={executeWorkflow.isPending}
                          className="bg-gold hover:bg-gold/90 text-slate-900"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Execute
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWorkflow(workflow.id);
                            setEditingWorkflow(workflow.id);
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Workflow Details */}
            {selected && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{selected.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedWorkflow(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300">{selected.description}</p>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Workflow Steps</h3>
                    {selected.steps.map((step, index) => {
                      const editing = editingSteps[step.id];
                      const isAI = step.type === 'ai';
                      
                      return (
                        <div
                          key={step.id}
                          className="bg-slate-900 border border-slate-700 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-slate-600 text-slate-400">
                                {step.type}
                              </Badge>
                              <span className="text-white font-medium">{step.id}</span>
                              {index < selected.steps.length - 1 && (
                                <span className="text-slate-500">→</span>
                              )}
                            </div>
                            {isAI && !editing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditStep(step.id, step)}
                                className="text-slate-400 hover:text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          {isAI && (
                            <div className="mt-3 pt-3 border-t border-slate-700">
                              {editing ? (
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-slate-300 mb-2 block">
                                      AI Provider
                                    </Label>
                                    <Select
                                      value={editing.provider || 'auto'}
                                      onValueChange={(value) => {
                                        setEditingSteps(prev => ({
                                          ...prev,
                                          [step.id]: { ...prev[step.id], provider: value as AIProvider },
                                        }));
                                      }}
                                    >
                                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-800 border-slate-600">
                                        <SelectItem value="auto" className="text-white">
                                          <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4" />
                                            Auto (Performance-Based)
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="perplexity" className="text-white">Perplexity</SelectItem>
                                        <SelectItem value="openai" className="text-white">OpenAI</SelectItem>
                                        <SelectItem value="anthropic" className="text-white">Anthropic</SelectItem>
                                        <SelectItem value="google" className="text-white">Google</SelectItem>
                                        <SelectItem value="xai" className="text-white">xAI</SelectItem>
                                        <SelectItem value="deepseek" className="text-white">DeepSeek</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-400 mt-1">
                                      Auto mode selects the optimal provider based on task profile and performance metrics
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveStep(step.id)}
                                      className="bg-gold hover:bg-gold/90 text-slate-900"
                                    >
                                      <Save className="w-4 h-4 mr-2" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancelEdit(step.id)}
                                      className="border-slate-600 text-slate-300"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Label className="text-slate-400 text-sm">Provider:</Label>
                                  <Badge
                                    variant={step.provider === 'auto' ? 'default' : 'outline'}
                                    className={
                                      step.provider === 'auto'
                                        ? 'bg-gold text-slate-900'
                                        : 'border-slate-600 text-slate-300'
                                    }
                                  >
                                    {step.provider || 'auto'}
                                  </Badge>
                                  {step.provider === 'auto' && (
                                    <span className="text-xs text-slate-500">
                                      (Performance-based selection)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {step.target && (
                            <div className="mt-2 text-sm text-slate-400">
                              Target: <span className="text-slate-300">{step.target}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-gold flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  MAE Default Provider Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 mb-2 block">
                    Default Provider for MAE Orchestrator
                  </Label>
                  <p className="text-xs text-slate-400 mb-4">
                    This provider is used when no provider is specified for auto-select in MAE workflows.
                    Perplexity is the default, but you can change it to any available provider.
                  </p>
                  <Select
                    value={maeDefaultProvider}
                    onValueChange={(value) => {
                      updateDefaultProvider.mutate(value as AIProvider);
                    }}
                    disabled={updateDefaultProvider.isPending}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="perplexity" className="text-white">Perplexity</SelectItem>
                      <SelectItem value="openai" className="text-white">OpenAI</SelectItem>
                      <SelectItem value="anthropic" className="text-white">Anthropic</SelectItem>
                      <SelectItem value="google" className="text-white">Google</SelectItem>
                      <SelectItem value="xai" className="text-white">xAI</SelectItem>
                      <SelectItem value="deepseek" className="text-white">DeepSeek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">About User Sovereignty</h4>
                  <p className="text-sm text-slate-300">
                    You have complete control over AI provider selection. For every AI-enhanced function,
                    you can choose a specific provider or use "auto" mode, which selects the optimal
                    provider based on task characteristics and performance metrics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
