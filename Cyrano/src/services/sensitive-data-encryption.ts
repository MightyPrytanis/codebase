/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Sensitive Data Encryption Utility
 * 
 * Provides helper functions to encrypt sensitive data before storage
 * and decrypt on retrieval. Uses the encryption service for API keys,
 * OAuth tokens, and other sensitive information.
 */

import { getEncryptionService, EncryptedData } from './encryption-service.js';

/**
 * Encrypt an API key before storage
 */
export function encryptApiKey(apiKey: string): EncryptedData {
  const encryptionService = getEncryptionService();
  return encryptionService.encryptField(apiKey, 'api_key');
}

/**
 * Decrypt an API key after retrieval
 */
export function decryptApiKey(encrypted: EncryptedData): string {
  const encryptionService = getEncryptionService();
  return encryptionService.decryptField(encrypted, 'api_key');
}

/**
 * Encrypt an OAuth access token before storage
 */
export function encryptOAuthToken(token: string, provider: string): EncryptedData {
  const encryptionService = getEncryptionService();
  return encryptionService.encryptField(token, `oauth_token_${provider}`);
}

/**
 * Decrypt an OAuth access token after retrieval
 */
export function decryptOAuthToken(encrypted: EncryptedData, provider: string): string {
  const encryptionService = getEncryptionService();
  return encryptionService.decryptField(encrypted, `oauth_token_${provider}`);
}

/**
 * Encrypt personal information (PII) before storage
 */
export function encryptPII(data: string, fieldName: string): EncryptedData {
  const encryptionService = getEncryptionService();
  return encryptionService.encryptField(data, `pii_${fieldName}`);
}

/**
 * Decrypt personal information (PII) after retrieval
 */
export function decryptPII(encrypted: EncryptedData, fieldName: string): string {
  const encryptionService = getEncryptionService();
  return encryptionService.decryptField(encrypted, `pii_${fieldName}`);
}

/**
 * Helper to encrypt sensitive fields in an object
 * Encrypts: apiKey, accessToken, refreshToken, password, ssn, etc.
 */
export function encryptSensitiveFields<T extends Record<string, any>>(data: T): T {
  const encrypted: any = { ...data };
  
  // Encrypt API keys
  if ('apiKey' in encrypted && encrypted.apiKey && typeof encrypted.apiKey === 'string') {
    encrypted.apiKey = encryptApiKey(encrypted.apiKey);
  }
  
  // Encrypt OAuth tokens
  if ('accessToken' in encrypted && encrypted.accessToken && typeof encrypted.accessToken === 'string') {
    const provider = (encrypted.provider as string) || 'default';
    encrypted.accessToken = encryptOAuthToken(encrypted.accessToken, provider);
  }
  
  if ('refreshToken' in encrypted && encrypted.refreshToken && typeof encrypted.refreshToken === 'string') {
    const provider = (encrypted.provider as string) || 'default';
    encrypted.refreshToken = encryptOAuthToken(encrypted.refreshToken, provider);
  }
  
  // Encrypt credentials object
  if ('credentials' in encrypted && encrypted.credentials && typeof encrypted.credentials === 'object' && encrypted.credentials !== null) {
    const creds: any = { ...encrypted.credentials };
    if (creds.apiKey && typeof creds.apiKey === 'string') {
      creds.apiKey = encryptApiKey(creds.apiKey);
    }
    if (creds.accessToken && typeof creds.accessToken === 'string') {
      const provider = creds.provider || 'default';
      creds.accessToken = encryptOAuthToken(creds.accessToken, provider);
    }
    encrypted.credentials = creds;
  }
  
  return encrypted as T;
}

/**
 * Helper to decrypt sensitive fields in an object
 */
export function decryptSensitiveFields<T extends Record<string, any>>(data: T): T {
  const decrypted: any = { ...data };
  
  // Decrypt API keys
  if ('apiKey' in decrypted && decrypted.apiKey && typeof decrypted.apiKey === 'object' && decrypted.apiKey !== null && 'encrypted' in decrypted.apiKey) {
    decrypted.apiKey = decryptApiKey(decrypted.apiKey as EncryptedData);
  }
  
  // Decrypt OAuth tokens
  if ('accessToken' in decrypted && decrypted.accessToken && typeof decrypted.accessToken === 'object' && decrypted.accessToken !== null && 'encrypted' in decrypted.accessToken) {
    const provider = (decrypted.provider as string) || 'default';
    decrypted.accessToken = decryptOAuthToken(decrypted.accessToken as EncryptedData, provider);
  }
  
  if ('refreshToken' in decrypted && decrypted.refreshToken && typeof decrypted.refreshToken === 'object' && decrypted.refreshToken !== null && 'encrypted' in decrypted.refreshToken) {
    const provider = (decrypted.provider as string) || 'default';
    decrypted.refreshToken = decryptOAuthToken(decrypted.refreshToken as EncryptedData, provider);
  }
  
  // Decrypt credentials object
  if ('credentials' in decrypted && decrypted.credentials && typeof decrypted.credentials === 'object' && decrypted.credentials !== null) {
    const creds: any = { ...decrypted.credentials };
    if (creds.apiKey && typeof creds.apiKey === 'object' && creds.apiKey !== null && 'encrypted' in creds.apiKey) {
      creds.apiKey = decryptApiKey(creds.apiKey as EncryptedData);
    }
    if (creds.accessToken && typeof creds.accessToken === 'object' && creds.accessToken !== null && 'encrypted' in creds.accessToken) {
      const provider = creds.provider || 'default';
      creds.accessToken = decryptOAuthToken(creds.accessToken as EncryptedData, provider);
    }
    decrypted.credentials = creds;
  }
  
  return decrypted as T;
}
