import { describe, it, expect } from 'vitest';
import { provenanceTracker } from '../../src/tools/provenance-tracker.js';

describe('ProvenanceTracker', () => {
  it('should have correct tool definition', () => {
    const definition = provenanceTracker.getToolDefinition();
    expect(definition.name).toBe('provenance_tracker');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await provenanceTracker.execute({ 
      time_entry: { id: '1', date: '2025-01-01', description: 'test', hours: 2 }
    });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await provenanceTracker.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
