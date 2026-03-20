/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { v4 as uuidv4 } from 'uuid';
import { addVersion } from './version-control.js';

/** Internal base URL for the Cyrano HTTP bridge.  Read once at module load from
 *  the environment — never supplied via user-controlled input — to prevent SSRF. */
const CYRANO_BASE_URL: string = process.env.CYRANO_URL ?? 'http://localhost:5002';

export type WorkflowType = 'parallel' | 'relay' | 'committee' | 'critique' | 'ebom' | 'panel';

export const WORKFLOW_PRESETS: Record<
  WorkflowType,
  { name: string; description: string; minModels: number; requiresSynthesizer: boolean }
> = {
  parallel: {
    name: 'Head-to-Head (Parallel)',
    description: 'All models run the same prompt simultaneously for maximum diversity.',
    minModels: 1,
    requiresSynthesizer: false,
  },
  relay: {
    name: 'Relay',
    description: "Sequential chain: each model refines the previous model's output.",
    minModels: 2,
    requiresSynthesizer: false,
  },
  committee: {
    name: 'Committee',
    description: 'All models draft in parallel, then a synthesizer combines the best elements.',
    minModels: 2,
    requiresSynthesizer: true,
  },
  critique: {
    name: 'Critique Round',
    description:
      "Models draft in parallel, critique each other's work, then a synthesizer produces the final.",
    minModels: 2,
    requiresSynthesizer: true,
  },
  ebom: {
    name: 'EBOM Pipeline',
    description:
      'Synthesizer creates a brief → models draft → synthesizer combines → models critique → final revision.',
    minModels: 2,
    requiresSynthesizer: true,
  },
  panel: {
    name: 'Expert Panel',
    description:
      'Each model adopts an expert persona, drafts in parallel, then a synthesizer combines expert views.',
    minModels: 2,
    requiresSynthesizer: true,
  },
};

export const DEFAULT_EXPERT_PERSONAS = [
  'Tax Attorney',
  'Financial Advisor',
  'Family Law Mediator',
  'Business Valuator',
  'Estate Planner',
  'Forensic Accountant',
];

export interface WorkflowModelSpec {
  provider: string;
  model: string;
  label?: string;
}

export interface WorkflowStageOutput {
  provider: string;
  model: string;
  content: string;
  isError: boolean;
  error?: string;
  persona?: string;
}

export interface WorkflowStage {
  index: number;
  name: string;
  description: string;
  outputs: WorkflowStageOutput[];
  startedAt: string;
  completedAt: string;
}

export interface WorkflowRunOptions {
  documentId: string;
  prompt: string;
  context?: string;
  models: WorkflowModelSpec[];
  synthesizer?: WorkflowModelSpec;
  workflowType: WorkflowType;
  anonymize?: boolean;
  expertPersonas?: string[];
  taskType?: string;
}

interface CyranoVersion {
  provider: string;
  model: string;
  content: string;
  isError: boolean;
  error?: string;
  timestamp: string;
}

async function callMulti(
  prompt: string,
  models: WorkflowModelSpec[],
  context?: string,
  anonymize?: boolean,
  taskType?: string,
): Promise<CyranoVersion[]> {
  const response = await fetch(`${CYRANO_BASE_URL}/api/mae/write/multi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      models,
      context,
      anonymize: anonymize ?? false,
      taskType: taskType ?? 'writing',
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cyrano HTTP bridge error ${response.status}: ${text}`);
  }
  const data = (await response.json()) as { versions?: CyranoVersion[] };
  if (!data.versions || !Array.isArray(data.versions)) {
    throw new Error('Unexpected response shape from Cyrano');
  }
  return data.versions;
}

async function callSingle(
  prompt: string,
  model: WorkflowModelSpec,
  context?: string,
  anonymize?: boolean,
  taskType?: string,
): Promise<CyranoVersion> {
  const response = await fetch(`${CYRANO_BASE_URL}/api/mae/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      provider: model.provider,
      model: model.model,
      context,
      anonymize: anonymize ?? false,
      taskType: taskType ?? 'writing',
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cyrano HTTP bridge error ${response.status}: ${text}`);
  }
  return (await response.json()) as CyranoVersion;
}

function saveStageVersions(
  documentId: string,
  stageIndex: number,
  stageName: string,
  workflowType: WorkflowType,
  outputs: WorkflowStageOutput[],
  prompt: string,
): void {
  for (const output of outputs) {
    if (!output.isError && output.content) {
      addVersion(documentId, {
        id: uuidv4(),
        documentId,
        content: output.content,
        model: output.model,
        provider: output.provider,
        prompt,
        timestamp: new Date().toISOString(),
        metadata: {
          stageIndex,
          stageName,
          workflowType,
          ...(output.persona ? { persona: output.persona } : {}),
        },
      });
    }
  }
}

export async function runWorkflow(options: WorkflowRunOptions): Promise<WorkflowStage[]> {
  const {
    documentId,
    prompt,
    context,
    models,
    synthesizer,
    workflowType,
    anonymize,
    expertPersonas,
    taskType,
  } = options;

  switch (workflowType) {
    case 'parallel':
      return runParallel(documentId, prompt, context, models, anonymize, taskType);
    case 'relay':
      return runRelay(documentId, prompt, context, models, anonymize, taskType);
    case 'committee':
      if (!synthesizer) throw new Error("Workflow type 'committee' requires a synthesizer model.");
      return runCommittee(documentId, prompt, context, models, synthesizer, anonymize, taskType);
    case 'critique':
      if (!synthesizer) throw new Error("Workflow type 'critique' requires a synthesizer model.");
      return runCritique(documentId, prompt, context, models, synthesizer, anonymize, taskType);
    case 'ebom':
      if (!synthesizer) throw new Error("Workflow type 'ebom' requires a synthesizer model.");
      return runEbom(documentId, prompt, context, models, synthesizer, anonymize, taskType);
    case 'panel':
      if (!synthesizer) throw new Error("Workflow type 'panel' requires a synthesizer model.");
      return runPanel(documentId, prompt, context, models, synthesizer, anonymize, expertPersonas, taskType);
    default:
      throw new Error(`Unknown workflow type: ${workflowType}`);
  }
}

async function runParallel(
  documentId: string,
  prompt: string,
  context: string | undefined,
  models: WorkflowModelSpec[],
  anonymize?: boolean,
  taskType?: string,
): Promise<WorkflowStage[]> {
  const startedAt = new Date().toISOString();
  const cyranoVersions = await callMulti(prompt, models, context, anonymize, taskType);
  const completedAt = new Date().toISOString();

  const outputs: WorkflowStageOutput[] = cyranoVersions.map((cv) => ({
    provider: cv.provider,
    model: cv.model,
    content: cv.content ?? '',
    isError: cv.isError,
    error: cv.error,
  }));

  const stage: WorkflowStage = {
    index: 0,
    name: 'Parallel Draft',
    description: 'All models ran the same prompt simultaneously.',
    outputs,
    startedAt,
    completedAt,
  };

  saveStageVersions(documentId, 0, 'Parallel Draft', 'parallel', outputs, prompt);
  return [stage];
}

async function runRelay(
  documentId: string,
  prompt: string,
  context: string | undefined,
  models: WorkflowModelSpec[],
  anonymize?: boolean,
  taskType?: string,
): Promise<WorkflowStage[]> {
  const stages: WorkflowStage[] = [];
  let currentPrompt = prompt;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const stageName = i === 0 ? 'Initial Draft' : `Relay Pass ${i}`;
    const stageDesc =
      i === 0
        ? `${model.label ?? model.model} writes the initial draft.`
        : `${model.label ?? model.model} refines the previous draft.`;

    const startedAt = new Date().toISOString();
    let output: WorkflowStageOutput;
    try {
      const cv = await callSingle(currentPrompt, model, context, anonymize, taskType);
      output = {
        provider: cv.provider,
        model: cv.model,
        content: cv.content ?? '',
        isError: cv.isError,
        error: cv.error,
      };
    } catch (err) {
      output = {
        provider: model.provider,
        model: model.model,
        content: '',
        isError: true,
        error: err instanceof Error ? err.message : String(err),
      };
    }
    const completedAt = new Date().toISOString();

    stages.push({ index: i, name: stageName, description: stageDesc, outputs: [output], startedAt, completedAt });
    saveStageVersions(documentId, i, stageName, 'relay', [output], currentPrompt);

    if (!output.isError && output.content) {
      currentPrompt = `Refine and improve the following draft:\n\n${output.content}`;
    }
  }

  return stages;
}

async function runCommittee(
  documentId: string,
  prompt: string,
  context: string | undefined,
  models: WorkflowModelSpec[],
  synthesizer: WorkflowModelSpec,
  anonymize?: boolean,
  taskType?: string,
): Promise<WorkflowStage[]> {
  const stages: WorkflowStage[] = [];

  // Stage 0: parallel draft
  const s0Start = new Date().toISOString();
  const cyranoVersions = await callMulti(prompt, models, context, anonymize, taskType);
  const s0End = new Date().toISOString();
  const s0Outputs: WorkflowStageOutput[] = cyranoVersions.map((cv) => ({
    provider: cv.provider,
    model: cv.model,
    content: cv.content ?? '',
    isError: cv.isError,
    error: cv.error,
  }));
  stages.push({
    index: 0,
    name: 'Parallel Draft',
    description: 'All models drafted independently.',
    outputs: s0Outputs,
    startedAt: s0Start,
    completedAt: s0End,
  });
  saveStageVersions(documentId, 0, 'Parallel Draft', 'committee', s0Outputs, prompt);

  // Stage 1: synthesizer combines
  const successfulDrafts = s0Outputs.filter((o) => !o.isError && o.content);
  const combined = successfulDrafts
    .map((o, idx) => `--- Draft ${idx + 1} (${o.provider}/${o.model}) ---\n${o.content}`)
    .join('\n\n');
  const synthPrompt = `You have received the following independent drafts:\n\n${combined}\n\nSynthesize them into a single best version.`;

  const s1Start = new Date().toISOString();
  let synthOutput: WorkflowStageOutput;
  try {
    const cv = await callSingle(synthPrompt, synthesizer, context, anonymize, taskType);
    synthOutput = {
      provider: cv.provider,
      model: cv.model,
      content: cv.content ?? '',
      isError: cv.isError,
      error: cv.error,
    };
  } catch (err) {
    synthOutput = {
      provider: synthesizer.provider,
      model: synthesizer.model,
      content: '',
      isError: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  const s1End = new Date().toISOString();
  stages.push({
    index: 1,
    name: 'Synthesis',
    description: 'Synthesizer combined all drafts.',
    outputs: [synthOutput],
    startedAt: s1Start,
    completedAt: s1End,
  });
  saveStageVersions(documentId, 1, 'Synthesis', 'committee', [synthOutput], synthPrompt);

  return stages;
}

async function runCritique(
  documentId: string,
  prompt: string,
  context: string | undefined,
  models: WorkflowModelSpec[],
  synthesizer: WorkflowModelSpec,
  anonymize?: boolean,
  taskType?: string,
): Promise<WorkflowStage[]> {
  const stages: WorkflowStage[] = [];

  // Stage 0: parallel draft
  const s0Start = new Date().toISOString();
  const cyranoVersions = await callMulti(prompt, models, context, anonymize, taskType);
  const s0End = new Date().toISOString();
  const s0Outputs: WorkflowStageOutput[] = cyranoVersions.map((cv) => ({
    provider: cv.provider,
    model: cv.model,
    content: cv.content ?? '',
    isError: cv.isError,
    error: cv.error,
  }));
  stages.push({
    index: 0,
    name: 'Parallel Draft',
    description: 'All models drafted independently.',
    outputs: s0Outputs,
    startedAt: s0Start,
    completedAt: s0End,
  });
  saveStageVersions(documentId, 0, 'Parallel Draft', 'critique', s0Outputs, prompt);

  // Stage 1: rotating critique — each valid draft's author critiques the next draft in the ring
  // We work entirely off validDrafts to avoid index mismatch when some models failed
  const validDrafts = s0Outputs.filter((o) => !o.isError && o.content);
  const s1Start = new Date().toISOString();
  const critiquePromises = validDrafts.map(async (critiquer, i) => {
    // critiquer is the model that produced validDrafts[i]; they critique the next draft
    const targetDraft = validDrafts[(i + 1) % validDrafts.length];
    const critiqueModel: WorkflowModelSpec = { provider: critiquer.provider, model: critiquer.model };
    const critiquePrompt = `Please critique the following draft and identify its strengths and weaknesses:\n\n${targetDraft.content}`;
    try {
      const cv = await callSingle(critiquePrompt, critiqueModel, context, anonymize, taskType);
      return {
        provider: cv.provider,
        model: cv.model,
        content: cv.content ?? '',
        isError: cv.isError,
        error: cv.error,
      };
    } catch (err) {
      return {
        provider: critiqueModel.provider,
        model: critiqueModel.model,
        content: '',
        isError: true,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
  const critiqueOutputs = await Promise.all(critiquePromises);
  const s1End = new Date().toISOString();
  stages.push({
    index: 1,
    name: 'Critique Round',
    description: "Models critiqued each other's drafts (rotating).",
    outputs: critiqueOutputs,
    startedAt: s1Start,
    completedAt: s1End,
  });
  saveStageVersions(documentId, 1, 'Critique Round', 'critique', critiqueOutputs, 'critique');

  // Stage 2: synthesizer final revision
  const draftSummary = validDrafts
    .map((d, i) => `--- Draft ${i + 1} (${d.provider}/${d.model}) ---\n${d.content}`)
    .join('\n\n');
  const critiqueSummary = critiqueOutputs
    .filter((c) => !c.isError && c.content)
    .map((c, i) => `--- Critique ${i + 1} (${c.provider}/${c.model}) ---\n${c.content}`)
    .join('\n\n');
  const revisePrompt = `You have the following original drafts:\n\n${draftSummary}\n\nAnd the following critiques:\n\n${critiqueSummary}\n\nRevise and synthesize the drafts into a final improved version that addresses the critiques.`;

  const s2Start = new Date().toISOString();
  let finalOutput: WorkflowStageOutput;
  try {
    const cv = await callSingle(revisePrompt, synthesizer, context, anonymize, taskType);
    finalOutput = {
      provider: cv.provider,
      model: cv.model,
      content: cv.content ?? '',
      isError: cv.isError,
      error: cv.error,
    };
  } catch (err) {
    finalOutput = {
      provider: synthesizer.provider,
      model: synthesizer.model,
      content: '',
      isError: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  const s2End = new Date().toISOString();
  stages.push({
    index: 2,
    name: 'Final Revision',
    description: 'Synthesizer revised drafts incorporating critiques.',
    outputs: [finalOutput],
    startedAt: s2Start,
    completedAt: s2End,
  });
  saveStageVersions(documentId, 2, 'Final Revision', 'critique', [finalOutput], revisePrompt);

  return stages;
}

async function runEbom(
  documentId: string,
  prompt: string,
  context: string | undefined,
  models: WorkflowModelSpec[],
  synthesizer: WorkflowModelSpec,
  anonymize?: boolean,
  taskType?: string,
): Promise<WorkflowStage[]> {
  const stages: WorkflowStage[] = [];

  // Stage 0: synthesizer creates brief
  const briefPrompt = `Design a detailed creative brief/RFP for the following task. Include objectives, requirements, constraints, evaluation criteria, and any relevant context:\n\n${prompt}`;
  const s0Start = new Date().toISOString();
  let briefOutput: WorkflowStageOutput;
  try {
    const cv = await callSingle(briefPrompt, synthesizer, context, anonymize, taskType);
    briefOutput = {
      provider: cv.provider,
      model: cv.model,
      content: cv.content ?? '',
      isError: cv.isError,
      error: cv.error,
    };
  } catch (err) {
    briefOutput = {
      provider: synthesizer.provider,
      model: synthesizer.model,
      content: '',
      isError: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  const s0End = new Date().toISOString();
  stages.push({
    index: 0,
    name: 'Brief Creation',
    description: 'Synthesizer created a detailed brief/RFP.',
    outputs: [briefOutput],
    startedAt: s0Start,
    completedAt: s0End,
  });
  saveStageVersions(documentId, 0, 'Brief Creation', 'ebom', [briefOutput], briefPrompt);

  if (briefOutput.isError || !briefOutput.content) {
    // Brief creation failed — return early so stages are not silently degraded
    throw new Error(
      `EBOM pipeline aborted: brief creation failed (${briefOutput.error ?? 'no content returned'}).`,
    );
  }
  const brief = briefOutput.content;

  // Stage 1: parallel draft based on brief
  const draftPrompt = `Using the following brief, create a high-quality draft:\n\n${brief}`;
  const s1Start = new Date().toISOString();
  const draftVersions = await callMulti(draftPrompt, models, context, anonymize, taskType);
  const s1End = new Date().toISOString();
  const draftOutputs: WorkflowStageOutput[] = draftVersions.map((cv) => ({
    provider: cv.provider,
    model: cv.model,
    content: cv.content ?? '',
    isError: cv.isError,
    error: cv.error,
  }));
  stages.push({
    index: 1,
    name: 'Parallel Draft',
    description: 'All models drafted from the brief.',
    outputs: draftOutputs,
    startedAt: s1Start,
    completedAt: s1End,
  });
  saveStageVersions(documentId, 1, 'Parallel Draft', 'ebom', draftOutputs, draftPrompt);

  // Stage 2: synthesizer combines/anonymizes
  const validDrafts = draftOutputs.filter((o) => !o.isError && o.content);
  const combined = validDrafts
    .map((d, i) => `--- Draft ${i + 1} ---\n${d.content}`)
    .join('\n\n');
  const combinePrompt = `Combine these drafts anonymously into a comprehensive composite draft. Preserve the best elements from each:\n\n${combined}`;
  const s2Start = new Date().toISOString();
  let combinedOutput: WorkflowStageOutput;
  try {
    const cv = await callSingle(combinePrompt, synthesizer, context, anonymize, taskType);
    combinedOutput = {
      provider: cv.provider,
      model: cv.model,
      content: cv.content ?? '',
      isError: cv.isError,
      error: cv.error,
    };
  } catch (err) {
    combinedOutput = {
      provider: synthesizer.provider,
      model: synthesizer.model,
      content: '',
      isError: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  const s2End = new Date().toISOString();
  stages.push({
    index: 2,
    name: 'Composite Draft',
    description: 'Synthesizer combined all drafts into a composite.',
    outputs: [combinedOutput],
    startedAt: s2Start,
    completedAt: s2End,
  });
  saveStageVersions(documentId, 2, 'Composite Draft', 'ebom', [combinedOutput], combinePrompt);

  if (combinedOutput.isError || !combinedOutput.content) {
    throw new Error(
      `EBOM pipeline aborted: synthesis (Stage 2) failed (${combinedOutput.error ?? 'no content returned'}).`,
    );
  }

  // Stage 3: parallel critique of composite
  const compositeDraft = combinedOutput.content;
  const critiquePrompt = `Please critique the following composite draft. Identify what works well, what needs improvement, and what is missing:\n\n${compositeDraft}`;
  const s3Start = new Date().toISOString();
  const critiqueVersions = await callMulti(critiquePrompt, models, context, anonymize, taskType);
  const s3End = new Date().toISOString();
  const critiqueOutputs: WorkflowStageOutput[] = critiqueVersions.map((cv) => ({
    provider: cv.provider,
    model: cv.model,
    content: cv.content ?? '',
    isError: cv.isError,
    error: cv.error,
  }));
  stages.push({
    index: 3,
    name: 'Critique',
    description: 'All models critiqued the composite draft.',
    outputs: critiqueOutputs,
    startedAt: s3Start,
    completedAt: s3End,
  });
  saveStageVersions(documentId, 3, 'Critique', 'ebom', critiqueOutputs, critiquePrompt);

  // Stage 4: synthesizer final revision
  const critiqueSummary = critiqueOutputs
    .filter((c) => !c.isError && c.content)
    .map((c, i) => `--- Critique ${i + 1} (${c.provider}/${c.model}) ---\n${c.content}`)
    .join('\n\n');
  const finalPrompt = `Here is the composite draft:\n\n${compositeDraft}\n\nHere are the critiques:\n\n${critiqueSummary}\n\nProduce a final, polished version that incorporates the best feedback.`;
  const s4Start = new Date().toISOString();
  let finalOutput: WorkflowStageOutput;
  try {
    const cv = await callSingle(finalPrompt, synthesizer, context, anonymize, taskType);
    finalOutput = {
      provider: cv.provider,
      model: cv.model,
      content: cv.content ?? '',
      isError: cv.isError,
      error: cv.error,
    };
  } catch (err) {
    finalOutput = {
      provider: synthesizer.provider,
      model: synthesizer.model,
      content: '',
      isError: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  const s4End = new Date().toISOString();
  stages.push({
    index: 4,
    name: 'Final Revision',
    description: 'Synthesizer produced the final polished version.',
    outputs: [finalOutput],
    startedAt: s4Start,
    completedAt: s4End,
  });
  saveStageVersions(documentId, 4, 'Final Revision', 'ebom', [finalOutput], finalPrompt);

  return stages;
}

async function runPanel(
  documentId: string,
  prompt: string,
  context: string | undefined,
  models: WorkflowModelSpec[],
  synthesizer: WorkflowModelSpec,
  anonymize?: boolean,
  expertPersonas?: string[],
  taskType?: string,
): Promise<WorkflowStage[]> {
  const stages: WorkflowStage[] = [];
  const personas =
    expertPersonas && expertPersonas.length > 0 ? expertPersonas : DEFAULT_EXPERT_PERSONAS;

  // Stage 0: each model gets an expert persona
  const s0Start = new Date().toISOString();
  const panelPromises = models.map(async (model, i) => {
    const persona = personas[i % personas.length];
    const personaPrompt = `You are a ${persona}. From your professional perspective as a ${persona}, respond to the following:\n\n${prompt}`;
    try {
      const cv = await callSingle(personaPrompt, model, context, anonymize, taskType);
      return {
        provider: cv.provider,
        model: cv.model,
        content: cv.content ?? '',
        isError: cv.isError,
        error: cv.error,
        persona,
      };
    } catch (err) {
      return {
        provider: model.provider,
        model: model.model,
        content: '',
        isError: true,
        error: err instanceof Error ? err.message : String(err),
        persona,
      };
    }
  });
  const panelOutputs = await Promise.all(panelPromises);
  const s0End = new Date().toISOString();
  stages.push({
    index: 0,
    name: 'Expert Panel',
    description: 'Each model provided a perspective from their expert persona.',
    outputs: panelOutputs,
    startedAt: s0Start,
    completedAt: s0End,
  });
  saveStageVersions(documentId, 0, 'Expert Panel', 'panel', panelOutputs, prompt);

  // Stage 1: synthesizer combines expert views
  const expertViews = panelOutputs
    .filter((o) => !o.isError && o.content)
    .map((o) => `--- ${o.persona ?? 'Expert'} (${o.provider}/${o.model}) ---\n${o.content}`)
    .join('\n\n');
  const synthPrompt = `You have received the following expert perspectives on the topic:\n\n${expertViews}\n\nSynthesize these expert views into a comprehensive, balanced analysis that integrates all perspectives.`;
  const s1Start = new Date().toISOString();
  let synthOutput: WorkflowStageOutput;
  try {
    const cv = await callSingle(synthPrompt, synthesizer, context, anonymize, taskType);
    synthOutput = {
      provider: cv.provider,
      model: cv.model,
      content: cv.content ?? '',
      isError: cv.isError,
      error: cv.error,
    };
  } catch (err) {
    synthOutput = {
      provider: synthesizer.provider,
      model: synthesizer.model,
      content: '',
      isError: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  const s1End = new Date().toISOString();
  stages.push({
    index: 1,
    name: 'Expert Synthesis',
    description: 'Synthesizer combined all expert perspectives.',
    outputs: [synthOutput],
    startedAt: s1Start,
    completedAt: s1End,
  });
  saveStageVersions(documentId, 1, 'Expert Synthesis', 'panel', [synthOutput], synthPrompt);

  return stages;
}
