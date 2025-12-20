/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Global TypeScript declarations for Cyrano backend environment.
 * 
 * This file provides type definitions for Node.js environment variables
 * used throughout the Cyrano codebase. It ensures type safety when accessing
 * process.env properties.
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server Configuration
      /** Server port number (default: 5002) */
      PORT?: string;
      /** Node environment (development | production | test) */
      NODE_ENV?: string;
      /** Cyrano operation mode (http | stdio) */
      CYRANO_MODE?: string;
      /** Enable demo mode (true | false) */
      DEMO_MODE?: string;
      /** Force HTTPS redirects (true | false) */
      FORCE_HTTPS?: string;
      /** Log level (debug | info | warn | error) */
      LOG_LEVEL?: string;
      
      // Database Configuration
      /** Database connection URL (PostgreSQL or SQLite) */
      DATABASE_URL?: string;
      /** Arkiver database file path */
      ARKIVER_DB_PATH?: string;
      
      // Authentication
      /** JWT secret key for token signing */
      JWT_SECRET?: string;
      /** JWT token expiration duration */
      JWT_EXPIRATION?: string;
      
      // AI Provider API Keys
      /** Anthropic Claude API key */
      ANTHROPIC_API_KEY?: string;
      /** OpenAI GPT API key */
      OPENAI_API_KEY?: string;
      /** Google Gemini API key */
      GEMINI_API_KEY?: string;
      /** Perplexity API key */
      PERPLEXITY_API_KEY?: string;
      /** DeepSeek API key */
      DEEPSEEK_API_KEY?: string;
      /** xAI Grok API key */
      XAI_API_KEY?: string;
      /** Cohere API key */
      COHERE_API_KEY?: string;
      /** Hume AI API key */
      HUME_API_KEY?: string;
      
      // Google Services
      /** Google API key (non-Gemini services) */
      GOOGLE_API_KEY?: string;
      /** Google OAuth client ID */
      GOOGLE_OAUTH_CLIENT_ID?: string;
      /** Google OAuth client secret */
      GOOGLE_OAUTH_CLIENT_SECRET?: string;
      
      // Gmail Integration
      /** Gmail OAuth client ID */
      GMAIL_CLIENT_ID?: string;
      /** Gmail OAuth client secret */
      GMAIL_CLIENT_SECRET?: string;
      /** Gmail OAuth redirect URI */
      GMAIL_REDIRECT_URI?: string;
      /** Gmail OAuth refresh token */
      GMAIL_REFRESH_TOKEN?: string;
      /** Gmail OAuth access token */
      GMAIL_ACCESS_TOKEN?: string;
      
      // Outlook Integration
      /** Outlook OAuth client ID */
      OUTLOOK_CLIENT_ID?: string;
      /** Outlook OAuth client secret */
      OUTLOOK_CLIENT_SECRET?: string;
      /** Outlook OAuth redirect URI */
      OUTLOOK_REDIRECT_URI?: string;
      /** Outlook OAuth tenant ID */
      OUTLOOK_TENANT_ID?: string;
      /** Outlook OAuth refresh token */
      OUTLOOK_REFRESH_TOKEN?: string;
      /** Outlook OAuth access token */
      OUTLOOK_ACCESS_TOKEN?: string;
      
      // External Service Integrations
      /** Clio API key for legal practice management */
      CLIO_API_KEY?: string;
      /** Clio OAuth client ID */
      CLIO_CLIENT_ID?: string;
      /** Clio OAuth client secret */
      CLIO_CLIENT_SECRET?: string;
      /** Clio OAuth redirect URI */
      CLIO_REDIRECT_URI?: string;
      /** CourtListener API key for legal case database */
      COURTLISTENER_API_KEY?: string;
      
      // CORS Configuration
      /** Allowed origins for CORS (comma-separated) */
      ALLOWED_ORIGINS?: string;
      
      // Arkiver Configuration
      /** OCR language for document processing */
      ARKIVER_OCR_LANGUAGE?: string;
      /** Enable verbose OCR logging (true | false) */
      ARKIVER_OCR_VERBOSE?: string;
      /** Maximum file size for processing (MB) */
      MAX_FILE_SIZE_MB?: string;
      /** Supported file types (comma-separated) */
      SUPPORTED_FILE_TYPES?: string;
      
      // Feature Flags
      /** Enable Gemini provider (true | false) */
      ENABLE_GEMINI?: string;
      /** Enable xAI provider (true | false) */
      ENABLE_XAI?: string;
      /** Enable DeepSeek provider (true | false) */
      ENABLE_DEEPSEEK?: string;
      /** Enable OCR processing (true | false) */
      ENABLE_OCR?: string;
      /** Enable multi-language support (true | false) */
      ENABLE_MULTI_LANGUAGE?: string;
      /** Enable telemetry (true | false) */
      ENABLE_TELEMETRY?: string;
      
      // Rate Limiting
      /** Max requests per minute per user */
      RATE_LIMIT_RPM?: string;
      /** Max tokens per request */
      MAX_TOKENS_PER_REQUEST?: string;
      
      // Monitoring & Telemetry
      /** Sentry DSN for error tracking */
      SENTRY_DSN?: string;
      /** DataDog API key for metrics */
      DATADOG_API_KEY?: string;
      
      // Redis
      /** Redis connection URL */
      REDIS_URL?: string;
      
      // Email/SMTP
      /** SMTP server host */
      SMTP_HOST?: string;
      /** SMTP server port */
      SMTP_PORT?: string;
      /** SMTP username */
      SMTP_USER?: string;
      /** SMTP password */
      SMTP_PASS?: string;
      /** Email "from" address */
      EMAIL_FROM?: string;
      
      // Development/Debug
      /** Enable debug mode (true | false) */
      DEBUG?: string;
      /** Enable verbose logging (true | false) */
      VERBOSE_LOGGING?: string;
      /** Skip authentication (development only - NEVER in production) */
      SKIP_AUTH?: string;
    }
  }
}

// Make this a module to ensure it's treated as an ambient declaration
export {};
