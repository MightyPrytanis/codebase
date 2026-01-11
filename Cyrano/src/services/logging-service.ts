/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  correlationId?: string;
  userId?: string;
  requestId?: string;
}

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile?: boolean;
  filePath?: string;
  maxFileSize?: number; // bytes
  maxFiles?: number;
  enableRemote?: boolean;
  remoteEndpoint?: string;
}

/**
 * Structured Logging Service
 * Provides JSON-structured logging with log levels, rotation, and optional aggregation
 */
export class LoggingService {
  private static instance: LoggingService;
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor(config?: Partial<LoggingConfig>) {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      enableConsole: process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true',
      enableFile: process.env.ENABLE_FILE_LOGS === 'true',
      filePath: process.env.LOG_FILE_PATH || './logs/cyrano.log',
      maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760', 10), // 10MB default
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
      enableRemote: process.env.ENABLE_REMOTE_LOGS === 'true',
      remoteEndpoint: process.env.LOG_REMOTE_ENDPOINT,
      ...config,
    };

    // Start periodic flush if file logging enabled
    if (this.config.enableFile) {
      this.flushInterval = setInterval(() => this.flush(), 5000); // Flush every 5 seconds
    }
  }

  public static getInstance(config?: Partial<LoggingConfig>): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService(config);
    }
    return LoggingService.instance;
  }

  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    // Check if we should log at this level
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) < levels.indexOf(this.config.level)) {
      return; // Skip if below configured level
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context: this.sanitizeContext(context) }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
      ...(context?.correlationId && { correlationId: context.correlationId }),
      ...(context?.userId && { userId: context.userId }),
      ...(context?.requestId && { requestId: context.requestId }),
    };

    // Remove from context if already in top level
    if (entry.context) {
      delete entry.context.correlationId;
      delete entry.context.userId;
      delete entry.context.requestId;
    }

    // Console output (formatted for readability)
    if (this.config.enableConsole) {
      const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      consoleMethod(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, context || '', error || '');
    }

    // Buffer for file/remote logging
    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization', 'cookie'];
    const sanitized = { ...context };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Flush log buffer to file/remote
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const entries = [...this.logBuffer];
    this.logBuffer = [];

    // File logging (async, don't block)
    if (this.config.enableFile && this.config.filePath) {
      this.writeToFile(entries).catch(err => {
        console.error('Failed to write logs to file:', err);
      });
    }

    // Remote logging (async, don't block)
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.sendToRemote(entries).catch(err => {
        console.error('Failed to send logs to remote:', err);
      });
    }
  }

  /**
   * Write logs to file (with rotation)
   */
  private async writeToFile(entries: LogEntry[]): Promise<void> {
    // In production, use a proper logging library like Winston or Pino
    // For now, we'll use basic file writing
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const logDir = path.dirname(this.config.filePath!);
      await fs.mkdir(logDir, { recursive: true });

      const logLines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(this.config.filePath!, logLines);

      // Check file size and rotate if needed
      const stats = await fs.stat(this.config.filePath!);
      if (stats.size > (this.config.maxFileSize || 10485760)) {
        await this.rotateLogFile();
      }
    } catch (error) {
      // Silently fail - don't break application if logging fails
      console.error('Logging service file write error:', error);
    }
  }

  /**
   * Rotate log file
   */
  private async rotateLogFile(): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const logPath = this.config.filePath!;
      const logDir = path.dirname(logPath);
      const logBase = path.basename(logPath, path.extname(logPath));
      const logExt = path.extname(logPath);

      // Rotate existing files
      for (let i = (this.config.maxFiles || 5) - 1; i > 0; i--) {
        const oldFile = path.join(logDir, `${logBase}.${i}${logExt}`);
        const newFile = path.join(logDir, `${logBase}.${i + 1}${logExt}`);
        try {
          await fs.rename(oldFile, newFile);
        } catch {
          // File doesn't exist, continue
        }
      }

      // Move current log to .1
      const firstRotated = path.join(logDir, `${logBase}.1${logExt}`);
      await fs.rename(logPath, firstRotated);
    } catch (error) {
      console.error('Log rotation error:', error);
    }
  }

  /**
   * Send logs to remote aggregation service
   */
  private async sendToRemote(entries: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (error) {
      // Silently fail - don't break application if remote logging fails
      console.error('Remote logging error:', error);
    }
  }

  /**
   * Public logging methods
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  public error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, context, error);
  }

  /**
   * Flush all buffered logs
   */
  public async flushAll(): Promise<void> {
    await this.flush();
  }

  /**
   * Cleanup on shutdown
   */
  public async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// Export singleton instance
export const loggingService = LoggingService.getInstance();

}
}
}
}
}