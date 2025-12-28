/*
 * Generic Onboarding Configuration
 * 
 * This module defines a reusable, app-agnostic configuration shape for
 * multi-step onboarding wizards. LexFiat provides one concrete instance
 * of this configuration; other clients (Arkiver, future apps) should
 * define their own config objects using the same types.
 */

import type { LucideIcon } from "lucide-react";
import { 
  Scale,
  MapPin,
  Tag,
  HardDrive,
  Sparkles,
  Clock,
  Plug,
  FileCheck,
} from "lucide-react";

/**
 * Generic step definition for the onboarding wizard.
 * 
 * - `id` is the stable step index (1-based).
 * - `key` is an app-defined identifier (used for persistence/analytics).
 */
export interface OnboardingStepConfig {
  id: number;
  key: string;
  title: string;
  icon: LucideIcon;
  /**
   * Optional short description shown in UI or docs.
   */
  description?: string;
  /**
   * Whether this step is required to consider onboarding "complete".
   * Validation logic is implemented in the app, but this flag makes
   * intent explicit for all clients.
   */
  required?: boolean;
}

/**
 * Core lists used by jurisdiction- and practice-profile–style onboarding
 * flows. Other apps can extend or replace these completely.
 */
export interface OnboardingReferenceData {
  jurisdictions: string[];
  practiceAreas: string[];
  commonIssueTags: string[];
}

/**
 * High‑level configuration for an app's onboarding flow.
 * 
 * This is intentionally generic: forms, API calls, and validation are
 * implemented by the client app, but wired to these shared definitions.
 */
export interface OnboardingConfig {
  /**
   * Machine identifier for the app using this config (e.g. "lexfiat", "arkiver").
   */
  appId: string;
  /**
   * Human‑readable app name for headings and copy.
   */
  appName: string;
  /**
   * Ordered list of steps for the onboarding wizard.
   */
  steps: OnboardingStepConfig[];
  /**
   * Reference data used to populate selectors and checklists.
   */
  references: OnboardingReferenceData;
}

/**
 * LexFiat-specific implementation of the generic onboarding configuration.
 * 
 * Other apps should create their own config objects in their respective
 * frontends and pass them into a shared onboarding wizard component.
 */
export const LEXFIAT_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: "lexfiat",
  appName: "LexFiat",
  steps: [
    {
      id: 1,
      key: "jurisdiction_practice",
      title: "Jurisdiction & Practice Areas",
      icon: Scale,
      required: true,
      description: "Select your primary jurisdiction and core practice areas.",
    },
    {
      id: 2,
      key: "counties_courts",
      title: "Counties & Courts",
      icon: MapPin,
      required: true,
      description: "Add the counties and courts where you regularly practice.",
    },
    {
      id: 3,
      key: "issue_tags",
      title: "Issue Tags",
      icon: Tag,
      required: true,
      description: "Choose common issues to improve search and organization.",
    },
    {
      id: 4,
      key: "storage_locations",
      title: "Storage Locations",
      icon: HardDrive,
      required: false,
      description: "Configure where your library documents live (local & cloud).",
    },
    {
      id: 5,
      key: "ai_provider",
      title: "AI Provider",
      icon: Sparkles,
      required: true,
      description: "Select and test your primary LLM and research providers.",
    },
    {
      id: 6,
      key: "time_tracking",
      title: "Time Tracking Setup",
      icon: Clock,
      required: false,
      description: "Set up a baseline for Chronometric time reconstruction.",
    },
    {
      id: 7,
      key: "integrations",
      title: "Integrations",
      icon: Plug,
      required: false,
      description: "Connect your practice management, email, calendar, and research tools.",
    },
    {
      id: 8,
      key: "review_complete",
      title: "Review & Complete",
      icon: FileCheck,
      required: true,
      description: "Review your settings and complete setup.",
    },
  ],
  references: {
    jurisdictions: [
      "Alabama", "Alaska", "American Samoa", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
      "Delaware", "District of Columbia", "Florida", "Georgia", "Guam", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
      "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
      "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
      "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Northern Mariana Islands", "Ohio",
      "Oklahoma", "Oregon", "Pennsylvania", "Puerto Rico", "Rhode Island", "South Carolina", "South Dakota",
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
      "Wisconsin", "Wyoming", "U.S. Virgin Islands",
    ],
    practiceAreas: [
      "Family Law",
      "Criminal Defense",
      "Personal Injury",
      "Estate Planning",
      "Real Estate",
      "Business Law",
      "Employment Law",
      "Immigration",
      "Bankruptcy",
      "Tax Law",
      "Intellectual Property",
      "Civil Litigation",
      "Administrative",
      "Government",
      "Civil Rights",
    ],
    commonIssueTags: [
      "divorce", "custody", "parenting-time", "child-support", "spousal-support",
      "property-division", "restraining-order", "adoption", "guardianship",
      "criminal-charges", "dui", "expungement", "appeals",
      "personal-injury", "medical-malpractice", "workers-comp",
      "estate-planning", "wills", "trusts", "probate",
      "contracts", "business-formation", "partnership-disputes",
    ],
  },
};

/**
 * Placeholder export for future Arkiver onboarding configuration.
 * 
 * Once Arkiver implements its own onboarding flow, it should define
 * an `ARKIVER_ONBOARDING_CONFIG` object that conforms to `OnboardingConfig`
 * and can be consumed by the shared onboarding wizard.
 */
// export const ARKIVER_ONBOARDING_CONFIG: OnboardingConfig = { ... };

