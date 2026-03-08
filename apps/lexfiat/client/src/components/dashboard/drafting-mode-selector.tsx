/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, MessageSquare, Users, GitCompare } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { showAIOfflineError } from "@/lib/ai-error-helper";

interface DraftingModeSelectorProps {
  documentId: string;
  matterId?: string;
  documentType: string;
  currentMode?: string;
  onModeChange?: (mode: string) => void;
  onExecute?: (mode: string) => void;
}

const MODE_DESCRIPTIONS = {
  'auto-draft': {
    name: 'Auto-Draft for Review',
    description: 'Automatically generate draft response for attorney review',
    icon: Zap,
    enabled: true,
  },
  'summarize-discuss-draft': {
    name: 'Summarize → Discuss → Draft',
    description: 'Generate summary, allow Q&A, then draft on command',
    icon: MessageSquare,
    enabled: true,
  },
  'competitive': {
    name: 'Competitive Drafting',
    description: 'Generate multiple strategies/providers and compare outputs',
    icon: GitCompare,
    enabled: false,
  },
  'collaborative': {
    name: 'Collaborative Drafting',
    description: 'Stepwise drafting with user checkpoints',
    icon: Users,
    enabled: false,
  },
};

export function DraftingModeSelector({
  documentId,
  matterId,
  documentType,
  currentMode,
  onModeChange,
  onExecute,
}: DraftingModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<string>(currentMode || 'auto-draft');

  const { data: availableModes, isLoading: isLoadingModes } = useQuery({
    queryKey: ['drafting-modes'],
    queryFn: async () => {
      const result = await executeCyranoTool('drafting_mode_registry', {
        action: 'list_modes',
      });
      
      if (result.isError) {
        return Object.keys(MODE_DESCRIPTIONS);
      }
      
      const modes = typeof result.content[0]?.text === 'string'
        ? JSON.parse(result.content[0].text)
        : result.content[0]?.text;
      
      return modes.modes || Object.keys(MODE_DESCRIPTIONS);
    },
  });

  const { data: currentConfig } = useQuery({
    queryKey: ['drafting-mode-config', matterId, documentType],
    queryFn: async () => {
      const result = await executeCyranoTool('drafting_mode_config', {
        matterId,
        documentType,
      });
      
      if (result.isError) {
        return { mode: 'auto-draft' };
      }
      
      const config = typeof result.content[0]?.text === 'string'
        ? JSON.parse(result.content[0].text)
        : result.content[0]?.text;
      
      return config;
    },
    enabled: !!matterId || !!documentType,
  });

  const executeMutation = useMutation({
    mutationFn: async (mode: string) => {
      const result = await executeCyranoTool('drafting_mode_executor', {
        mode,
        documentId,
        matterId,
        documentType,
        action: 'execute',
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Failed to execute drafting mode');
      }
      
      return result;
    },
    onSuccess: () => {
      if (onExecute) {
        onExecute(selectedMode);
      }
    },
    onError: (error) => {
      showAIOfflineError();
      console.error('Drafting mode execution failed:', error);
    },
  });

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
    if (onModeChange) {
      onModeChange(mode);
    }
  };

  const handleExecute = () => {
    executeMutation.mutate(selectedMode);
  };

  const modes = availableModes || Object.keys(MODE_DESCRIPTIONS);
  const effectiveMode = currentConfig?.mode || selectedMode;

  return (
    <Card className="bg-card-dark border-border-gray">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent-gold" />
          Drafting Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingModes ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-accent-gold" />
          </div>
        ) : (
          <>
            <Select value={effectiveMode} onValueChange={handleModeSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select drafting mode" />
              </SelectTrigger>
              <SelectContent>
                {modes.map((mode: string) => {
                  const desc = MODE_DESCRIPTIONS[mode as keyof typeof MODE_DESCRIPTIONS];
                  if (!desc) return null;
                  
                  return (
                    <SelectItem 
                      key={mode} 
                      value={mode}
                      disabled={!desc.enabled}
                    >
                      <div className="flex items-center gap-2">
                        <desc.icon className="w-4 h-4" />
                        <span>{desc.name}</span>
                        {!desc.enabled && (
                          <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {effectiveMode && MODE_DESCRIPTIONS[effectiveMode as keyof typeof MODE_DESCRIPTIONS] && (
              <div className="p-3 bg-primary-bg-light rounded-md border border-border-gray">
                <p className="text-sm text-text-secondary">
                  {MODE_DESCRIPTIONS[effectiveMode as keyof typeof MODE_DESCRIPTIONS].description}
                </p>
              </div>
            )}

            <Button
              onClick={handleExecute}
              disabled={executeMutation.isPending || !MODE_DESCRIPTIONS[effectiveMode as keyof typeof MODE_DESCRIPTIONS]?.enabled}
              className="w-full bg-accent-gold text-primary-dark hover:bg-accent-gold/90"
            >
              {executeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Execute {MODE_DESCRIPTIONS[effectiveMode as keyof typeof MODE_DESCRIPTIONS]?.name || 'Mode'}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );

}