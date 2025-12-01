import { describe, it, expect } from 'vitest';
import { maeEngineTool } from '../../src/tools/mae-engine.js';

describe('MaeEngine', () => {
  it('should have correct tool definition', () => {
    const definition = maeEngineTool.getToolDefinition();
    expect(definition.name).toBe('mae_engine');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await maeEngineTool.execute({ action: 'list_workflows' });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await maeEngineTool.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
