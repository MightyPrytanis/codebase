/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Eye, X, GitCompare, Clock } from 'lucide-react'
import type { DocumentVersion } from '../lib/api'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function providerBadgeClass(provider: string) {
  if (provider === 'openai') return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
  if (provider === 'anthropic') return 'bg-orange-900/50 text-orange-300 border border-orange-700'
  return 'bg-gray-800 text-gray-300 border border-gray-700'
}

interface VersionCardProps {
  version: DocumentVersion
  isSelected: boolean
  onSelect: () => void
  onView: () => void
}

function VersionCard({ version, isSelected, onSelect, onView }: VersionCardProps) {
  const preview = version.content.slice(0, 200)
  return (
    <div
      className={`rounded-lg border p-4 space-y-2 transition-colors ${
        isSelected
          ? 'border-indigo-600 bg-indigo-950/30'
          : 'border-gray-700 bg-gray-900 hover:border-gray-600'
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${providerBadgeClass(version.provider)}`}>
          {version.provider}
        </span>
        <span className="text-sm font-mono text-gray-300">{version.model}</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
          <Clock size={11} />
          {formatTime(version.timestamp)}
        </span>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
        {preview}
        {version.content.length > 200 && '…'}
      </p>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-1 text-xs px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <Eye size={12} /> View
        </button>
        <button
          type="button"
          onClick={onSelect}
          className={`flex items-center gap-1 text-xs px-3 py-1 rounded transition-colors ${
            isSelected
              ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <GitCompare size={12} /> {isSelected ? 'Deselect' : 'Compare'}
        </button>
      </div>
    </div>
  )
}

function DiffView({ a, b }: { a: DocumentVersion; b: DocumentVersion }) {
  const aLines = a.content.split('\n')
  const bLines = b.content.split('\n')
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className={`text-xs px-2 py-1 rounded-t font-medium ${providerBadgeClass(a.provider)}`}>
          {a.provider} / {a.model}
        </div>
        <pre className="text-xs text-gray-300 bg-gray-900 border border-gray-700 rounded-b p-3 overflow-auto max-h-96 whitespace-pre-wrap">
          {aLines.map((line, i) => {
            const different = line !== (bLines[i] ?? '')
            return (
              <span key={i} className={different ? 'bg-yellow-900/40 block' : 'block'}>
                {line}
              </span>
            )
          })}
        </pre>
      </div>
      <div>
        <div className={`text-xs px-2 py-1 rounded-t font-medium ${providerBadgeClass(b.provider)}`}>
          {b.provider} / {b.model}
        </div>
        <pre className="text-xs text-gray-300 bg-gray-900 border border-gray-700 rounded-b p-3 overflow-auto max-h-96 whitespace-pre-wrap">
          {bLines.map((line, i) => {
            const different = line !== (aLines[i] ?? '')
            return (
              <span key={i} className={different ? 'bg-yellow-900/40 block' : 'block'}>
                {line}
              </span>
            )
          })}
        </pre>
      </div>
    </div>
  )
}

interface VersionPanelProps {
  versions: DocumentVersion[]
}

export default function VersionPanel({ versions }: VersionPanelProps) {
  const [viewVersion, setViewVersion] = useState<DocumentVersion | null>(null)
  const [compareSelection, setCompareSelection] = useState<string[]>([])

  const toggleCompare = (id: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  const compareVersions =
    compareSelection.length === 2
      ? [
          versions.find((v) => v.id === compareSelection[0]),
          versions.find((v) => v.id === compareSelection[1]),
        ]
      : []

  if (versions.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        No versions yet — generate some with the panel on the left.
      </div>
    )
  }

  return (
    <>
      <Tabs.Root defaultValue="all" className="flex flex-col gap-4">
        <Tabs.List className="flex gap-1 border-b border-gray-800 pb-0">
          <Tabs.Trigger
            value="all"
            className="px-4 py-2 text-sm text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 transition-colors"
          >
            All Versions ({versions.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="compare"
            className="px-4 py-2 text-sm text-gray-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 transition-colors"
          >
            Compare {compareSelection.length > 0 ? `(${compareSelection.length}/2)` : ''}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="all" className="space-y-3">
          {versions.map((v) => (
            <VersionCard
              key={v.id}
              version={v}
              isSelected={compareSelection.includes(v.id)}
              onSelect={() => toggleCompare(v.id)}
              onView={() => setViewVersion(v)}
            />
          ))}
        </Tabs.Content>

        <Tabs.Content value="compare">
          {compareSelection.length < 2 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Select 2 versions from the "All Versions" tab to compare them side by side.
            </p>
          ) : compareVersions[0] && compareVersions[1] ? (
            <DiffView a={compareVersions[0]} b={compareVersions[1]} />
          ) : null}
        </Tabs.Content>
      </Tabs.Root>

      {/* Full version dialog */}
      <Dialog.Root open={!!viewVersion} onOpenChange={(open) => !open && setViewVersion(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-40" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,800px)] max-h-[80vh] flex flex-col bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                {viewVersion && (
                  <>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${providerBadgeClass(viewVersion.provider)}`}>
                      {viewVersion.provider}
                    </span>
                    <span className="text-sm font-mono text-gray-300">{viewVersion.model}</span>
                    <span className="text-xs text-gray-500">{viewVersion && formatTime(viewVersion.timestamp)}</span>
                  </>
                )}
              </div>
              <Dialog.Close asChild>
                <button type="button" className="text-gray-500 hover:text-gray-300 transition-colors">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>
            <div className="overflow-auto p-5 flex-1">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">
                {viewVersion?.content}
              </pre>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
