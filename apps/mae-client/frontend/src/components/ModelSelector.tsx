/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Check, AlertTriangle, PlusCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'

export interface ModelSpec {
  provider: string
  model: string
  label: string
  caution?: string
}

interface ModelGroupDef {
  group: string
  models: ModelSpec[]
}

const MODEL_GROUPS: ModelGroupDef[] = [
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
  {
    group: 'Perplexity',
    models: [
      { provider: 'perplexity', model: 'sonar', label: 'Sonar' },
      { provider: 'perplexity', model: 'sonar-pro', label: 'Sonar Pro' },
    ],
  },
  {
    group: 'Gemini',
    models: [
      { provider: 'google', model: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
      { provider: 'google', model: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { provider: 'google', model: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
  {
    group: 'Groq',
    models: [
      { provider: 'groq', model: 'groq/llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { provider: 'groq', model: 'groq/llama-3.1-8b-instant', label: 'Llama 3.1 8B (fast)' },
      { provider: 'groq', model: 'groq/mixtral-8x7b-32768', label: 'Mixtral 8×7B' },
    ],
  },
  {
    group: 'Cohere',
    models: [
      { provider: 'cohere', model: 'cohere/command-r-plus', label: 'Command R+' },
      { provider: 'cohere', model: 'cohere/command-r', label: 'Command R' },
    ],
  },
  {
    group: 'DeepSeek ⚠',
    models: [
      {
        provider: 'deepseek',
        model: 'deepseek-chat',
        label: 'DeepSeek Chat',
        caution: 'Data routed to DeepSeek servers (CN). Do not use with client-identifiable information.',
      },
      {
        provider: 'deepseek',
        model: 'deepseek-reasoner',
        label: 'DeepSeek Reasoner',
        caution: 'Data routed to DeepSeek servers (CN). Do not use with client-identifiable information.',
      },
    ],
  },
  {
    group: 'Local / Open (via OpenRouter)',
    models: [
      { provider: 'openrouter', model: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (free)' },
      { provider: 'openrouter', model: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (free)' },
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

  const [customProvider, setCustomProvider] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [customLabel, setCustomLabel] = useState('')

  const toggle = (m: ModelSpec) => {
    const key = modelKey(m)
    if (selectedKeys.has(key)) {
      onChange(selected.filter((s) => modelKey(s) !== key))
    } else {
      onChange([...selected, m])
    }
  }

  const allBuiltInModels = MODEL_GROUPS.flatMap((g) => g.models)
  const selectAll = () => onChange(allBuiltInModels.filter((m) => !m.caution))
  const clearAll = () => onChange([])

  const addCustom = () => {
    const p = customProvider.trim()
    const m = customModel.trim()
    if (!p || !m) return
    const spec: ModelSpec = { provider: p, model: m, label: customLabel.trim() || `${p}/${m}` }
    if (!selectedKeys.has(modelKey(spec))) {
      onChange([...selected, spec])
    }
    setCustomProvider('')
    setCustomModel('')
    setCustomLabel('')
  }

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
            Select safe models
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
                <div key={key}>
                  <button
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
                    {m.caution && (
                      <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                    )}
                  </button>
                  {m.caution && checked && (
                    <p className="text-xs text-amber-400/80 mt-0.5 ml-7 leading-snug">
                      ⚠ {m.caution}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Custom model entry */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Custom / Local</p>
        <div className="space-y-1">
          <input
            type="text"
            value={customProvider}
            onChange={(e) => setCustomProvider(e.target.value)}
            placeholder="Provider (e.g. openrouter)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="Model ID (e.g. ollama/llama3)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Label (optional)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customProvider.trim() || !customModel.trim()}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <PlusCircle size={12} />
            Add custom model
          </button>
        </div>
      </div>

      {/* Selected custom models (not in built-in list) */}
      {selected.some((s) => !allBuiltInModels.some((m) => modelKey(m) === modelKey(s))) && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Added</p>
          <div className="space-y-1">
            {selected
              .filter((s) => !allBuiltInModels.some((m) => modelKey(m) === modelKey(s)))
              .map((s) => (
                <div key={modelKey(s)} className="flex items-center gap-2 px-3 py-1.5 rounded text-sm bg-indigo-900/50 text-indigo-200 border border-indigo-700">
                  <span className="flex-1 truncate">{s.label}</span>
                  <span className="text-xs font-mono text-gray-500 truncate max-w-[8rem]">{s.model}</span>
                  <button
                    type="button"
                    onClick={() => onChange(selected.filter((x) => modelKey(x) !== modelKey(s)))}
                    className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <p className="text-xs text-gray-500">
          {selected.length} model{selected.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}
