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
  | 'c-suite' 
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
  isCSuite?: boolean; // C-Suite executive workflows
}

/**
 * Standard Workflow Templates Library
 */
export const workflowTemplates: WorkflowTemplate[] = [
  // ========== C-SUITE WORKFLOWS ==========
  {
    id: 'csuite-case-overview',
    name: 'Executive Case Overview',
    category: 'c-suite',
    description: 'High-level case status and risk assessment for executive review',
    isCSuite: true,
    steps: [
      {
        id: 'collect-case-data',
        name: 'Collect Case Data',
        type: 'module',
        tool: 'case_data_collector',
        description: 'Aggregate all case information, documents, deadlines, and status',
      },
      {
        id: 'risk-analysis',
        name: 'Risk Analysis',
        type: 'ai',
        agent: 'risk_analyst',
        description: 'AI-powered risk assessment and exposure analysis',
      },
      {
        id: 'financial-summary',
        name: 'Financial Summary',
        type: 'module',
        tool: 'financial_aggregator',
        description: 'Calculate fees, costs, and potential outcomes',
      },
      {
        id: 'executive-dashboard',
        name: 'Executive Dashboard',
        type: 'module',
        tool: 'executive_dashboard_generator',
        description: 'Generate executive-level summary dashboard',
      },
    ],
    estimatedTime: '3-5 minutes',
    useCases: ['Weekly case reviews', 'Client reporting', 'Strategic planning'],
    tags: ['executive', 'reporting', 'risk', 'dashboard'],
  },
  {
    id: 'csuite-portfolio-analysis',
    name: 'Portfolio Analysis',
    category: 'c-suite',
    description: 'Comprehensive analysis of entire case portfolio',
    isCSuite: true,
    steps: [
      {
        id: 'portfolio-collection',
        name: 'Portfolio Collection',
        type: 'module',
        tool: 'portfolio_collector',
        description: 'Gather data from all active cases',
      },
      {
        id: 'trend-analysis',
        name: 'Trend Analysis',
        type: 'ai',
        agent: 'trend_analyst',
        description: 'Identify patterns, trends, and anomalies across portfolio',
      },
      {
        id: 'resource-allocation',
        name: 'Resource Allocation Analysis',
        type: 'ai',
        agent: 'resource_optimizer',
        description: 'Analyze resource utilization and recommend optimization',
      },
      {
        id: 'strategic-recommendations',
        name: 'Strategic Recommendations',
        type: 'ai',
        agent: 'strategic_advisor',
        description: 'Generate strategic recommendations for portfolio management',
      },
    ],
    estimatedTime: '10-15 minutes',
    useCases: ['Monthly portfolio reviews', 'Resource planning', 'Strategic decisions'],
    tags: ['executive', 'portfolio', 'strategy', 'analytics'],
  },
  {
    id: 'csuite-client-relationship',
    name: 'Client Relationship Management',
    category: 'c-suite',
    description: 'Comprehensive client relationship analysis and recommendations',
    isCSuite: true,
    steps: [
      {
        id: 'client-data-aggregation',
        name: 'Client Data Aggregation',
        type: 'module',
        tool: 'client_data_aggregator',
        description: 'Collect all client interaction data',
      },
      {
        id: 'relationship-analysis',
        name: 'Relationship Analysis',
        type: 'ai',
        agent: 'relationship_analyst',
        description: 'Analyze client satisfaction, engagement, and risk factors',
      },
      {
        id: 'retention-strategy',
        name: 'Retention Strategy',
        type: 'ai',
        agent: 'retention_advisor',
        description: 'Generate client retention and growth strategies',
      },
      {
        id: 'executive-briefing',
        name: 'Executive Briefing',
        type: 'module',
        tool: 'briefing_generator',
        description: 'Create executive briefing document',
      },
    ],
    estimatedTime: '5-8 minutes',
    useCases: ['Client reviews', 'Retention planning', 'Business development'],
    tags: ['executive', 'client', 'relationship', 'retention'],
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
 * Get C-Suite workflows
 */
export function getCSuiteWorkflows(): WorkflowTemplate[] {
  return workflowTemplates.filter(w => w.isCSuite === true);
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
