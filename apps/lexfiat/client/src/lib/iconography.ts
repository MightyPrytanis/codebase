/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Uniform Iconography System for LexFiat
 * 
 * This file defines the consistent icon language/style used throughout LexFiat.
 * All icons should use lucide-react and follow these guidelines:
 * 
 * - Header/Navigation: Use standard lucide-react icons (Bell, Settings, Wifi, Clock, HelpCircle)
 * - Widgets: Use semantic icons that match function (Brain for AI, TrendingUp for Performance, etc.)
 * - Buttons: Use action-oriented icons (Send, Save, RefreshCw, etc.)
 * - Status: Use status icons (CheckCircle, AlertTriangle, XCircle, etc.)
 * 
 * Icon Style Guidelines:
 * - Size: w-4 h-4 for small, w-5 h-5 for medium, w-6 h-6 for large
 * - Colors: Use theme colors (accent-gold, status-*, primary, secondary)
 * - Consistency: Same icon for same function across the app
 */

import {
  // Navigation & Header
  Bell, Settings, Wifi, Clock, HelpCircle,
  
  // Core Functions
  Brain, // GoodCounsel, AI features
  FileText, // Documents
  Mail, // Email, Intake
  CheckCircle, // Review, Approval
  TrendingUp, // Performance
  AlertTriangle, // Alerts, Warnings
  Calendar, // Today's Focus, Scheduling
  
  // Actions
  Send, Save, RefreshCw, Plus, X, Edit, Trash2,
  
  // Status
  XCircle, AlertCircle, Info,
  
  // Workflow
  Maximize2, GripVertical,
  
  // Testing
  Bug,
  
  // Other
  Users, Zap, Shield, FileText as FileTextIcon,
} from "lucide-react";

/**
 * Icon mapping for consistent usage
 */
export const Icons = {
  // Navigation
  navigation: {
    settings: Settings,
    notifications: Bell,
    help: HelpCircle,
    clock: Clock,
    wifi: Wifi,
  },
  
  // Core Features
  features: {
    goodCounsel: Brain,
    documents: FileText,
    email: Mail,
    review: CheckCircle,
    performance: TrendingUp,
    alerts: AlertTriangle,
    calendar: Calendar,
    clients: Users,
    automation: Zap,
    security: Shield,
  },
  
  // Actions
  actions: {
    send: Send,
    save: Save,
    refresh: RefreshCw,
    add: Plus,
    remove: X,
    edit: Edit,
    delete: Trash2,
  },
  
  // Status
  status: {
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
    critical: AlertCircle,
  },
  
  // Workflow
  workflow: {
    expand: Maximize2,
    drag: GripVertical,
  },
  
  // Testing
  testing: {
    bug: Bug,
  },
} as const;

/**
 * Get icon component by category and name
 */
export function getIcon(category: keyof typeof Icons, name: string) {
  const categoryIcons = Icons[category];
  return (categoryIcons as any)[name] || null;
}

/**
 * Standard icon sizes
 */
export const IconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
} as const;

/**
 * Standard icon colors (use with Tailwind classes)
 */
export const IconColors = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent-gold",
  success: "text-status-success",
  warning: "text-status-warning",
  error: "text-status-critical",
  info: "text-status-processing",
} as const;

