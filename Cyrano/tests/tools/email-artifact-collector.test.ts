import { describe, it, expect } from 'vitest';
import { emailArtifactCollector } from '../../src/tools/email-artifact-collector.js';

describe('EmailArtifactCollector', () => {
  it('should have correct tool definition', () => {
    const definition = emailArtifactCollector.getToolDefinition();
    expect(definition.name).toBe('email_artifact_collector');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await emailArtifactCollector.execute({ 
      start_date: '2025-01-01',
      end_date: '2025-01-02'
    });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await emailArtifactCollector.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
