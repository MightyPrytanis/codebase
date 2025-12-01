import { describe, it, expect } from 'vitest';
import { preFillLogic } from '../../src/tools/pre-fill-logic.js';

describe('PreFillLogic', () => {
  it('should have correct tool definition', () => {
    const definition = preFillLogic.getToolDefinition();
    expect(definition.name).toBe('pre_fill_logic');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await preFillLogic.execute({ 
      gaps: [{ date: '2025-01-01', gap_hours: 2 }],
      artifacts: { emails: [], documents: [], calendar: [] }
    });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await preFillLogic.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
