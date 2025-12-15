/**
 * Security Tests - Authentication & Authorization
 * Tests JWT authentication, token validation, and security middleware
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

// Mock environment variables
const originalEnv = process.env;

describe('Security - JWT Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('JWT_SECRET Enforcement', () => {
    it('should require JWT_SECRET environment variable', async () => {
      // Remove JWT_SECRET from environment
      delete process.env.JWT_SECRET;

      const { authTool } = await import('../../src/tools/auth.js');
      
      const result = await authTool.execute({
        action: 'generate_token',
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      });

      expect(result.isError).toBe(true);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        expect(content.text).toContain('JWT_SECRET');
      }
    });

    it('should generate token when JWT_SECRET is set', async () => {
      process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-min-32-chars';

      const { authTool } = await import('../../src/tools/auth.js');
      
      const result = await authTool.execute({
        action: 'generate_token',
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        expect(data.token).toBeDefined();
        expect(typeof data.token).toBe('string');
        expect(data.token.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Token Validation', () => {
    it('should validate valid token', async () => {
      process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-min-32-chars';

      const { authTool } = await import('../../src/tools/auth.js');
      
      // First generate a token
      const genResult = await authTool.execute({
        action: 'generate_token',
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      });

      const genContent = genResult.content[0];
      if (genContent.type === 'text' && 'text' in genContent) {
        const genData = JSON.parse(genContent.text);
        const token = genData.token;

        // Now validate it
        const valResult = await authTool.execute({
          action: 'verify_token',
          token,
        });

        expect(valResult.isError).toBe(false);
        const valContent = valResult.content[0];
        if (valContent.type === 'text' && 'text' in valContent) {
          const valData = JSON.parse(valContent.text);
          expect(valData.valid).toBe(true);
          expect(valData.userId).toBe(1);
        }
      }
    });

    it('should reject invalid token', async () => {
      process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-min-32-chars';

      const { authTool } = await import('../../src/tools/auth.js');
      
      const result = await authTool.execute({
        action: 'verify_token',
        token: 'invalid.token.here',
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('Authorization & Roles', () => {
    it('should include role in token', async () => {
      process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-min-32-chars';

      const { authTool } = await import('../../src/tools/auth.js');
      
      const result = await authTool.execute({
        action: 'generate_token',
        userId: 1,
        email: 'admin@example.com',
        role: 'admin',
      });

      expect(result.isError).toBe(false);
      const content = result.content[0];
      if (content.type === 'text' && 'text' in content) {
        const data = JSON.parse(content.text);
        
        // Verify token contains role
        const verifyResult = await authTool.execute({
          action: 'verify_token',
          token: data.token,
        });

        const verifyContent = verifyResult.content[0];
        if (verifyContent.type === 'text' && 'text' in verifyContent) {
          const verifyData = JSON.parse(verifyContent.text);
          expect(verifyData.role).toBe('admin');
        }
      }
    });
  });
});
