/*
 * Dependency Manager Service
 * Manages dependency updates automatically
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { renderIntegrationService } from './render-integration.js';

const execAsync = promisify(exec);

export interface DependencyUpdate {
  package: string;
  current_version: string;
  latest_version: string;
  update_type: 'patch' | 'minor' | 'major';
  security_update: boolean;
}

export interface UpdateResult {
  success: boolean;
  updated: string[];
  failed: string[];
  rollback_available: boolean;
  changelog: string[];
}

class DependencyManagerService {
  private initialized: boolean = false;
  private updateHistory: Array<{ timestamp: Date; updates: string[]; success: boolean }> = [];

  async initialize(): Promise<void> {
    this.initialized = true;
    console.log('[Dependency Manager] Service initialized');
  }

  async getStatus(): Promise<{ initialized: boolean; update_history_count: number }> {
    return {
      initialized: this.initialized,
      update_history_count: this.updateHistory.length,
    };
  }

  async checkForUpdates(target?: string): Promise<{
    updates_available: boolean;
    updates: DependencyUpdate[];
    auto_update_safe: boolean;
  }> {
    try {
      // Check for outdated packages
      const { stdout } = await execAsync('npm outdated --json', {
        cwd: path.resolve(process.cwd(), 'Cyrano'),
      });

      const outdated = JSON.parse(stdout || '{}');
      const updates: DependencyUpdate[] = [];

      for (const [pkg, info] of Object.entries(outdated as Record<string, any>)) {
        if (target && pkg !== target) continue;

        const current = info.current;
        const latest = info.latest;
        const updateType = this.getUpdateType(current, latest);
        const securityUpdate = await this.isSecurityUpdate(pkg, current, latest);

        updates.push({
          package: pkg,
          current_version: current,
          latest_version: latest,
          update_type: updateType,
          security_update: securityUpdate,
        });
      }

      // Auto-update is safe if only patch/minor updates and no breaking changes
      const autoUpdateSafe = updates.every(
        u => (u.update_type === 'patch' || u.update_type === 'minor') && !u.security_update
      );

      return {
        updates_available: updates.length > 0,
        updates,
        auto_update_safe: autoUpdateSafe,
      };
    } catch (error) {
      return {
        updates_available: false,
        updates: [],
        auto_update_safe: false,
      };
    }
  }

  async updateDependencies(target?: string, options?: any): Promise<UpdateResult> {
    const timestamp = new Date();
    const updated: string[] = [];
    const failed: string[] = [];
    const changelog: string[] = [];

    // On Render, trigger a new deployment instead of runtime npm update
    if (renderIntegrationService.isRender() && renderIntegrationService.isConfigured()) {
      changelog.push('Render environment detected - triggering new deployment for dependency updates');
      
      const deployResult = await renderIntegrationService.triggerDeploy(
        `Dependency update: ${target || 'all dependencies'}`
      );

      if (deployResult.success) {
        changelog.push(`Deployment triggered successfully (deploy ID: ${deployResult.deploy_id})`);
        changelog.push('Dependencies will be updated in new deployment');
        
        this.updateHistory.push({
          timestamp,
          updates: [target || 'all'],
          success: true,
        });

        return {
          success: true,
          updated: [target || 'all'],
          failed: [],
          rollback_available: false, // Render handles rollback via previous deployment
          changelog,
        };
      } else {
        changelog.push(`Failed to trigger deployment: ${deployResult.error}`);
        
        this.updateHistory.push({
          timestamp,
          updates: [],
          success: false,
        });

        return {
          success: false,
          updated: [],
          failed: [target || 'all'],
          rollback_available: false,
          changelog,
        };
      }
    }

    // Local/non-Render environment: use npm update
    try {
      // Backup package.json before update
      const packageJsonPath = path.resolve(process.cwd(), 'Cyrano', 'package.json');
      const backupPath = packageJsonPath + `.backup.${timestamp.getTime()}`;
      await fs.copyFile(packageJsonPath, backupPath);

      if (target) {
        // Update specific package
        try {
          await execAsync(`npm update ${target}`, {
            cwd: path.resolve(process.cwd(), 'Cyrano'),
          });
          updated.push(target);
          changelog.push(`Updated ${target}`);
        } catch (error) {
          failed.push(target);
          changelog.push(`Failed to update ${target}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        // Update all dependencies
        try {
          await execAsync('npm update', {
            cwd: path.resolve(process.cwd(), 'Cyrano'),
          });
          changelog.push('Updated all dependencies');
        } catch (error) {
          changelog.push(`Failed to update dependencies: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Verify update success
      const verifyResult = await this.verifyUpdate();
      if (!verifyResult.success) {
        // Rollback if verification fails
        await fs.copyFile(backupPath, packageJsonPath);
        await execAsync('npm install', {
          cwd: path.resolve(process.cwd(), 'Cyrano'),
        });
        changelog.push('Rolled back due to verification failure');
      }

      this.updateHistory.push({
        timestamp,
        updates: updated,
        success: verifyResult.success,
      });

      return {
        success: verifyResult.success,
        updated,
        failed,
        rollback_available: true,
        changelog,
      };
    } catch (error) {
      return {
        success: false,
        updated,
        failed: [...failed, target || 'all'],
        rollback_available: true,
        changelog: [...changelog, `Error: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  private getUpdateType(current: string, latest: string): 'patch' | 'minor' | 'major' {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    if (latestParts[0] > currentParts[0]) return 'major';
    if (latestParts[1] > currentParts[1]) return 'minor';
    return 'patch';
  }

  private async isSecurityUpdate(pkg: string, current: string, latest: string): Promise<boolean> {
    // In production, check npm audit or security advisories
    // For now, assume security updates are flagged by npm audit
    try {
      const { stdout } = await execAsync(`npm audit --json`, {
        cwd: path.resolve(process.cwd(), 'Cyrano'),
      });
      const audit = JSON.parse(stdout);
      return audit.vulnerabilities && audit.vulnerabilities[pkg] !== undefined;
    } catch {
      return false;
    }
  }

  private async verifyUpdate(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Run type check
      await execAsync('npm run type-check', {
        cwd: path.resolve(process.cwd(), 'Cyrano'),
      });
    } catch (error) {
      errors.push(`Type check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      // Run tests
      await execAsync('npm test', {
        cwd: path.resolve(process.cwd(), 'Cyrano'),
      });
    } catch (error) {
      errors.push(`Tests failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }
}

export const dependencyManagerService = new DependencyManagerService();

