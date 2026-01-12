/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { db } from '../db.js';
import { wellnessJournalEntries, wellnessFeedback, wellnessTrends } from '../schema-wellness.js';
import { eq, and, gte, lte, desc, isNull } from 'drizzle-orm';
import { encryption } from './encryption-service.js';
import { hipaaCompliance } from './hipaa-compliance.js';
import { hume } from './hume-service.js';
import { wellnessAudioStorage } from './wellness-audio-storage.js';
import { AIService } from './ai-service.js';
import { randomUUID } from 'crypto';

/**
 * Wellness Service
 * 
 * Core service for managing wellness journal entries, generating AI feedback,
 * analyzing sentiment, detecting burnout signals, and tracking wellness trends.
 * All sensitive data is encrypted at rest and access is logged for HIPAA compliance.
 */

export interface JournalEntryInput {
  content: string;
  mood?: string;
  tags?: string[];
  audioBuffer?: Buffer;
}

export interface JournalEntry {
  id: string;
  userId: number;
  content: string;
  contentType: 'text' | 'voice' | 'both';
  mood?: string;
  tags: string[];
  voiceAudioPath?: string;
  transcription?: string;
  sentimentScore?: number;
  stressIndicators?: string[];
  burnoutSignals?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WellnessFeedback {
  insights: string[];
  patterns: string[];
  suggestions: string[];
  encouragement?: string;
  wellnessRecommendations?: {
    type: 'physical' | 'mental' | 'social' | 'professional';
    action: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  alerts?: {
    type: 'burnout' | 'stress' | 'overwork' | 'isolation';
    severity: 'mild' | 'moderate' | 'severe';
    message: string;
    recommendations: string[];
  }[];
}

class WellnessService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(
    userId: number,
    input: JournalEntryInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<JournalEntry> {
    let voiceAudioPath: string | undefined;
    let transcription: string | undefined;
    let contentType: 'text' | 'voice' | 'both' = 'text';
    let humeEmotionData: any = null;

    // Process voice recording if provided
    if (input.audioBuffer) {
      contentType = input.content ? 'both' : 'voice';
      
      // Store encrypted audio file
      const entryId = randomUUID();
      voiceAudioPath = await wellnessAudioStorage.storeAudio(userId, entryId, input.audioBuffer);
      
      // Analyze emotion with Hume
      try {
        const humeResult = await hume.processVoiceJournal(input.audioBuffer);
        transcription = humeResult.transcription;
        humeEmotionData = humeResult.emotions;
      } catch (error) {
        console.error('Hume analysis failed:', error);
        // Continue without emotion data
      }
    }

    // Encrypt sensitive fields
    const contentEncrypted = encryption.encryptField(input.content, 'content').encrypted;
    const moodEncrypted = input.mood ? encryption.encryptField(input.mood, 'mood').encrypted : null;
    // Encrypt tags as single JSON string (consistent with update/decrypt pattern)
    const tagsEncrypted = input.tags && input.tags.length > 0
      ? encryption.encryptField(JSON.stringify(input.tags), 'tags').encrypted
      : null;
    const transcriptionEncrypted = transcription ? encryption.encryptField(transcription, 'transcription').encrypted : null;
    const voiceAudioPathEncrypted = voiceAudioPath ? encryption.encryptField(voiceAudioPath, 'voice_audio_path').encrypted : null;

    // Analyze sentiment from text content
    const sentimentScore = await this.analyzeSentiment(input.content);

    // Detect stress indicators
    const stressIndicators = this.detectStressIndicators(input.content);

    // Insert into database
    const [entry] = await db.insert(wellnessJournalEntries).values({
      userId,
      contentEncrypted,
      contentType,
      mood: moodEncrypted || null,
      tags: tagsEncrypted || null, // Store encrypted string directly (not array check - tagsEncrypted is always a string)
      voiceAudioPath: voiceAudioPathEncrypted || null,
      transcriptionEncrypted: transcriptionEncrypted || null,
      sentimentScore,
      stressIndicators: stressIndicators.length > 0 ? stressIndicators : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Log access and audit trail
    await hipaaCompliance.logAccess(userId, entry.id, 'create', ipAddress, userAgent);
    await hipaaCompliance.logDataOperation(userId, entry.id, 'create', undefined, {
      contentType,
      hasAudio: !!input.audioBuffer,
    });

    // Generate feedback asynchronously (don't block entry creation)
    this.generateFeedback(entry.id, userId).catch(error => {
      console.error('Failed to generate feedback:', error);
    });

    // Return decrypted entry
    return this.decryptEntry(entry);
  }

  /**
   * Get a journal entry by ID
   */
  async getJournalEntry(userId: number, entryId: string, ipAddress?: string, userAgent?: string): Promise<JournalEntry | null> {
    const [entry] = await db
      .select()
      .from(wellnessJournalEntries)
      .where(
        and(
          eq(wellnessJournalEntries.id, entryId),
          eq(wellnessJournalEntries.userId, userId),
          isNull(wellnessJournalEntries.deletedAt)
        )
      )
      .limit(1);

    if (!entry) {
      return null;
    }

    // Log access
    await hipaaCompliance.logAccess(userId, entryId, 'view', ipAddress, userAgent);
    await hipaaCompliance.logDataOperation(userId, entryId, 'read');

    return this.decryptEntry(entry);
  }

  /**
   * Get user's journal entries
   */
  async getUserEntries(
    userId: number,
    limit: number = 10,
    offset: number = 0,
    ipAddress?: string,
    userAgent?: string
  ): Promise<JournalEntry[]> {
    const entries = await db
      .select()
      .from(wellnessJournalEntries)
      .where(
        and(
          eq(wellnessJournalEntries.userId, userId),
          isNull(wellnessJournalEntries.deletedAt)
        )
      )
      .orderBy(desc(wellnessJournalEntries.createdAt))
      .limit(limit)
      .offset(offset);

    // Log access
    await hipaaCompliance.logAccess(userId, null, 'view', ipAddress, userAgent);

    return entries.map(entry => this.decryptEntry(entry));
  }

  /**
   * Update a journal entry
   */
  async updateJournalEntry(
    userId: number,
    entryId: string,
    updates: Partial<JournalEntryInput>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<JournalEntry | null> {
    // Get existing entry for audit trail
    const existing = await this.getJournalEntry(userId, entryId);
    if (!existing) {
      return null;
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Encrypt updated fields
    if (updates.content !== undefined) {
      updateData.contentEncrypted = encryption.encryptField(updates.content, 'content').encrypted;
    }
    if (updates.mood !== undefined) {
      updateData.mood = updates.mood ? encryption.encryptField(updates.mood, 'mood').encrypted : null;
    }
    if (updates.tags !== undefined) {
      // Handle empty arrays consistently with createJournalEntry (store null if empty)
      updateData.tags = updates.tags && updates.tags.length > 0
        ? encryption.encryptField(JSON.stringify(updates.tags), 'tags').encrypted
        : null;
    }

    // Update sentiment if content changed
    if (updates.content !== undefined) {
      updateData.sentimentScore = await this.analyzeSentiment(updates.content);
      updateData.stressIndicators = this.detectStressIndicators(updates.content);
    }

    const [updated] = await db
      .update(wellnessJournalEntries)
      .set(updateData)
      .where(
        and(
          eq(wellnessJournalEntries.id, entryId),
          eq(wellnessJournalEntries.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      return null;
    }

    // Log access and audit trail
    await hipaaCompliance.logAccess(userId, entryId, 'update', ipAddress, userAgent);
    await hipaaCompliance.logDataOperation(userId, entryId, 'update', existing, updated);

    return this.decryptEntry(updated);
  }

  /**
   * Delete a journal entry (soft delete for HIPAA retention)
   */
  async deleteJournalEntry(
    userId: number,
    entryId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const existing = await this.getJournalEntry(userId, entryId);
    if (!existing) {
      return false;
    }

    // Soft delete
    await db
      .update(wellnessJournalEntries)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(wellnessJournalEntries.id, entryId),
          eq(wellnessJournalEntries.userId, userId)
        )
      );

    // Delete audio file if exists
    if (existing.voiceAudioPath) {
      try {
        await wellnessAudioStorage.deleteAudio(existing.voiceAudioPath);
      } catch (error) {
        console.error('Failed to delete audio file:', error);
      }
    }

    // Log access and audit trail
    await hipaaCompliance.logAccess(userId, entryId, 'delete', ipAddress, userAgent);
    await hipaaCompliance.logDataOperation(userId, entryId, 'delete', existing, null);
    await hipaaCompliance.secureDelete(entryId);

    return true;
  }

  /**
   * Generate AI feedback for an entry
   */
  async generateFeedback(entryId: string, userId: number): Promise<WellnessFeedback> {
    const entry = await db
      .select()
      .from(wellnessJournalEntries)
      .where(eq(wellnessJournalEntries.id, entryId))
      .limit(1);

    if (!entry.length) {
      throw new Error('Entry not found');
    }

    const decryptedEntry = this.decryptEntry(entry[0]);

    // Build prompt for AI feedback
    const prompt = this.buildFeedbackPrompt(decryptedEntry);

    // Call AI service (prefer Anthropic for wellness guidance)
    const aiResponse = await this.aiService.call('anthropic', prompt, {
      maxTokens: 2000,
      temperature: 0.7,
      systemPrompt: `You are a compassionate wellness assistant helping attorneys maintain their mental and emotional health. Provide supportive, empathetic feedback that acknowledges the challenges of legal practice while offering practical, actionable suggestions.`,
    });

    // Parse AI response into structured feedback
    const feedback = this.parseFeedbackResponse(aiResponse, decryptedEntry);

    // Encrypt feedback before storing
    const insightsEncrypted = encryption.encryptField(JSON.stringify(feedback.insights), 'insights').encrypted;
    const patternsEncrypted = encryption.encryptField(JSON.stringify(feedback.patterns), 'patterns').encrypted;
    const suggestionsEncrypted = encryption.encryptField(JSON.stringify(feedback.suggestions), 'suggestions').encrypted;
    const encouragementEncrypted = feedback.encouragement ? encryption.encryptField(feedback.encouragement, 'encouragement').encrypted : null;
    const recommendationsEncrypted = feedback.wellnessRecommendations ? encryption.encryptField(JSON.stringify(feedback.wellnessRecommendations), 'wellness_recommendations').encrypted : null;
    const alertsEncrypted = feedback.alerts ? encryption.encryptField(JSON.stringify(feedback.alerts), 'alerts').encrypted : null;

    // Store feedback
    await db.insert(wellnessFeedback).values({
      entryId,
      insightsEncrypted: insightsEncrypted as any,
      patternsEncrypted: patternsEncrypted as any,
      suggestionsEncrypted: suggestionsEncrypted as any,
      encouragementEncrypted,
      wellnessRecommendationsEncrypted: recommendationsEncrypted as any,
      alertsEncrypted: alertsEncrypted as any,
      createdAt: new Date(),
    });

    return feedback;
  }

  /**
   * Get feedback for an entry
   */
  async getFeedback(entryId: string): Promise<WellnessFeedback | null> {
    const [feedback] = await db
      .select()
      .from(wellnessFeedback)
      .where(eq(wellnessFeedback.entryId, entryId))
      .orderBy(desc(wellnessFeedback.createdAt))
      .limit(1);

    if (!feedback) {
      return null;
    }

    // Decrypt feedback
    return {
      insights: Array.isArray(feedback.insightsEncrypted) ? feedback.insightsEncrypted : JSON.parse(encryption.decryptField({ encrypted: feedback.insightsEncrypted as any, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'insights')),
      patterns: feedback.patternsEncrypted ? (Array.isArray(feedback.patternsEncrypted) ? feedback.patternsEncrypted : JSON.parse(encryption.decryptField({ encrypted: feedback.patternsEncrypted as any, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'patterns'))) : [],
      suggestions: feedback.suggestionsEncrypted ? (Array.isArray(feedback.suggestionsEncrypted) ? feedback.suggestionsEncrypted : JSON.parse(encryption.decryptField({ encrypted: feedback.suggestionsEncrypted as any, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'suggestions'))) : [],
      encouragement: feedback.encouragementEncrypted ? encryption.decryptField({ encrypted: feedback.encouragementEncrypted, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'encouragement') : undefined,
      wellnessRecommendations: feedback.wellnessRecommendationsEncrypted ? (Array.isArray(feedback.wellnessRecommendationsEncrypted) ? feedback.wellnessRecommendationsEncrypted : JSON.parse(encryption.decryptField({ encrypted: feedback.wellnessRecommendationsEncrypted as any, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'wellness_recommendations'))) : undefined,
      alerts: feedback.alertsEncrypted ? (Array.isArray(feedback.alertsEncrypted) ? feedback.alertsEncrypted : JSON.parse(encryption.decryptField({ encrypted: feedback.alertsEncrypted as any, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'alerts'))) : undefined,
    };
  }

  /**
   * Analyze sentiment from text content
   */
  async analyzeSentiment(content: string): Promise<number> {
    // Simple sentiment analysis - can be enhanced with ML model
    // Returns -1.0 (very negative) to 1.0 (very positive)
    
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'grateful', 'thankful', 'relieved', 'proud', 'accomplished', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'angry', 'frustrated', 'stressed', 'overwhelmed', 'exhausted', 'burned out'];
    
    const lowerContent = content.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) score += 0.1;
    });
    
    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) score -= 0.1;
    });
    
    // Clamp to -1.0 to 1.0
    return Math.max(-1.0, Math.min(1.0, score));
  }

  /**
   * Detect stress indicators in content
   */
  detectStressIndicators(content: string): string[] {
    const indicators: string[] = [];
    const lowerContent = content.toLowerCase();
    
    const stressPatterns = {
      'overwork': ['working late', 'no sleep', 'too many hours', 'overwhelmed', 'drowning'],
      'burnout': ['burned out', 'exhausted', 'can\'t keep up', 'too much', 'breaking point'],
      'isolation': ['alone', 'isolated', 'no support', 'no one understands'],
      'anxiety': ['anxious', 'worried', 'panic', 'nervous', 'stressed'],
    };
    
    Object.entries(stressPatterns).forEach(([indicator, patterns]) => {
      if (patterns.some(pattern => lowerContent.includes(pattern))) {
        indicators.push(indicator);
      }
    });
    
    return indicators;
  }

  /**
   * Detect burnout signals for a user
   */
  async detectBurnoutSignals(userId: number, timeframe: 'week' | 'month' = 'month'): Promise<{
    risk: 'low' | 'moderate' | 'high';
    signals: string[];
    recommendations: string[];
  }> {
    const days = timeframe === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await db
      .select()
      .from(wellnessJournalEntries)
      .where(
        and(
          eq(wellnessJournalEntries.userId, userId),
          gte(wellnessJournalEntries.createdAt, startDate),
          isNull(wellnessJournalEntries.deletedAt)
        )
      );

    const decryptedEntries = entries.map(e => this.decryptEntry(e));

    // Analyze patterns
    let stressCount = 0;
    let negativeSentimentCount = 0;
    const signals: string[] = [];

    decryptedEntries.forEach(entry => {
      if (entry.stressIndicators && entry.stressIndicators.length > 0) {
        stressCount++;
        signals.push(...entry.stressIndicators);
      }
      if (entry.sentimentScore && entry.sentimentScore < -0.3) {
        negativeSentimentCount++;
      }
    });

    // Determine risk level
    let risk: 'low' | 'moderate' | 'high' = 'low';
    const recommendations: string[] = [];

    if (stressCount > entries.length * 0.5 || negativeSentimentCount > entries.length * 0.6) {
      risk = 'high';
      recommendations.push('Consider speaking with a mental health professional');
      recommendations.push('Take time off if possible');
      recommendations.push('Review workload and delegate where possible');
    } else if (stressCount > entries.length * 0.3 || negativeSentimentCount > entries.length * 0.4) {
      risk = 'moderate';
      recommendations.push('Take regular breaks throughout the day');
      recommendations.push('Practice stress-reduction techniques');
      recommendations.push('Consider workload management strategies');
    } else {
      recommendations.push('Continue current wellness practices');
      recommendations.push('Monitor stress levels');
    }

    return { risk, signals: [...new Set(signals)], recommendations };
  }

  /**
   * Get wellness trends for a user
   */
  async getWellnessTrends(userId: number, period: 'week' | 'month' = 'month'): Promise<any> {
    // This would aggregate data and create trend analysis
    // For now, return basic aggregation
    const days = period === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await db
      .select()
      .from(wellnessJournalEntries)
      .where(
        and(
          eq(wellnessJournalEntries.userId, userId),
          gte(wellnessJournalEntries.createdAt, startDate),
          isNull(wellnessJournalEntries.deletedAt)
        )
      );

    if (entries.length === 0) {
      return null;
    }

    const decryptedEntries = entries.map(e => this.decryptEntry(e));

    // Calculate averages
    const avgSentiment = decryptedEntries.reduce((sum, e) => sum + (e.sentimentScore || 0), 0) / decryptedEntries.length;
    
    // Determine stress level
    const stressCount = decryptedEntries.filter(e => e.stressIndicators && e.stressIndicators.length > 0).length;
    const stressLevel = stressCount > entries.length * 0.5 ? 'high' : stressCount > entries.length * 0.3 ? 'moderate' : 'low';

    // Get burnout risk
    const burnoutAnalysis = await this.detectBurnoutSignals(userId, period);

    return {
      periodStart: startDate,
      periodEnd: new Date(),
      periodType: period,
      avgSentiment,
      stressLevel,
      burnoutRisk: burnoutAnalysis.risk,
      entryCount: entries.length,
    };
  }

  /**
   * Decrypt a database entry
   */
  private decryptEntry(entry: any): JournalEntry {
    return {
      id: entry.id,
      userId: entry.userId,
      content: encryption.decryptField({ encrypted: entry.contentEncrypted, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'content'),
      contentType: entry.contentType as 'text' | 'voice' | 'both',
      mood: entry.mood ? encryption.decryptField({ encrypted: entry.mood, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'mood') : undefined,
      tags: entry.tags ? (() => {
        try {
          // New format: single encrypted JSON string
          return JSON.parse(encryption.decryptField(
            { encrypted: entry.tags, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' },
            'tags'
          ));
        } catch (error) {
          // Migration: handle old format (array of encrypted strings)
          if (Array.isArray(entry.tags)) {
            try {
              return entry.tags.map(tag => {
                try {
                  return encryption.decryptField(
                    { encrypted: tag, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' },
                    'tags'
                  );
                } catch {
                  return tag; // Fallback if decryption fails
                }
              });
            } catch {
              return [];
            }
          }
          console.error('Error decrypting tags:', error);
          return [];
        }
      })() : [],
      voiceAudioPath: entry.voiceAudioPath ? encryption.decryptField({ encrypted: entry.voiceAudioPath, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'voice_audio_path') : undefined,
      transcription: entry.transcriptionEncrypted ? encryption.decryptField({ encrypted: entry.transcriptionEncrypted, algorithm: 'aes-256-gcm', keyDerivation: 'pbkdf2' }, 'transcription') : undefined,
      sentimentScore: entry.sentimentScore || undefined,
      stressIndicators: entry.stressIndicators || undefined,
      burnoutSignals: entry.burnoutSignals || undefined,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  /**
   * Build prompt for AI feedback generation
   */
  private buildFeedbackPrompt(entry: JournalEntry): string {
    return `Analyze this journal entry from an attorney and provide supportive wellness feedback:

Entry: "${entry.content}"
Mood: ${entry.mood || 'Not specified'}
Tags: ${entry.tags.join(', ') || 'None'}
Sentiment Score: ${entry.sentimentScore?.toFixed(2) || 'N/A'}
Stress Indicators: ${entry.stressIndicators?.join(', ') || 'None'}

Provide:
1. 2-3 key insights about what this entry reveals
2. Any patterns you notice (if this is part of a series)
3. 2-3 actionable suggestions for wellness
4. A brief, encouraging message
5. Specific wellness recommendations (physical, mental, social, professional)
6. Any alerts for burnout, stress, overwork, or isolation (if detected)

Format your response as JSON with keys: insights (array), patterns (array), suggestions (array), encouragement (string), wellnessRecommendations (array of {type, action, priority}), alerts (array of {type, severity, message, recommendations}).`;
  }

  /**
   * Parse AI response into structured feedback
   */
  private parseFeedbackResponse(aiResponse: string, entry: JournalEntry): WellnessFeedback {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          insights: parsed.insights || [],
          patterns: parsed.patterns || [],
          suggestions: parsed.suggestions || [],
          encouragement: parsed.encouragement,
          wellnessRecommendations: parsed.wellnessRecommendations || [],
          alerts: parsed.alerts || [],
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
    }

    // Fallback: parse from text
    return {
      insights: [aiResponse.substring(0, 200)],
      patterns: [],
      suggestions: [],
      encouragement: 'Thank you for sharing. Take care of yourself.',
      wellnessRecommendations: [],
      alerts: [],
    };
  }
}

// Export singleton instance
let wellnessService: WellnessService | null = null;

export function getWellnessService(): WellnessService {
  if (!wellnessService) {
    wellnessService = new WellnessService();
  }
  return wellnessService;
}

// Export for direct use
export const wellness = {
  createJournalEntry: async (userId: number, input: JournalEntryInput, ipAddress?: string, userAgent?: string) => {
    const service = getWellnessService();
    return service.createJournalEntry(userId, input, ipAddress, userAgent);
  },
  getJournalEntry: async (userId: number, entryId: string, ipAddress?: string, userAgent?: string) => {
    const service = getWellnessService();
    return service.getJournalEntry(userId, entryId, ipAddress, userAgent);
  },
  getUserEntries: async (userId: number, limit?: number, offset?: number, ipAddress?: string, userAgent?: string) => {
    const service = getWellnessService();
    return service.getUserEntries(userId, limit, offset, ipAddress, userAgent);
  },
  updateJournalEntry: async (userId: number, entryId: string, updates: Partial<JournalEntryInput>, ipAddress?: string, userAgent?: string) => {
    const service = getWellnessService();
    return service.updateJournalEntry(userId, entryId, updates, ipAddress, userAgent);
  },
  deleteJournalEntry: async (userId: number, entryId: string, ipAddress?: string, userAgent?: string) => {
    const service = getWellnessService();
    return service.deleteJournalEntry(userId, entryId, ipAddress, userAgent);
  },
  generateFeedback: async (entryId: string, userId: number) => {
    const service = getWellnessService();
    return service.generateFeedback(entryId, userId);
  },
  getFeedback: async (entryId: string) => {
    const service = getWellnessService();
    return service.getFeedback(entryId);
  },
  detectBurnoutSignals: async (userId: number, timeframe?: 'week' | 'month') => {
    const service = getWellnessService();
    return service.detectBurnoutSignals(userId, timeframe);
  },
  getWellnessTrends: async (userId: number, period?: 'week' | 'month') => {
    const service = getWellnessService();
    return service.getWellnessTrends(userId, period);
  },
};

}
}