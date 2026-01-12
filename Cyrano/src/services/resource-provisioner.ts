/*
 * ResourceProvisioner
 * Wraps ResourceLoader with version tracking and scheduled refresh hooks.
 * Keeps implementation light while enabling future cron-based updates.
 */
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';
import { ModuleResource } from '../modules/base-module.js';
import { ResourceLoader } from './resource-loader.js';

export interface ProvisionedResource extends ModuleResource {
  lastUpdated?: string;
  checksum?: string;
}

export class ResourceProvisioner {
  private loader: ResourceLoader;
  private registryPath: string;

  constructor(resourcesDir?: string) {
    this.loader = new ResourceLoader(resourcesDir);
    this.registryPath = path.join(resourcesDir || path.join(process.cwd(), 'Cyrano/resources'), 'registry.json');
  }

  /**
   * Load and optionally refresh a resource. Persists simple metadata.
   */
  async fetch(resource: ProvisionedResource): Promise<Buffer | any> {
    const data = await this.loader.loadResource(resource);
    await this.persistMetadata(resource);
    return data;
  }

  /**
   * Check if an update is needed based on version string.
   */
  needsUpdate(resource: ProvisionedResource): boolean {
    const registry = this.readRegistrySync();
    const entry = registry[resource.id];
    if (!entry) return true;
    return entry.version !== resource.version;
  }

  /**
   * Schedule a refresh callback. This is intentionally lightweight to avoid new deps.
   * Callers can wire this into node-cron or OS-level schedulers.
   */
  scheduleRefresh(
    resource: ProvisionedResource,
    refreshFn: () => Promise<void>,
    intervalMs: number = 1000 * 60 * 60 * 24,
  ): NodeJS.Timeout {
    return setInterval(async () => {
      if (this.needsUpdate(resource)) {
        await refreshFn();
        await this.persistMetadata(resource);
      }
    }, intervalMs);
  }

  private async persistMetadata(resource: ProvisionedResource): Promise<void> {
    const registry = this.readRegistrySync();
    registry[resource.id] = {
      version: resource.version || 'unknown',
      lastUpdated: new Date().toISOString(),
    };
    await fsp.mkdir(path.dirname(this.registryPath), { recursive: true });
    await fsp.writeFile(this.registryPath, JSON.stringify(registry, null, 2), 'utf8');
  }

  private readRegistrySync(): Record<string, { version: string; lastUpdated?: string }> {
    try {
      const raw = fs.readFileSync(this.registryPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return {};

}
}
}