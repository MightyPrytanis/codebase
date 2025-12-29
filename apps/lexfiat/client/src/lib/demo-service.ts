/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Demo Service
 * Handles loading and managing demo data using mock pleadings
 */

import { DEMO_CASES, MOCK_PLEADINGS, getAllDemoCases, getAllDemoDocuments } from './demo-data';
import { safeSetJSON, safeGetJSON, safeRemoveItem, safeGetItem } from './secure-storage';

export interface DemoLoadResult {
  casesLoaded: number;
  documentsLoaded: number;
  redFlagsLoaded: number;
  success: boolean;
  message?: string;
}

/**
 * Load demo data for a specific scenario
 */
export async function loadDemoScenario(scenarioId: string): Promise<DemoLoadResult> {
  try {
    // Store demo data in localStorage for demo mode
    const demoData = {
      scenario: scenarioId,
      cases: getAllDemoCases(),
      documents: getAllDemoDocuments(),
      loadedAt: new Date().toISOString(),
    };

    safeSetJSON('lexfiat_demo_data', demoData);
    safeSetItem('lexfiat_demo_mode', 'true');

    // Generate red flags based on demo cases
    const redFlags = generateDemoRedFlags(demoData.cases);

    return {
      casesLoaded: demoData.cases.length,
      documentsLoaded: demoData.documents.length,
      redFlagsLoaded: redFlags.length,
      success: true,
      message: `Demo scenario "${scenarioId}" loaded successfully`,
    };
  } catch (error) {
    console.error('Failed to load demo scenario:', error);
    return {
      casesLoaded: 0,
      documentsLoaded: 0,
      redFlagsLoaded: 0,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clear demo data
 */
export function clearDemoData(): void {
  safeRemoveItem('lexfiat_demo_data');
  safeRemoveItem('lexfiat_demo_mode');
}

/**
 * Check if demo mode is active
 */
export function isDemoMode(): boolean {
  return safeGetItem('lexfiat_demo_mode') === 'true';
}

/**
 * Get demo data from localStorage
 */
export function getDemoData(): any {
  return safeGetJSON('lexfiat_demo_data');
}

/**
 * Generate demo red flags based on cases
 */
function generateDemoRedFlags(cases: any[]): any[] {
  const flags: any[] = [];

  cases.forEach((case_) => {
    if (case_.priority === 'critical' && case_.deadline) {
      flags.push({
        id: `flag-${case_.id}-deadline`,
        case_id: case_.id,
        priority: 'critical',
        type: 'deadline',
        message: `Critical deadline approaching: ${case_.case_name}`,
        deadline: case_.deadline,
        timestamp: new Date().toISOString(),
      });
    }

    if (case_.documents && case_.documents.length > 0) {
      flags.push({
        id: `flag-${case_.id}-documents`,
        case_id: case_.id,
        priority: 'high',
        type: 'documents',
        message: `${case_.documents.length} documents require review: ${case_.case_name}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return flags;
}

/**
 * Get demo cases for display
 */
export function getDemoCases(): any[] {
  const demoData = getDemoData();
  return demoData?.cases || getAllDemoCases();
}

/**
 * Get demo documents for display
 */
export function getDemoDocuments(): any[] {
  const demoData = getDemoData();
  return demoData?.documents || getAllDemoDocuments();
}

