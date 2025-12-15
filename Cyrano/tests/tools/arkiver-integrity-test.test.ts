/**
 * Arkiver Integrity Test Tool - Unit Tests
 * Tests opinion drift detection, bias detection, honesty assessment, and other integrity checks
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { arkiverIntegrityTestTool } from '../../src/tools/arkiver-integrity-test.js';
import { engineRegistry } from '../../src/engines/registry.js';

// Mock the database
vi.mock('../../src/db.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([
              {
                id: 'insight1',
                fileId: 'file1',
                title: 'Test Insight 1',
                content: 'This is test content about legal matters.',
                sourceLLM: 'ChatGPT',
                createdAt: new Date(),
              },
              {
                id: 'insight2',
                fileId: 'file1',
                title: 'Test Insight 2',
                content: 'Another insight about contract law.',
                sourceLLM: 'ChatGPT',
                createdAt: new Date(),
              },
            ])),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'test-result-id' }])),
      })),
    })),
  },
}));

describe('ArkiverIntegrityTestTool', () => {
  let mockGetSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (mockGetSpy) {
      mockGetSpy.mockRestore();
    }
  });

  it('should have correct tool definition', () => {
    const definition = arkiverIntegrityTestTool.getToolDefinition();
    expect(definition.name).toBe('arkiver_integrity_test');
    expect(definition.description).toContain('AI integrity monitoring');
    expect(definition.inputSchema.properties.testType).toBeDefined();
    expect(definition.inputSchema.properties.llmSource).toBeDefined();
  });

  it('should validate input schema correctly', async () => {
    // Missing required field
    const result = await arkiverIntegrityTestTool.execute({
      testType: 'opinion_drift',
      // Missing llmSource
    });
    expect(result.isError).toBe(true);
  });

  it('should handle opinion drift test type', async () => {
    // Mock Potemkin engine with proper BaseEngine interface
    const mockPotemkinEngine = {
      getEngineInfo: () => ({
        name: 'potemkin',
        description: 'Test engine',
        version: '1.0.0',
        toolCount: 5,
        workflowCount: 5,
      }),
      initialize: vi.fn(),
      execute: vi.fn(() =>
        Promise.resolve({
          isError: false,
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                drift_score: 65,
                analysis: 'Moderate opinion drift detected',
                recommendations: ['Review consistency', 'Check sources'],
              }),
            },
          ],
        })
      ),
    };
    
    // Mock the get method to return our mock engine
    mockGetSpy = vi.spyOn(engineRegistry, 'get').mockReturnValue(mockPotemkinEngine as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'opinion_drift',
      llmSource: 'ChatGPT',
      parameters: {
        topic: 'contract law',
        minInsights: 2,
      },
    });

    expect(result.isError).toBe(false);
    const content = result.content[0];
    if (content.type === 'text' && 'text' in content) {
      const response = JSON.parse(content.text);
      expect(response.success).toBe(true);
      expect(response.results.testType).toBe('opinion_drift');
      expect(response.results.overallScore).toBeDefined();
    }
  });

  it('should handle bias detection test type', async () => {
    const mockPotemkinEngine = {
      getEngineInfo: vi.fn(() => ({ workflowCount: 5 })),
      initialize: vi.fn(),
      execute: vi.fn(() =>
        Promise.resolve({
          isError: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                bias_score: 45,
                bias_indicators: ['Language bias', 'Selection bias'],
                neutrality_assessment: 'Some bias detected',
                recommendations: ['Use neutral language', 'Diversify sources'],
              }),
            },
          ],
        })
      ),
    };
    
    engineRegistry.register('potemkin', mockPotemkinEngine as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'bias',
      llmSource: 'Claude',
      parameters: {
        biasTopic: 'political',
        minInsights: 3,
      },
    });

    expect(result.isError).toBe(false);
    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.results.testType).toBe('bias');
    expect(response.results.biasIndicators).toBeDefined();
  });

  it('should handle honesty assessment test type', async () => {
    const mockPotemkinEngine = {
      getEngineInfo: vi.fn(() => ({ workflowCount: 5 })),
      initialize: vi.fn(),
      execute: vi.fn(() =>
        Promise.resolve({
          isError: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                honesty_score: 0.85,
                assessment: 'High honesty score',
                recommendations: ['Maintain current standards'],
              }),
            },
          ],
        })
      ),
    };
    
    engineRegistry.register('potemkin', mockPotemkinEngine as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'honesty',
      llmSource: 'Gemini',
    });

    expect(result.isError).toBe(false);
    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.results.testType).toBe('honesty');
  });

  it('should handle ten rules compliance test type', async () => {
    const mockPotemkinEngine = {
      getEngineInfo: vi.fn(() => ({ workflowCount: 5 })),
      initialize: vi.fn(),
      execute: vi.fn(() =>
        Promise.resolve({
          isError: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                honesty_score: 0.75,
                assessment: 'Generally compliant',
                recommendations: ['Review rule 3', 'Strengthen rule 7 compliance'],
              }),
            },
          ],
        })
      ),
    };
    
    engineRegistry.register('potemkin', mockPotemkinEngine as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'ten_rules',
      llmSource: 'ChatGPT',
    });

    expect(result.isError).toBe(false);
    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.results.testType).toBe('ten_rules');
  });

  it('should handle fact checking test type', async () => {
    const mockPotemkinEngine = {
      getEngineInfo: vi.fn(() => ({ workflowCount: 5 })),
      initialize: vi.fn(),
      execute: vi.fn(() =>
        Promise.resolve({
          isError: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                verification_score: 0.92,
                report: 'High confidence in factual accuracy',
                recommendations: ['Continue verification practices'],
              }),
            },
          ],
        })
      ),
    };
    
    engineRegistry.register('potemkin', mockPotemkinEngine as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'fact_check',
      llmSource: 'Claude',
      fileId: 'test-file-123',
    });

    expect(result.isError).toBe(false);
    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.results.testType).toBe('fact_check');
  });

  it('should return error when Potemkin engine not found', async () => {
    engineRegistry.register('potemkin', null as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'bias',
      llmSource: 'ChatGPT',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Potemkin engine not found');
  });

  it('should return error when no insights found', async () => {
    // Mock empty insights
    const { db } = await import('../../src/db.js');
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    } as any);

    const mockPotemkinEngine = {
      getEngineInfo: vi.fn(() => ({ workflowCount: 5 })),
      initialize: vi.fn(),
      execute: vi.fn(),
    };
    
    engineRegistry.register('potemkin', mockPotemkinEngine as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'bias',
      llmSource: 'NonExistentLLM',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No insights found');
  });

  it('should handle Potemkin engine errors gracefully', async () => {
    const mockPotemkinEngine = {
      getEngineInfo: vi.fn(() => ({ workflowCount: 5 })),
      initialize: vi.fn(),
      execute: vi.fn(() =>
        Promise.resolve({
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Potemkin engine execution failed',
            },
          ],
        })
      ),
    };
    
    engineRegistry.register('potemkin', mockPotemkinEngine as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'bias',
      llmSource: 'ChatGPT',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Potemkin engine error');
  });

  it('should initialize Potemkin engine if needed', async () => {
    const mockPotemkinEngine = {
      getEngineInfo: vi.fn(() => ({ workflowCount: 0 })),
      initialize: vi.fn(),
      execute: vi.fn(() =>
        Promise.resolve({
          isError: false,
          content: [{ type: 'text', text: JSON.stringify({ drift_score: 50 }) }],
        })
      ),
    };
    
    engineRegistry.register('potemkin', mockPotemkinEngine as any);

    await arkiverIntegrityTestTool.execute({
      testType: 'opinion_drift',
      llmSource: 'ChatGPT',
    });

    expect(mockPotemkinEngine.initialize).toHaveBeenCalled();
  });

  it('should calculate alert levels correctly', async () => {
    const mockPotemkinEngine = {
      getEngineInfo: vi.fn(() => ({ workflowCount: 5 })),
      initialize: vi.fn(),
      execute: vi.fn(() =>
        Promise.resolve({
          isError: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                drift_score: 40, // Below 0.5 threshold
                analysis: 'Critical drift detected',
              }),
            },
          ],
        })
      ),
    };
    
    engineRegistry.register('potemkin', mockPotemkinEngine as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'opinion_drift',
      llmSource: 'ChatGPT',
    });

    expect(result.isError).toBe(false);
    const response = JSON.parse(result.content[0].text);
    expect(response.results.details[0].status).toBe('failed');
  });
});
