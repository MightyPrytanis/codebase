/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import path from 'path';

/**
 * Secure path manipulation utilities to prevent path traversal attacks
 */

/**
 * Safely join path segments and validate against a base directory
 * Prevents path traversal attacks by normalizing paths and checking containment
 * 
 * @param basePath - The base directory that all paths must be contained within
 * @param segments - Path segments to join
 * @returns Validated absolute path
 * @throws Error if path traversal is detected
 */
export function safeJoin(basePath: string, ...segments: string[]): string {
  // Normalize all segments to prevent '..' attacks
  const normalizedSegments = segments.map(seg => 
    path.normalize(seg).replace(/^(\.\.[\/\\])+/, '')
  );
  
  // Join paths
  const fullPath = path.join(basePath, ...normalizedSegments);
  
  // Resolve to absolute paths for comparison
  const resolvedBase = path.resolve(basePath);
  const resolvedFile = path.resolve(fullPath);
  
  // Verify the resolved path is within the base directory
  if (!resolvedFile.startsWith(resolvedBase + path.sep) && resolvedFile !== resolvedBase) {
    throw new Error(`Path traversal detected: ${fullPath} is outside ${basePath}`);
  }
  
  return fullPath;
}

/**
 * Validate that a given path is within a base directory
 * 
 * @param basePath - The base directory
 * @param targetPath - The path to validate
 * @returns true if path is safe, false otherwise
 */
export function isPathSafe(basePath: string, targetPath: string): boolean {
  try {
    const resolvedBase = path.resolve(basePath);
    const resolvedTarget = path.resolve(targetPath);
    return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
  } catch {
    return false;
  }
}

/**
 * Normalize a filename to prevent directory traversal
 * Removes path separators and parent directory references
 * 
 * @param filename - The filename to normalize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/[\/\\]/g, '_') // Replace path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '_'); // Remove invalid filename characters
}

/**
 * Create a path validation middleware for Express routes
 * 
 * @param basePath - The base directory to validate against
 * @returns Middleware function
 */
export function createPathValidator(basePath: string) {
  return (filePath: string): string => {
    if (!isPathSafe(basePath, filePath)) {
      throw new Error('Invalid file path: path traversal detected');
    }
    return filePath;
  };
}
