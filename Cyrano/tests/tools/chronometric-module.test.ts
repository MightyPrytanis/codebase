import { describe, it, expect } from 'vitest';
import { chronometricModuleTool } from '../../src/tools/chronometric-module.js';

describe('ChronometricModule', () => {
  it('should have correct tool definition', () => {
    const definition = chronometricModuleTool.getToolDefinition();
    expect(definition.name).toBe('chronometric_module');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await chronometricModuleTool.execute({ action: 'generate_report' });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await chronometricModuleTool.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
