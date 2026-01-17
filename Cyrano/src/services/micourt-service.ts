/**
 * MiCourt Service
 * 
 * Michigan Court Case Lookup Integration
 * 
 * Light footprint integration for user-initiated docket queries from LexFiat.
 * NO automated scraping or routine wide-net updates.
 * 
 * IMPORTANT: MiCourt does NOT offer a public API for attorneys/developers.
 * The MiCourt API (developer.micourt.courts.michigan.gov) is only available
 * to court users/internal systems, not public/attorney users. This service
 * uses Playwright web scraping as the only viable option for public access.
 * 
 * Uses Playwright for browser automation to query public court portals:
 * - MiCourt (Michigan's statewide system)
 * - Wayne County Odyssey (Third Judicial Circuit Court)
 * - Oakland County Court Explorer
 * - Other county-specific portals
 * 
 * All queries are explicit user actions - no background automation.
 * 
 * Created: 2025-12-21
 * Updated: 2025-12-21 - Implemented Playwright-based query system
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { chromium, Browser, Page } from 'playwright';

export interface MiCourtConfig {
  timeout?: number;
  headless?: boolean;
  portal?: 'micourt' | 'odyssey' | 'court-explorer' | 'auto';
}

export interface MiCourtCase {
  caseNumber: string;
  caseTitle: string;
  court: string;
  caseType: string;
  filingDate?: string;
  status?: string;
  parties?: Array<{
    name: string;
    role: string; // Plaintiff, Defendant, etc.
    attorney?: string;
  }>;
  docketEntries?: Array<{
    date: string;
    description: string;
    documentType?: string;
    filingParty?: string;
  }>;
  roa?: Array<{
    date: string;
    action: string;
    description?: string;
  }>;
}

export interface MiCourtQueryOptions {
  caseNumber?: string;
  lastName?: string;
  firstName?: string;
  court?: string;
  caseType?: string;
  portal?: 'micourt' | 'odyssey' | 'court-explorer' | 'auto';
}

/**
 * MiCourt Service
 * 
 * Light-weight service for user-initiated docket queries using Playwright.
 * All queries are explicit user actions - no background automation.
 */
export class MiCourtService {
  private config: MiCourtConfig;
  private browser: Browser | null = null;

  constructor(config: MiCourtConfig = {}) {
    this.config = {
      timeout: config.timeout || 30000, // 30 second default timeout
      headless: config.headless !== false, // Default to headless
      portal: config.portal || 'auto',
    };
  }

  /**
   * Query case by case number and optional party information
   * User-initiated query only - no automation
   */
  async queryCase(options: MiCourtQueryOptions): Promise<MiCourtCase> {
    if (!options.caseNumber && !options.lastName) {
      throw new Error('Either case number or last name is required for MiCourt query');
    }

    const portal = options.portal || this.config.portal || 'auto';
    
    try {
      // Determine which portal to use
      const targetPortal = portal === 'auto' 
        ? this.determinePortal(options.court)
        : portal;

      // Perform query using Playwright
      const result = await this.performPlaywrightQuery(targetPortal, options);
      return this.mapToMiCourtCase(result);
    } catch (error) {
      throw new Error(
        `MiCourt query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search cases by criteria
   * User-initiated query only - no automation
   */
  async searchCases(criteria: MiCourtQueryOptions): Promise<MiCourtCase[]> {
    if (!criteria.caseNumber && !criteria.lastName) {
      throw new Error('Either case number or last name is required for MiCourt search');
    }

    const portal = criteria.portal || this.config.portal || 'auto';
    
    try {
      const targetPortal = portal === 'auto' 
        ? this.determinePortal(criteria.court)
        : portal;

      const results = await this.performPlaywrightQuery(targetPortal, criteria, true);
      return Array.isArray(results) 
        ? results.map((c: any) => this.mapToMiCourtCase(c))
        : [this.mapToMiCourtCase(results)];
    } catch (error) {
      throw new Error(
        `MiCourt search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Determine which portal to use based on court name
   */
  private determinePortal(court?: string): 'micourt' | 'odyssey' | 'court-explorer' {
    if (!court) return 'micourt'; // Default to MiCourt

    const courtLower = court.toLowerCase();
    
    // Wayne County uses Odyssey
    if (courtLower.includes('wayne')) {
      return 'odyssey';
    }
    
    // Oakland County uses Court Explorer
    if (courtLower.includes('oakland')) {
      return 'court-explorer';
    }
    
    // Default to MiCourt for other courts
    return 'micourt';
  }

  /**
   * Perform Playwright-based query
   * 
   * This method uses Playwright to automate browser interaction with public court portals.
   * All queries are user-initiated only - no automated scraping or routine updates.
   * 
   * NOTE: Some portals may have CAPTCHAs, terms acceptance, or other blockers that
   * require manual intervention. These will result in errors that should be handled
   * gracefully by the calling code.
   */
  private async performPlaywrightQuery(
    portal: 'micourt' | 'odyssey' | 'court-explorer',
    options: MiCourtQueryOptions,
    returnMultiple: boolean = false
  ): Promise<any> {
    // Launch browser
    this.browser = await chromium.launch({ 
      headless: this.config.headless,
      timeout: this.config.timeout,
    });
    
    const page = await this.browser.newPage();
    
    try {
      // Set reasonable timeout
      page.setDefaultTimeout(this.config.timeout || 30000);

      // Navigate to appropriate portal
      const portalUrl = this.getPortalUrl(portal);
      await page.goto(portalUrl, { waitUntil: 'networkidle' });

      // Handle portal-specific pre-search requirements (terms, court selection, etc.)
      await this.handlePortalPrerequisites(page, portal);

      // Fill search form based on portal
      await this.fillSearchForm(page, portal, options);

      // Submit search
      await this.submitSearch(page, portal);

      // Wait for results and extract data
      const results = await this.extractResults(page, portal, returnMultiple);

      return results;
    } finally {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Handle portal-specific prerequisites (terms acceptance, court selection, etc.)
   */
  private async handlePortalPrerequisites(
    page: Page,
    portal: 'micourt' | 'odyssey' | 'court-explorer'
  ): Promise<void> {
    switch (portal) {
      case 'micourt':
        // MiCourt requires accepting terms of service first
        try {
          // Look for terms acceptance button
          const termsButton = page.locator('button:has-text("continue"), button:has-text("Continue"), button:has-text("agree")').first();
          if (await termsButton.isVisible({ timeout: 3000 })) {
            await termsButton.click();
            await page.waitForLoadState('networkidle');
          }
        } catch {
          // Terms may have already been accepted or not present
        }

        // MiCourt may require court selection - if we're on court-selection page, select first available
        try {
          const currentUrl = page.url();
          if (currentUrl.includes('court-selection')) {
            // Try to find and click a court link or search for a court
            // For now, we'll try to navigate to search directly if possible
            // This may need refinement based on actual portal behavior
            await page.waitForLoadState('networkidle');
          }
        } catch {
          // Court selection may not be required or already handled
        }
        break;

      case 'odyssey':
        // Wayne County Odyssey may have specific requirements
        // Add handling as needed
        break;

      case 'court-explorer':
        // Oakland County Court Explorer may require court type selection (Circuit/Probate)
        try {
          // Check if Circuit tab needs to be selected (default is usually Circuit)
          const circuitTab = page.locator('button:has-text("Circuit"), a:has-text("Circuit")').first();
          if (await circuitTab.isVisible({ timeout: 3000 })) {
            // Only click if not already selected
            const ariaSelected = await circuitTab.getAttribute('aria-selected');
            const classAttr = await circuitTab.getAttribute('class');
            const isSelected = ariaSelected === 'true' ||
                              (classAttr?.includes('active') ?? false) ||
                              (classAttr?.includes('selected') ?? false);
            if (!isSelected) {
              await circuitTab.click();
              await page.waitForLoadState('networkidle');
            }
          }
        } catch {
          // Court type selection may not be required or already handled
        }
        break;
    }
  }

  /**
   * Get portal URL
   */
  private getPortalUrl(portal: 'micourt' | 'odyssey' | 'court-explorer'): string {
    switch (portal) {
      case 'micourt':
        return 'https://micourt.courts.michigan.gov/case-search/';
      case 'odyssey':
        // Wayne County Third Judicial Circuit Court - Odyssey Public Access
        return 'https://www.3rdcc.org/odyssey-public-access-(opa)';
      case 'court-explorer':
        // Oakland County Court Explorer
        return 'https://courtexplorer.oakgov.com/OaklandCounty/SearchCases/';
      default:
        return 'https://micourt.courts.michigan.gov/case-search/';
    }
  }

  /**
   * Fill search form based on portal type
   * 
   * NOTE: Selectors are placeholders and must be updated based on actual portal structure.
   * Each portal has different form layouts and field names.
   */
  private async fillSearchForm(
    page: Page,
    portal: 'micourt' | 'odyssey' | 'court-explorer',
    options: MiCourtQueryOptions
  ): Promise<void> {
    // Wait for form to be ready
    await page.waitForLoadState('networkidle');

    switch (portal) {
      case 'micourt':
        // MiCourt form selectors (to be verified/updated)
        if (options.caseNumber) {
          await page.fill('input#caseNumber, input[name="caseNumber"], input[placeholder*="case number" i]', options.caseNumber);
        }
        if (options.lastName) {
          await page.fill('input#lastName, input[name="lastName"], input[placeholder*="last name" i]', options.lastName);
        }
        if (options.firstName) {
          await page.fill('input#firstName, input[name="firstName"], input[placeholder*="first name" i]', options.firstName);
        }
        if (options.court) {
          await page.selectOption('select#court, select[name="court"]', options.court);
        }
        if (options.caseType) {
          await page.selectOption('select#caseType, select[name="caseType"]', options.caseType);
        }
        break;

      case 'odyssey':
        // Wayne County Odyssey form selectors (to be verified/updated)
        if (options.caseNumber) {
          await page.fill('input#caseNumber, input[name="caseNumber"]', options.caseNumber);
        }
        if (options.lastName) {
          await page.fill('input#lastName, input[name="lastName"]', options.lastName);
        }
        if (options.firstName) {
          await page.fill('input#firstName, input[name="firstName"]', options.firstName);
        }
        break;

      case 'court-explorer':
        // Oakland County Court Explorer form selectors (to be verified/updated)
        if (options.caseNumber) {
          await page.fill('input#caseNumber, input[name="caseNumber"]', options.caseNumber);
        }
        if (options.lastName) {
          await page.fill('input#lastName, input[name="lastName"]', options.lastName);
        }
        if (options.firstName) {
          await page.fill('input#firstName, input[name="firstName"]', options.firstName);
        }
        break;
    }
  }

  /**
   * Submit search form
   */
  private async submitSearch(
    page: Page,
    portal: 'micourt' | 'odyssey' | 'court-explorer'
  ): Promise<void> {
    // Try common submit button selectors
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Search")',
      'button:has-text("Submit")',
      'input[type="submit"]',
      'button.search',
      'button.submit',
    ];

    for (const selector of submitSelectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click();
          await page.waitForLoadState('networkidle');
          return;
        }
      } catch {
        // Try next selector
        continue;
      }
    }

    throw new Error('Could not find submit button on search form');
  }

  /**
   * Extract results from page
   * 
   * NOTE: Selectors are placeholders and must be updated based on actual portal structure.
   */
  private async extractResults(
    page: Page,
    portal: 'micourt' | 'odyssey' | 'court-explorer',
    returnMultiple: boolean
  ): Promise<any> {
    // Wait for results to load
    await page.waitForLoadState('networkidle');
    
    // Wait for result elements (adjust selector based on actual portal)
    await page.waitForSelector('.case-result, .case-row, .result-item, table.cases, .search-results', { 
      timeout: 10000 
    }).catch(() => {
      // Results might not have a specific class - continue anyway
    });

    // Extract case data
    const results = await page.evaluate((args: { portalType: string; multiple: boolean }) => {
      const { portalType, multiple } = args;
      const cases: any[] = [];
      
      // Try various result container selectors
      const resultSelectors = [
        '.case-result',
        '.case-row',
        '.result-item',
        'table.cases tbody tr',
        '.search-results .result',
      ];

      let elements: Element[] = [];
      for (const selector of resultSelectors) {
        const found = Array.from(document.querySelectorAll(selector));
        if (found.length > 0) {
          elements = found;
          break;
        }
      }

      if (elements.length === 0) {
        // No results found
        return multiple ? [] : null;
      }

      // Extract data from each result element
      for (const element of elements) {
        const caseData: any = {
          caseNumber: '',
          caseTitle: '',
          court: '',
          caseType: '',
          status: '',
          parties: [],
          docketEntries: [],
          roa: [],
        };

        // Extract case number
        const caseNumberEl = element.querySelector('.case-number, [data-case-number], .caseNumber');
        if (caseNumberEl) {
          caseData.caseNumber = caseNumberEl.textContent?.trim() || '';
        }

        // Extract case title
        const titleEl = element.querySelector('.case-title, .title, [data-title]');
        if (titleEl) {
          caseData.caseTitle = titleEl.textContent?.trim() || '';
        }

        // Extract status
        const statusEl = element.querySelector('.status, [data-status]');
        if (statusEl) {
          caseData.status = statusEl.textContent?.trim() || '';
        }

        // Extract ROA entries
        const roaElements = element.querySelectorAll('.roa-item, .docket-entry, [data-roa]');
        roaElements.forEach((roaEl) => {
          const dateEl = roaEl.querySelector('.date, [data-date]');
          const actionEl = roaEl.querySelector('.action, [data-action], .description');
          
          if (dateEl || actionEl) {
            caseData.roa.push({
              date: dateEl?.textContent?.trim() || '',
              action: actionEl?.textContent?.trim() || '',
            });
          }
        });

        cases.push(caseData);
      }

      return multiple ? cases : cases[0];
    }, { portalType: portal, multiple: returnMultiple });

    // Only throw error if we expected results but got none
    // For search operations, empty array is valid
    if (!returnMultiple && !results) {
      throw new Error('No case results found. The portal structure may have changed, selectors need updating, or a CAPTCHA/blocker was encountered.');
    }
    
    // For multiple results, empty array is acceptable
    if (returnMultiple && (!Array.isArray(results) || results.length === 0)) {
      // Return empty array rather than throwing - no results is a valid outcome
      return [];
    }

    return results;
  }

  /**
   * Map extracted data to MiCourtCase format
   */
  private mapToMiCourtCase(data: any): MiCourtCase {
    return {
      caseNumber: data.caseNumber || data.case_number || '',
      caseTitle: data.caseTitle || data.case_title || '',
      court: data.court || '',
      caseType: data.caseType || data.case_type || '',
      filingDate: data.filingDate || data.filing_date,
      status: data.status,
      parties: (data.parties || []).map((p: any) => ({
        name: p.name || '',
        role: p.role || '',
        attorney: p.attorney,
      })),
      docketEntries: (data.docketEntries || data.docket_entries || []).map((entry: any) => ({
        date: entry.date || '',
        description: entry.description || '',
        documentType: entry.documentType || entry.document_type,
        filingParty: entry.filingParty || entry.filing_party,
      })),
      roa: (data.roa || []).map((roa: any) => ({
        date: roa.date || '',
        action: roa.action || '',
        description: roa.description,
      })),
    };
  }

  /**
   * Cleanup browser instance
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

}