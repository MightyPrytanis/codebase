/**
 * Potemkin Tools Integration Tests
 * Tests bias-detector, integrity-monitor, and other Potemkin-specific tools
 */
import { describe, it, expect, beforeEach } from 'vitest';
// Use REAL components - no mocks
import { biasDetector } from '../../src/engines/potemkin/tools/index.js';
import { integrityMonitor } from '../../src/engines/potemkin/tools/index.js';

describe('Potemkin Tools Integration', () => {
  beforeEach(() => {
    // No mocks - using real components
  });

  describe('BiasDetector', () => {
    it('should have correct tool definition', () => {
      const definition = biasDetector.getToolDefinition();
      expect(definition.name).toBe('bias_detector');
      expect(definition.description).toContain('Detects bias');
      expect(definition.inputSchema.properties.targetLLM).toBeDefined();
      expect(definition.inputSchema.properties.biasTopic).toBeDefined();
      expect(definition.inputSchema.properties.insights).toBeDefined();
    });

    it.skip('should detect bias in insights', async () => {
      const testInsights = [
        {
          id: 'insight1',
          content: 'This shows clear preference for one side',
          created_date: '2025-01-01',
          title: 'Political Opinion',
        },
        {
          id: 'insight2',
          content: 'Another biased statement favoring one viewpoint',
          created_date: '2025-01-02',
          title: 'Economic Analysis',
        },
        {
          id: 'insight3',
          content: 'Yet another example of skewed perspective',
          created_date: '2025-01-03',
          title: 'Social Commentary',
        },
        {
          id: 'insight4',
          content: 'Continuing the pattern of one-sided arguments',
          created_date: '2025-01-04',
          title: 'Legal Interpretation',
        },
        {
          id: 'insight5',
          content: 'Final example showing consistent bias',
          created_date: '2025-01-05',
          title: 'Policy Discussion',
        },
      ];

      const result = await biasDetector.execute({
        targetLLM: 'ChatGPT',
        biasTopic: 'politics',
        insights: testInsights,
        minInsights: 5,
      });

      // Log error if present for debugging
      if (result.isError) {
        const content = result.content[0];
        if (content.type === 'text' && 'text' in content) {
          console.log('BiasDetector error:', content.text);
        }
      }

      expect(result.isError).toBe(false);
      const content = result.content[0];
      expect(content.type).toBe('text');
      
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.bias_detected).toBeDefined();
        expect(data.bias_score).toBeGreaterThanOrEqual(0);
        expect(data.bias_score).toBeLessThanOrEqual(100);
        expect(Array.isArray(data.bias_patterns)).toBe(true);
        expect(Array.isArray(data.recommendations)).toBe(true);
        expect(data.neutrality_assessment).toBeDefined();
      }
    });

    it('should require minimum insights', async () => {
      const testInsights = [
        {
          id: 'insight1',
          content: 'Only one insight',
          created_date: '2025-01-01',
        },
      ];

      const result = await biasDetector.execute({
        targetLLM: 'ChatGPT',
        biasTopic: 'economics',
        insights: testInsights,
        minInsights: 5,
      });

      expect(result.isError).toBe(true);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        expect(content.text).toContain('at least');
      }
    });

    it('should validate input schema', async () => {
      const result = await biasDetector.execute({
        targetLLM: 'ChatGPT',
        // Missing biasTopic and insights
      });

      expect(result.isError).toBe(true);
    });

    it.skip('should handle insights with optional fields', async () => {
      const testInsights = Array.from({ length: 5 }, (_, i) => ({
        id: `insight${i + 1}`,
        content: `Content ${i + 1}`,
        created_date: `2025-01-0${i + 1}`,
        // title and ai_generated_summary are optional
      }));

      const result = await biasDetector.execute({
        targetLLM: 'Claude',
        biasTopic: 'technology',
        insights: testInsights,
        minInsights: 3,
      });

      expect(result.isError).toBe(false);
    });

    it.skip('should use default minInsights value', async () => {
      const testInsights = Array.from({ length: 5 }, (_, i) => ({
        id: `insight${i + 1}`,
        content: `Content ${i + 1}`,
        created_date: `2025-01-0${i + 1}`,
      }));

      const result = await biasDetector.execute({
        targetLLM: 'Gemini',
        biasTopic: 'science',
        insights: testInsights,
        // minInsights not provided, should default to 5
      });

      expect(result.isError).toBe(false);
    });
  });

  describe('IntegrityMonitor', () => {
    it('should have correct tool definition', () => {
      const definition = integrityMonitor.getToolDefinition();
      expect(definition.name).toBe('integrity_monitor');
      expect(definition.description).toContain('Monitors AI integrity');
      expect(definition.inputSchema.properties.testResults).toBeDefined();
      expect(definition.inputSchema.properties.userConfig).toBeDefined();
    });

    it('should generate alerts for opinion drift', async () => {
      const testResults = [
        {
          id: 'test1',
          testName: 'Opinion Drift Test',
          testType: 'opinion_drift',
          targetLLM: 'ChatGPT',
          driftScore: 85, // Above threshold
          honestyScore: null,
          biasIndicators: null,
          tenRulesViolations: null,
          createdAt: new Date().toISOString(),
        },
      ];

      const userConfig = {
        enabled: true,
        drift_threshold: 70,
        bias_threshold: 80,
        honesty_threshold: 60,
        compliance_threshold: 70,
        monitored_llms: ['ChatGPT', 'Claude'],
        notification_method: 'email' as const,
      };

      const result = await integrityMonitor.execute({
        testResults,
        userConfig,
        timeWindowHours: 24,
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.alerts).toBeDefined();
        expect(Array.isArray(data.alerts)).toBe(true);
        expect(data.alerts.length).toBeGreaterThan(0);
        expect(data.alerts[0].type).toBe('opinion_drift');
        expect(data.alerts[0].severity).toBeDefined();
        expect(data.summary).toBeDefined();
        expect(data.summary.total).toBe(data.alerts.length);
      }
    });

    it('should generate alerts for bias detection', async () => {
      const testResults = [
        {
          id: 'test2',
          testName: 'Bias Detection Test',
          testType: 'bias_detection',
          targetLLM: 'Claude',
          driftScore: 90, // Used as bias score
          honestyScore: null,
          biasIndicators: ['Language bias', 'Selection bias'],
          tenRulesViolations: null,
          createdAt: new Date().toISOString(),
        },
      ];

      const userConfig = {
        enabled: true,
        drift_threshold: 70,
        bias_threshold: 75,
        honesty_threshold: 60,
        compliance_threshold: 70,
        monitored_llms: ['Claude'],
        notification_method: 'email' as const,
      };

      const result = await integrityMonitor.execute({
        testResults,
        userConfig,
        timeWindowHours: 24,
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.alerts.length).toBeGreaterThan(0);
        expect(data.alerts[0].type).toBe('bias_detection');
        expect(data.alerts[0].severity).toBe('critical');
      }
    });

    it('should generate alerts for low honesty scores', async () => {
      const testResults = [
        {
          id: 'test3',
          testName: 'Honesty Assessment',
          testType: 'honesty_assessment',
          targetLLM: 'Gemini',
          driftScore: null,
          honestyScore: 35, // Below threshold
          biasIndicators: null,
          tenRulesViolations: null,
          createdAt: new Date().toISOString(),
        },
      ];

      const userConfig = {
        enabled: true,
        drift_threshold: 70,
        bias_threshold: 80,
        honesty_threshold: 60,
        compliance_threshold: 70,
        monitored_llms: ['Gemini'],
        notification_method: 'email' as const,
      };

      const result = await integrityMonitor.execute({
        testResults,
        userConfig,
        timeWindowHours: 24,
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.alerts.length).toBeGreaterThan(0);
        expect(data.alerts[0].type).toBe('honesty_assessment');
        expect(data.alerts[0].severity).toBe('critical');
      }
    });

    it('should generate alerts for Ten Rules (Version 1.4) violations', async () => {
      const testResults = [
        {
          id: 'test4',
          testName: 'Ten Rules (Version 1.4) Compliance',
          testType: 'ten_rules_compliance',
          targetLLM: 'ChatGPT',
          driftScore: null,
          honestyScore: 55, // Below threshold
          biasIndicators: null,
          tenRulesViolations: [
            {
              rule_number: 3,
              rule_name: 'Rule 3',
              violation_description: 'Severe violation',
              severity: 'severe' as const,
            },
          ],
          createdAt: new Date().toISOString(),
        },
      ];

      const userConfig = {
        enabled: true,
        drift_threshold: 70,
        bias_threshold: 80,
        honesty_threshold: 60,
        compliance_threshold: 70,
        monitored_llms: ['ChatGPT'],
        notification_method: 'both' as const,
      };

      const result = await integrityMonitor.execute({
        testResults,
        userConfig,
        timeWindowHours: 24,
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.alerts.length).toBeGreaterThan(0);
        expect(data.alerts[0].type).toBe('ten_rules_compliance');
        expect(data.alerts[0].severity).toBe('critical'); // Severe violations
      }
    });

    it('should not generate alerts when monitoring disabled', async () => {
      const testResults = [
        {
          id: 'test5',
          testName: 'Test',
          testType: 'opinion_drift',
          targetLLM: 'ChatGPT',
          driftScore: 95,
          honestyScore: null,
          biasIndicators: null,
          tenRulesViolations: null,
          createdAt: new Date().toISOString(),
        },
      ];

      const userConfig = {
        enabled: false, // Monitoring disabled
        drift_threshold: 70,
        bias_threshold: 80,
        honesty_threshold: 60,
        compliance_threshold: 70,
        monitored_llms: ['ChatGPT'],
        notification_method: 'email' as const,
      };

      const result = await integrityMonitor.execute({
        testResults,
        userConfig,
        timeWindowHours: 24,
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.alerts.length).toBe(0);
        expect(data.summary.total).toBe(0);
      }
    });

    it('should filter by monitored LLMs', async () => {
      const testResults = [
        {
          id: 'test6',
          testName: 'Test Unmonitored LLM',
          testType: 'opinion_drift',
          targetLLM: 'UnmonitoredLLM',
          driftScore: 95,
          honestyScore: null,
          biasIndicators: null,
          tenRulesViolations: null,
          createdAt: new Date().toISOString(),
        },
      ];

      const userConfig = {
        enabled: true,
        drift_threshold: 70,
        bias_threshold: 80,
        honesty_threshold: 60,
        compliance_threshold: 70,
        monitored_llms: ['ChatGPT', 'Claude'], // UnmonitoredLLM not in list
        notification_method: 'email' as const,
      };

      const result = await integrityMonitor.execute({
        testResults,
        userConfig,
        timeWindowHours: 24,
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.alerts.length).toBe(0); // No alerts for unmonitored LLM
      }
    });

    it('should filter by time window', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 48); // 48 hours ago

      const testResults = [
        {
          id: 'test7',
          testName: 'Old Test',
          testType: 'opinion_drift',
          targetLLM: 'ChatGPT',
          driftScore: 95,
          honestyScore: null,
          biasIndicators: null,
          tenRulesViolations: null,
          createdAt: oldDate.toISOString(),
        },
      ];

      const userConfig = {
        enabled: true,
        drift_threshold: 70,
        bias_threshold: 80,
        honesty_threshold: 60,
        compliance_threshold: 70,
        monitored_llms: ['ChatGPT'],
        notification_method: 'email' as const,
      };

      const result = await integrityMonitor.execute({
        testResults,
        userConfig,
        timeWindowHours: 24, // Only last 24 hours
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.alerts.length).toBe(0); // Old test filtered out
      }
    });

    it('should categorize alerts by severity', async () => {
      const testResults = [
        {
          id: 'test8',
          testName: 'Critical Drift',
          testType: 'opinion_drift',
          targetLLM: 'ChatGPT',
          driftScore: 85, // Critical
          honestyScore: null,
          biasIndicators: null,
          tenRulesViolations: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'test9',
          testName: 'High Drift',
          testType: 'opinion_drift',
          targetLLM: 'ChatGPT',
          driftScore: 75, // High
          honestyScore: null,
          biasIndicators: null,
          tenRulesViolations: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'test10',
          testName: 'Medium Drift',
          testType: 'opinion_drift',
          targetLLM: 'ChatGPT',
          driftScore: 65, // Medium
          honestyScore: null,
          biasIndicators: null,
          tenRulesViolations: null,
          createdAt: new Date().toISOString(),
        },
      ];

      const userConfig = {
        enabled: true,
        drift_threshold: 60,
        bias_threshold: 80,
        honesty_threshold: 60,
        compliance_threshold: 70,
        monitored_llms: ['ChatGPT'],
        notification_method: 'email' as const,
      };

      const result = await integrityMonitor.execute({
        testResults,
        userConfig,
        timeWindowHours: 24,
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.summary.critical).toBeGreaterThanOrEqual(1);
        expect(data.summary.high).toBeGreaterThanOrEqual(1);
        expect(data.summary.medium).toBeGreaterThanOrEqual(1);
        expect(data.summary.total).toBe(data.summary.critical + data.summary.high + data.summary.medium + data.summary.low);
      }
    });
  });
});
)
}