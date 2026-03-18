/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react'
import { getDocument, generateVersions, runWorkflow } from '../lib/api'
import ModelSelector, { type ModelSpec } from './ModelSelector'
import VersionPanel from './VersionPanel'
import WorkflowSelector, { type WorkflowType } from './WorkflowSelector'
import WorkflowStagePanel from './WorkflowStagePanel'
import type { WorkflowStageResult } from '../lib/api'

const DEFAULT_EXPERT_PERSONAS = [
  'Tax Attorney',
  'Financial Advisor',
  'Family Law Mediator',
  'Business Valuator',
  'Estate Planner',
  'Forensic Accountant',
]

export default function DocumentEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState<ModelSpec[]>([])
  const [genError, setGenError] = useState<string | null>(null)
  const [anonymize, setAnonymize] = useState(false)
  const [workflow, setWorkflow] = useState<WorkflowType>('parallel')
  const [synthesizer, setSynthesizer] = useState<ModelSpec | null>(null)
  const [expertPersonas, setExpertPersonas] = useState<string[]>(DEFAULT_EXPERT_PERSONAS)
  const [workflowStages, setWorkflowStages] = useState<WorkflowStageResult[]>([])

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id!),
    enabled: !!id,
  })

  const WORKFLOWS_NEEDING_SYNTH: WorkflowType[] = ['committee', 'critique', 'ebom', 'panel']
  const needsSynthesizer = WORKFLOWS_NEEDING_SYNTH.includes(workflow)
  const synthesizerMissing = needsSynthesizer && !synthesizer

  const generateMutation = useMutation({
    mutationFn: () => {
      if (workflow === 'parallel') {
        return generateVersions({
          documentId: id!,
          prompt,
          models: selectedModels.map(({ provider, model }) => ({ provider, model })),
          anonymize,
        }).then((result) => {
          setWorkflowStages([])
          return result
        })
      }
      return runWorkflow({
        documentId: id!,
        prompt,
        models: selectedModels.map(({ provider, model }) => ({ provider, model })),
        synthesizer: synthesizer
          ? { provider: synthesizer.provider, model: synthesizer.model }
          : undefined,
        workflowType: workflow,
        anonymize,
        expertPersonas: workflow === 'panel' ? expertPersonas : undefined,
      }).then((result) => {
        setWorkflowStages(result.stages)
        return { versions: [], errors: undefined }
      })
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['document', id] })
      if (result.errors && result.errors.length > 0) {
        setGenError(result.errors.map((e) => `${e.provider}/${e.model}: ${e.error}`).join('\n'))
      } else {
        setGenError(null)
      }
    },
    onError: (err: Error) => setGenError(err.message),
  })

  const canGenerate =
    prompt.trim().length > 0 &&
    selectedModels.length > 0 &&
    !generateMutation.isPending &&
    !synthesizerMissing

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Loading…</div>
    )
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <p>Document not found.</p>
        <button type="button" onClick={() => navigate('/')} className="text-indigo-400 hover:underline text-sm">
          Back to documents
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* Top bar */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-base font-semibold text-gray-100">{doc.title}</h1>
        <span className="text-xs text-gray-600 ml-auto">
          {doc.versions.length} version{doc.versions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="w-80 flex-shrink-0 border-r border-gray-800 flex flex-col overflow-y-auto p-5 gap-5">
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium text-gray-300">
              Prompt
            </label>
            <textarea
              id="prompt"
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want the AI to write…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Anonymize toggle */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setAnonymize(!anonymize)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                anonymize
                  ? 'bg-emerald-900/40 border-emerald-700 text-emerald-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <ShieldCheck size={15} className={anonymize ? 'text-emerald-400' : 'text-gray-600'} />
              <span className="flex-1 text-left font-medium">Anonymize for sensitive documents</span>
              <span
                className={`w-8 h-4 rounded-full relative transition-colors ${
                  anonymize ? 'bg-emerald-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                    anonymize ? 'left-4' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
            {anonymize && (
              <p className="text-xs text-emerald-400/80 leading-snug px-1">
                Names, organizations, dates, amounts, and other PII will be replaced with tokens
                before the prompt is sent to any AI provider. Tokens are reversed locally before
                the response is returned. Content classified as Category 3 (SSN, account
                numbers, date of birth) is blocked from leaving the device.
              </p>
            )}
          </div>

          <ModelSelector selected={selectedModels} onChange={setSelectedModels} />

          <WorkflowSelector
            selectedWorkflow={workflow}
            onWorkflowChange={(w) => {
              setWorkflow(w)
              setWorkflowStages([])
            }}
            models={selectedModels}
            synthesizer={synthesizer}
            onSynthesizerChange={setSynthesizer}
            expertPersonas={expertPersonas}
            onPersonasChange={setExpertPersonas}
          />

          {synthesizerMissing && (
            <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800 rounded-lg px-3 py-2">
              This workflow requires a synthesizer model. Select one above.
            </p>
          )}

          <button
            type="button"
            disabled={!canGenerate}
            onClick={() => {
              setGenError(null)
              generateMutation.mutate()
            }}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {generateMutation.isPending ? (
              <>
                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate
              </>
            )}
          </button>

          {genError && (
            <div className="flex gap-2 text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-lg p-3">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <pre className="whitespace-pre-wrap">{genError}</pre>
            </div>
          )}
        </aside>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {workflowStages.length > 0 && (
            <WorkflowStagePanel stages={workflowStages} />
          )}
          <VersionPanel versions={doc.versions} />
        </div>
      </div>
    </div>
  )
}
