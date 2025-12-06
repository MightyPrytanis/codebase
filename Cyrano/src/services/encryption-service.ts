/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { createCipheriv, createDecipheriv, randomBytes, createHmac, pbkdf2Sync } from 'crypto';

/**
 * Enterprise-Grade Encryption Service
 * 
 * Provides AES-256-GCM encryption with authenticated encryption,
 * per-field key derivation, and secure key management.
 * 
 * HIPAA-compliant encryption for wellness data.
 */

export interface EncryptedData {
  encrypted: string; // Base64 encoded ciphertext + IV/nonce + auth tag
  algorithm: string; // 'aes-256-gcm'
  keyDerivation: string; // 'pbkdf2'
}

export interface EncryptedBuffer {
  encrypted: Buffer; // Encrypted buffer
  algorithm: string;
  keyDerivation: string;
}

class EncryptionService {
  private masterKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 32; // 256 bits
  private readonly pbkdf2Iterations = 100000;
  private readonly pbkdf2Digest = 'sha256';

  constructor() {
    const keyEnv = process.env.WELLNESS_ENCRYPTION_KEY;
    if (!keyEnv) {
      throw new Error('WELLNESS_ENCRYPTION_KEY environment variable is required');
    }

    // Validate key is 32-byte hex string (64 hex characters)
    if (!/^[0-9a-fA-F]{64}$/.test(keyEnv)) {
      throw new Error('WELLNESS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }

    this.masterKey = Buffer.from(keyEnv, 'hex');
  }

  /**
   * Derive a field-specific encryption key from master key + field name
   */
  private deriveFieldKey(fieldName: string): Buffer {
    const salt = Buffer.from(`wellness-field-${fieldName}`, 'utf8');
    return pbkdf2Sync(
      this.masterKey,
      salt,
      this.pbkdf2Iterations,
      this.keyLength,
      this.pbkdf2Digest
    );
  }

  /**
   * Encrypt a field value
   */
  encryptField(data: string, fieldName: string): EncryptedData {
    const fieldKey = this.deriveFieldKey(fieldName);
    const iv = randomBytes(this.ivLength);
    
    const cipher = createCipheriv(this.algorithm, fieldKey, iv);
    
    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine: IV + AuthTag + EncryptedData
    const combined = Buffer.concat([iv, authTag, encrypted]);
    
    return {
      encrypted: combined.toString('base64'),
      algorithm: this.algorithm,
      keyDerivation: 'pbkdf2',
    };
  }

  /**
   * Decrypt a field value
   */
  decryptField(encrypted: EncryptedData, fieldName: string): string {
    if (encrypted.algorithm !== this.algorithm) {
      throw new Error(`Unsupported algorithm: ${encrypted.algorithm}`);
    }

    const fieldKey = this.deriveFieldKey(fieldName);
    const combined = Buffer.from(encrypted.encrypted, 'base64');
    
    // Extract: IV + AuthTag + EncryptedData
    const iv = combined.subarray(0, this.ivLength);
    const authTag = combined.subarray(this.ivLength, this.ivLength + this.tagLength);
    const encryptedData = combined.subarray(this.ivLength + this.tagLength);
    
    const decipher = createDecipheriv(this.algorithm, fieldKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Encrypt an audio file buffer
   */
  encryptAudioFile(buffer: Buffer): EncryptedBuffer {
    const iv = randomBytes(this.ivLength);
    
    // Use master key directly for file encryption (no field derivation for files)
    const cipher = createCipheriv(this.algorithm, this.masterKey, iv);
    
    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine: IV + AuthTag + EncryptedData
    const combined = Buffer.concat([iv, authTag, encrypted]);
    
    return {
      encrypted: combined,
      algorithm: this.algorithm,
      keyDerivation: 'none', // Direct master key for files
    };
  }

  /**
   * Decrypt an audio file buffer
   */
  decryptAudioFile(encrypted: EncryptedBuffer): Buffer {
    if (encrypted.algorithm !== this.algorithm) {
      throw new Error(`Unsupported algorithm: ${encrypted.algorithm}`);
    }

    const combined = encrypted.encrypted;
    
    // Extract: IV + AuthTag + EncryptedData
    const iv = combined.subarray(0, this.ivLength);
    const authTag = combined.subarray(this.ivLength, this.ivLength + this.tagLength);
    const encryptedData = combined.subarray(this.ivLength + this.tagLength);
    
    const decipher = createDecipheriv(this.algorithm, this.masterKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  /**
   * Generate HMAC for integrity verification
   */
  generateHMAC(data: string): string {
    const hmac = createHmac('sha256', this.masterKey);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: string, expectedHMAC: string): boolean {
    const computedHMAC = this.generateHMAC(data);
    return computedHMAC === expectedHMAC;
  }

  /**
   * Rotate encryption key (requires re-encryption of all data)
   * This is a placeholder - actual implementation would require
   * decrypting with old key and re-encrypting with new key
   */
  async rotateEncryptionKey(newKeyHex: string): Promise<void> {
    if (!/^[0-9a-fA-F]{64}$/.test(newKeyHex)) {
      throw new Error('New key must be a 64-character hex string (32 bytes)');
    }
    
    // In production, this would:
    // 1. Decrypt all data with old key
    // 2. Re-encrypt with new key
    // 3. Update master key
    // 4. Log rotation event
    
    this.masterKey = Buffer.from(newKeyHex, 'hex');
  }
}

// Export singleton instance
let encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
}

// Export for direct use
export const encryption = {
  encryptField: (data: string, fieldName: string) => {
    const service = getEncryptionService();
    return service.encryptField(data, fieldName);
  },
  decryptField: (encrypted: EncryptedData, fieldName: string) => {
    const service = getEncryptionService();
    return service.decryptField(encrypted, fieldName);
  },
  encryptAudioFile: (buffer: Buffer) => {
    const service = getEncryptionService();
    return service.encryptAudioFile(buffer);
  },
  decryptAudioFile: (encrypted: EncryptedBuffer) => {
    const service = getEncryptionService();
    return service.decryptAudioFile(encrypted);
  },
  generateHMAC: (data: string) => {
    const service = getEncryptionService();
    return service.generateHMAC(data);
  },
  verifyHMAC: (data: string, expectedHMAC: string) => {
    const service = getEncryptionService();
    return service.verifyHMAC(data, expectedHMAC);
  },
};

