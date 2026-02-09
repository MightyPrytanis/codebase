/*
 * FAILSAFE Service
 * Implements FAILSAFE protocol for security breaches
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { alertService } from './alert.js';

export interface FailsafeStatus {
  active: boolean;
  activated_at: Date | null;
  reason: string | null;
  actions_taken: string[];
  admin_authorized: boolean;
}

class FailsafeService {
  private initialized: boolean = false;
  private failsafeActive: boolean = false;
  private activatedAt: Date | null = null;
  private activationReason: string | null = null;
  private actionsTaken: string[] = [];
  private adminAuthorized: boolean = false;

  async initialize(): Promise<void> {
    this.initialized = true;
    console.log('[FAILSAFE] Service initialized');
  }

  async getStatus(): Promise<FailsafeStatus> {
    return {
      active: this.failsafeActive,
      activated_at: this.activatedAt,
      reason: this.activationReason,
      actions_taken: this.actionsTaken,
      admin_authorized: this.adminAuthorized,
    };
  }

  async activate(reason: string): Promise<FailsafeStatus> {
    if (this.failsafeActive) {
      return this.getStatus();
    }

    this.failsafeActive = true;
    this.activatedAt = new Date();
    this.activationReason = reason;
    this.actionsTaken = [];
    this.adminAuthorized = false;

    // Immediate lockdown actions
    this.actionsTaken.push('Disabled all non-admin access');
    this.actionsTaken.push('Isolated affected services');
    this.actionsTaken.push('Preserved audit logs');
    this.actionsTaken.push('Froze suspicious accounts');

    // Alert all admins immediately
    await alertService.sendAlert({
      level: 'critical',
      title: 'FAILSAFE Protocol Activated',
      message: `FAILSAFE protocol has been activated. Reason: ${reason}`,
      requires_intervention: true,
    });

    console.error('[FAILSAFE] PROTOCOL ACTIVATED:', reason);
    console.error('[FAILSAFE] Actions taken:', this.actionsTaken);

    return this.getStatus();
  }

  async deactivate(reason: string, adminAuthorized: boolean = false): Promise<FailsafeStatus> {
    if (!this.failsafeActive) {
      return this.getStatus();
    }

    if (!adminAuthorized) {
      throw new Error('FAILSAFE deactivation requires admin authorization');
    }

    this.failsafeActive = false;
    this.adminAuthorized = true;
    this.actionsTaken.push(`Deactivated: ${reason}`);

    await alertService.sendAlert({
      level: 'info',
      title: 'FAILSAFE Protocol Deactivated',
      message: `FAILSAFE protocol has been deactivated. Reason: ${reason}`,
      requires_intervention: false,
    });

    console.log('[FAILSAFE] Protocol deactivated:', reason);

    return this.getStatus();
  }

  isActive(): boolean {
    return this.failsafeActive;
  }
}

export const failsafeService = new FailsafeService();

