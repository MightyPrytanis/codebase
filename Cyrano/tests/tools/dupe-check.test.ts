import { describe, it, expect } from 'vitest';
import { dupeCheck } from '../../src/tools/dupe-check.js';

describe('DupeCheck', () => {
  it('should have correct tool definition', () => {
    const definition = dupeCheck.getToolDefinition();
    expect(definition.name).toBe('dupe_check');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await dupeCheck.execute({ 
      new_entries: [{ date: '2025-01-01', description: 'test', hours: 2 }],
      existing_entries: []
    });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await dupeCheck.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
