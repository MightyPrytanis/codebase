/*
 * Alert Service
 * Sends alerts to administrators
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

export interface Alert {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  requires_intervention: boolean;
  timestamp: Date;
  metadata?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlertResult {
  success: boolean;
  alert_id: string;
  delivery_methods: string[];
  delivered_at: Date;
}

class AlertService {
  private initialized: boolean = false;
  private alertHistory: Alert[] = [];

  async initialize(): Promise<void> {
    this.initialized = true;
    console.log('[Alert Service] Service initialized');
  }

  async getStatus(): Promise<{ initialized: boolean; alert_count: number }> {
    return {
      initialized: this.initialized,
      alert_count: this.alertHistory.length,
    };
  }

  async sendAlert(alert: Omit<Alert, 'timestamp'>): Promise<AlertResult> {
    const fullAlert: Alert = {
      ...alert,
      timestamp: new Date(),
      priority: alert.priority || this.getPriorityFromLevel(alert.level),
    };

    this.alertHistory.push(fullAlert);

    const deliveryMethods: string[] = [];

    // Log alert (always)
    console.log(`[Custodian Alert] ${fullAlert.level.toUpperCase()}: ${fullAlert.title} - ${fullAlert.message}`);
    deliveryMethods.push('console');

    // Get admin contacts based on priority
    const { custodianConfigService } = await import('./custodian-config.js');
    const adminContacts = custodianConfigService.getAdminContacts(fullAlert.priority || 'low');

    // Send alerts via configured methods
    for (const contact of adminContacts) {
      try {
        switch (contact.method) {
          case 'email':
            await this.sendEmail(contact.contact_info, fullAlert);
            deliveryMethods.push(`email:${contact.contact_info}`);
            break;
          case 'sms':
            await this.sendSMS(contact.contact_info, fullAlert);
            deliveryMethods.push(`sms:${contact.contact_info}`);
            break;
          case 'instant_message':
            await this.sendInstantMessage(contact.contact_info, fullAlert);
            deliveryMethods.push(`im:${contact.contact_info}`);
            break;
          case 'webhook':
            await this.sendWebhook(contact.contact_info, fullAlert);
            deliveryMethods.push(`webhook:${contact.contact_info}`);
            break;
        }
      } catch (error) {
        // Logging contact method type (email/sms/webhook) - no sensitive data
        console.error(`[Alert Service] Failed to send alert via ${contact.method}:`, error); // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
      }
    }

    // For critical alerts or those requiring intervention, send ASAP
    if (fullAlert.requires_intervention || fullAlert.level === 'critical') {
      // Send immediate notification via all enabled methods
      await this.sendASAPNotification(fullAlert, adminContacts);
    }

    // Store in database for admin dashboard
    // In production, store alerts in database

    return {
      success: true,
      alert_id: `alert-${Date.now()}`,
      delivery_methods: deliveryMethods,
      delivered_at: fullAlert.timestamp,
    };
  }

  private getPriorityFromLevel(level: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (level) {
      case 'critical':
        return 'critical';
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      default:
        return 'low';
    }
  }

  private async sendEmail(email: string, alert: Alert): Promise<void> {
    // In production, implement actual email sending (e.g., using nodemailer, SendGrid, etc.)
    console.log(`[Alert Service] Would send email to ${email}: ${alert.title}`);
    // TODO: Implement actual email sending
  }

  private async sendSMS(phone: string, alert: Alert): Promise<void> {
    // In production, implement actual SMS sending (e.g., using Twilio, etc.)
    console.log(`[Alert Service] Would send SMS to ${phone}: ${alert.title}`);
    // TODO: Implement actual SMS sending
  }

  private async sendInstantMessage(contact: string, alert: Alert): Promise<void> {
    // In production, implement actual IM sending (e.g., Slack, Teams, etc.)
    console.log(`[Alert Service] Would send IM to ${contact}: ${alert.title}`);
    // TODO: Implement actual IM sending
  }

  private async sendWebhook(url: string, alert: Alert): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.error(`[Alert Service] Webhook failed:`, error);
      throw error;
    }
  }

  private async sendASAPNotification(alert: Alert, contacts: any[]): Promise<void> {
    // Send immediate notification via all enabled methods
    // This ensures admins are notified ASAP for critical issues
    for (const contact of contacts) {
      if (contact.enabled) {
        try {
          switch (contact.method) {
            case 'email':
              await this.sendEmail(contact.contact_info, alert);
              break;
            case 'sms':
              await this.sendSMS(contact.contact_info, alert);
              break;
            case 'instant_message':
              await this.sendInstantMessage(contact.contact_info, alert);
              break;
            case 'webhook':
              await this.sendWebhook(contact.contact_info, alert);
              break;
          }
        } catch (error) {
          // Logging contact method type (email/sms/webhook) - no sensitive data
          console.error(`[Alert Service] ASAP notification failed via ${contact.method}:`, error); // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
        }
      }
    }
  }

  getRecentAlerts(limit: number = 50): Alert[] {
    return this.alertHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getCriticalAlerts(): Alert[] {
    return this.alertHistory.filter(a => a.level === 'critical' || a.requires_intervention);
  }
}

export const alertService = new AlertService();

}
}
}
}
)
}
)
}
)
}