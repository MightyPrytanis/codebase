/*
 * Type declarations for optional dependencies
 * These packages may not be installed in all environments
 *
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Twilio SDK types (optional dependency)
 * Only available when twilio package is installed
 */
declare module 'twilio' {
  export interface TwilioClient {
    messages: {
      create(options: {
        body: string;
        from?: string;
        to: string;
      }): Promise<any>;
    };
  }

  export interface TwilioConstructor {
    new (accountSid: string, authToken: string): TwilioClient;
    (accountSid: string, authToken: string): TwilioClient;
  }

  const twilio: TwilioConstructor & { default: TwilioConstructor };
  export default twilio;
}

/**
 * Google APIs types (optional dependency)
 * Only available when googleapis package is installed
 */
declare module 'googleapis' {
  export const google: any;
}

/**
 * AWS SDK S3 Client types (optional dependency)
 * Only available when @aws-sdk/client-s3 package is installed
 */
declare module '@aws-sdk/client-s3' {
  export class S3Client {
    constructor(config: any);
    send(command: any): Promise<any>;
  }

  export class ListObjectsV2Command {
    constructor(input: any);
  }

  export class GetObjectCommand {
    constructor(input: any);
  }

  export class HeadObjectCommand {
    constructor(input: any);
  }

  export class PutObjectCommand {
    constructor(input: any);
  }
}

/**
 * Drizzle Zod types (optional dependency)
 * Only available when drizzle-zod package is installed
 */
declare module 'drizzle-zod' {
  export function createInsertSchema<T>(schema: any): any;
