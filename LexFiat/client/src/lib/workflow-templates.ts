/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Standard Workflow Templates
 * Based on Vincent AI workflows and enhanced for LexFiat's MAE framework
 */

export type WorkflowCategory = 
  | 'c-workflows'  // C workflows: Compare, Critique, Collaborate, etc. (adapted from SwimMeet Dive/Turn/Work)
  | 'document-review' 
  | 'litigation' 
  | 'transactional' 
  | 'compliance' 
  | 'client-intake'
  | 'research'
  | 'drafting';

export type WorkflowStepType = 
  | 'module' 
  | 'tool' 
  | 'ai' 
  | 'condition' 
  | 'approval' 
  | 'notification'
  | 'integration';

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  agent?: string; // MAE agent to use
  tool?: string; // Tool/module to execute
  description: string;
  config?: Record<string, any>;
  conditions?: {
    onSuccess?: string; // Next step ID on success
    onFailure?: string; // Next step ID on failure
    onCondition?: Array<{
      condition: string;
      nextStep: string;
    }>;
  };
  requiresApproval?: boolean;
  timeout?: number; // Timeout in seconds
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: WorkflowCategory;
  description: string;
  icon?: string;
  steps: WorkflowStep[];
  estimatedTime: string;
  useCases: string[];
  tags: string[];
  isDefault?: boolean;
  isCWorkflow?: boolean; // C workflows: Compare, Critique, Collaborate, etc. (adapted from SwimMeet)
}

/**
 * Standard Workflow Templates Library
 */
export const workflowTemplates: WorkflowTemplate[] = [
  // ========== C WORKFLOWS ==========
  // Adapted from SwimMeet's Dive/Turn/Work workflows
  // These are workflows that start with "C": Compare, Critique, Collaborate, etc.
  {
    id: 'compare',
    name: 'Compare',
    category: 'c-workflows',
    description: 'Multi-agent document comparison and analysis workflow (adapted from SwimMeet Dive)',
    isCWorkflow: true,
    steps: [
      {
        id: 'document-ingestion',
        name: 'Document Ingestion',
        type: 'module',
        tool: 'document_processor',
        description: 'Process and extract text from multiple documents',
      },
      {
        id: 'document-analysis',
        name: 'Document Analysis',
        type: 'ai',
        agent: 'document_analyzer',
        description: 'Analyze each document structure and content',
      },
      {
        id: 'comparative-analysis',
        name: 'Comparative Analysis',
        type: 'ai',
        agent: 'legal_comparator',
        description: 'Compare documents side-by-side, identify differences and similarities',
      },
      {
        id: 'fact-verification',
        name: 'Fact Verification',
        type: 'ai',
        agent: 'fact_checker',
        description: 'Verify facts and cross-reference information across documents',
      },
      {
        id: 'comparison-report',
        name: 'Comparison Report',
        type: 'ai',
        agent: 'report_generator',
        description: 'Generate comprehensive comparison report with findings',
      },
    ],
    estimatedTime: '5-10 minutes',
    useCases: ['Contract comparison', 'Pleading comparison', 'Document version comparison', 'Due diligence'],
    tags: ['compare', 'comparison', 'documents', 'analysis', 'swimmeet'],
    isDefault: true,
  },
  {
    id: 'critique',
    name: 'Critique',
    category: 'c-workflows',
    description: 'Legal document review and critique workflow (adapted from SwimMeet Turn)',
    isCWorkflow: true,
    steps: [
      {
        id: 'document-review',
        name: 'Document Review',
        type: 'ai',
        agent: 'document_analyzer',
        description: 'Comprehensive analysis of document structure and content',
      },
      {
        id: 'legal-review',
        name: 'Legal Review',
        type: 'ai',
        agent: 'legal_reviewer',
        description: 'Review legal compliance, identify legal issues and risks',
      },
      {
        id: 'compliance-check',
        name: 'Compliance Check',
        type: 'ai',
        agent: 'compliance_checker',
        description: 'Check against applicable regulations and standards',
      },
      {
        id: 'quality-assessment',
        name: 'Quality Assessment',
        type: 'ai',
        agent: 'quality_assessor',
        description: 'Assess document quality, identify improvements and recommendations',
      },
      {
        id: 'critique-report',
        name: 'Critique Report',
        type: 'ai',
        agent: 'report_generator',
        description: 'Generate detailed critique report with findings and recommendations',
      },
    ],
    estimatedTime: '8-15 minutes',
    useCases: ['Document review', 'Contract critique', 'Pleading review', 'Quality assurance'],
    tags: ['critique', 'review', 'quality', 'compliance', 'swimmeet'],
    isDefault: true,
  },
  {
    id: 'collaborate',
    name: 'Collaborate',
    category: 'c-workflows',
    description: 'Multi-party collaboration workflow (adapted from SwimMeet Work)',
    isCWorkflow: true,
    steps: [
      {
        id: 'collaboration-setup',
        name: 'Collaboration Setup',
        type: 'module',
        tool: 'collaboration_manager',
        description: 'Set up collaboration session and identify participants',
      },
      {
        id: 'task-distribution',
        name: 'Task Distribution',
        type: 'ai',
        agent: 'task_manager',
        description: 'Distribute tasks and coordinate work among participants',
      },
      {
        id: 'coordination',
        name: 'Coordination',
        type: 'ai',
        agent: 'collaboration_coordinator',
        description: 'Coordinate multi-agent collaboration and information sharing',
      },
      {
        id: 'communication-facilitation',
        name: 'Communication Facilitation',
        type: 'ai',
        agent: 'communication_facilitator',
        description: 'Facilitate communication and consensus building',
      },
      {
        id: 'synthesis',
        name: 'Synthesis',
        type: 'ai',
        agent: 'synthesis_agent',
        description: 'Synthesize contributions from all participants into final output',
      },
    ],
    estimatedTime: '10-20 minutes',
    useCases: ['Multi-party document review', 'Team collaboration', 'Consensus building', 'Joint analysis'],
    tags: ['collaborate', 'collaboration', 'multi-party', 'team', 'swimmeet'],
    isDefault: true,
  },
  {
    id: 'compose',
    name: 'Compose',
    category: 'c-workflows',
    description: 'AI-assisted document composition workflow',
    isCWorkflow: true,
    steps: [
      {
        id: 'requirements-analysis',
        name: 'Requirements Analysis',
        type: 'ai',
        agent: 'requirements_analyzer',
        description: 'Analyze document requirements and objectives',
      },
      {
        id: 'content-generation',
        name: 'Content Generation',
        type: 'ai',
        agent: 'draft_generator',
        description: 'Generate initial document content',
      },
      {
        id: 'structure-optimization',
        name: 'Structure Optimization',
        type: 'ai',
        agent: 'structure_optimizer',
        description: 'Optimize document structure and organization',
      },
      {
        id: 'refinement',
        name: 'Refinement',
        type: 'ai',
        agent: 'refinement_agent',
        description: 'Refine and polish document content',
      },
      {
        id: 'quality-check',
        name: 'Quality Check',
        type: 'ai',
        agent: 'quality_checker',
        description: 'Final quality check and validation',
      },
    ],
    estimatedTime: '10-15 minutes',
    useCases: ['Document drafting', 'Brief writing', 'Memo composition', 'Report generation'],
    tags: ['compose', 'drafting', 'writing', 'generation'],
  },
  {
    id: 'check',
    name: 'Check',
    category: 'c-workflows',
    description: 'Comprehensive document checking and validation workflow',
    isCWorkflow: true,
    steps: [
      {
        id: 'format-check',
        name: 'Format Check',
        type: 'module',
        tool: 'format_checker',
        description: 'Check document formatting and style compliance',
      },
      {
        id: 'citation-check',
        name: 'Citation Check',
        type: 'ai',
        agent: 'citation_checker',
        description: 'Verify citations and references',
      },
      {
        id: 'fact-check',
        name: 'Fact Check',
        type: 'ai',
        agent: 'fact_checker',
        description: 'Verify factual claims and statements',
      },
      {
        id: 'legal-check',
        name: 'Legal Check',
        type: 'ai',
        agent: 'legal_reviewer',
        description: 'Check legal accuracy and compliance',
      },
      {
        id: 'consistency-check',
        name: 'Consistency Check',
        type: 'ai',
        agent: 'consistency_checker',
        description: 'Check for internal consistency and coherence',
      },
    ],
    estimatedTime: '5-10 minutes',
    useCases: ['Document validation', 'Quality assurance', 'Pre-filing checks', 'Final review'],
    tags: ['check', 'validation', 'quality', 'verification'],
  },
  {
    id: 'calculate',
    name: 'Calculate',
    category: 'c-workflows',
    description: 'Financial and numerical calculation workflow',
    isCWorkflow: true,
    steps: [
      {
        id: 'data-extraction',
        name: 'Data Extraction',
        type: 'ai',
        agent: 'data_extractor',
        description: 'Extract numerical and financial data from documents',
      },
      {
        id: 'calculation-setup',
        name: 'Calculation Setup',
        type: 'module',
        tool: 'calculation_engine',
        description: 'Set up calculation formulas and parameters',
      },
      {
        id: 'financial-analysis',
        name: 'Financial Analysis',
        type: 'ai',
        agent: 'financial_analyst',
        description: 'Perform financial calculations and analysis',
      },
      {
        id: 'validation',
        name: 'Validation',
        type: 'ai',
        agent: 'validation_agent',
        description: 'Validate calculations and results',
      },
      {
        id: 'report-generation',
        name: 'Report Generation',
        type: 'ai',
        agent: 'report_generator',
        description: 'Generate calculation report with results',
      },
    ],
    estimatedTime: '5-8 minutes',
    useCases: ['Fee calculations', 'Damage calculations', 'Financial analysis', 'Settlement calculations'],
    tags: ['calculate', 'financial', 'numbers', 'analysis'],
  },

  // ========== DOCUMENT REVIEW WORKFLOWS ==========
  {
    id: 'document-review-standard',
    name: 'Standard Document Review',
    category: 'document-review',
    description: 'Comprehensive document review with red flag detection',
    steps: [
      {
        id: 'document-ingestion',
        name: 'Document Ingestion',
        type: 'module',
        tool: 'document_processor',
        description: 'Process and extract text from documents',
      },
      {
        id: 'initial-analysis',
        name: 'Initial Analysis',
        type: 'ai',
        agent: 'document_analyzer',
        description: 'Analyze document structure and content',
      },
      {
        id: 'red-flag-detection',
        name: 'Red Flag Detection',
        type: 'ai',
        agent: 'red_flag_finder',
        description: 'Identify potential issues and red flags',
      },
      {
        id: 'legal-review',
        name: 'Legal Review',
        type: 'ai',
        agent: 'legal_reviewer',
        description: 'Legal compliance and risk assessment',
      },
      {
        id: 'summary-generation',
        name: 'Summary Generation',
        type: 'ai',
        agent: 'summary_generator',
        description: 'Generate executive summary and recommendations',
      },
    ],
    estimatedTime: '5-10 minutes',
    useCases: ['Contract review', 'Pleading review', 'General document analysis'],
    tags: ['document', 'review', 'red-flags', 'compliance'],
    isDefault: true,
  },
  {
    id: 'contract-analysis',
    name: 'Contract Analysis',
    category: 'document-review',
    description: 'Deep contract analysis with clause identification and risk assessment',
    steps: [
      {
        id: 'contract-parsing',
        name: 'Contract Parsing',
        type: 'module',
        tool: 'contract_parser',
        description: 'Parse contract structure and identify clauses',
      },
      {
        id: 'clause-analysis',
        name: 'Clause Analysis',
        type: 'ai',
        agent: 'contract_analyzer',
        description: 'Analyze individual clauses for risk and compliance',
      },
      {
        id: 'term-extraction',
        name: 'Term Extraction',
        type: 'ai',
        agent: 'term_extractor',
        description: 'Extract key terms, dates, and obligations',
      },
      {
        id: 'comparison-benchmark',
        name: 'Benchmark Comparison',
        type: 'ai',
        agent: 'benchmark_comparator',
        description: 'Compare against standard contract templates',
      },
      {
        id: 'risk-assessment',
        name: 'Risk Assessment',
        type: 'ai',
        agent: 'risk_assessor',
        description: 'Comprehensive risk assessment and recommendations',
      },
    ],
    estimatedTime: '8-12 minutes',
    useCases: ['Contract negotiation', 'Due diligence', 'Contract review'],
    tags: ['contract', 'analysis', 'risk', 'clauses'],
  },

  // ========== LITIGATION WORKFLOWS ==========
  {
    id: 'motion-drafting',
    name: 'Motion Drafting',
    category: 'litigation',
    description: 'Complete motion drafting workflow with research and review',
    steps: [
      {
        id: 'case-context',
        name: 'Gather Case Context',
        type: 'module',
        tool: 'case_context_collector',
        description: 'Collect relevant case information and history',
      },
      {
        id: 'legal-research',
        name: 'Legal Research',
        type: 'ai',
        agent: 'legal_researcher',
        description: 'Research relevant case law and statutes',
      },
      {
        id: 'motion-draft',
        name: 'Draft Motion',
        type: 'ai',
        agent: 'motion_drafter',
        description: 'Generate motion draft with arguments and citations',
      },
      {
        id: 'citation-verification',
        name: 'Citation Verification',
        type: 'ai',
        agent: 'citation_checker',
        description: 'Verify and format citations',
      },
      {
        id: 'quality-review',
        name: 'Quality Review',
        type: 'ai',
        agent: 'quality_checker',
        description: 'Review for completeness and quality',
      },
      {
        id: 'attorney-review',
        name: 'Attorney Review',
        type: 'approval',
        description: 'Attorney review and approval',
        requiresApproval: true,
      },
    ],
    estimatedTime: '15-25 minutes',
    useCases: ['Motion drafting', 'Brief preparation', 'Pleading creation'],
    tags: ['litigation', 'drafting', 'motion', 'research'],
  },
  {
    id: 'discovery-management',
    name: 'Discovery Management',
    category: 'litigation',
    description: 'Automated discovery tracking and response workflow',
    steps: [
      {
        id: 'discovery-intake',
        name: 'Discovery Intake',
        type: 'module',
        tool: 'discovery_processor',
        description: 'Process incoming discovery requests',
      },
      {
        id: 'document-identification',
        name: 'Document Identification',
        type: 'ai',
        agent: 'document_identifier',
        description: 'Identify responsive documents',
      },
      {
        id: 'privilege-review',
        name: 'Privilege Review',
        type: 'ai',
        agent: 'privilege_reviewer',
        description: 'Review for privilege and work product',
      },
      {
        id: 'response-drafting',
        name: 'Response Drafting',
        type: 'ai',
        agent: 'response_drafter',
        description: 'Draft discovery responses',
      },
      {
        id: 'deadline-tracking',
        name: 'Deadline Tracking',
        type: 'module',
        tool: 'deadline_tracker',
        description: 'Track and manage discovery deadlines',
      },
    ],
    estimatedTime: '10-15 minutes',
    useCases: ['Discovery responses', 'Document production', 'Discovery tracking'],
    tags: ['litigation', 'discovery', 'document-production', 'deadlines'],
  },

  // ========== TRANSACTIONAL WORKFLOWS ==========
  {
    id: 'due-diligence',
    name: 'Due Diligence',
    category: 'transactional',
    description: 'Comprehensive due diligence workflow',
    steps: [
      {
        id: 'document-collection',
        name: 'Document Collection',
        type: 'module',
        tool: 'document_collector',
        description: 'Collect all relevant documents',
      },
      {
        id: 'document-review',
        name: 'Document Review',
        type: 'ai',
        agent: 'document_reviewer',
        description: 'Review documents for issues',
      },
      {
        id: 'issue-identification',
        name: 'Issue Identification',
        type: 'ai',
        agent: 'issue_finder',
        description: 'Identify potential deal issues',
      },
      {
        id: 'risk-assessment',
        name: 'Risk Assessment',
        type: 'ai',
        agent: 'risk_assessor',
        description: 'Assess transaction risks',
      },
      {
        id: 'diligence-report',
        name: 'Due Diligence Report',
        type: 'ai',
        agent: 'report_generator',
        description: 'Generate comprehensive due diligence report',
      },
    ],
    estimatedTime: '20-30 minutes',
    useCases: ['M&A transactions', 'Real estate deals', 'Business acquisitions'],
    tags: ['transactional', 'due-diligence', 'M&A', 'risk'],
  },

  // ========== COMPLIANCE WORKFLOWS ==========
  {
    id: 'compliance-check',
    name: 'Compliance Check',
    category: 'compliance',
    description: 'Automated compliance checking workflow',
    steps: [
      {
        id: 'document-analysis',
        name: 'Document Analysis',
        type: 'ai',
        agent: 'document_analyzer',
        description: 'Analyze document for compliance requirements',
      },
      {
        id: 'regulation-check',
        name: 'Regulation Check',
        type: 'ai',
        agent: 'compliance_checker',
        description: 'Check against applicable regulations',
      },
      {
        id: 'violation-detection',
        name: 'Violation Detection',
        type: 'ai',
        agent: 'violation_detector',
        description: 'Identify potential violations',
      },
      {
        id: 'remediation-recommendations',
        name: 'Remediation Recommendations',
        type: 'ai',
        agent: 'remediation_advisor',
        description: 'Generate remediation recommendations',
      },
    ],
    estimatedTime: '5-8 minutes',
    useCases: ['Regulatory compliance', 'Policy compliance', 'Audit preparation'],
    tags: ['compliance', 'regulations', 'audit', 'risk'],
  },

  // ========== CLIENT INTAKE WORKFLOWS ==========
  {
    id: 'client-intake',
    name: 'Client Intake',
    category: 'client-intake',
    description: 'Automated client intake and conflict check workflow',
    steps: [
      {
        id: 'intake-form-processing',
        name: 'Intake Form Processing',
        type: 'module',
        tool: 'intake_processor',
        description: 'Process client intake forms',
      },
      {
        id: 'conflict-check',
        name: 'Conflict Check',
        type: 'ai',
        agent: 'conflict_checker',
        description: 'Check for conflicts of interest',
      },
      {
        id: 'matter-setup',
        name: 'Matter Setup',
        type: 'module',
        tool: 'matter_creator',
        description: 'Create new matter in system',
      },
      {
        id: 'initial-assessment',
        name: 'Initial Assessment',
        type: 'ai',
        agent: 'case_assessor',
        description: 'Assess case viability and strategy',
      },
      {
        id: 'engagement-letter',
        name: 'Engagement Letter Generation',
        type: 'ai',
        agent: 'document_generator',
        description: 'Generate engagement letter',
      },
    ],
    estimatedTime: '8-12 minutes',
    useCases: ['New client intake', 'Conflict checking', 'Matter creation'],
    tags: ['intake', 'client', 'conflict-check', 'onboarding'],
  },

  // ========== RESEARCH WORKFLOWS ==========
  {
    id: 'legal-research',
    name: 'Legal Research',
    category: 'research',
    description: 'Comprehensive legal research workflow',
    steps: [
      {
        id: 'research-query',
        name: 'Research Query Analysis',
        type: 'ai',
        agent: 'query_analyzer',
        description: 'Analyze research query and identify key issues',
      },
      {
        id: 'case-law-research',
        name: 'Case Law Research',
        type: 'ai',
        agent: 'case_researcher',
        description: 'Research relevant case law',
      },
      {
        id: 'statute-research',
        name: 'Statute Research',
        type: 'ai',
        agent: 'statute_researcher',
        description: 'Research applicable statutes',
      },
      {
        id: 'secondary-research',
        name: 'Secondary Sources',
        type: 'ai',
        agent: 'secondary_researcher',
        description: 'Research treatises and secondary sources',
      },
      {
        id: 'research-memo',
        name: 'Research Memo Generation',
        type: 'ai',
        agent: 'memo_generator',
        description: 'Generate comprehensive research memo',
      },
    ],
    estimatedTime: '15-20 minutes',
    useCases: ['Case law research', 'Statutory research', 'Legal memo preparation'],
    tags: ['research', 'case-law', 'statutes', 'memo'],
  },

  // ========== DRAFTING WORKFLOWS ==========
  {
    id: 'document-drafting',
    name: 'Document Drafting',
    category: 'drafting',
    description: 'Complete document drafting workflow',
    steps: [
      {
        id: 'template-selection',
        name: 'Template Selection',
        type: 'module',
        tool: 'template_selector',
        description: 'Select appropriate document template',
      },
      {
        id: 'content-generation',
        name: 'Content Generation',
        type: 'ai',
        agent: 'draft_generator',
        description: 'Generate document content',
      },
      {
        id: 'legal-review',
        name: 'Legal Review',
        type: 'ai',
        agent: 'legal_reviewer',
        description: 'Review for legal accuracy',
      },
      {
        id: 'formatting',
        name: 'Formatting',
        type: 'module',
        tool: 'document_formatter',
        description: 'Format document according to standards',
      },
      {
        id: 'quality-check',
        name: 'Quality Check',
        type: 'ai',
        agent: 'quality_checker',
        description: 'Final quality check',
      },
    ],
    estimatedTime: '10-15 minutes',
    useCases: ['Document creation', 'Template-based drafting', 'Standard documents'],
    tags: ['drafting', 'documents', 'templates', 'generation'],
  },
];

/**
 * Get workflows by category
 */
export function getWorkflowsByCategory(category: WorkflowCategory): WorkflowTemplate[] {
  return workflowTemplates.filter(w => w.category === category);
}

/**
 * Get C workflows (Compare, Critique, Collaborate, etc.)
 */
export function getCWorkflows(): WorkflowTemplate[] {
  return workflowTemplates.filter(w => w.isCWorkflow === true);
}

/**
 * Get default workflows
 */
export function getDefaultWorkflows(): WorkflowTemplate[] {
  return workflowTemplates.filter(w => w.isDefault === true);
}

/**
 * Get workflow by ID
 */
export function getWorkflowById(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find(w => w.id === id);
}

/**
 * Search workflows
 */
export function searchWorkflows(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase();
  return workflowTemplates.filter(w => 
    w.name.toLowerCase().includes(lowerQuery) ||
    w.description.toLowerCase().includes(lowerQuery) ||
    w.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    w.useCases.some(uc => uc.toLowerCase().includes(lowerQuery))
  );
}
