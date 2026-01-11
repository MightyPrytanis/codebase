/**
 * E2E Security Integration Tests
 * Tests complete auth flows, CSRF protection, and rate limiting
 * Week 2 Implementation
 * 
 * NOTE: These are manual E2E tests that require a running server.
 * They are skipped in unit test runs. Run with server started: npm run http
 */
import { describe, it, expect, beforeAll } from 'vitest';

describe.skip('Security Integration E2E Tests', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:5002';

  describe('Health & Status Endpoints', () => {
    it('should return health status with security info', async () => {
      const response = await fetch(`${baseURL}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.security).toBeDefined();
      expect(data.security.jwtEnabled).toBeDefined();
      expect(data.security.csrfProtection).toBe(true);
    });

    it('should return security status', async () => {
      const response = await fetch(`${baseURL}/security/status`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.security).toBeDefined();
      expect(data.security.jwtEnabled).toBeDefined();
      expect(data.security.rateLimiting).toBe('enabled');
    });
  });

  describe('CSRF Protection', () => {
    it('should provide CSRF token endpoint', async () => {
      const response = await fetch(`${baseURL}/csrf-token`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.csrfToken).toBeDefined();
      expect(data.csrfToken.length).toBeGreaterThan(0);
    });
  });

  describe('Secure Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await fetch(`${baseURL}/health`);
      
      // Check for Helmet.js headers
      expect(response.headers.has('x-frame-options') || response.headers.has('X-Frame-Options')).toBe(true);
      expect(response.headers.has('x-content-type-options') || response.headers.has('X-Content-Type-Options')).toBe(true);
    });

    it('should not expose X-Powered-By header', async () => {
      const response = await fetch(`${baseURL}/health`);
      expect(response.headers.has('x-powered-by')).toBe(false);
      expect(response.headers.has('X-Powered-By')).toBe(false);
    });
  });
});

)
}
)
}
)
}
)
}
)
}