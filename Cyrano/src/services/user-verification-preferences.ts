/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { AIProvider } from './ai-service.js';

export type VerificationMode = 'simple' | 'standard' | 'comprehensive' | 'custom';
export type ProviderStrategy = 'single' | 'mixed';

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  role: 'fact_check' | 'trust_chain' | 'reasoning';
  weight: number; // For confidence scoring (0.0-1.0)
}

export interface CustomVerificationConfig {
  name: string;
  description?: string;
  models: ModelConfig[];
  providerStrategy: ProviderStrategy;
}

export interface UserVerificationPreferences {
  userId?: string; // For future database integration
  defaultMode: VerificationMode;
  defaultProviderStrategy: ProviderStrategy;
  customConfigs?: CustomVerificationConfig[];
  lastUsedMode?: VerificationMode;
  showRecommendations: boolean;
  savedPreferences: {
    [toolName: string]: {
      mode: VerificationMode;
      providerStrategy: ProviderStrategy;
      customConfigId?: string;
    };
  };
}

/**
 * User Verification Preferences Manager
 * Implements user sovereignty by persisting and respecting user choices
 */
export class UserVerificationPreferencesManager {
  private static instance: UserVerificationPreferencesManager;
  private preferences: Map<string, UserVerificationPreferences> = new Map();
  private readonly STORAGE_KEY = 'cyrano_verification_preferences';

  private constructor() {
    this.loadPreferences();
  }

  public static getInstance(): UserVerificationPreferencesManager {
    if (!UserVerificationPreferencesManager.instance) {
      UserVerificationPreferencesManager.instance = new UserVerificationPreferencesManager();
    }
    return UserVerificationPreferencesManager.instance;
  }

  /**
   * Get preferences for a user (or default if not found)
   */
  public getPreferences(userId: string = 'default'): UserVerificationPreferences {
    const prefs = this.preferences.get(userId);
    if (prefs) {
      return prefs;
    }

    // Return default preferences
    const defaultPrefs: UserVerificationPreferences = {
      userId,
      defaultMode: 'standard',
      defaultProviderStrategy: 'single',
      showRecommendations: true,
      savedPreferences: {},
    };

    this.preferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Save preferences for a user (user sovereignty)
   */
  public savePreferences(preferences: UserVerificationPreferences): void {
    const userId = preferences.userId || 'default';
    this.preferences.set(userId, {
      ...preferences,
      lastUpdated: new Date().toISOString(),
    } as any);
    this.persistPreferences();
  }

  /**
   * Update default mode for a user
   */
  public setDefaultMode(userId: string, mode: VerificationMode): void {
    const prefs = this.getPreferences(userId);
    prefs.defaultMode = mode;
    this.savePreferences(prefs);
  }

  /**
   * Update default provider strategy for a user
   */
  public setDefaultProviderStrategy(userId: string, strategy: ProviderStrategy): void {
    const prefs = this.getPreferences(userId);
    prefs.defaultProviderStrategy = strategy;
    this.savePreferences(prefs);
  }

  /**
   * Save a custom verification configuration
   */
  public saveCustomConfig(userId: string, config: CustomVerificationConfig): void {
    const prefs = this.getPreferences(userId);
    if (!prefs.customConfigs) {
      prefs.customConfigs = [];
    }
    
    // Update existing or add new
    const index = prefs.customConfigs.findIndex(c => c.name === config.name);
    if (index >= 0) {
      prefs.customConfigs[index] = config;
    } else {
      prefs.customConfigs.push(config);
    }
    
    this.savePreferences(prefs);
  }

  /**
   * Get a custom configuration by name
   */
  public getCustomConfig(userId: string, configName: string): CustomVerificationConfig | undefined {
    const prefs = this.getPreferences(userId);
    return prefs.customConfigs?.find(c => c.name === configName);
  }

  /**
   * Save tool-specific preferences
   */
  public saveToolPreference(
    userId: string,
    toolName: string,
    mode: VerificationMode,
    providerStrategy: ProviderStrategy,
    customConfigId?: string
  ): void {
    const prefs = this.getPreferences(userId);
    prefs.savedPreferences[toolName] = {
      mode,
      providerStrategy,
      customConfigId,
    };
    prefs.lastUsedMode = mode;
    this.savePreferences(prefs);
  }

  /**
   * Get tool-specific preferences (falls back to user defaults)
   */
  public getToolPreference(userId: string, toolName: string): {
    mode: VerificationMode;
    providerStrategy: ProviderStrategy;
    customConfigId?: string;
  } {
    const prefs = this.getPreferences(userId);
    const toolPrefs = prefs.savedPreferences[toolName];
    
    if (toolPrefs) {
      return toolPrefs;
    }

    // Fall back to user defaults
    return {
      mode: prefs.defaultMode,
      providerStrategy: prefs.defaultProviderStrategy,
    };
  }

  /**
   * Load preferences from storage (localStorage for now, can be extended to database)
   */
  private loadPreferences(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.entries(parsed).forEach(([userId, prefs]) => {
            this.preferences.set(userId, prefs as UserVerificationPreferences);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load verification preferences:', error);
    }
  }

  /**
   * Persist preferences to storage
   */
  private persistPreferences(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const toStore: Record<string, UserVerificationPreferences> = {};
        this.preferences.forEach((prefs, userId) => {
          toStore[userId] = prefs;
        });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
      }
    } catch (error) {
      console.warn('Failed to persist verification preferences:', error);
    }
  }

  /**
   * Clear preferences for a user (for testing/reset)
   */
  public clearPreferences(userId: string): void {
    this.preferences.delete(userId);
    this.persistPreferences();
  }
}

export const userVerificationPreferences = UserVerificationPreferencesManager.getInstance();


