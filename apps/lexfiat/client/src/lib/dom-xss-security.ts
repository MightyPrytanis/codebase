/**
 * DOM XSS Security Utilities
 * 
 * Comprehensive client-side security utilities for preventing DOM-based XSS attacks.
 * Implements input validation, output encoding, and secure DOM manipulation practices.
 * 
 * Created: 2025-12-21
 * Security Specialist Agent - DOM XSS Hardening
 */

/**
 * Sanitize string for safe HTML text content (textContent)
 * Escapes HTML entities to prevent XSS when used in text nodes
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize string for safe HTML attribute values
 * Escapes characters that could break out of attribute context
 */
export function escapeHtmlAttribute(value: string): string {
  if (typeof value !== 'string') {
    return String(value);
  }
  
  // Escape quotes and other dangerous characters
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize string for safe JavaScript string context
 * Escapes characters that could break out of JavaScript string literals
 */
export function escapeJavaScript(value: string): string {
  if (typeof value !== 'string') {
    return JSON.stringify(value);
  }
  
  // Use JSON.stringify for proper escaping
  return JSON.stringify(value).slice(1, -1); // Remove surrounding quotes
}

/**
 * Sanitize string for safe CSS value context
 * Validates and escapes CSS values to prevent injection
 */
export function escapeCSS(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  
  // Remove dangerous CSS constructs
  return value
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/expression\(/gi, '')
    .replace(/@import/gi, '')
    .replace(/url\(/gi, '');
}

/**
 * Sanitize URL to prevent javascript: protocol and other dangerous schemes
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim();
  
  // Block javascript: protocol
  if (/^javascript:/i.test(trimmed)) {
    return '#';
  }
  
  // Block data: URLs with script content
  if (/^data:text\/html/i.test(trimmed)) {
    return '#';
  }
  
  // Block vbscript: protocol
  if (/^vbscript:/i.test(trimmed)) {
    return '#';
  }
  
  // Allow http, https, mailto, tel, and relative URLs
  if (/^(https?|mailto|tel|#|\/)/i.test(trimmed)) {
    return trimmed;
  }
  
  // Block other protocols
  return '#';
}

/**
 * Validate and sanitize URL search parameters
 * Prevents injection through URL parameters
 */
export function sanitizeUrlParam(param: string): string {
  if (typeof param !== 'string') {
    return '';
  }
  
  // Remove null bytes and control characters
  let sanitized = param.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length to prevent DoS
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize hash fragment
 * Prevents XSS through location.hash manipulation
 */
export function sanitizeHashFragment(hash: string): string {
  if (typeof hash !== 'string') {
    return '';
  }
  
  // Remove leading #
  const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
  
  // Sanitize as URL parameter
  return sanitizeUrlParam(withoutHash);
}

/**
 * Sanitize data retrieved from localStorage/sessionStorage
 * Validates and sanitizes stored data before use
 */
export function sanitizeStorageData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (typeof data === 'string') {
    // Parse JSON if possible, otherwise sanitize as string
    try {
      const parsed = JSON.parse(data);
      return sanitizeStorageData(parsed);
    } catch {
      // Not JSON, sanitize as plain string
      return escapeHtml(data);
    }
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeStorageData(item));
    }
    
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = escapeHtmlAttribute(key);
      sanitized[sanitizedKey] = sanitizeStorageData(value);
    }
    return sanitized;
  }
  
  // For primitives, return as-is (numbers, booleans are safe)
  return data;
}

/**
 * Validate postMessage origin
 * Ensures messages only come from trusted origins
 */
export function isValidPostMessageOrigin(
  origin: string,
  allowedOrigins: string[]
): boolean {
  if (!origin || typeof origin !== 'string') {
    return false;
  }
  
  // Allow exact matches
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Allow subdomains if parent domain is in allowed list
  for (const allowed of allowedOrigins) {
    if (origin.endsWith('.' + allowed) || origin === allowed) {
      return true;
    }
  }
  
  return false;
}

/**
 * Safe wrapper for postMessage listener
 * Validates origin and sanitizes message data
 */
export function createSafePostMessageListener(
  handler: (data: any, origin: string) => void,
  allowedOrigins: string[]
): (event: MessageEvent) => void {
  return (event: MessageEvent) => {
    if (!isValidPostMessageOrigin(event.origin, allowedOrigins)) {
      console.warn(`Rejected postMessage from untrusted origin: ${event.origin}`);
      return;
    }
    
    // Sanitize message data
    const sanitizedData = sanitizeStorageData(event.data);
    handler(sanitizedData, event.origin);
  };
}

/**
 * Parse and validate URL search parameters safely
 * Prevents DOM XSS through URL parameter manipulation
 */
export function safeParseUrlParams(search: string): URLSearchParams {
  try {
    // Remove leading ? if present
    const cleanSearch = search.startsWith('?') ? search.slice(1) : search;
    
    // Create URLSearchParams which automatically URL-decodes
    const params = new URLSearchParams(cleanSearch);
    
    // Sanitize all parameter values
    const sanitized = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      const sanitizedKey = sanitizeUrlParam(key);
      const sanitizedValue = sanitizeUrlParam(value);
      sanitized.append(sanitizedKey, sanitizedValue);
    }
    
    return sanitized;
  } catch (error) {
    console.error('Failed to parse URL parameters:', error);
    return new URLSearchParams();
  }
}

/**
 * Safe wrapper for location.hash parsing
 * Prevents XSS through hash fragment manipulation
 */
export function safeParseHash(): string {
  try {
    const hash = window.location.hash;
    if (!hash) {
      return '';
    }
    
    return sanitizeHashFragment(hash);
  } catch (error) {
    console.error('Failed to parse hash:', error);
    return '';
  }
}

/**
 * Safe wrapper for document.referrer
 * Sanitizes referrer value before use
 */
export function safeGetReferrer(): string {
  try {
    const referrer = document.referrer;
    if (!referrer) {
      return '';
    }
    
    // Sanitize as URL
    return sanitizeUrl(referrer);
  } catch (error) {
    console.error('Failed to get referrer:', error);
    return '';
  }
}

/**
 * Create safe DOM element with text content
 * Prevents XSS by using textContent instead of innerHTML
 */
export function createSafeTextElement(
  tagName: string,
  text: string,
  attributes?: Record<string, string>
): HTMLElement {
  const element = document.createElement(tagName);
  
  // Set text content safely
  element.textContent = text;
  
  // Set attributes safely
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      // Use setAttribute for non-event attributes
      if (!key.startsWith('on')) {
        element.setAttribute(key, escapeHtmlAttribute(value));
      }
    }
  }
  
  return element;
}

/**
 * Validate CSS value before using in style attribute
 * Prevents CSS injection attacks
 */
export function validateCSSValue(property: string, value: string): boolean {
  if (typeof property !== 'string' || typeof value !== 'string') {
    return false;
  }
  
  // Block dangerous CSS properties
  const dangerousProperties = ['expression', 'javascript', 'import', 'binding'];
  const lowerProperty = property.toLowerCase();
  if (dangerousProperties.some(danger => lowerProperty.includes(danger))) {
    return false;
  }
  
  // Block dangerous CSS values
  const dangerousValues = ['javascript:', 'expression(', '@import', 'url(javascript:'];
  const lowerValue = value.toLowerCase();
  if (dangerousValues.some(danger => lowerValue.includes(danger))) {
    return false;
  }
  
  return true;
}

/**
 * Set CSS style property safely
 * Validates and sanitizes CSS values before setting
 */
export function setSafeStyle(
  element: HTMLElement,
  property: string,
  value: string
): void {
  if (!validateCSSValue(property, value)) {
    console.warn(`Rejected unsafe CSS: ${property}: ${value}`);
    return;
  }
  
  const sanitizedValue = escapeCSS(value);
  element.style.setProperty(property, sanitizedValue);
}

/**
 * Sanitize React dangerouslySetInnerHTML content
 * Use this wrapper before using dangerouslySetInnerHTML
 */
export function sanitizeForInnerHTML(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }
  
  // For React, we should use DOMPurify if available
  // Otherwise, escape all HTML
  if (typeof window !== 'undefined' && (window as any).DOMPurify) {
    return (window as any).DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }
  
  // Fallback: escape all HTML
  return escapeHtml(html);
}

/**
 * Validate that a string is safe for use in a specific DOM context
 */
export type DOMContext = 'text' | 'attribute' | 'url' | 'css' | 'javascript';

export function sanitizeForContext(value: string, context: DOMContext): string {
  switch (context) {
    case 'text':
      return escapeHtml(value);
    case 'attribute':
      return escapeHtmlAttribute(value);
    case 'url':
      return sanitizeUrl(value);
    case 'css':
      return escapeCSS(value);
    case 'javascript':
      return escapeJavaScript(value);
    default:
      return escapeHtml(value);
  }
}

}
)
)
)
)
}
)
)
)
)
}
)
)
)
)
}
)
)
)
)
}
)
)
)
)
}
)
)
)
)
}
)
)
)
)