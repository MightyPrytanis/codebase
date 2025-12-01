/**
 * Processor Index
 * Exports all Arkiver processors
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export { 
  TextProcessor, 
  textProcessor,
  TextProcessorSchema,
  type TextProcessorInput,
  type TextProcessorOutput 
} from './text-processor.js';

export { 
  EmailProcessor, 
  emailProcessor,
  EmailProcessorSchema,
  type EmailProcessorInput,
  type EmailProcessorOutput,
  type EmailAddress,
  type EmailAttachment
} from './email-processor.js';

export { 
  InsightProcessor, 
  insightProcessor,
  InsightProcessorSchema,
  type InsightProcessorInput,
  type InsightProcessorOutput,
  type Insight
} from './insight-processor.js';

export { 
  EntityProcessor, 
  entityProcessor,
  EntityProcessorSchema,
  type EntityProcessorInput,
  type EntityProcessorOutput,
  type Entity
} from './entity-processor.js';

export { 
  TimelineProcessor, 
  timelineProcessor,
  TimelineProcessorSchema,
  type TimelineProcessorInput,
  type TimelineProcessorOutput,
  type TimelineEvent
} from './timeline-processor.js';
