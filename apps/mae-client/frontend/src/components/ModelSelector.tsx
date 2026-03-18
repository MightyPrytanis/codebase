/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Check } from 'lucide-react'

export interface ModelSpec {
  provider: string
  model: string
  label: string
}

const MODEL_GROUPS: Array<{ group: string; models: ModelSpec[] }> = [
  {
    group: 'OpenAI',
    models: [
      { provider: 'openai', model: 'gpt-4o', label: 'GPT-4o' },
      { provider: 'openai', model: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { provider: 'openai', model: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { provider: 'openai', model: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    group: 'Anthropic',
    models: [
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { provider: 'anthropic', model: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
      { provider: 'anthropic', model: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    ],
  },
]

interface ModelSelectorProps {
  selected: ModelSpec[]
  onChange: (selected: ModelSpec[]) => void
}

function modelKey(m: ModelSpec) {
  return `${m.provider}:${m.model}`
}

export default function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  const selectedKeys = new Set(selected.map(modelKey))

  const toggle = (m: ModelSpec) => {
    const key = modelKey(m)
    if (selectedKeys.has(key)) {
      onChange(selected.filter((s) => modelKey(s) !== key))
    } else {
      onChange([...selected, m])
    }
  }

  const allModels = MODEL_GROUPS.flatMap((g) => g.models)

  const selectAll = () => onChange(allModels)
  const clearAll = () => onChange([])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">Models</span>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={selectAll}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Select All
          </button>
          <span className="text-gray-600">·</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {MODEL_GROUPS.map(({ group, models }) => (
        <div key={group}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{group}</p>
          <div className="space-y-1">
            {models.map((m) => {
              const key = modelKey(m)
              const checked = selectedKeys.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(m)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                    checked
                      ? 'bg-indigo-900/50 text-indigo-200 border border-indigo-700'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                      checked ? 'bg-indigo-600 border-indigo-500' : 'border-gray-600'
                    }`}
                  >
                    {checked && <Check size={10} className="text-white" />}
                  </span>
                  <span className="flex-1 text-left">{m.label}</span>
                  <span className="text-xs font-mono text-gray-600">{m.model}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {selected.length > 0 && (
        <p className="text-xs text-gray-500">
          {selected.length} model{selected.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}
