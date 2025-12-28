# Test Mock Removal Plan - Beta Readiness

**Status:** IN PROGRESS  
**Goal:** Remove ALL mocks from ALL tests - use REAL components only

## Files Requiring Mock Removal

### High Priority (Extensive Mocks)
1. `tests/tools/document-drafter.test.ts` - Mocks: AIService, office-integration, ai-provider-selector, api-validator, ethics services
2. `tests/services/rag-service.test.ts` - Mocks: EmbeddingService, VectorStore, Chunker

### Medium Priority
3. Other test files with vi.mock or vi.spyOn mocks

## Strategy

1. Remove all `vi.mock()` calls
2. Remove all `vi.spyOn().mockImplementation()` calls  
3. Use real implementations from source
4. If tests fail due to missing API keys/credentials:
   - Tests should verify code handles missing credentials gracefully
   - OR skip tests that require credentials (with clear reason)
   - OR use test environment variables if available
5. Fix any real issues that arise

## Real Components to Use

- `AIService` from `src/services/ai-service.ts`
- `officeIntegration` from `src/services/office-integration.ts`
- `aiProviderSelector` from `src/services/ai-provider-selector.ts`
- `apiValidator` from `src/utils/api-validator.ts`
- `checkGeneratedContent` from `src/services/ethics-check-helper.ts`
- `injectTenRulesIntoSystemPrompt` from `src/services/ethics-prompt-injector.ts`
- `EmbeddingService` from `src/services/embedding-service.ts`
- `VectorStore` from `src/modules/rag/vector-store.ts`
- `Chunker` from `src/modules/rag/chunker.ts`

## Expected Behavior

- Tests should use REAL implementations
- If API keys are missing, code should return appropriate errors (not crash)
- Tests should verify error handling for missing credentials
- No fake/mock data should be used
