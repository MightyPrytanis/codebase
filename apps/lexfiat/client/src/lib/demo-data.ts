/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Demo Data Service
 * Provides demo data using the actual mock pleadings from /assets/demo-documents/mock_pleadings/
 */

export interface DemoDocument {
  id: string;
  filename: string;
  type: 'pdf' | 'docx' | 'txt';
  path: string;
  caseName: string;
  description: string;
  uploadDate: string;
}

export interface DemoCase {
  id: string;
  case_name: string;
  court: string;
  jurisdiction: string;
  deadline?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  description: string;
  documents: DemoDocument[];
}

/**
 * Mock pleadings available in demo mode
 */
export const MOCK_PLEADINGS: DemoDocument[] = [
  {
    id: 'johnson-tro-response',
    filename: 'Johnson_v_Johnson_Draft_Response_to_TRO.docx',
    type: 'docx',
    path: '/assets/demo-documents/mock_pleadings/Johnson_v_Johnson_Draft_Response_to_TRO.docx',
    caseName: 'Johnson v Johnson',
    description: 'Draft response to Temporary Restraining Order',
    uploadDate: '2025-11-25',
  },
  {
    id: 'johnson-tro-emergency',
    filename: 'Johnson_v_Johnson_TRO_Emergency_Motion_DRAFT.txt',
    type: 'txt',
    path: '/assets/demo-documents/mock_pleadings/Johnson_v_Johnson_TRO_Emergency_Motion_DRAFT.txt',
    caseName: 'Johnson v Johnson',
    description: 'Emergency motion for Temporary Restraining Order',
    uploadDate: '2025-11-24',
  },
  {
    id: 'johnson-tro-full',
    filename: 'Johnson_v_Johnson_TRO_Emergency_Motion_FULL.pdf',
    type: 'pdf',
    path: '/assets/demo-documents/mock_pleadings/Johnson_v_Johnson_TRO_Emergency_Motion_FULL.pdf',
    caseName: 'Johnson v Johnson',
    description: 'Full TRO Emergency Motion document',
    uploadDate: '2025-11-24',
  },
  {
    id: 'mdag-response',
    filename: 'MDAG_Response_to_Towne_MSJ_DRAFT.pdf',
    type: 'pdf',
    path: '/assets/demo-documents/mock_pleadings/MDAG_Response_to_Towne_MSJ_DRAFT.pdf',
    caseName: 'Towne v MDAG',
    description: 'Response to Motion for Summary Judgment',
    uploadDate: '2025-11-23',
  },
  {
    id: 'morgan-mediation',
    filename: 'Morgan_v_Morgan_Livingston_Mediation_Summary_DRAFT.docx',
    type: 'docx',
    path: '/assets/demo-documents/mock_pleadings/Morgan_v_Morgan_Livingston_Mediation_Summary_DRAFT.docx',
    caseName: 'Morgan v Morgan',
    description: 'Livingston County Mediation Summary',
    uploadDate: '2025-11-22',
  },
  {
    id: 'morgan-mediation-txt',
    filename: 'Morgan_v_Morgan_Livingston_Mediation_Summary_DRAFT.txt',
    type: 'txt',
    path: '/assets/demo-documents/mock_pleadings/Morgan_v_Morgan_Livingston_Mediation_Summary_DRAFT.txt',
    caseName: 'Morgan v Morgan',
    description: 'Livingston County Mediation Summary (text)',
    uploadDate: '2025-11-22',
  },
  {
    id: 'towne-msj',
    filename: 'Towne_v_MDAG_Motion_for_Summary_Judgment_DRAFT.docx',
    type: 'docx',
    path: '/assets/demo-documents/mock_pleadings/Towne_v_MDAG_Motion_for_Summary_Judgment_DRAFT.docx',
    caseName: 'Towne v MDAG',
    description: 'Motion for Summary Judgment',
    uploadDate: '2025-11-21',
  },
  {
    id: 'towne-msj-txt',
    filename: 'Towne_v_MDAG_Motion_for_Summary_Judgment_DRAFT.txt',
    type: 'txt',
    path: '/assets/demo-documents/mock_pleadings/Towne_v_MDAG_Motion_for_Summary_Judgment_DRAFT.txt',
    caseName: 'Towne v MDAG',
    description: 'Motion for Summary Judgment (text)',
    uploadDate: '2025-11-21',
  },
];

/**
 * Demo cases built from mock pleadings
 */
export const DEMO_CASES: DemoCase[] = [
  {
    id: 'case-johnson',
    case_name: 'Johnson v Johnson',
    court: 'Wayne County Circuit Court',
    jurisdiction: 'Wayne County',
    deadline: '2025-11-27T17:00:00',
    priority: 'critical',
    status: 'Active',
    description: 'Family law matter involving emergency TRO proceedings',
    documents: MOCK_PLEADINGS.filter(d => d.caseName === 'Johnson v Johnson'),
  },
  {
    id: 'case-towne',
    case_name: 'Towne v MDAG',
    court: 'Michigan Court of Claims',
    jurisdiction: 'State of Michigan',
    deadline: '2025-12-01T17:00:00',
    priority: 'high',
    status: 'Active',
    description: 'Administrative law matter with motion for summary judgment',
    documents: MOCK_PLEADINGS.filter(d => d.caseName === 'Towne v MDAG'),
  },
  {
    id: 'case-morgan',
    case_name: 'Morgan v Morgan',
    court: 'Livingston County Circuit Court',
    jurisdiction: 'Livingston County',
    deadline: '2025-11-30T17:00:00',
    priority: 'medium',
    status: 'Mediation',
    description: 'Family law matter in mediation phase',
    documents: MOCK_PLEADINGS.filter(d => d.caseName === 'Morgan v Morgan'),
  },
];

/**
 * Get demo case by ID
 */
export function getDemoCase(caseId: string): DemoCase | undefined {
  return DEMO_CASES.find(c => c.id === caseId);
}

/**
 * Get all demo cases
 */
export function getAllDemoCases(): DemoCase[] {
  return DEMO_CASES;
}

/**
 * Get demo documents for a case
 */
export function getDemoDocuments(caseId: string): DemoDocument[] {
  const case_ = getDemoCase(caseId);
  return case_?.documents || [];
}

/**
 * Get all demo documents
 */
export function getAllDemoDocuments(): DemoDocument[] {
  return MOCK_PLEADINGS;
}

/**
 * Load demo document content (for text files)
 */
export async function loadDemoDocumentContent(document: DemoDocument): Promise<string | null> {
  if (document.type === 'txt') {
    try {
      const response = await fetch(document.path);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.error('Failed to load demo document', document.filename, ':', error);
    }
  }
  return null;
}

/**
 * Mock red flags for demo mode
 */
export const mockRedFlags = [
  {
    id: 'rf-001',
    description: 'Potential statute of limitations issue in Johnson v Johnson',
    case_name: 'Johnson v Johnson',
    severity: 'high',
    status: 'open',
  },
  {
    id: 'rf-002',
    description: 'Missing required documentation in Hartley Estate filing',
    case_name: 'Hartley Estate',
    severity: 'medium',
    status: 'processing',
  },
];

/**
 * Mock cases for demo mode (alias for DEMO_CASES)
 */
export const mockCases = DEMO_CASES;
