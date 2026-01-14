/**
 * Email Processor
 * Parses email messages and extracts headers, body, and attachments
 */

import { z } from 'zod';

export const EmailProcessorSchema = z.object({
  content: z.string(),
  format: z.enum(['eml', 'raw', 'json']).default('raw'),
  extractAttachments: z.boolean().default(true),
});

export type EmailProcessorInput = z.infer<typeof EmailProcessorSchema>;

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: string; // Base64 encoded
}

export interface EmailProcessorOutput {
  headers: {
    from: EmailAddress[];
    to: EmailAddress[];
    cc: EmailAddress[];
    bcc: EmailAddress[];
    subject: string;
    date: string;
    messageId: string;
    inReplyTo?: string;
    references?: string[];
  };
  body: {
    text: string;
    html?: string;
  };
  attachments: EmailAttachment[];
  metadata: {
    hasAttachments: boolean;
    attachmentCount: number;
    bodyLength: number;
    headerCount: number;
  };
  threadInfo?: {
    isReply: boolean;
    isForward: boolean;
    threadId?: string;
  };
}

export class EmailProcessor {
  /**
   * Process email content
   */
  async process(input: EmailProcessorInput): Promise<EmailProcessorOutput> {
    const validated = EmailProcessorSchema.parse(input);
    
    let parsedEmail: any;
    switch (validated.format) {
      case 'eml':
        parsedEmail = this.parseEml(validated.content);
        break;
      case 'json':
        parsedEmail = JSON.parse(validated.content);
        break;
      case 'raw':
      default:
        parsedEmail = this.parseRaw(validated.content);
        break;
    }

    const headers = this.extractHeaders(parsedEmail);
    const body = this.extractBody(parsedEmail);
    const attachments = validated.extractAttachments 
      ? this.extractAttachments(parsedEmail) 
      : [];
    
    const metadata = {
      hasAttachments: attachments.length > 0,
      attachmentCount: attachments.length,
      bodyLength: body.text.length,
      headerCount: Object.keys(headers).length,
    };

    const threadInfo = this.extractThreadInfo(headers);

    return {
      headers,
      body,
      attachments,
      metadata,
      threadInfo,
    };
  }

  /**
   * Parse EML format email
   */
  private parseEml(content: string): any {
    const lines = content.split(/\r?\n/);
    const headers: Record<string, string> = {};
    let headerSection = true;
    let currentHeader = '';
    let bodyLines: string[] = [];

    for (const line of lines) {
      if (headerSection) {
        // Empty line marks end of headers
        if (line.trim() === '') {
          headerSection = false;
          continue;
        }

        // Continuation of previous header (starts with whitespace)
        if (line.match(/^\s/) && currentHeader) {
          headers[currentHeader] += ' ' + line.trim();
        } else {
          // New header
          const match = line.match(/^([^:]+):\s*(.*)$/);
          if (match) {
            currentHeader = match[1].toLowerCase();
            headers[currentHeader] = match[2];
          }
        }
      } else {
        bodyLines.push(line);
      }
    }

    return {
      headers,
      body: bodyLines.join('\n'),
    };
  }

  /**
   * Parse raw email text
   */
  private parseRaw(content: string): any {
    // Simple parsing - assumes headers at top, body below
    const headerEndIndex = content.indexOf('\n\n');
    if (headerEndIndex === -1) {
      return {
        headers: {},
        body: content,
      };
    }

    const headerSection = content.slice(0, headerEndIndex);
    const body = content.slice(headerEndIndex + 2);

    const headers: Record<string, string> = {};
    const headerLines = headerSection.split(/\r?\n/);
    
    for (const line of headerLines) {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        headers[match[1].toLowerCase()] = match[2];
      }
    }

    return { headers, body };
  }

  /**
   * Extract email headers
   */
  private extractHeaders(parsedEmail: any) {
    const headers = parsedEmail.headers || {};
    
    return {
      from: this.parseAddresses(headers.from || ''),
      to: this.parseAddresses(headers.to || ''),
      cc: this.parseAddresses(headers.cc || ''),
      bcc: this.parseAddresses(headers.bcc || ''),
      subject: headers.subject || '',
      date: headers.date || '',
      messageId: headers['message-id'] || '',
      inReplyTo: headers['in-reply-to'],
      references: headers.references?.split(/\s+/).filter(Boolean),
    };
  }

  /**
   * Parse email addresses from header value
   */
  private parseAddresses(addressString: string): EmailAddress[] {
    if (!addressString) return [];

    const addresses: EmailAddress[] = [];
    
    // Split by comma, but not within quotes
    const parts = addressString.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Match "Name" <email@example.com>
      const withNameMatch = trimmed.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
      if (withNameMatch) {
        addresses.push({
          name: withNameMatch[1].trim(),
          address: withNameMatch[2].trim(),
        });
        continue;
      }

      // Match just email@example.com
      const emailMatch = trimmed.match(/^([^\s<>]+@[^\s<>]+)$/);
      if (emailMatch) {
        addresses.push({
          address: emailMatch[1].trim(),
        });
      }
    }

    return addresses;
  }

  /**
   * Extract email body
   */
  private extractBody(parsedEmail: any) {
    const bodyContent = parsedEmail.body || '';
    
    // Check if body contains HTML
    const hasHtml = bodyContent.includes('<html') || bodyContent.includes('<body');
    
    if (hasHtml) {
      return {
        text: this.htmlToText(bodyContent),
        html: bodyContent,
      };
    }

    return {
      text: bodyContent,
    };
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    let text = html;
    
    // Remove script and style tags
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Convert common tags
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n\n');
    
    // Remove all other HTML tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    text = this.decodeHtmlEntities(text);
    
    // Clean up whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
    
    return text;
  }

  /**
   * Decode common HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&nbsp;': ' ',
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
    };
    
    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }
    
    // Decode numeric entities
    decoded = decoded.replace(/&#(\d+);/g, (_, num) => 
      String.fromCharCode(parseInt(num, 10))
    );
    
    return decoded;
  }

  /**
   * Extract attachments (basic implementation)
   */
  private extractAttachments(parsedEmail: any): EmailAttachment[] {
    // This is a simplified implementation
    // In production, you'd use a proper MIME parser library
    const attachments: EmailAttachment[] = [];
    
    if (parsedEmail.attachments && Array.isArray(parsedEmail.attachments)) {
      for (const att of parsedEmail.attachments) {
        attachments.push({
          filename: att.filename || 'unknown',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size || 0,
          content: att.content,
        });
      }
    }
    
    return attachments;
  }

  /**
   * Extract thread information
   */
  private extractThreadInfo(headers: EmailProcessorOutput['headers']) {
    const isReply = !!(headers.inReplyTo || headers.references);
    const isForward = headers.subject.toLowerCase().startsWith('fwd:') || 
                     headers.subject.toLowerCase().startsWith('fw:');
    
    let threadId: string | undefined;
    if (headers.references && headers.references.length > 0) {
      threadId = headers.references[0];
    } else if (headers.inReplyTo) {
      threadId = headers.inReplyTo;
    } else {
      threadId = headers.messageId;
    }
    
    return {
      isReply,
      isForward,
      threadId,
    };
  }

  /**
   * Extract quoted text from replies
   */
  extractQuotedText(bodyText: string): { original: string; quoted: string } {
    const lines = bodyText.split('\n');
    const original: string[] = [];
    const quoted: string[] = [];
    
    let inQuoted = false;
    for (const line of lines) {
      // Common quote indicators
      if (line.match(/^>/) || line.match(/^On .+ wrote:/)) {
        inQuoted = true;
        quoted.push(line);
      } else if (inQuoted && line.trim() === '') {
        // Empty line might end quote
        quoted.push(line);
      } else if (inQuoted) {
        quoted.push(line);
      } else {
        original.push(line);
      }
    }
    
    return {
      original: original.join('\n').trim(),
      quoted: quoted.join('\n').trim(),
    };
  }
}

export const emailProcessor = new EmailProcessor();

}
}
)
)
)