import { describe, it, expect } from 'vitest';
import { recollectionSupport } from '../../src/tools/recollection-support.js';

describe('RecollectionSupport', () => {
  it('should have correct tool definition', () => {
    const definition = recollectionSupport.getToolDefinition();
    expect(definition.name).toBe('recollection_support');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await recollectionSupport.execute({ 
      artifacts: { emails: [], documents: [], calendar: [] },
      date: '2025-01-01'
    });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await recollectionSupport.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
