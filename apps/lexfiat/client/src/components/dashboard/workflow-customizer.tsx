/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from "react";
import { Settings, Plus, X, GripVertical, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";

interface WorkflowStage {
  id: string;
  name: string;
  agent: string;
  description: string;
  order: number;
}

interface WorkflowCustomizerProps {
  currentStages: WorkflowStage[];
  onSave: (stages: WorkflowStage[]) => void;
  onClose: () => void;
}

const availableAgents = [
  { id: "document_processor", name: "Document Processor" },
  { id: "document_analyzer", name: "Document Analyzer" },
  { id: "red_flag_finder", name: "Red Flag Finder" },
  { id: "legal_reviewer", name: "Legal Reviewer" },
  { id: "draft_generator", name: "Draft Generator" },
  { id: "quality_checker", name: "Quality Checker" },
  { id: "filing_service", name: "Filing Service" },
  { id: "notification_service", name: "Notification Service" },
];

export default function WorkflowCustomizer({ currentStages, onSave, onClose }: WorkflowCustomizerProps) {
  const [stages, setStages] = useState<WorkflowStage[]>(currentStages);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (customStages: WorkflowStage[]) => {
      return executeCyranoTool("workflow_manager", {
        action: "customize",
        workflow_type: "custom",
        custom_stages: customStages,
      });
    },
    onSuccess: () => {
      onSave(stages);
      onClose();
    },
  });

  const handleAddStage = () => {
    const newStage: WorkflowStage = {
      id: `stage_${Date.now()}`,
      name: "New Stage",
      agent: availableAgents[0].id,
      description: "",
      order: stages.length,
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (id: string) => {
    const updated = stages.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx }));
    setStages(updated);
  };

  const handleUpdateStage = (id: string, field: keyof WorkflowStage, value: any) => {
    setStages(stages.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newStages = [...stages];
    const dragged = newStages[draggedIndex];
    newStages.splice(draggedIndex, 1);
    newStages.splice(index, 0, dragged);
    
    // Update order
    const reordered = newStages.map((s, idx) => ({ ...s, order: idx }));
    setStages(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    saveMutation.mutate(stages);
  };

  return (
    <Card className="bg-card-dark border-accent-gold">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Settings className="w-5 h-5 text-accent-gold" />
            Customize Workflow
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="flex items-center gap-3 p-3 bg-card-light rounded-lg border border-border-gray hover:border-accent-gold transition-all cursor-move"
            >
              <GripVertical className="w-5 h-5 text-secondary flex-shrink-0" />
              
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-secondary">Stage Name</Label>
                  <Input
                    value={stage.name}
                    onChange={(e) => handleUpdateStage(stage.id, "name", e.target.value)}
                    className="bg-primary-dark border-border-gray"
                  />
                </div>
                <div>
                  <Label className="text-xs text-secondary">Agent</Label>
                  <Select
                    value={stage.agent}
                    onValueChange={(value) => handleUpdateStage(stage.id, "agent", value)}
                  >
                    <SelectTrigger className="bg-primary-dark border-border-gray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card-dark border-border-gray">
                      {availableAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-secondary">Description</Label>
                  <Input
                    value={stage.description}
                    onChange={(e) => handleUpdateStage(stage.id, "description", e.target.value)}
                    className="bg-primary-dark border-border-gray"
                    placeholder="Stage description..."
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveStage(stage.id)}
                className="text-status-critical hover:text-status-critical/80 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          onClick={handleAddStage}
          variant="outline"
          className="w-full border-accent-gold text-accent-gold hover:bg-accent-gold/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Stage
        </Button>

        <div className="flex gap-3 pt-4 border-t border-border-gray">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex-1 bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Workflow"}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


}