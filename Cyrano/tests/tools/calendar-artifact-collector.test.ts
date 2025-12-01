import { describe, it, expect } from 'vitest';
import { calendarArtifactCollector } from '../../src/tools/calendar-artifact-collector.js';

describe('CalendarArtifactCollector', () => {
  it('should have correct tool definition', () => {
    const definition = calendarArtifactCollector.getToolDefinition();
    expect(definition.name).toBe('calendar_artifact_collector');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await calendarArtifactCollector.execute({ 
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await calendarArtifactCollector.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
