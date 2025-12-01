import { describe, it, expect } from 'vitest';
import { gapIdentifier } from '../../src/tools/gap-identifier.js';

describe('GapIdentifier', () => {
  it('should have correct tool definition', () => {
    const definition = gapIdentifier.getToolDefinition();
    expect(definition.name).toBe('gap_identifier');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await gapIdentifier.execute({ 
      start_date: '2025-01-01',
      end_date: '2025-01-02'
    });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await gapIdentifier.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
