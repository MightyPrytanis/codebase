/**
 * Arkiver Integrity Test Tool - Unit Tests (Fixed)
 * Tests opinion drift detection, bias detection, honesty assessment
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

describe('ArkiverIntegrityTestTool - Fixed Tests', () => {
  let mockGetSpy: any;

  const createMockEngine = () => ({
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
              bias_score: 45,
              honesty_score: 0.85,
              analysis: 'Test analysis',
              recommendations: ['Test recommendation'],
            }),
          },
        ],
      })
    ),
  });

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
  });

  it('should validate required fields', async () => {
    const result = await arkiverIntegrityTestTool.execute({
      testType: 'opinion_drift',
      // Missing llmSource
    });
    expect(result.isError).toBe(true);
  });

  it('should execute opinion drift test', async () => {
    mockGetSpy = vi.spyOn(engineRegistry, 'get').mockReturnValue(createMockEngine() as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'opinion_drift',
      llmSource: 'ChatGPT',
      parameters: { topic: 'contract law', minInsights: 2 },
    });

    expect(result.isError).toBe(false);
  });

  it('should execute bias detection test', async () => {
    mockGetSpy = vi.spyOn(engineRegistry, 'get').mockReturnValue(createMockEngine() as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'bias',
      llmSource: 'Claude',
      parameters: { biasTopic: 'political' },
    });

    expect(result.isError).toBe(false);
  });

  it('should execute honesty assessment', async () => {
    mockGetSpy = vi.spyOn(engineRegistry, 'get').mockReturnValue(createMockEngine() as any);

    const result = await arkiverIntegrityTestTool.execute({
      testType: 'honesty',
      llmSource: 'Gemini',
    });

    expect(result.isError).toBe(false);
  });
});
