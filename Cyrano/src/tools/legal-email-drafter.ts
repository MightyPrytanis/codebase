/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Legal Email Drafter Tool
 * 
 * Provides three tools for legal email drafting:
 * 1. draft_legal_email - Draft professional legal emails for various recipient types
 * 2. refine_email_tone - Refine email tone to match desired professionalism level
 * 3. validate_legal_language - Validate legal language and avoid unnecessary jargon
 */

import { BaseTool } from './base-tool.js';
import { z } from 'zod';
import { aiService, AIProvider } from '../services/ai-service.js';
import { apiValidator } from '../utils/api-validator.js';
import { aiProviderSelector } from '../services/ai-provider-selector.js';
import { injectTenRulesIntoSystemPrompt } from '../services/ethics-prompt-injector.js';
import { checkGeneratedContent } from '../services/ethics-check-helper.js';

// Schema for draft_legal_email tool
const DraftLegalEmailSchema = z.object({
  recipientType: z.enum([
    'client',
    'opposing_counsel',
    'court',
    'mediator',
    'transcription_service',
    'process_server',
    'witness',
    'deponent',
    'other',
  ]).describe('Type of recipient'),
  subject: z.string().describe('Email subject line - should be clear and professional'),
  purpose: z.string().describe('Main purpose or content of the email, including key points to address'),
  caseDetails: z.string().optional().describe('Case name, number, or other relevant details to include'),
  tone: z.enum(['formal', 'professional', 'firm', 'collaborative']).default('professional').describe('Tone of the email'),
  recipientName: z.string().optional().describe('Name of the recipient'),
  attorneyName: z.string().optional().describe('Name of the attorney sending the email'),
  barNumber: z.string().optional().describe('Bar number for court communications'),
  includeAttachments: z.boolean().optional().default(false).describe('Whether to note attachment(s) in the email'),
  aiProvider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto']).optional().default('auto').describe('AI provider to use (default: auto-select)'),
});

// Schema for refine_email_tone tool
const RefineEmailToneSchema = z.object({
  emailContent: z.string().describe('The email content to refine'),
  targetTone: z.enum(['formal', 'professional', 'firm', 'collaborative']).describe('Desired tone'),
  recipientType: z.string().optional().describe('Type of recipient for context-appropriate refinement'),
  aiProvider: z.enum(['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek', 'auto']).optional().default('auto').describe('AI provider to use (default: auto-select)'),
});

// Schema for validate_legal_language tool
const ValidateLegalLanguageSchema = z.object({
  emailContent: z.string().describe('The email content to validate'),
});

// Legal jargon guidelines
const LEGAL_JARGON_GUIDELINES = {
  acceptable_terms: [
    'plaintiff',
    'defendant',
    'respondent',
    'deposition',
    'interrogatory',
    'affidavit',
    'motion',
    'discovery',
    'damages',
    'remedy',
    'injunctive relief',
    'stipulation',
    'admissible',
    'probative value',
    'subpoena',
    'continuance',
    'adjournment',
  ],
  avoid_jargon: [
    'hereinabove',
    'aforementioned',
    'whereas',
    'notwithstanding',
    'pursuant to',
  ],
  plain_language_replacements: {
    hereinabove: 'mentioned above',
    aforementioned: 'previously discussed',
    'pursuant to': 'according to',
    'in the matter of': 'regarding',
  },
} as const;

// Email templates for different recipient types
const EMAIL_TEMPLATES: Record<string, string> = {
  client: `Dear {recipient},

I am writing to provide you with an update regarding {case_reference}.

{main_content}

Should you have any questions or concerns regarding the foregoing, please do not hesitate to contact me.

Respectfully,
{attorney_name}`,

  opposing_counsel: `Dear {opposing_counsel},

Re: {case_reference}

{main_content}

I look forward to your prompt response.

Sincerely,
{attorney_name}`,

  court: `Dear Honorable {judge_name},

SUBJECT: {case_reference} - {motion_type}

{main_content}

Respectfully submitted,
{attorney_name}
{bar_number}`,

  mediator: `Dear {mediator_name},

I write on behalf of {party} in the matter of {case_reference}.

{main_content}

Thank you for your consideration.

Best regards,
{attorney_name}`,

  transcription_service: `Dear {service_name},

We request transcription services for the following deposition/hearing:

Case: {case_reference}
Date of Recording: {date}
Parties Involved: {parties}
Estimated Duration: {duration}

{main_content}

Please provide your rate schedule and turnaround time.

Best regards,
{attorney_name}`,

  process_server: `Dear {process_server_name},

I request your services to serve the following documents in the matter of {case_reference}:

Documents to Serve: {documents}
Defendant(s)/Respondent(s): {recipients}

{main_content}

Please confirm receipt and advise on availability.

Respectfully,
{attorney_name}`,

  witness: `Dear {witness_name},

You are requested to appear and testify as a witness in {case_reference}.

Date and Time: {date_time}
Location: {location}

{main_content}

Your testimony is important to this matter. Please confirm your availability.

Sincerely,
{attorney_name}`,

  deponent: `Dear {deponent_name},

NOTICE OF DEPOSITION

You are hereby noticed that your deposition shall be taken on {date_time} at {location}.

{main_content}

Please contact me immediately if you have any scheduling conflicts.

Respectfully,
{attorney_name}`,
};

/**
 * Legal Email Drafter Tool
 * Main tool that provides three sub-tools for legal email drafting
 */
export const legalEmailDrafter = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'draft_legal_email',
      description: 'Draft a professional legal email for attorneys and law offices to various recipients including clients, opposing counsel, courts, mediators, and other legal professionals',
      inputSchema: {
        type: 'object' as const,
        properties: {
          recipientType: {
            type: 'string',
            enum: ['client', 'opposing_counsel', 'court', 'mediator', 'transcription_service', 'process_server', 'witness', 'deponent', 'other'],
            description: 'Type of recipient: client, opposing_counsel, court, mediator, transcription_service, process_server, witness, deponent, or other',
          },
          subject: {
            type: 'string',
            description: 'Email subject line - should be clear and professional',
          },
          purpose: {
            type: 'string',
            description: 'Main purpose or content of the email, including key points to address',
          },
          caseDetails: {
            type: 'string',
            description: 'Case name, number, or other relevant details to include',
          },
          tone: {
            type: 'string',
            enum: ['formal', 'professional', 'firm', 'collaborative'],
            default: 'professional',
            description: 'Tone of the email: formal, professional, firm, or collaborative',
          },
          recipientName: {
            type: 'string',
            description: 'Name of the recipient',
          },
          attorneyName: {
            type: 'string',
            description: 'Name of the attorney sending the email',
          },
          barNumber: {
            type: 'string',
            description: 'Bar number for court communications',
          },
          includeAttachments: {
            type: 'boolean',
            default: false,
            description: 'Whether to note attachment(s) in the email signature',
          },
          aiProvider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek'],
            description: 'AI provider to use for drafting',
          },
        },
        required: ['recipientType', 'subject', 'purpose'],
      },
    };
  }

  async execute(args: any) {
    try {
      const validated = DraftLegalEmailSchema.parse(args);

      // Check for available AI providers
      if (!apiValidator.hasAnyValidProviders()) {
        return this.createErrorResult(
          'No AI providers configured. Legal email drafting requires an AI provider. Please configure API keys.'
        );
      }

      // Resolve provider (handle 'auto' mode with user sovereignty)
      let provider: AIProvider;
      if (validated.aiProvider === 'auto' || !validated.aiProvider) {
        // Use auto-select based on task profile
        provider = aiProviderSelector.getProviderForTask({
          taskType: 'email_drafting',
          complexity: 'medium',
          preferredProvider: 'auto',
          balanceQualitySpeed: 'quality', // Prioritize quality for email drafting
        });
      } else {
        // User explicitly selected a provider (user sovereignty)
        const validation = apiValidator.validateProvider(validated.aiProvider as AIProvider);
        if (!validation.valid) {
          return this.createErrorResult(
            `Selected AI provider ${validated.aiProvider} is not configured: ${validation.error}`
          );
        }
        provider = validated.aiProvider as AIProvider;
      }

      // Draft the email
      const draft = await this.draftLegalEmail(validated, provider);

      // Add ethics metadata to response if present
      const responseMetadata: any = {
        recipientType: validated.recipientType,
        tone: validated.tone,
        aiProvider: provider,
      };
      
      if (draft._ethicsMetadata) {
        responseMetadata.ethicsReviewed = true;
        responseMetadata.ethicsComplianceScore = draft._ethicsMetadata.complianceScore;
      }

      return this.createSuccessResult(JSON.stringify(draft, null, 2), responseMetadata);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createErrorResult(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      return this.createErrorResult(`Legal email drafting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Draft a legal email using AI
   */
  async draftLegalEmail(
    request: z.infer<typeof DraftLegalEmailSchema>,
    provider: AIProvider
  ): Promise<any> {
    const template = EMAIL_TEMPLATES[request.recipientType] || EMAIL_TEMPLATES.opposing_counsel;
    const toneGuidelines = this.getToneGuidelines(request.tone || 'professional');

    let systemPrompt = `You are an expert legal email drafting assistant. Create professional, clear emails that:
- Use precise legal terminology appropriately
- Maintain a ${request.tone || 'professional'} tone
- Are concise and direct
- Follow proper legal correspondence formatting
- Avoid unnecessary jargon while using proper legal terms of art
- Include all necessary context for the ${request.recipientType}

Tone Guidelines for ${request.tone || 'professional'}:
${toneGuidelines}

DO use these legal terms when appropriate: ${LEGAL_JARGON_GUIDELINES.acceptable_terms.join(', ')}
DO NOT use these archaic terms: ${LEGAL_JARGON_GUIDELINES.avoid_jargon.join(', ')}`;
    
    // Inject Ten Rules into system prompt
    systemPrompt = injectTenRulesIntoSystemPrompt(systemPrompt, 'summary');

    const userPrompt = `Draft a professional legal email with the following specifications:

Recipient Type: ${request.recipientType}
Subject: ${request.subject}
Purpose: ${request.purpose}
${request.caseDetails ? `Case Details: ${request.caseDetails}` : ''}
${request.recipientName ? `Recipient Name: ${request.recipientName}` : ''}
${request.attorneyName ? `Attorney Name: ${request.attorneyName}` : ''}
${request.barNumber ? `Bar Number: ${request.barNumber}` : ''}
${request.includeAttachments ? 'Include reference to attachments' : ''}

Use this template as a starting point:

${template}

Ensure the email is clear, concise, and professionally appropriate for a ${request.recipientType}. Replace all placeholder variables with appropriate content based on the specifications above.`;

    try {
      const emailBody = await aiService.call(provider, userPrompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2000,
      });

      // Get CC recommendations
      const ccRecommendations = this.getCCRecommendations(request.recipientType);

      const draft = {
        to: request.recipientName || '[recipient-address]',
        subject: request.subject,
        body: emailBody,
        cc: ccRecommendations,
        recipientType: request.recipientType,
        tone: request.tone,
        caseDetails: request.caseDetails,
      };

      // Ethics check: Ensure email content complies with Ten Rules
      const emailText = `${draft.subject}\n\n${draft.body}`;
      const ethicsCheck = await checkGeneratedContent(emailText, {
        toolName: 'legal_email_drafter',
        contentType: 'draft',
        strictMode: true, // Strict for legal communications
      });

      // If blocked, return error
      if (ethicsCheck.ethicsCheck.blocked) {
        return {
          to: request.recipientName || '[recipient-address]',
          subject: request.subject,
          body: '[Email draft blocked by ethics check. Does not meet Ten Rules compliance standards.]',
          cc: [],
          recipientType: request.recipientType,
          tone: request.tone,
          caseDetails: request.caseDetails,
          _ethicsMetadata: {
            reviewed: true,
            blocked: true,
            warnings: ethicsCheck.ethicsCheck.warnings,
            complianceScore: ethicsCheck.ethicsCheck.complianceScore,
            auditId: ethicsCheck.ethicsCheck.auditId,
          },
        };
      }

      // Add ethics metadata if warnings
      return {
        ...draft,
        ...(ethicsCheck.ethicsCheck.warnings.length > 0 && {
          _ethicsMetadata: {
            reviewed: true,
            warnings: ethicsCheck.ethicsCheck.warnings,
            complianceScore: ethicsCheck.ethicsCheck.complianceScore,
            auditId: ethicsCheck.ethicsCheck.auditId,
          },
        }),
      };
    } catch (error) {
      throw new Error(`AI call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get tone guidelines for different tones
   */
  getToneGuidelines(tone: string): string {
    const guidelines: Record<string, string> = {
      formal: `- Use formal salutations (Dear Ms./Mr./Hon.)
- Employ complete sentences and formal structure
- Minimize contractions
- Use formal constructions when appropriate
- Maintain distance and objectivity`,

      professional: `- Use professional but approachable language
- Balance formality with clarity
- Use complete sentences
- Avoid excessive legalese
- Be direct and concise`,

      firm: `- Take a clear, definitive stance
- Use assertive but not aggressive language
- State positions clearly and directly
- Provide explicit timelines and requirements
- Maintain professionalism while being resolute`,

      collaborative: `- Use inclusive language ("we," "our mutual interest")
- Emphasize cooperation and resolution
- Acknowledge the other party's position
- Propose solutions rather than demands
- Maintain warmth while remaining professional`,
    };

    return guidelines[tone] || guidelines.professional;
  }

  /**
   * Get CC recommendations based on recipient type
   */
  getCCRecommendations(recipientType: string): string[] {
    const recommendations: Record<string, string[]> = {
      opposing_counsel: ['[case-co-counsel@firm.com]'],
      court: ['[supervising-attorney@firm.com]'],
      mediator: ['[co-counsel@firm.com]'],
      process_server: ['[client@email.com]'],
      deponent: ['[opposing-counsel@firm.com]'],
    };

    return recommendations[recipientType] || [];
  }
})();

/**
 * Refine Email Tone Tool
 * Refines the tone of a draft email to ensure appropriate professionalism
 */
export const refineEmailTone = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'refine_email_tone',
      description: 'Refine the tone of a draft email to ensure appropriate professionalism and clarity for legal correspondence',
      inputSchema: {
        type: 'object' as const,
        properties: {
          emailContent: {
            type: 'string',
            description: 'The email content to refine',
          },
          targetTone: {
            type: 'string',
            enum: ['formal', 'professional', 'firm', 'collaborative'],
            description: 'Desired tone: formal, professional, firm, or collaborative',
          },
          recipientType: {
            type: 'string',
            description: 'Type of recipient for context-appropriate refinement',
          },
          aiProvider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'perplexity', 'google', 'xai', 'deepseek'],
            description: 'AI provider to use for refinement',
          },
        },
        required: ['emailContent', 'targetTone'],
      },
    };
  }

  async execute(args: any) {
    try {
      const validated = RefineEmailToneSchema.parse(args);

      // Check for available AI providers
      if (!apiValidator.hasAnyValidProviders()) {
        return this.createErrorResult(
          'No AI providers configured. Email tone refinement requires an AI provider. Please configure API keys.'
        );
      }

      // Resolve provider (handle 'auto' mode with user sovereignty)
      let provider: AIProvider;
      if (validated.aiProvider === 'auto' || !validated.aiProvider) {
        // Use auto-select based on task profile
        provider = aiProviderSelector.getProviderForTask({
          taskType: 'email_tone_refinement',
          complexity: 'low',
          preferredProvider: 'auto',
          balanceQualitySpeed: 'quality',
        });
      } else {
        // User explicitly selected a provider (user sovereignty)
        const validation = apiValidator.validateProvider(validated.aiProvider as AIProvider);
        if (!validation.valid) {
          return this.createErrorResult(
            `Selected AI provider ${validated.aiProvider} is not configured: ${validation.error}`
          );
        }
        provider = validated.aiProvider as AIProvider;
      }

      // Refine the email tone
      const refined = await this.refineTone(validated, provider);

      return this.createSuccessResult(JSON.stringify({ refinedEmail: refined }, null, 2), {
        targetTone: validated.targetTone,
        recipientType: validated.recipientType || 'not specified',
        aiProvider: provider,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createErrorResult(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      return this.createErrorResult(`Email tone refinement failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Refine email tone using AI
   */
  async refineTone(
    request: z.infer<typeof RefineEmailToneSchema>,
    provider: AIProvider
  ): Promise<string> {
    const toneGuidelines = this.getToneGuidelines(request.targetTone);

    const systemPrompt = `You are an expert legal writing assistant specializing in professional email communication. Your task is to refine email tone while maintaining legal accuracy and professionalism.

Tone Guidelines for ${request.targetTone}:
${toneGuidelines}

Maintain all legal accuracy and key information while adjusting tone.`;

    const userPrompt = `Review this legal email and refine it to match a ${request.targetTone} tone while maintaining professional standards and legal accuracy:

${request.emailContent}

${request.recipientType ? `Recipient Type: ${request.recipientType}` : ''}

Provide only the refined email without additional commentary.`;

    try {
      const refined = await aiService.call(provider, userPrompt, {
        systemPrompt,
        temperature: 0.6,
        maxTokens: 2000,
      });

      return refined;
    } catch (error) {
      throw new Error(`AI call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get tone guidelines (shared with main tool)
   */
  getToneGuidelines(tone: string): string {
    const guidelines: Record<string, string> = {
      formal: `- Use formal salutations (Dear Ms./Mr./Hon.)
- Employ complete sentences and formal structure
- Minimize contractions
- Use formal constructions when appropriate
- Maintain distance and objectivity`,

      professional: `- Use professional but approachable language
- Balance formality with clarity
- Use complete sentences
- Avoid excessive legalese
- Be direct and concise`,

      firm: `- Take a clear, definitive stance
- Use assertive but not aggressive language
- State positions clearly and directly
- Provide explicit timelines and requirements
- Maintain professionalism while being resolute`,

      collaborative: `- Use inclusive language ("we," "our mutual interest")
- Emphasize cooperation and resolution
- Acknowledge the other party's position
- Propose solutions rather than demands
- Maintain warmth while remaining professional`,
    };

    return guidelines[tone] || guidelines.professional;
  }
})();

/**
 * Validate Legal Language Tool
 * Validates that legal language in the email is accurate and avoids unnecessary jargon
 */
export const validateLegalLanguage = new (class extends BaseTool {
  getToolDefinition() {
    return {
      name: 'validate_legal_language',
      description: 'Validate that legal language in the email is accurate, uses proper legal terminology, and avoids unnecessary jargon',
      inputSchema: {
        type: 'object' as const,
        properties: {
          emailContent: {
            type: 'string',
            description: 'The email content to validate',
          },
        },
        required: ['emailContent'],
      },
    };
  }

  async execute(args: any) {
    try {
      const validated = ValidateLegalLanguageSchema.parse(args);

      // Perform validation
      const validation = await this.validateLanguage(validated.emailContent);

      return this.createSuccessResult(JSON.stringify(validation, null, 2), {
        isValid: validation.isValid,
        issueCount: validation.issues.length,
        suggestionCount: validation.suggestions.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createErrorResult(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
      }
      return this.createErrorResult(`Legal language validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate legal language in email content
   */
  async validateLanguage(emailContent: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    const contentLower = emailContent.toLowerCase();

    // Check for archaic jargon
    LEGAL_JARGON_GUIDELINES.avoid_jargon.forEach((term) => {
      if (contentLower.includes(term.toLowerCase())) {
        issues.push(`Avoid archaic term: "${term}"`);
        const replacement = LEGAL_JARGON_GUIDELINES.plain_language_replacements[term as keyof typeof LEGAL_JARGON_GUIDELINES.plain_language_replacements];
        if (replacement) {
          suggestions.push(`Use "${replacement}" instead of "${term}"`);
        }
      }
    });

    // Check for proper legal terminology usage
    const acceptableTerms = LEGAL_JARGON_GUIDELINES.acceptable_terms;
    const foundTerms = acceptableTerms.filter(term => contentLower.includes(term.toLowerCase()));
    
    if (foundTerms.length === 0 && emailContent.length > 200) {
      // If it's a longer email but has no legal terms, it might be too informal
      suggestions.push('Consider using appropriate legal terminology where relevant');
    }

    // Check for common legal writing issues
    if (contentLower.includes('hereinabove') || contentLower.includes('aforementioned')) {
      issues.push('Contains archaic legal jargon that should be replaced with plain language');
    }

    // Check for proper formatting
    if (!emailContent.includes('Dear') && !emailContent.includes('To:')) {
      suggestions.push('Consider adding a proper salutation');
    }

    if (!emailContent.match(/sincerely|respectfully|best regards|yours truly/i)) {
      suggestions.push('Consider adding a professional closing');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }
})();

