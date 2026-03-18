/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react'
import {
  Play,
  Repeat2,
  Users,
  MessageSquare,
  Layers,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { ModelSpec } from './ModelSelector'

export type WorkflowType = 'parallel' | 'relay' | 'committee' | 'critique' | 'ebom' | 'panel'

const WORKFLOW_CARDS: Array<{
  type: WorkflowType
  name: string
  description: string
  icon: React.ReactNode
  requiresSynthesizer: boolean
}> = [
  {
    type: 'parallel',
    name: 'Head-to-Head',
    description: 'All models run the same prompt simultaneously.',
    icon: <Play size={16} />,
    requiresSynthesizer: false,
  },
  {
    type: 'relay',
    name: 'Relay',
    description: "Each model refines the previous model's output.",
    icon: <Repeat2 size={16} />,
    requiresSynthesizer: false,
  },
  {
    type: 'committee',
    name: 'Committee',
    description: 'Parallel drafts → synthesizer combines the best.',
    icon: <Users size={16} />,
    requiresSynthesizer: true,
  },
  {
    type: 'critique',
    name: 'Critique Round',
    description: 'Draft → cross-critique → synthesizer revises.',
    icon: <MessageSquare size={16} />,
    requiresSynthesizer: true,
  },
  {
    type: 'ebom',
    name: 'EBOM Pipeline',
    description: 'Brief → draft → composite → critique → final.',
    icon: <Layers size={16} />,
    requiresSynthesizer: true,
  },
  {
    type: 'panel',
    name: 'Expert Panel',
    description: 'Each model takes an expert persona → synthesizer combines.',
    icon: <UserCheck size={16} />,
    requiresSynthesizer: true,
  },
]

const DEFAULT_PERSONAS = [
  'Tax Attorney',
  'Financial Advisor',
  'Family Law Mediator',
  'Business Valuator',
  'Estate Planner',
  'Forensic Accountant',
]

export interface WorkflowSelectorProps {
  selectedWorkflow: WorkflowType
  onWorkflowChange: (w: WorkflowType) => void
  models: ModelSpec[]
  synthesizer: ModelSpec | null
  onSynthesizerChange: (m: ModelSpec | null) => void
  expertPersonas: string[]
  onPersonasChange: (p: string[]) => void
}

export default function WorkflowSelector({
  selectedWorkflow,
  onWorkflowChange,
  models,
  synthesizer,
  onSynthesizerChange,
  expertPersonas,
  onPersonasChange,
}: WorkflowSelectorProps) {
  const [expanded, setExpanded] = useState(false)

  const currentCard = WORKFLOW_CARDS.find((c) => c.type === selectedWorkflow)

  const handleSynthesizerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [provider, model] = e.target.value.split('::')
    if (!provider || !model) {
      onSynthesizerChange(null)
    } else {
      const found = models.find((m) => m.provider === provider && m.model === model)
      onSynthesizerChange(found ?? null)
    }
  }

  const synthKey = (m: ModelSpec) => `${m.provider}::${m.model}`

  return (
    <div className="space-y-2">
      {/* Header / collapse toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-300 hover:text-gray-100 transition-colors"
      >
        <span>Workflow</span>
        <span className="flex items-center gap-2">
          {!expanded && currentCard && (
            <span className="text-xs text-indigo-400 font-normal">{currentCard.name}</span>
          )}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* 2-column workflow grid */}
          <div className="grid grid-cols-2 gap-2">
            {WORKFLOW_CARDS.map((card) => {
              const isSelected = selectedWorkflow === card.type
              return (
                <button
                  key={card.type}
                  type="button"
                  onClick={() => onWorkflowChange(card.type)}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      isSelected ? 'text-indigo-300' : 'text-gray-300'
                    }`}
                  >
                    <span className={isSelected ? 'text-indigo-400' : 'text-gray-500'}>
                      {card.icon}
                    </span>
                    {card.name}
                  </span>
                  <span className="text-xs leading-snug text-gray-500">{card.description}</span>
                </button>
              )
            })}
          </div>

          {/* Synthesizer selector — shown when required */}
          {currentCard?.requiresSynthesizer && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">
                Synthesizer model
                <span className="text-red-400 ml-0.5">*</span>
              </label>
              {models.length === 0 ? (
                <p className="text-xs text-gray-600 italic">Select models above first.</p>
              ) : (
                <select
                  value={synthesizer ? synthKey(synthesizer) : ''}
                  onChange={handleSynthesizerSelect}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">— choose synthesizer —</option>
                  {models.map((m) => (
                    <option key={synthKey(m)} value={synthKey(m)}>
                      {m.provider} / {m.label ?? m.model}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Expert personas textarea — panel workflow only */}
          {selectedWorkflow === 'panel' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">
                Expert personas <span className="text-gray-600 font-normal">(one per line)</span>
              </label>
              <textarea
                rows={6}
                value={expertPersonas.join('\n')}
                onChange={(e) =>
                  onPersonasChange(
                    e.target.value
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean),
                  )
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={DEFAULT_PERSONAS.join('\n')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
