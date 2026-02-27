/*
 * Security Monitor Service
 * Monitors for security threats and breaches
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { db } from '../../../db.js';

export interface SecurityThreat {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detected_at: Date;
  source?: string;
  details: any;
}

export interface SecurityStatus {
  status: 'secure' | 'threat_detected' | 'breach_detected';
  threats: SecurityThreat[];
  threat_detected: boolean;
  threat_description?: string;
  last_check: Date;
}

class SecurityMonitorService {
  private initialized: boolean = false;
  private threatHistory: SecurityThreat[] = [];
  private failedAuthAttempts: Map<string, { count: number; last_attempt: Date }> = new Map();
  private suspiciousIPs: Set<string> = new Set();

  async initialize(): Promise<void> {
    this.initialized = true;
    console.log('[Security Monitor] Service initialized');
  }

  async getStatus(): Promise<{ initialized: boolean; threat_count: number }> {
    return {
      initialized: this.initialized,
      threat_count: this.threatHistory.length,
    };
  }

  async checkSecurity(): Promise<SecurityStatus> {
    const threats: SecurityThreat[] = [];
    const now = new Date();

    // Check for brute force attacks
    for (const [identifier, attempts] of this.failedAuthAttempts.entries()) {
      if (attempts.count > 5 && (now.getTime() - attempts.last_attempt.getTime()) < 15 * 60 * 1000) {
        threats.push({
          type: 'brute_force_attack',
          severity: 'high',
          description: `Multiple failed authentication attempts from ${identifier}`,
          detected_at: now,
          source: identifier,
          details: { attempt_count: attempts.count },
        });
      }
    }

    // Check for suspicious IPs
    if (this.suspiciousIPs.size > 0) {
      threats.push({
        type: 'suspicious_activity',
        severity: 'medium',
        description: `Suspicious activity detected from ${this.suspiciousIPs.size} IP(s)`,
        detected_at: now,
        details: { suspicious_ips: Array.from(this.suspiciousIPs) },
      });
    }

    // Check for rate limit violations
    // In production, check actual rate limit violations from middleware

    // Check for unauthorized access attempts
    // In production, check audit logs for unauthorized access patterns

    const threatDetected = threats.length > 0;
    const breachDetected = threats.some(t => t.severity === 'critical');

    this.threatHistory.push(...threats);

    return {
      status: breachDetected ? 'breach_detected' : threatDetected ? 'threat_detected' : 'secure',
      threats,
      threat_detected: threatDetected,
      threat_description: threatDetected ? threats.map(t => t.description).join('; ') : undefined,
      last_check: now,
    };
  }

  recordFailedAuth(identifier: string): void {
    const existing = this.failedAuthAttempts.get(identifier);
    if (existing) {
      existing.count++;
      existing.last_attempt = new Date();
    } else {
      this.failedAuthAttempts.set(identifier, {
        count: 1,
        last_attempt: new Date(),
      });
    }
  }

  recordSuspiciousIP(ip: string): void {
    this.suspiciousIPs.add(ip);
  }

  clearFailedAuth(identifier: string): void {
    this.failedAuthAttempts.delete(identifier);
  }

  clearSuspiciousIP(ip: string): void {
    this.suspiciousIPs.delete(ip);
  }
}

export const securityMonitorService = new SecurityMonitorService();

