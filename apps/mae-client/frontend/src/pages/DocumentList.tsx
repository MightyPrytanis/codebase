/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { FilePlus, FileText, Trash2, X, AlertCircle } from 'lucide-react'
import { listDocuments, createDocument, deleteDocument } from '../lib/api'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function DocumentList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [newTitle, setNewTitle] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const { data: docs = [], isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
  })

  const createMutation = useMutation({
    mutationFn: () => createDocument(newTitle.trim()),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setDialogOpen(false)
      setNewTitle('')
      setCreateError(null)
      navigate(`/documents/${doc.id}`)
    },
    onError: (err: Error) => setCreateError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Documents</h2>

        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              <FilePlus size={15} /> New Document
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70 z-40" />
            <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,420px)] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-base font-semibold">New Document</Dialog.Title>
                <Dialog.Close asChild>
                  <button type="button" className="text-gray-500 hover:text-gray-300 transition-colors">
                    <X size={16} />
                  </button>
                </Dialog.Close>
              </div>

              <div className="space-y-2">
                <label htmlFor="doc-title" className="text-sm text-gray-400">
                  Title
                </label>
                <input
                  id="doc-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && newTitle.trim() && createMutation.mutate()}
                  placeholder="e.g. Draft motion to compel"
                  autoFocus
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {createError && (
                <div className="flex gap-2 text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-lg p-2">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  disabled={!newTitle.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {isLoading && (
        <p className="text-gray-500 text-sm">Loading…</p>
      )}

      {error && (
        <div className="flex gap-2 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg p-3">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error instanceof Error ? error.message : 'Failed to load documents'}
        </div>
      )}

      {!isLoading && docs.length === 0 && (
        <div className="text-center py-16 text-gray-600 space-y-2">
          <FileText size={32} className="mx-auto opacity-30" />
          <p className="text-sm">No documents yet. Create one to get started.</p>
        </div>
      )}

      <div className="space-y-2">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-800 bg-gray-900 hover:border-gray-700 group transition-colors"
          >
            <button
              type="button"
              onClick={() => navigate(`/documents/${doc.id}`)}
              className="flex-1 flex items-center gap-3 text-left min-w-0"
            >
              <FileText size={16} className="text-indigo-400 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-200 truncate">{doc.title}</span>
              <span className="text-xs text-gray-600 flex-shrink-0">
                {doc.versions.length} version{doc.versions.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-600 flex-shrink-0">{timeAgo(doc.updatedAt)}</span>
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(doc.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
              aria-label="Delete document"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
