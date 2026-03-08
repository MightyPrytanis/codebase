/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, FileText, CheckCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { executeCyranoTool } from "@/lib/cyrano-api";
import { showAIOfflineError } from "@/lib/ai-error-helper";

interface ModeBQAProps {
  documentId?: string;
  matterId?: string;
  documentType?: string;
  onDraftReady?: (draftId: string) => void;
}

/**
 * Mode B Q&A Interface Component
 * 
 * Interactive Q&A interface for Mode B (summarize→discuss→draft) workflow.
 * Displays generated summary, allows user to ask questions, and generates draft on command.
 */
export function ModeBQA({ documentId, matterId, documentType, onDraftReady }: ModeBQAProps) {
  const [question, setQuestion] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [currentPhase, setCurrentPhase] = useState<'summary' | 'qa' | 'draft'>('summary');
  const [draftId, setDraftId] = useState<string | null>(null);

  // Fetch summary when component mounts
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['mode-b-summary', documentId],
    queryFn: async () => {
      if (!documentId) return null;

      const result = await executeCyranoTool('drafting_mode_executor', {
        mode: 'summarize-discuss-draft',
        documentId,
        matterId,
        documentType,
        action: 'get_summary',
      });

      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Failed to get summary');
      }

      const data = typeof result.content[0]?.text === 'string'
        ? JSON.parse(result.content[0].text)
        : result.content[0]?.text;

      return data;
    },
    enabled: !!documentId && currentPhase === 'summary',
  });

  // Update summary when data loads
  useEffect(() => {
    if (summaryData?.summary) {
      setSummary(summaryData.summary);
      setCurrentPhase('qa');
      // Add summary to conversation
      setConversation([{
        role: 'assistant',
        content: summaryData.summary,
        timestamp: new Date(),
      }]);
    }
  }, [summaryData]);

  // Ask question mutation
  const askQuestionMutation = useMutation({
    mutationFn: async (questionText: string) => {
      const result = await executeCyranoTool('drafting_mode_executor', {
        mode: 'summarize-discuss-draft',
        documentId,
        matterId,
        documentType,
        action: 'ask_question',
        question: questionText,
      });

      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Failed to get answer');
      }

      const data = typeof result.content[0]?.text === 'string'
        ? JSON.parse(result.content[0].text)
        : result.content[0]?.text;

      return data.answer || data.response || 'No answer provided';
    },
    onSuccess: (answer, questionText) => {
      // Add question and answer to conversation
      setConversation(prev => [
        ...prev,
        { role: 'user', content: questionText, timestamp: new Date() },
        { role: 'assistant', content: answer, timestamp: new Date() },
      ]);
      setQuestion("");
    },
    onError: (error) => {
      console.error('Error asking question:', error);
      showAIOfflineError();
    },
  });

  // Generate draft mutation
  const generateDraftMutation = useMutation({
    mutationFn: async () => {
      const result = await executeCyranoTool('drafting_mode_executor', {
        mode: 'summarize-discuss-draft',
        documentId,
        matterId,
        documentType,
        action: 'generate_draft',
      });

      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Failed to generate draft');
      }

      const data = typeof result.content[0]?.text === 'string'
        ? JSON.parse(result.content[0].text)
        : result.content[0]?.text;

      return data;
    },
    onSuccess: (data) => {
      setCurrentPhase('draft');
      setDraftId(data.draftId || data.id || 'draft-generated');
      if (onDraftReady && (data.draftId || data.id)) {
        onDraftReady(data.draftId || data.id);
      }
    },
    onError: (error) => {
      console.error('Error generating draft:', error);
      showAIOfflineError();
    },
  });

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    askQuestionMutation.mutate(question.trim());
  };

  const handleGenerateDraft = () => {
    generateDraftMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Phase Indicator */}
      <div className="flex items-center gap-4">
        <Badge variant={currentPhase === 'summary' ? 'default' : 'outline'} className={currentPhase === 'summary' ? 'bg-accent-gold text-slate-900' : ''}>
          {currentPhase === 'summary' && <CheckCircle className="w-3 h-3 mr-1" />}
          Summary
        </Badge>
        <div className="h-px flex-1 bg-border-gray" />
        <Badge variant={currentPhase === 'qa' ? 'default' : 'outline'} className={currentPhase === 'qa' ? 'bg-accent-gold text-slate-900' : ''}>
          {currentPhase === 'qa' && <CheckCircle className="w-3 h-3 mr-1" />}
          Q&A
        </Badge>
        <div className="h-px flex-1 bg-border-gray" />
        <Badge variant={currentPhase === 'draft' ? 'default' : 'outline'} className={currentPhase === 'draft' ? 'bg-accent-gold text-slate-900' : ''}>
          {currentPhase === 'draft' && <CheckCircle className="w-3 h-3 mr-1" />}
          Draft
        </Badge>
      </div>

      {/* Summary Phase */}
      {currentPhase === 'summary' && (
        <Card className="bg-card-dark border-border-gray">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5 text-accent-gold" />
              Generating Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
                <span className="ml-3 text-secondary">Analyzing document and generating summary...</span>
              </div>
            ) : (
              <p className="text-secondary">Summary will appear here once generated.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Q&A Phase */}
      {currentPhase === 'qa' && (
        <>
          {/* Summary Display */}
          {summary && (
            <Card className="bg-card-dark border-border-gray">
              <CardHeader>
                <CardTitle className="text-primary">Document Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="text-secondary whitespace-pre-wrap">{summary}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversation History */}
          {conversation.length > 1 && (
            <Card className="bg-card-dark border-border-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <MessageSquare className="w-5 h-5 text-accent-gold" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversation.slice(1).map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-accent-gold text-slate-900'
                            : 'bg-card-light text-primary'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Input */}
          <Card className="bg-card-dark border-border-gray">
            <CardHeader>
              <CardTitle className="text-primary">Ask a Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask questions about the document summary..."
                className="bg-primary-dark border-border-gray min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAskQuestion();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-secondary">
                  Press Cmd/Ctrl + Enter to send
                </p>
                <Button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || askQuestionMutation.isPending}
                  className="bg-accent-gold hover:bg-accent-gold/90 text-slate-900"
                >
                  {askQuestionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Asking...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Ask Question
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generate Draft Button */}
          <Card className="bg-card-dark border-2 border-accent-gold/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-primary">
                  Ready to generate the draft? The system will use your conversation to create a tailored response.
                </p>
                <Button
                  onClick={handleGenerateDraft}
                  disabled={generateDraftMutation.isPending}
                  className="bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold"
                  size="lg"
                >
                  {generateDraftMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Draft...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Generate Draft
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Draft Ready Phase */}
      {currentPhase === 'draft' && (
        <Card className="bg-card-dark border-2 border-status-success/30">
          <CardHeader className="bg-gradient-to-r from-status-success/20 to-accent-gold/20">
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5 text-status-success" />
              Draft Generated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-primary">
              Your draft has been generated and is ready for review.
            </p>
            {draftId && (
              <Badge variant="outline" className="bg-card-light">
                Draft ID: {draftId}
              </Badge>
            )}
            <Button
              onClick={() => {
                // Navigate to draft review or open draft
                console.log('Opening draft:', draftId);
              }}
              className="w-full bg-status-success hover:bg-status-success/90 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Open Draft for Review
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

}
