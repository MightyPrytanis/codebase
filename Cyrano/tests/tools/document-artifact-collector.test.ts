import { describe, it, expect } from 'vitest';
import { documentArtifactCollector } from '../../src/tools/document-artifact-collector.js';

describe('DocumentArtifactCollector', () => {
  it('should have correct tool definition', () => {
    const definition = documentArtifactCollector.getToolDefinition();
    expect(definition.name).toBe('document_artifact_collector');
    expect(definition.description).toBeDefined();
  });

  it('should execute successfully with valid input', async () => {
    const result = await documentArtifactCollector.execute({ 
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    });
    expect(result.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const result = await documentArtifactCollector.execute({ invalid: 'input' });
    expect(result.isError).toBe(true);
  });
});
