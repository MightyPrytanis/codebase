# Testing Guide

**Document ID:** TESTING-GUIDE  
**Created:** 2025-12-21  
**Version:** 1.0  
**Status:** Active  

## Overview

This document provides comprehensive guidance on running tests, understanding test structure, coverage goals, and troubleshooting test issues in the Cyrano MCP Server project.

## Test Structure

### Test Organization

Tests are organized in the `tests/` directory with the following structure:

```
tests/
├── security/              # Security middleware tests
│   ├── jwt-token.test.ts
│   ├── csrf-middleware.test.ts
│   ├── cookie-security.test.ts
│   ├── session-management.test.ts
│   ├── authentication-middleware.test.ts
│   ├── rate-limiting.test.ts
│   ├── secure-headers.test.ts
│   ├── input-sanitization.test.ts
│   ├── security-status.test.ts
│   ├── security-middleware.test.ts
│   └── encryption-at-rest.test.ts
├── tools/                 # Tool integration tests
│   ├── potemkin-tools-integration.test.ts
│   └── arkiver-integrity-test.test.ts
├── mcp-compliance/        # MCP protocol compliance tests
│   ├── http-bridge.test.ts
│   └── stdio-bridge.test.ts
└── e2e-manual/           # End-to-end manual tests
    └── security-integration.test.ts
```

### Test Types

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test interactions between components
3. **Security Tests** - Test security middleware and features
4. **Compliance Tests** - Test MCP protocol compliance
5. **E2E Tests** - End-to-end tests requiring full server setup

## Running Tests

### Prerequisites

- Node.js 20+
- npm dependencies installed (`npm ci`)

### Basic Commands

```bash
# Run all tests
npm run test:unit

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest run tests/security/jwt-token.test.ts

# Run tests matching a pattern
npx vitest run tests/security

# Run MCP compliance tests
npm run test:mcp
```

### Environment Variables

Some tests require environment variables:

```bash
# JWT tests require JWT_SECRET
export JWT_SECRET="test-secret-key-minimum-32-characters-long-for-testing"

# Encryption tests require WELLNESS_ENCRYPTION_KEY
export WELLNESS_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# HTTP bridge tests use TEST_PORT (default: 5003)
export TEST_PORT=5003
```

### Test Configuration

Test configuration is in `vitest.config.ts`:

- **Test Environment:** Node.js
- **Globals:** Enabled (vitest globals available)
- **Include:** `tests/**/*.test.ts`
- **Coverage Provider:** v8
- **Coverage Reporters:** text, json, html

## Coverage Goals

### Current Coverage Targets

- **Minimum Pass Rate:** 85% of tests must pass
- **Minimum Code Coverage:** 70% line coverage
- **Security Tests:** 100% coverage for security-critical code

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- `coverage/coverage-summary.json` - JSON summary
- `coverage/index.html` - HTML report (open in browser)
- `coverage/lcov.info` - LCOV format (for CI/CD)

View HTML report:
```bash
npm run test:coverage
open coverage/index.html
```

## CI/CD Process

### GitHub Actions Workflow

The CI/CD pipeline (`.github/workflows/ci.yml`) runs automatically on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Pipeline Stages

1. **Test Job**
   - Checkout code
   - Setup Node.js 20
   - Install dependencies (`npm ci`)
   - Run linter (`npm run lint`)
   - Type check (`npm run build`)
   - Run unit tests (`npm run test:unit`)
   - Generate coverage report
   - Upload coverage to Codecov

2. **Quality Gates Job**
   - Verifies test pass rate ≥ 85%
   - Verifies code coverage ≥ 70%
   - Fails build if gates not met

3. **Security Scan Job**
   - Runs Snyk security scan
   - Uploads results to GitHub Security

### Quality Gates

The pipeline enforces:

- ✅ **Test Pass Rate:** Minimum 85%
- ✅ **Code Coverage:** Minimum 70%
- ✅ **Type Checking:** All TypeScript must compile
- ✅ **Linting:** ESLint must pass (warnings allowed)

## Test Writing Guidelines

### Test File Naming

- Test files must end with `.test.ts`
- Place tests near the code they test or in `tests/` directory
- Use descriptive names: `feature-name.test.ts`

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Sub-feature', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking Guidelines

- Use `vi.mock()` for module mocks
- Use `vi.fn()` for function mocks
- Reset mocks in `beforeEach()` when needed
- Mock external dependencies (APIs, databases, etc.)

### Security Test Requirements

Security tests must:

- Test all security middleware functions
- Test error cases and edge cases
- Test configuration validation
- Verify secure defaults
- Test authentication and authorization

## Troubleshooting

### Common Issues

#### Tests Fail with "Cannot find module"

**Solution:** Ensure dependencies are installed:
```bash
npm ci
```

#### JWT tests fail with "JWT_SECRET must be set"

**Solution:** Set the environment variable:
```bash
export JWT_SECRET="test-secret-key-minimum-32-characters-long-for-testing"
npm run test:unit
```

#### HTTP bridge tests fail with "Port already in use"

**Solution:** Use a different port:
```bash
export TEST_PORT=5004
npm run test:unit tests/mcp-compliance/http-bridge.test.ts
```

#### Coverage report not generated

**Solution:** Ensure coverage provider is installed:
```bash
npm install --save-dev @vitest/coverage-v8
npm run test:coverage
```

#### Tests timeout

**Solution:** Increase timeout for slow tests:
```typescript
it('slow test', async () => {
  // test code
}, { timeout: 10000 }); // 10 seconds
```

### Debugging Tests

1. **Run single test file:**
   ```bash
   npx vitest run tests/security/jwt-token.test.ts
   ```

2. **Run in watch mode:**
   ```bash
   npm run test:watch
   ```

3. **Add console.log:**
   ```typescript
   console.log('Debug value:', value);
   ```

4. **Use debugger:**
   ```typescript
   debugger; // Pause execution in Node.js debugger
   ```

### Getting Help

- Check test output for error messages
- Review test file for incorrect mocks or setup
- Verify environment variables are set
- Check that dependencies are up to date
- Review CI/CD logs for detailed error information

## Test Maintenance

### Adding New Tests

1. Create test file following naming convention
2. Write tests following structure guidelines
3. Ensure tests pass locally
4. Verify coverage meets goals
5. Update this documentation if needed

### Updating Existing Tests

1. Run tests before making changes
2. Make minimal changes to fix issues
3. Ensure all tests still pass
4. Update documentation if test structure changes

### Removing Tests

- Only remove tests for deprecated features
- Update coverage goals if removing significant tests
- Document removal in commit message

## Best Practices

1. **Write Clear Tests**
   - Use descriptive test names
   - Follow Arrange-Act-Assert pattern
   - Test one thing per test

2. **Keep Tests Fast**
   - Mock slow operations
   - Use in-memory alternatives when possible
   - Avoid real network calls

3. **Test Edge Cases**
   - Test error conditions
   - Test boundary values
   - Test null/undefined inputs

4. **Maintain Test Independence**
   - Tests should not depend on each other
   - Reset state between tests
   - Use `beforeEach` for setup

5. **Keep Tests Up to Date**
   - Update tests when code changes
   - Remove obsolete tests
   - Refactor tests for clarity

## Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Project Change Log](../docs/PROJECT_CHANGE_LOG.md)
- [CI/CD Configuration](../../.github/workflows/ci.yml)
- [Security Testing Guide](../docs/security/)

---

**Last Updated:** 2025-12-21  
**Maintained By:** Development Team
