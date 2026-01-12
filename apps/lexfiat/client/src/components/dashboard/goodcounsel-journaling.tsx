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
import { BookOpen, Send, RefreshCw, Sparkles, TrendingUp, Heart, Lightbulb } from "lucide-react";
import { showAIOfflineError } from "@/lib/ai-error-helper";
import { executeCyranoTool } from "@/lib/cyrano-api";

interface JournalingProps {
  userId?: string;
}

// Temporary interfaces - will be replaced when backend is fully integrated
interface JournalEntry {
  id?: string;
  content: string;
  timestamp?: string;
  tags?: string[];
  mood?: string;
}

interface JournalFeedback {
  insights: string[];
  patterns: string[];
  suggestions: string[];
  encouragement?: string;
}

/**
 * GoodCounsel Journaling Component
 * 
 * Wellness journaling with AI-powered feedback and insights.
 * Provides a safe space for attorneys to reflect, process, and receive supportive guidance.
 * 
 * NOTE: Currently stubbed - will be fully integrated with wellness_journal tool in Phase 4.
 */
export function GoodCounselJournaling({ userId }: JournalingProps) {
  const [entry, setEntry] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [feedback, setFeedback] = useState<JournalFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  useEffect(() => {
    loadRecentEntries();
  }, []);

  const loadRecentEntries = async () => {
    setIsLoadingEntries(true);
    try {
      // Use goodcounsel_engine with wellness_journal action
      const result = await executeCyranoTool('goodcounsel_engine', {
        action: 'wellness_journal',
        input: {
          action: 'get_entries',
          limit: 5,
          offset: 0,
        },
        userId: userId || 'default-user',
      });
      
      if (result.isError) {
        console.error('Error loading journal entries:', result.content[0]?.text);
        return;
      }
      
      const entries = typeof result.content[0]?.text === 'string'
        ? JSON.parse(result.content[0].text)
        : result.content[0]?.text;
      
      setRecentEntries(entries || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      // Don't show error to user - journaling should be non-intrusive
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleSubmit = async () => {
    if (!entry.trim()) return;

    setIsSubmitting(true);
    try {
      // Create entry via goodcounsel_engine with wellness_journal action
      const result = await executeCyranoTool('goodcounsel_engine', {
        action: 'wellness_journal',
        input: {
          action: 'create_entry',
          content: entry.trim(),
          mood: mood.trim() || undefined,
          tags: tags,
        },
        userId: userId || 'default-user',
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Failed to create journal entry');
      }
      
      const createdEntry = typeof result.content[0]?.text === 'string'
        ? JSON.parse(result.content[0].text)
        : result.content[0]?.text;
      
      // Add to recent entries
      setRecentEntries([createdEntry, ...recentEntries.slice(0, 4)]);
      
      // Get feedback
      if (createdEntry.id) {
        await getFeedback([createdEntry.id]);
      }
      
      // Clear form
      setEntry("");
      setMood("");
      setTags([]);
    } catch (error) {
      console.error('Error creating journal entry:', error);
      showAIOfflineError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedback = async (entryIds?: string[]) => {
    if (!entryIds || entryIds.length === 0) return;
    
    setIsLoadingFeedback(true);
    try {
      // Get feedback via goodcounsel_engine with wellness_journal action
      const result = await executeCyranoTool('goodcounsel_engine', {
        action: 'wellness_journal',
        input: {
          action: 'get_feedback',
          entryId: entryIds[0],
        },
        userId: userId || 'default-user',
      });
      
      if (result.isError) {
        console.error('Error getting feedback:', result.content[0]?.text);
        return;
      }
      
      const feedbackData = typeof result.content[0]?.text === 'string'
        ? JSON.parse(result.content[0].text)
        : result.content[0]?.text;
      
      setFeedback(feedbackData);
    } catch (error) {
      console.error('Error getting feedback:', error);
      showAIOfflineError();
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      {/* New Entry Form */}
      <Card className="bg-card-dark border-border-gray">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BookOpen className="w-5 h-5 text-accent-gold" />
            Journal Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">
              What's on your mind?
            </label>
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Take a moment to reflect. What are you thinking, feeling, or processing today?"
              className="bg-primary-dark border-border-gray min-h-[150px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary mb-2 block">
                Mood (Optional)
              </label>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g., thoughtful, stressed, grateful..."
                className="w-full bg-primary-dark border border-border-gray rounded px-3 py-2 text-sm text-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary mb-2 block">
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-card-light border-border-gray cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full bg-primary-dark border border-border-gray rounded px-3 py-2 text-sm text-primary"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!entry.trim() || isSubmitting}
            className="w-full bg-accent-gold hover:bg-accent-gold/90 text-slate-900 font-semibold"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Save Entry & Get Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      {feedback && (
        <Card className="bg-card-dark border-2 border-accent-gold/30">
          <CardHeader className="bg-gradient-to-r from-accent-gold/20 to-status-success/10 border-b border-accent-gold/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5 text-accent-gold" />
              Insights & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {feedback.insights && feedback.insights.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-accent-gold" />
                  Insights
                </h4>
                <ul className="space-y-2">
                  {feedback.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-secondary bg-card-light p-3 rounded border border-border-gray">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.patterns && feedback.patterns.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent-gold" />
                  Patterns
                </h4>
                <ul className="space-y-2">
                  {feedback.patterns.map((pattern, idx) => (
                    <li key={idx} className="text-sm text-secondary bg-card-light p-3 rounded border border-border-gray">
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-status-success" />
                  Suggestions
                </h4>
                <ul className="space-y-2">
                  {feedback.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm text-secondary bg-card-light p-3 rounded border border-border-gray">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.encouragement && (
              <div className="bg-accent-gold/10 border border-accent-gold/30 p-4 rounded">
                <p className="text-sm text-secondary italic">{feedback.encouragement}</p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => getFeedback()}
              disabled={isLoadingFeedback}
              className="w-full"
            >
              {isLoadingFeedback ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Insights
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <Card className="bg-card-dark border-border-gray">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <BookOpen className="w-5 h-5 text-accent-gold" />
              Recent Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-card-light p-4 rounded border border-border-gray"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-secondary">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Recently'}
                    </p>
                    {entry.mood && (
                      <Badge variant="outline" className="bg-card-dark border-border-gray">
                        {entry.mood}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-primary whitespace-pre-wrap">{entry.content}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {entry.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-card-dark border-border-gray text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={loadRecentEntries}
              disabled={isLoadingEntries}
              className="w-full mt-4"
            >
              {isLoadingEntries ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load More
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

}
)