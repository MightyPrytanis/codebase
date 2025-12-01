/**
 * Entity Processor
 * Extracts and categorizes named entities from text
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { z } from 'zod';

export const EntityProcessorSchema = z.object({
  text: z.string(),
  types: z.array(z.enum(['person', 'organization', 'location', 'date', 'money', 'statute', 'case', 'email', 'phone'])).optional(),
  context: z.string().optional(),
});

export type EntityProcessorInput = z.infer<typeof EntityProcessorSchema>;

export interface Entity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'statute' | 'case' | 'email' | 'phone' | 'other';
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  context: string; // Surrounding text
  metadata?: Record<string, any>;
}

export interface EntityProcessorOutput {
  entities: Entity[];
  summary: {
    total: number;
    byType: Record<string, number>;
    uniqueEntities: number;
  };
  relationships: Array<{
    entity1: string;
    entity2: string;
    type: string;
    confidence: number;
  }>;
  metadata: {
    processingTime: number;
    textLength: number;
  };
}

export class EntityProcessor {
  /**
   * Process text and extract entities
   */
  async process(input: EntityProcessorInput): Promise<EntityProcessorOutput> {
    const startTime = Date.now();
    const validated = EntityProcessorSchema.parse(input);
    
    const targetTypes = validated.types || [
      'person', 'organization', 'location', 'date', 'money', 'statute', 'case', 'email', 'phone'
    ];

    const entities: Entity[] = [];

    for (const type of targetTypes) {
      const extracted = this.extractEntitiesByType(validated.text, type);
      entities.push(...extracted);
    }

    // Remove duplicates
    const uniqueEntities = this.deduplicateEntities(entities);

    // Find relationships
    const relationships = this.findRelationships(uniqueEntities, validated.text);

    // Calculate summary
    const byType = uniqueEntities.reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueTexts = new Set(uniqueEntities.map(e => e.text.toLowerCase())).size;

    const processingTime = Date.now() - startTime;

    return {
      entities: uniqueEntities,
      summary: {
        total: uniqueEntities.length,
        byType,
        uniqueEntities: uniqueTexts,
      },
      relationships,
      metadata: {
        processingTime,
        textLength: validated.text.length,
      },
    };
  }

  /**
   * Extract entities by type
   */
  private extractEntitiesByType(text: string, type: string): Entity[] {
    switch (type) {
      case 'person':
        return this.extractPersons(text);
      case 'organization':
        return this.extractOrganizations(text);
      case 'location':
        return this.extractLocations(text);
      case 'date':
        return this.extractDates(text);
      case 'money':
        return this.extractMoney(text);
      case 'statute':
        return this.extractStatutes(text);
      case 'case':
        return this.extractCases(text);
      case 'email':
        return this.extractEmails(text);
      case 'phone':
        return this.extractPhones(text);
      default:
        return [];
    }
  }

  /**
   * Extract person names
   */
  private extractPersons(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // Pattern: Title + First + Last (e.g., "Mr. John Smith", "Dr. Jane Doe")
    const titlePattern = /\b(?:Mr|Ms|Mrs|Dr|Prof|Judge|Attorney|Esq)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
    this.extractWithPattern(text, titlePattern, 'person', 0.9, entities);

    // Pattern: First + Middle? + Last (capitalized words)
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\b/g;
    this.extractWithPattern(text, namePattern, 'person', 0.7, entities);

    // Pattern: Legal name format (e.g., "SMITH, John")
    const legalNamePattern = /\b([A-Z]+,\s+[A-Z][a-z]+(?:\s+[A-Z]\.?)?)\b/g;
    this.extractWithPattern(text, legalNamePattern, 'person', 0.85, entities);

    return entities;
  }

  /**
   * Extract organization names
   */
  private extractOrganizations(text: string): Entity[] {
    const entities: Entity[] = [];

    // Corporate suffixes
    const corpPattern = /\b([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|LP|LLP|PC|P\.C\.))\b/g;
    this.extractWithPattern(text, corpPattern, 'organization', 0.9, entities);

    // Company/firm keywords
    const companyPattern = /\b([A-Z][A-Za-z\s&]+(?:Company|Group|Associates|Partners|Firm|Law Offices?))\b/g;
    this.extractWithPattern(text, companyPattern, 'organization', 0.85, entities);

    // Government agencies
    const agencyPattern = /\b((?:State|County|City|Federal)\s+(?:of\s+)?[A-Z][A-Za-z\s]+(?:Department|Agency|Bureau|Office|Court))\b/g;
    this.extractWithPattern(text, agencyPattern, 'organization', 0.9, entities);

    return entities;
  }

  /**
   * Extract location names
   */
  private extractLocations(text: string): Entity[] {
    const entities: Entity[] = [];

    // City, State format
    const cityStatePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+(?:[A-Z]{2}|[A-Z][a-z]+))\b/g;
    this.extractWithPattern(text, cityStatePattern, 'location', 0.9, entities);

    // Street addresses
    const addressPattern = /\b(\d+\s+[A-Z][A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln))\b/g;
    this.extractWithPattern(text, addressPattern, 'location', 0.85, entities);

    // Countries
    const countryPattern = /\b(United States|USA|Canada|Mexico|United Kingdom|UK)\b/g;
    this.extractWithPattern(text, countryPattern, 'location', 0.95, entities);

    return entities;
  }

  /**
   * Extract dates
   */
  private extractDates(text: string): Entity[] {
    const entities: Entity[] = [];

    // MM/DD/YYYY
    const slashDatePattern = /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g;
    this.extractWithPattern(text, slashDatePattern, 'date', 0.95, entities);

    // YYYY-MM-DD
    const isoDatePattern = /\b(\d{4}-\d{2}-\d{2})\b/g;
    this.extractWithPattern(text, isoDatePattern, 'date', 0.95, entities);

    // Month DD, YYYY
    const writtenDatePattern = /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/g;
    this.extractWithPattern(text, writtenDatePattern, 'date', 0.95, entities);

    // Abbreviated month
    const abbrevDatePattern = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4})\b/gi;
    this.extractWithPattern(text, abbrevDatePattern, 'date', 0.9, entities);

    return entities;
  }

  /**
   * Extract monetary amounts
   */
  private extractMoney(text: string): Entity[] {
    const entities: Entity[] = [];

    // $X,XXX.XX format
    const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
    this.extractWithPattern(text, moneyPattern, 'money', 0.95, entities);

    // Written amounts
    const writtenMoneyPattern = /\b((?:one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion)\s+dollars?)\b/gi;
    this.extractWithPattern(text, writtenMoneyPattern, 'money', 0.8, entities);

    return entities;
  }

  /**
   * Extract statute citations
   */
  private extractStatutes(text: string): Entity[] {
    const entities: Entity[] = [];

    // Michigan statutes
    const mclPattern = /\b(MCL\s+\d+\.\d+(?:\([a-z0-9]+\))?)\b/g;
    this.extractWithPattern(text, mclPattern, 'statute', 0.95, entities);

    const mcrPattern = /\b(MCR\s+\d+\.\d+(?:\([A-Z0-9]+\))?)\b/g;
    this.extractWithPattern(text, mcrPattern, 'statute', 0.95, entities);

    // Federal statutes
    const uscPattern = /\b(\d+\s+U\.?S\.?C\.?\s+§?\s*\d+[a-z]?)\b/gi;
    this.extractWithPattern(text, uscPattern, 'statute', 0.9, entities);

    // CFR
    const cfrPattern = /\b(\d+\s+C\.?F\.?R\.?\s+§?\s*\d+\.\d+)\b/gi;
    this.extractWithPattern(text, cfrPattern, 'statute', 0.9, entities);

    return entities;
  }

  /**
   * Extract case citations
   */
  private extractCases(text: string): Entity[] {
    const entities: Entity[] = [];

    // Traditional case citations: Party v Party, Volume Reporter Page
    const casePattern = /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+v\.?\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*,\s+\d+\s+[A-Za-z]+(?:\s+\d[a-z]*)?\s+\d+)\b/g;
    this.extractWithPattern(text, casePattern, 'case', 0.85, entities);

    // Michigan public domain: Party v Party, YYYY MI [App] Sequence
    const miPublicDomainPattern = /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+v\.?\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*,\s+\d{4}\s+MI(?:\s+App)?\s+\d+)\b/g;
    this.extractWithPattern(text, miPublicDomainPattern, 'case', 0.9, entities);

    return entities;
  }

  /**
   * Extract email addresses
   */
  private extractEmails(text: string): Entity[] {
    const entities: Entity[] = [];
    const emailPattern = /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g;
    this.extractWithPattern(text, emailPattern, 'email', 0.95, entities);
    return entities;
  }

  /**
   * Extract phone numbers
   */
  private extractPhones(text: string): Entity[] {
    const entities: Entity[] = [];

    // (XXX) XXX-XXXX
    const phonePattern1 = /\b(\(\d{3}\)\s*\d{3}[-.]?\d{4})\b/g;
    this.extractWithPattern(text, phonePattern1, 'phone', 0.95, entities);

    // XXX-XXX-XXXX
    const phonePattern2 = /\b(\d{3}[-.]?\d{3}[-.]?\d{4})\b/g;
    this.extractWithPattern(text, phonePattern2, 'phone', 0.9, entities);

    return entities;
  }

  /**
   * Extract entities with regex pattern
   */
  private extractWithPattern(
    text: string,
    pattern: RegExp,
    type: Entity['type'],
    confidence: number,
    entities: Entity[]
  ): void {
    const matches = Array.from(text.matchAll(pattern));
    
    for (const match of matches) {
      const entityText = match[1] || match[0];
      const position = match.index || 0;
      
      // Extract context (50 chars before and after)
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(text.length, position + entityText.length + 50);
      const context = text.slice(contextStart, contextEnd);

      entities.push({
        text: entityText,
        type,
        confidence,
        position: {
          start: position,
          end: position + entityText.length,
        },
        context,
      });
    }
  }

  /**
   * Remove duplicate entities
   */
  private deduplicateEntities(entities: Entity[]): Entity[] {
    const seen = new Map<string, Entity>();

    for (const entity of entities) {
      const key = `${entity.type}:${entity.text.toLowerCase()}`;
      const existing = seen.get(key);
      
      // Keep entity with higher confidence
      if (!existing || entity.confidence > existing.confidence) {
        seen.set(key, entity);
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.position.start - b.position.start);
  }

  /**
   * Find relationships between entities
   */
  private findRelationships(
    entities: Entity[],
    text: string
  ): Array<{
    entity1: string;
    entity2: string;
    type: string;
    confidence: number;
  }> {
    const relationships: Array<{
      entity1: string;
      entity2: string;
      type: string;
      confidence: number;
    }> = [];

    // Find entities that appear close together (within 100 chars)
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        const distance = Math.abs(entity1.position.start - entity2.position.start);
        
        if (distance < 100) {
          const type = this.inferRelationshipType(entity1, entity2, text);
          const confidence = Math.max(0.3, 1 - (distance / 200));
          
          if (type) {
            relationships.push({
              entity1: entity1.text,
              entity2: entity2.text,
              type,
              confidence: Math.round(confidence * 100) / 100,
            });
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Infer relationship type between entities
   */
  private inferRelationshipType(entity1: Entity, entity2: Entity, text: string): string | null {
    const type1 = entity1.type;
    const type2 = entity2.type;

    // Person-Organization relationships
    if (type1 === 'person' && type2 === 'organization') {
      return 'affiliated_with';
    }
    if (type1 === 'organization' && type2 === 'person') {
      return 'employs';
    }

    // Person-Location relationships
    if (type1 === 'person' && type2 === 'location') {
      return 'located_in';
    }

    // Case-Statute relationships
    if (type1 === 'case' && type2 === 'statute') {
      return 'cites';
    }

    // Date-Event relationships (person or case with date)
    if (type2 === 'date' && (type1 === 'person' || type1 === 'case' || type1 === 'organization')) {
      return 'occurred_on';
    }

    // Money-Party relationships
    if (type1 === 'money' && (type2 === 'person' || type2 === 'organization')) {
      return 'amount_involving';
    }

    return 'related_to';
  }
}

export const entityProcessor = new EntityProcessor();
