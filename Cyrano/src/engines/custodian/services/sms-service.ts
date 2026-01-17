/*
 * SMS Service
 * Sends SMS via Twilio or other SMS provider
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

export interface SMSOptions {
  to: string;
  message: string;
}

class SMSService {
  private initialized: boolean = false;
  private twilioConfig: {
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
  } | null = null;

  async initialize(): Promise<void> {
    this.initialized = true;
    
    // Load Twilio configuration from environment
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioConfig = {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER,
      };
    }
    
    console.log('[SMS Service] Service initialized');
  }

  async sendSMS(options: SMSOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // If Twilio not configured, log and return
    if (!this.twilioConfig) {
      console.log(`[SMS Service] Twilio not configured. Would send SMS to ${options.to}: ${options.message}`);
      return { success: false, error: 'Twilio not configured' };
    }

    try {
      // Dynamic import of twilio (optional dependency)
      const twilio = await import('twilio').catch(() => null);
      
      if (!twilio) {
        console.warn('[SMS Service] twilio not installed. Install with: npm install twilio');
        console.log(`[SMS Service] Would send SMS to ${options.to}: ${options.message}`);
        return { success: false, error: 'twilio not installed' };
      }

      if (!this.twilioConfig.accountSid || !this.twilioConfig.authToken) {
        return { success: false, error: 'Twilio credentials incomplete' };
      }

      const client = twilio.default(this.twilioConfig.accountSid, this.twilioConfig.authToken);

      await client.messages.create({
        body: options.message,
        from: this.twilioConfig.fromNumber || undefined,
        to: options.to,
      });

      console.log(`[SMS Service] SMS sent to ${options.to}`);
      return { success: true };
    } catch (error) {
      console.error('[SMS Service] Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  isConfigured(): boolean {
    return !!this.twilioConfig;
  }
}

export const smsService = new SMSService();
