/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useEffect } from 'react'
import { CheckCircle, Eye } from 'lucide-react'
import type { WorkflowStageResult } from '../lib/api'

function providerBadgeClass(provider: string) {
  if (provider === 'openai') return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
  if (provider === 'anthropic') return 'bg-orange-900/50 text-orange-300 border border-orange-700'
  return 'bg-gray-800 text-gray-300 border border-gray-700'
}

export interface WorkflowStagePanelProps {
  stages: WorkflowStageResult[]
  onViewVersion?: (versionId: string) => void
}

interface OutputCardProps {
  output: WorkflowStageResult['outputs'][number]
  onView: () => void
}

function OutputCard({ output, onView }: OutputCardProps) {
  const preview = output.content.slice(0, 100)
  return (
    <div
      className={`rounded border p-2.5 space-y-1.5 ${
        output.isError
          ? 'border-red-800 bg-red-950/30'
          : 'border-gray-700 bg-gray-900'
      }`}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${providerBadgeClass(output.provider)}`}
        >
          {output.provider}
        </span>
        <span className="text-xs font-mono text-gray-400 truncate max-w-[10rem]">{output.model}</span>
        {output.persona && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-900/50 text-violet-300 border border-violet-700">
            {output.persona}
          </span>
        )}
      </div>
      {output.isError ? (
        <p className="text-xs text-red-400">{output.error ?? 'Error'}</p>
      ) : (
        <p className="text-xs text-gray-400 leading-snug">
          {preview}
          {output.content.length > 100 && '…'}
        </p>
      )}
      {!output.isError && (
        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <Eye size={11} /> View
        </button>
      )}
    </div>
  )
}

export default function WorkflowStagePanel({ stages, onViewVersion }: WorkflowStagePanelProps) {
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (stages.length > 0) {
      setExpandedStages(new Set([stages.length - 1]))
    }
  }, [stages.length])

  if (stages.length === 0) return null

  const toggleStage = (idx: number) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Workflow Stages
      </p>
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gray-700" />

        <div className="space-y-3">
          {stages.map((stage) => {
            const isExpanded = expandedStages.has(stage.index)
            const hasErrors = stage.outputs.some((o) => o.isError)
            return (
              <div key={stage.index} className="relative pl-9">
                {/* Stage indicator dot */}
                <div className="absolute left-0 top-2.5 w-7 h-7 rounded-full bg-gray-800 border-2 border-indigo-500 flex items-center justify-center z-10">
                  <CheckCircle size={14} className="text-indigo-400" />
                </div>

                {/* Stage header */}
                <button
                  type="button"
                  onClick={() => toggleStage(stage.index)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-200">
                      Stage {stage.index + 1}: {stage.name}
                    </span>
                    {hasErrors && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-400 border border-red-800">
                        errors
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {stage.outputs.length} output{stage.outputs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">{isExpanded ? '▲' : '▼'}</span>
                </button>

                <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>

                {isExpanded && (
                  <div className="mt-2 space-y-2">
                    {stage.outputs.map((output, oi) => (
                      <OutputCard
                        key={`${output.provider}-${output.model}-${oi}`}
                        output={output}
                        onView={() => onViewVersion?.(`${stage.index}-${oi}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
