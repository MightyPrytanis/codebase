/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X, Clock, History, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GoodCounselPrompt {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
  snoozedUntil?: string;
  dismissed?: boolean;
}

/**
 * GoodCounsel Prompt Manager
 * Displays and manages event-driven GoodCounsel prompts
 */
export function GoodCounselPromptManager({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  // Fetch active prompts
  const { data: prompts = [], isLoading } = useQuery<GoodCounselPrompt[]>({
    queryKey: ["goodcounsel-prompts", userId],
    queryFn: async () => {
      const result = await executeCyranoTool("get_goodcounsel_prompts", { userId });
      if (result.isError) {
        return [];
      }
      try {
        const parsed = JSON.parse(result.content[0]?.text || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Dismiss prompt mutation
  const dismissMutation = useMutation({
    mutationFn: async (promptId: string) => {
      await executeCyranoTool("dismiss_goodcounsel_prompt", { promptId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goodcounsel-prompts", userId] });
    },
  });

  // Snooze prompt type mutation
  const snoozeMutation = useMutation({
    mutationFn: async ({ promptType, hours }: { promptType: string; hours: number }) => {
      await executeCyranoTool("snooze_goodcounsel_prompt_type", { userId, promptType, hours });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goodcounsel-prompts", userId] });
    },
  });

  // Fetch prompt history
  const { data: history = [] } = useQuery<GoodCounselPrompt[]>({
    queryKey: ["goodcounsel-prompt-history", userId],
    queryFn: async () => {
      const result = await executeCyranoTool("get_goodcounsel_prompt_history", { userId, limit: 50 });
      if (result.isError) {
        return [];
      }
      try {
        const parsed = JSON.parse(result.content[0]?.text || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    enabled: showHistory,
  });

  const activePrompts = prompts.filter((p) => !p.dismissed && (!p.snoozedUntil || new Date(p.snoozedUntil) > new Date()));

  if (isLoading) {
    return (
      <Card className="border-0 shadow-none bg-panel-glass backdrop-blur-md">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading prompts...</div>
        </CardContent>
      </Card>
    );
  }

  if (activePrompts.length === 0 && !showHistory) {
    return null;
  }

  return (
    <Card className="border-0 shadow-none bg-panel-glass backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            GoodCounsel
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="h-auto p-1"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!showHistory ? (
          <>
            {activePrompts.map((prompt) => (
              <Alert
                key={prompt.id}
                variant={prompt.severity === "high" ? "destructive" : "default"}
                className="border-0 shadow-none bg-muted/50"
              >
                <AlertTitle className="flex items-center justify-between">
                  <span>{prompt.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {prompt.severity}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => dismissMutation.mutate(prompt.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </AlertTitle>
                <AlertDescription className="mt-2">{prompt.message}</AlertDescription>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => snoozeMutation.mutate({ promptType: prompt.type, hours: 24 })}
                    className="text-xs"
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    Snooze 24h
                  </Button>
                </div>
              </Alert>
            ))}
          </>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Prompt History</h4>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No prompt history</p>
            ) : (
              history.map((prompt) => (
                <div
                  key={prompt.id}
                  className="text-sm p-2 bg-muted/30 rounded border-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{prompt.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(prompt.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{prompt.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

}