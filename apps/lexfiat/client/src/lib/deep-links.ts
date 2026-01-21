/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Deep Link Utilities
 * 
 * Provides protocol handlers for opening documents, emails, calendar events,
 * and Clio matters in their respective applications.
 */

/**
 * Open document in Microsoft Word
 */
export function openInWord(documentId: string, path?: string): void {
  // Microsoft Word protocol handler
  // Format: ms-word://ofe|u|<url> or ms-word://nft|u|<url>
  // For local files: ms-word://file://<path>
  
  if (path) {
    // Local file path
    const wordUrl = `ms-word://file://${encodeURIComponent(path)}`;
    window.open(wordUrl, '_blank');
  } else {
    // Document ID - construct URL based on your document storage
    // This assumes documents are accessible via a URL
    const documentUrl = `/api/documents/${documentId}/download`;
    const wordUrl = `ms-word://ofe|u|${encodeURIComponent(window.location.origin + documentUrl)}`;
    window.open(wordUrl, '_blank');
  }
}

/**
 * Open email in email client
 */
export function openInEmail(messageId: string, client: 'gmail' | 'outlook'): void {
  if (client === 'gmail') {
    // Gmail web interface
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
    window.open(gmailUrl, '_blank');
  } else if (client === 'outlook') {
    // Outlook protocol handler
    // Format: outlook://mail/item/<messageId>
    const outlookUrl = `outlook://mail/item/${messageId}`;
    window.open(outlookUrl, '_blank');
    
    // Fallback to Outlook web if protocol handler not available
    setTimeout(() => {
      const outlookWebUrl = `https://outlook.office.com/mail/${messageId}`;
      window.open(outlookWebUrl, '_blank');
    }, 500);
  } else {
    // Generic mailto fallback
    const mailtoUrl = `mailto:?message-id=${messageId}`;
    window.location.href = mailtoUrl;
  }
}

/**
 * Open matter in Clio
 */
export function openInClio(matterId: string): void {
  // Clio deep-link format
  // Format: https://app.clio.com/matters/<matterId>
  // Or: clio://matter/<matterId> (if Clio desktop app is installed)
  
  // Try desktop app first
  const clioDesktopUrl = `clio://matter/${matterId}`;
  window.open(clioDesktopUrl, '_blank');
  
  // Fallback to web after short delay
  setTimeout(() => {
    const clioWebUrl = `https://app.clio.com/matters/${matterId}`;
    window.open(clioWebUrl, '_blank');
  }, 500);
}

/**
 * Open calendar event
 */
export function openInCalendar(eventId: string, provider: 'google' | 'outlook'): void {
  if (provider === 'google') {
    // Google Calendar web interface
    // Format: https://calendar.google.com/calendar/r/eventedit/<eventId>
    const googleCalendarUrl = `https://calendar.google.com/calendar/r/eventedit/${eventId}`;
    window.open(googleCalendarUrl, '_blank');
  } else if (provider === 'outlook') {
    // Outlook Calendar protocol handler
    // Format: outlookcal://calendar/item/<eventId>
    const outlookCalendarUrl = `outlookcal://calendar/item/${eventId}`;
    window.open(outlookCalendarUrl, '_blank');
    
    // Fallback to Outlook web
    setTimeout(() => {
      const outlookWebUrl = `https://outlook.office.com/calendar/item/${eventId}`;
      window.open(outlookWebUrl, '_blank');
    }, 500);
  }
}

/**
 * Generic deep link handler that tries multiple protocols
 */
export function openDeepLink(
  type: 'word' | 'email' | 'clio' | 'calendar',
  id: string,
  options?: {
    path?: string;
    client?: 'gmail' | 'outlook';
    provider?: 'google' | 'outlook';
  }
): void {
  switch (type) {
    case 'word':
      openInWord(id, options?.path);
      break;
    case 'email':
      openInEmail(id, options?.client || 'gmail');
      break;
    case 'clio':
      openInClio(id);
      break;
    case 'calendar':
      openInCalendar(id, options?.provider || 'google');
      break;
    default:
      console.warn(`Unknown deep link type: ${type}`);
