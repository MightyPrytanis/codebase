/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Library Seed Script
 * 
 * Seeds the library with a Michigan family law bundle including:
 * - Michigan Court Rules (MCR)
 * - Local court rules for Wayne, Oakland, Macomb counties
 * - Standing orders from common judges
 * - Template documents (complaint, motion, parenting time forms)
 * - Playbooks for common family law scenarios
 */

import { 
  upsertLibraryItem, 
  upsertLibraryLocation,
  enqueueIngest 
} from '../src/services/library-service.js';
import { LibraryItem } from '../src/modules/library/library-model.js';

const MICHIGAN_FAMILY_LAW_ITEMS = [
  {
    filename: 'MCR-3-Family-Division.pdf',
    title: 'Michigan Court Rules - Chapter 3: Family Division',
    description: 'Michigan Court Rules governing family law proceedings',
    sourceType: 'rule' as const,
    jurisdiction: 'Michigan',
    practiceAreas: ['Family Law'],
    issueTags: ['divorce', 'custody', 'parenting-time', 'child-support', 'property-division'],
  },
  {
    filename: 'Wayne-County-Local-Rules.pdf',
    title: 'Wayne County Circuit Court - Local Rules',
    description: 'Local rules for Wayne County Circuit Court',
    sourceType: 'rule' as const,
    jurisdiction: 'Michigan',
    county: 'Wayne',
    court: 'Wayne County Circuit Court',
    practiceAreas: ['Family Law'],
    issueTags: ['local-rules', 'procedure'],
  },
  {
    filename: 'Oakland-County-Local-Rules.pdf',
    title: 'Oakland County Circuit Court - Local Rules',
    description: 'Local rules for Oakland County Circuit Court',
    sourceType: 'rule' as const,
    jurisdiction: 'Michigan',
    county: 'Oakland',
    court: 'Oakland County Circuit Court',
    practiceAreas: ['Family Law'],
    issueTags: ['local-rules', 'procedure'],
  },
  {
    filename: 'Macomb-County-Local-Rules.pdf',
    title: 'Macomb County Circuit Court - Local Rules',
    description: 'Local rules for Macomb County Circuit Court',
    sourceType: 'rule' as const,
    jurisdiction: 'Michigan',
    county: 'Macomb',
    court: 'Macomb County Circuit Court',
    practiceAreas: ['Family Law'],
    issueTags: ['local-rules', 'procedure'],
  },
  {
    filename: 'Standing-Order-Parenting-Time.pdf',
    title: 'Standing Order - Parenting Time Guidelines',
    description: 'Standard parenting time guidelines used in Michigan family courts',
    sourceType: 'standing-order' as const,
    jurisdiction: 'Michigan',
    practiceAreas: ['Family Law'],
    issueTags: ['parenting-time', 'custody', 'visitation'],
  },
  {
    filename: 'Template-Complaint-Divorce.docx',
    title: 'Template: Complaint for Divorce',
    description: 'Standard template for filing a complaint for divorce in Michigan',
    sourceType: 'template' as const,
    jurisdiction: 'Michigan',
    practiceAreas: ['Family Law'],
    issueTags: ['divorce', 'pleading', 'initial-filing'],
  },
  {
    filename: 'Template-Motion-Parenting-Time.docx',
    title: 'Template: Motion for Parenting Time',
    description: 'Template for filing a motion to establish or modify parenting time',
    sourceType: 'template' as const,
    jurisdiction: 'Michigan',
    practiceAreas: ['Family Law'],
    issueTags: ['parenting-time', 'motion', 'modification'],
  },
  {
    filename: 'Template-Judgment-Divorce.docx',
    title: 'Template: Judgment of Divorce',
    description: 'Template for final judgment of divorce',
    sourceType: 'template' as const,
    jurisdiction: 'Michigan',
    practiceAreas: ['Family Law'],
    issueTags: ['divorce', 'judgment', 'final-order'],
  },
  {
    filename: 'Playbook-Initial-Consultation.md',
    title: 'Playbook: Initial Divorce Consultation',
    description: 'Step-by-step guide for conducting an initial divorce consultation',
    sourceType: 'playbook' as const,
    jurisdiction: 'Michigan',
    practiceAreas: ['Family Law'],
    issueTags: ['divorce', 'consultation', 'client-intake'],
  },
  {
    filename: 'Playbook-Property-Division.md',
    title: 'Playbook: Property Division in Divorce',
    description: 'Guide to property division in Michigan divorce cases',
    sourceType: 'playbook' as const,
    jurisdiction: 'Michigan',
    practiceAreas: ['Family Law'],
    issueTags: ['divorce', 'property-division', 'assets', 'debts'],
  },
  {
    filename: 'Playbook-Child-Custody.md',
    title: 'Playbook: Child Custody Determination',
    description: 'Guide to Michigan child custody best interest factors',
    sourceType: 'playbook' as const,
    jurisdiction: 'Michigan',
    practiceAreas: ['Family Law'],
    issueTags: ['custody', 'best-interest-factors', 'child-welfare'],
  },
];

/**
 * Seed the library with Michigan family law documents
 */
export async function seedMichiganFamilyLaw(userId: string = 'default-user'): Promise<void> {
  console.log('[Seed Library] Starting Michigan family law bundle seed');
  
  try {
    // Create a local library location for the seed bundle
    const location = await upsertLibraryLocation(userId, {
      type: 'local',
      name: 'Michigan Family Law Seed Bundle',
      path: '/library/seed/michigan-family-law',
    });
    
    console.log(`[Seed Library] Created location: ${location.id}`);
    
    // Add each library item
    for (const itemData of MICHIGAN_FAMILY_LAW_ITEMS) {
      const item = await upsertLibraryItem({
        userId,
        locationId: location.id,
        filename: itemData.filename,
        filepath: `/library/seed/michigan-family-law/${itemData.filename}`,
        fileType: itemData.filename.endsWith('.pdf') ? 'application/pdf' : 
                  itemData.filename.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                  'text/markdown',
        title: itemData.title,
        description: itemData.description,
        sourceType: itemData.sourceType,
        jurisdiction: itemData.jurisdiction,
        county: itemData.county,
        court: itemData.court,
        practiceAreas: itemData.practiceAreas,
        issueTags: itemData.issueTags,
        pinned: false,
        ingested: false,
        superseded: false,
      });
      
      console.log(`[Seed Library] Created item: ${item.title}`);
      
      // Enqueue for ingestion
      await enqueueIngest(item.id, userId, 'normal');
      console.log(`[Seed Library] Enqueued for ingestion: ${item.title}`);
    }
    
    console.log(`[Seed Library] Successfully seeded ${MICHIGAN_FAMILY_LAW_ITEMS.length} items`);
  } catch (error) {
    console.error('[Seed Library] Error seeding library:', error);
    throw error;
  }
}

// If run directly, execute the seed
if (import.meta.url === `file://${process.argv[1]}`) {
  const userId = process.argv[2] || 'default-user';
  seedMichiganFamilyLaw(userId).catch(err => {
    console.error('[Seed Library] Fatal error:', err);
    process.exit(1);
  });
