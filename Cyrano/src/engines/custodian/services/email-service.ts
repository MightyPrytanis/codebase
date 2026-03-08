/*
 * Email Service
 * Sends emails via SMTP or email service provider
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

class EmailService {
  private initialized: boolean = false;
  private smtpConfig: {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  } | null = null;

  async initialize(): Promise<void> {
    this.initialized = true;
    
    // Load SMTP configuration from environment
    if (process.env.SMTP_HOST) {
      this.smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        } : undefined,
      };
    }
    
    console.log('[Email Service] Service initialized');
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // If SMTP not configured, log and return
    if (!this.smtpConfig) {
      console.log(`[Email Service] SMTP not configured. Would send email to ${options.to}: ${options.subject}`);
      console.log(`[Email Service] Email content: ${options.text}`);
      return { success: false, error: 'SMTP not configured' };
    }

    try {
      // Dynamic import of nodemailer (optional dependency)
      const nodemailer = await import('nodemailer').catch(() => null);
      
      if (!nodemailer) {
        console.warn('[Email Service] nodemailer not installed. Install with: npm install nodemailer @types/nodemailer');
        console.log(`[Email Service] Would send email to ${options.to}: ${options.subject}`);
        return { success: false, error: 'nodemailer not installed' };
      }

      const transporter = nodemailer.createTransport({
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure,
        auth: this.smtpConfig.auth,
      });

      await transporter.sendMail({
        from: options.from || this.smtpConfig.auth?.user || 'custodian@cyrano.local',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      });

      console.log(`[Email Service] Email sent to ${options.to}: ${options.subject}`);
      return { success: true };
    } catch (error) {
      console.error('[Email Service] Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  isConfigured(): boolean {
    return !!this.smtpConfig;
  }
}

export const emailService = new EmailService();

