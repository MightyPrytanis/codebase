/*
 * Arkiver Onboarding Configuration
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import type { LucideIcon } from "lucide-react";
import { 
  User,
  Sparkles,
  Settings,
  Shield,
  FileText,
} from "lucide-react";

export interface OnboardingStepConfig {
  id: number;
  key: string;
  title: string;
  icon: LucideIcon;
  description?: string;
  required?: boolean;
}

export interface OnboardingReferenceData {
  extractionModes: string[];
  insightTypes: string[];
  llmProviders: string[];
}

export interface OnboardingConfig {
  appId: string;
  appName: string;
  steps: OnboardingStepConfig[];
  references: OnboardingReferenceData;
}

export const ARKIVER_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: "arkiver",
  appName: "Arkiver",
  steps: [
    {
      id: 1,
      key: "user_profile",
      title: "User Profile",
      icon: User,
      required: true,
      description: "Set up your account and preferences.",
    },
    {
      id: 2,
      key: "ai_provider",
      title: "AI Provider",
      icon: Sparkles,
      required: true,
      description: "Select and test your primary LLM provider for extraction and insights.",
    },
    {
      id: 3,
      key: "extraction_settings",
      title: "Extraction Settings",
      icon: FileText,
      required: true,
      description: "Configure default extraction preferences.",
    },
    {
      id: 4,
      key: "ai_integrity",
      title: "AI Integrity Monitoring",
      icon: Shield,
      required: false,
      description: "Set up drift and bias detection thresholds.",
    },
    {
      id: 5,
      key: "preferences",
      title: "Preferences",
      icon: Settings,
      required: false,
      description: "Configure general application preferences.",
    },
  ],
  references: {
    extractionModes: ["standard", "deep", "fast"],
    insightTypes: ["general", "legal", "medical", "business"],
    llmProviders: ["perplexity", "anthropic", "openai", "google", "xai", "deepseek", "openrouter"],
  },
};
