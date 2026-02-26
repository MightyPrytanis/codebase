/**
 * Potemkin Engine - Unit Tests
 * Tests verification and integrity workflows including document verification,
 * bias detection, integrity monitoring, opinion drift, and honesty assessment
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { potemkinEngine } from '../../src/engines/potemkin/potemkin-engine.js';

describe('PotemkinEngine', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Initialize engine before each test
    await potemkinEngine.initialize();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      const info = potemkinEngine.getEngineInfo();
      expect(info.name).toBe('potemkin');
      expect(info.description).toContain('Verification and Integrity');
      expect(info.version).toBe('1.0.0');
      expect(info.toolCount).toBeGreaterThan(0);
    });

    it('should register default workflows', async () => {
      const workflows = await potemkinEngine.getWorkflows();
      expect(workflows.length).toBeGreaterThan(0);
      
      const workflowIds = workflows.map(w => w.id);
      expect(workflowIds).toContain('verify_document');
      expect(workflowIds).toContain('detect_bias');
      expect(workflowIds).toContain('monitor_integrity');
      expect(workflowIds).toContain('test_opinion_drift');
      expect(workflowIds).toContain('assess_honesty');
    });
  });

  describe('Workflow Execution', () => {
    it('should list workflows', async () => {
      const result = await potemkinEngine.execute({
        action: 'list_workflows',
      });

      expect(result.isError).toBeFalsy();
      const content = result.content[0];
      expect(content.type).toBe('text');
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.workflows).toBeDefined();
        expect(Array.isArray(data.workflows)).toBe(true);
        expect(data.workflows.length).toBeGreaterThan(0);
      }
    });

    it('should execute verify_document workflow', async () => {
      const result = await potemkinEngine.execute({
        action: 'verify_document',
        content: 'Test document content with claims and citations.',
        documentId: 'test-doc-123',
      });

      expect(result.isError).toBeFalsy();
      const content = result.content[0];
      expect(content.type).toBe('text');
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.success).toBe(true);
        expect(data.workflowId).toBe('verify_document');
        expect(data.results).toBeDefined();
      }
    });

    it('should execute detect_bias workflow', async () => {
      const result = await potemkinEngine.execute({
        action: 'detect_bias',
        content: 'Test content for bias detection.',
        input: {
          targetLLM: 'ChatGPT',
          biasTopic: 'politics',
          insights: [
            { id: '1', content: 'Insight 1', created_date: '2025-01-01' },
            { id: '2', content: 'Insight 2', created_date: '2025-01-02' },
          ],
        },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content[0];
      expect(content.type).toBe('text');
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.workflowId).toBe('detect_bias');
      }
    });

    it('should execute monitor_integrity workflow', async () => {
      const result = await potemkinEngine.execute({
        action: 'monitor_integrity',
        input: {
          testResults: [
            {
              id: 'test1',
              testName: 'Test 1',
              testType: 'opinion_drift',
              targetLLM: 'ChatGPT',
              driftScore: 75,
              createdAt: new Date().toISOString(),
            },
          ],
          userConfig: {
            enabled: true,
            drift_threshold: 70,
            bias_threshold: 80,
            honesty_threshold: 60,
            compliance_threshold: 70,
            monitored_llms: ['ChatGPT', 'Claude'],
            notification_method: 'email',
          },
        },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content[0];
      expect(content.type).toBe('text');
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.workflowId).toBe('monitor_integrity');
      }
    });

    it('should execute test_opinion_drift workflow', async () => {
      const result = await potemkinEngine.execute({
        action: 'test_opinion_drift',
        input: {
          targetLLM: 'ChatGPT',
          topic: 'contract law',
          dateRange: {
            start: '2025-01-01',
            end: '2025-03-01',
          },
          minInsights: 3,
        },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content[0];
      expect(content.type).toBe('text');
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.workflowId).toBe('test_opinion_drift');
      }
    });

    it('should execute assess_honesty workflow', async () => {
      const result = await potemkinEngine.execute({
        action: 'assess_honesty',
        content: 'Test content for honesty assessment.',
        input: {
          targetLLM: 'Claude',
          insights: [
            { id: '1', title: 'Insight 1', content: 'Content 1' },
            { id: '2', title: 'Insight 2', content: 'Content 2' },
          ],
        },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content[0];
      expect(content.type).toBe('text');
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.workflowId).toBe('assess_honesty');
      }
    });

    it('should execute workflow by id', async () => {
      const result = await potemkinEngine.execute({
        action: 'execute_workflow',
        workflow_id: 'verify_document',
        input: {
          content: 'Test content',
          documentId: 'doc-123',
        },
      });

      expect(result.isError).toBeFalsy();
    });

    it('should return error for unknown action', async () => {
      const result = await potemkinEngine.execute({
        action: 'unknown_action' as any,
      });

      expect(result.isError).toBe(true);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        // Zod returns detailed validation error, check for invalid_value (Zod v4)
        expect(content.text).toContain('invalid_value');
      }
    });

    it('should return error for missing workflow_id', async () => {
      const result = await potemkinEngine.execute({
        action: 'execute_workflow',
        // Missing workflow_id
      });

      expect(result.isError).toBe(true);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        expect(content.text).toContain('workflow_id is required');
      }
    });

    it('should return error for non-existent workflow', async () => {
      const result = await potemkinEngine.execute({
        action: 'execute_workflow',
        workflow_id: 'non_existent_workflow',
        input: {},
      });

      expect(result.isError).toBe(true);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        expect(content.text).toContain('Workflow');
        expect(content.text).toContain('not found');
      }
    });
  });

  describe('Workflow Structure', () => {
    it('verify_document workflow should have correct structure', async () => {
      const workflows = await potemkinEngine.getWorkflows();
      const workflow = workflows.find(w => w.id === 'verify_document');
      
      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe('Document Verification');
      expect(workflow?.steps).toBeDefined();
      expect(workflow?.steps.length).toBeGreaterThan(0);
      
      // Check for expected steps
      const stepIds = workflow?.steps.map(s => s.id) || [];
      expect(stepIds).toContain('extract_claims');
      expect(stepIds).toContain('check_citations');
    });

    it('detect_bias workflow should have correct structure', async () => {
      const workflows = await potemkinEngine.getWorkflows();
      const workflow = workflows.find(w => w.id === 'detect_bias');
      
      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe('Bias Detection');
      expect(workflow?.steps.length).toBeGreaterThan(0);
      
      const stepIds = workflow?.steps.map(s => s.id) || [];
      expect(stepIds).toContain('analyze_content');
      expect(stepIds).toContain('check_patterns');
    });

    it('monitor_integrity workflow should have correct structure', async () => {
      const workflows = await potemkinEngine.getWorkflows();
      const workflow = workflows.find(w => w.id === 'monitor_integrity');
      
      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe('Integrity Monitoring');
      expect(workflow?.steps.length).toBeGreaterThan(0);
      
      const stepIds = workflow?.steps.map(s => s.id) || [];
      expect(stepIds).toContain('collect_metrics');
      expect(stepIds).toContain('analyze_trends');
    });

    it('test_opinion_drift workflow should have correct structure', async () => {
      const workflows = await potemkinEngine.getWorkflows();
      const workflow = workflows.find(w => w.id === 'test_opinion_drift');
      
      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe('Opinion Drift Test');
      expect(workflow?.steps.length).toBeGreaterThan(0);
      
      const stepIds = workflow?.steps.map(s => s.id) || [];
      expect(stepIds).toContain('retrieve_history');
      expect(stepIds).toContain('calculate_drift');
    });

    it('assess_honesty workflow should have correct structure', async () => {
      const workflows = await potemkinEngine.getWorkflows();
      const workflow = workflows.find(w => w.id === 'assess_honesty');
      
      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe('Honesty Assessment');
      expect(workflow?.steps.length).toBeGreaterThan(0);
      
      const stepIds = workflow?.steps.map(s => s.id) || [];
      expect(stepIds).toContain('analyze_content');
      expect(stepIds).toContain('check_consistency');
      expect(stepIds).toContain('verify_sources');
    });
  });

  describe('Engine Cleanup', () => {
    it('should cleanup resources', async () => {
      await potemkinEngine.cleanup();
      const workflows = await potemkinEngine.getWorkflows();
      expect(workflows.length).toBe(0);
    });
  });
});
