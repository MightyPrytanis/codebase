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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Play, 
  Edit, 
  Copy, 
  Settings, 
  TrendingUp,
  FileText,
  Gavel,
  Briefcase,
  Shield,
  UserPlus,
  BookOpen,
  PenTool,
  Crown,
  Filter
} from "lucide-react";
import { 
  workflowTemplates, 
  getWorkflowsByCategory, 
  getCWorkflows,
  searchWorkflows,
  WorkflowCategory,
  WorkflowTemplate
} from "@/lib/workflow-templates";
import VisualWorkflowBuilder from "@/components/dashboard/visual-workflow-builder";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_ICONS: Record<WorkflowCategory, typeof FileText> = {
  'c-workflows': Crown,  // C workflows: Compare, Critique, Collaborate, etc.
  'document-review': FileText,
  'litigation': Gavel,
  'transactional': Briefcase,
  'compliance': Shield,
  'client-intake': UserPlus,
  'research': BookOpen,
  'drafting': PenTool,
};

const CATEGORY_COLORS: Record<WorkflowCategory, string> = {
  'c-workflows': 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',  // C workflows
  'document-review': 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  'litigation': 'bg-red-500/20 border-red-500/50 text-red-400',
  'transactional': 'bg-green-500/20 border-green-500/50 text-green-400',
  'compliance': 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  'client-intake': 'bg-pink-500/20 border-pink-500/50 text-pink-400',
  'research': 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400',
  'drafting': 'bg-orange-500/20 border-orange-500/50 text-orange-400',
};

export default function WorkflowLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WorkflowCategory | 'all'>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowTemplate | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filter workflows
  const filteredWorkflows = (() => {
    let workflows = workflowTemplates;
    
    if (selectedCategory !== 'all') {
      workflows = getWorkflowsByCategory(selectedCategory);
    }
    
    if (searchQuery.trim()) {
      workflows = searchWorkflows(searchQuery);
    }
    
    return workflows;
  })();

  // Execute workflow
  const executeWorkflow = useMutation({
    mutationFn: async (workflow: WorkflowTemplate) => {
      const result = await executeCyranoTool('mae_engine', {
        action: 'execute_workflow',
        workflow_id: workflow.id,
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
        description: "Workflow execution started successfully",
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

  const handleCreateNew = () => {
    setEditingWorkflow(null);
    setIsBuilderOpen(true);
  };

  const handleEdit = (workflow: WorkflowTemplate) => {
    setEditingWorkflow(workflow);
    setIsBuilderOpen(true);
  };

  const handleSaveWorkflow = async (workflow: WorkflowTemplate) => {
    // Save workflow via API
    try {
      const result = await executeCyranoTool('mae_engine', {
        action: 'create_workflow',
        workflow: workflow,
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Failed to save workflow');
      }
      
      toast({
        title: "Workflow Saved",
        description: `Workflow "${workflow.name}" has been saved`,
      });
      
      setIsBuilderOpen(false);
      setEditingWorkflow(null);
      queryClient.invalidateQueries({ queryKey: ['mae-workflows'] });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Failed to save workflow',
        variant: "destructive",
      });
    }
  };

  const cWorkflows = getCWorkflows();

  return (
    <div className="min-h-screen bg-primary-dark">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gold mb-2">Workflow Library</h1>
          <p className="text-slate-300">
            Browse and use standard workflows, or create custom workflows with our visual builder
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows..."
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-gold hover:bg-gold/90 text-slate-900"
          >
            <Settings className="w-4 h-4 mr-2" />
            Create New Workflow
          </Button>
        </div>

        {/* C Workflows Section */}
        {/* C workflows: Compare, Critique, Collaborate, etc. (adapted from SwimMeet Dive/Turn/Work) */}
        {selectedCategory === 'all' || selectedCategory === 'c-workflows' ? (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">C Workflows</h2>
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                Compare • Critique • Collaborate
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                Adapted from SwimMeet
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onExecute={() => executeWorkflow.mutate(workflow)}
                  onEdit={() => handleEdit(workflow)}
                  isExecuting={executeWorkflow.isPending}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)} className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700 grid grid-cols-4 lg:grid-cols-8 w-full">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">
              All
            </TabsTrigger>
            {Object.entries(CATEGORY_ICONS).map(([category, Icon]) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="data-[state=active]:bg-slate-700"
              >
                <Icon className="w-4 h-4 mr-2" />
                {category === 'c-workflows' ? 'C Workflows' : category.replace('-', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-6">
            {filteredWorkflows.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">No workflows found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    onExecute={() => executeWorkflow.mutate(workflow)}
                    onEdit={() => handleEdit(workflow)}
                    isExecuting={executeWorkflow.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Visual Workflow Builder */}
      {isBuilderOpen && (
        <VisualWorkflowBuilder
          workflow={editingWorkflow || undefined}
          onSave={handleSaveWorkflow}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingWorkflow(null);
          }}
        />
      )}
    </div>
  );
}

interface WorkflowCardProps {
  workflow: WorkflowTemplate;
  onExecute: () => void;
  onEdit: () => void;
  isExecuting: boolean;
}

function WorkflowCard({ workflow, onExecute, onEdit, isExecuting }: WorkflowCardProps) {
  const Icon = CATEGORY_ICONS[workflow.category];
  const colorClass = CATEGORY_COLORS[workflow.category];

  return (
    <Card className={`bg-slate-800 border-slate-700 hover:border-gold/50 transition-all ${workflow.isCWorkflow ? 'ring-2 ring-yellow-500/30' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center border`}>
            <Icon className="w-6 h-6" />
          </div>
          {workflow.isCWorkflow && (
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
              C Workflow
            </Badge>
          )}
        </div>
        <CardTitle className="text-white text-lg">{workflow.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{workflow.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Steps:</span>
            <span className="text-slate-300 font-mono">{workflow.steps.length}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Time:</span>
            <span className="text-slate-300">{workflow.estimatedTime}</span>
          </div>
        </div>

        {workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {workflow.tags.slice(0, 3).map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs border-slate-600 text-slate-400"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onExecute}
            disabled={isExecuting}
            className="flex-1 bg-gold hover:bg-gold/90 text-slate-900"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Execute
          </Button>
          <Button
            onClick={onEdit}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            size="sm"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

}
