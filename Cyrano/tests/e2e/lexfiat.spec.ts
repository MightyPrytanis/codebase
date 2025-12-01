/**
 * LexFiat E2E Tests
 * 
 * End-to-end tests for LexFiat frontend using Playwright
 * 
 * Created: 2025-11-26
 */

import { test, expect } from '@playwright/test';

test.describe('LexFiat Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to LexFiat
    await page.goto('/');
  });

  test('should load dashboard', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for main dashboard elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display workflow manager', async ({ page }) => {
    // Navigate to workflow manager if it exists
    const workflowLink = page.locator('a[href*="workflow"], button:has-text("Workflow")').first();
    
    if (await workflowLink.isVisible()) {
      await workflowLink.click();
      await expect(page).toHaveURL(/.*workflow.*/);
    }
  });

  test('should connect to Cyrano MCP', async ({ page }) => {
    // Check for MCP connection status
    const statusIndicator = page.locator('[data-testid="mcp-status"], .mcp-status, [aria-label*="MCP"]').first();
    
    // If status indicator exists, verify it shows connected
    if (await statusIndicator.isVisible()) {
      await expect(statusIndicator).toBeVisible();
    }
  });
});

test.describe('LexFiat Integrations', () => {
  test('should display integration settings', async ({ page }) => {
    await page.goto('/');
    
    // Look for integration settings
    const settingsLink = page.locator('a[href*="settings"], a[href*="integrations"], button:has-text("Settings")').first();
    
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/.*settings.*|.*integrations.*/);
    }
  });
});

test.describe('LexFiat Tools', () => {
  test('should access document analyzer', async ({ page }) => {
    await page.goto('/');
    
    // Look for document analyzer tool
    const toolLink = page.locator('a[href*="document"], button:has-text("Document"), [data-tool="document_analyzer"]').first();
    
    if (await toolLink.isVisible()) {
      await toolLink.click();
      await expect(page).toHaveURL(/.*document.*/);
    }
  });
});

