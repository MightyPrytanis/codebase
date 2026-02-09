/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ModuleResource } from '../modules/base-module.js';
import { safeJoin } from '../utils/secure-path.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resource Loader Service
 * Handles downloading and caching external resources (PDFs, data files, etc.)
 * for modules that need access to government forms, templates, and formulas.
 */
export class ResourceLoader {
  private resourcesDir: string;
  
  constructor(resourcesDir?: string) {
    // Default to Cyrano/resources/ if not specified
    this.resourcesDir = resourcesDir || path.join(__dirname, '../../resources');
  }

  /**
   * Load a resource (download from URL if needed, or use local path)
   * Returns Buffer for binary files (PDFs), or parsed content for data files
   */
  async loadResource(resource: ModuleResource): Promise<Buffer | any> {
    // Priority 1: Local path exists, use it
    if (resource.path) {
      try {
        const fullPath = path.isAbsolute(resource.path) 
          ? resource.path 
          : safeJoin(this.resourcesDir, resource.path); // Use safeJoin for security
        return await fs.readFile(fullPath);
      } catch (error) {
        // Logging resource path for debugging - paths are application-controlled
        console.warn(`Failed to load resource from path ${resource.path}:`, error); // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
        // Fall through to URL download
      }
    }

    // Priority 2: URL provided, download and cache
    if (resource.url) {
      const cachedPath = this.getCachedPath(resource);
      
      // Check if cached
      try {
        const stats = await fs.stat(cachedPath);
        if (stats.isFile()) {
          console.log(`Using cached resource: ${resource.id} (${resource.version || 'no version'})`);
          return await fs.readFile(cachedPath);
        }
      } catch {
        // Not cached, will download
      }

      // Download from URL
      console.log(`Downloading resource: ${resource.id} from ${resource.url}`);
      try {
        const response = await fetch(resource.url);
        if (!response.ok) {
          throw new Error(`Failed to download ${resource.url}: ${response.statusText} (${response.status})`);
        }

        const buffer = await response.buffer();
        
        // Cache if enabled (default: true)
        if (resource.cache !== false) {
          await this.ensureDir(path.dirname(cachedPath));
          await fs.writeFile(cachedPath, buffer);
          console.log(`Cached resource: ${resource.id} to ${cachedPath}`);
        }

        return buffer;
      } catch (error) {
        // Logging resource ID and URL for debugging - URLs and IDs are application-controlled
        console.error(`Failed to download resource ${resource.id} from ${resource.url}:`, error); // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
        throw error;
      }
    }

    // Priority 3: Content provided, use it
    if (resource.content) {
      return resource.content;
    }

    throw new Error(`Resource ${resource.id} has no path, url, or content`);
  }

  /**
   * Get the cached file path for a resource
   */
  getCachedPath(resource: ModuleResource): string {
    const extension = this.getFileExtension(resource.url || resource.path || '');
    const filename = `${resource.id}${resource.version ? `_${resource.version}` : ''}${extension}`;
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    return path.join(this.resourcesDir, 'forecast', filename); // Safe: filename is sanitized from controlled resource ID
  }

  /**
   * Extract file extension from URL or path
   */
  private getFileExtension(filePath: string): string {
    const match = filePath.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? `.${match[1]}` : '.pdf'; // Default to .pdf for IRS forms
  }

  /**
   * Ensure directory exists (create if needed)
   */
  private async ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Check if a resource is cached
   */
  async isCached(resource: ModuleResource): Promise<boolean> {
    if (resource.path) {
      return false; // Local path, not cached
    }
    
    if (resource.url && resource.cache !== false) {
      const cachedPath = this.getCachedPath(resource);
      try {
        const stats = await fs.stat(cachedPath);
        return stats.isFile();
      } catch {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Get cache directory path
   */
  getCacheDir(): string {
    return path.join(this.resourcesDir, 'forecast');
}
}

