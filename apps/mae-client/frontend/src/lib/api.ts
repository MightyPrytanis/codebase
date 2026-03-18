/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

const API_BASE = '/api'

export interface DocumentVersion {
  id: string
  documentId: string
  content: string
  model: string
  provider: string
  prompt: string
  timestamp: string
  metadata: Record<string, unknown>
}

export interface Document {
  id: string
  title: string
  versions: DocumentVersion[]
  createdAt: string
  updatedAt: string
}

export interface GenerateRequest {
  documentId: string
  prompt: string
  models: Array<{ provider: string; model: string }>
  context?: string
}

export interface GenerateResponse {
  versions: DocumentVersion[]
  errors?: Array<{ provider: string; model: string; error: string }>
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const listDocuments = (): Promise<Document[]> =>
  request<Document[]>('/documents')

export const createDocument = (title: string): Promise<Document> =>
  request<Document>('/documents', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })

export const getDocument = (id: string): Promise<Document> =>
  request<Document>(`/documents/${id}`)

export const deleteDocument = (id: string): Promise<void> =>
  request<void>(`/documents/${id}`, { method: 'DELETE' })

export const getVersions = (documentId: string): Promise<DocumentVersion[]> =>
  request<DocumentVersion[]>(`/documents/${documentId}/versions`)

export const addVersion = (
  documentId: string,
  data: Omit<DocumentVersion, 'id' | 'documentId' | 'timestamp'>,
): Promise<DocumentVersion> =>
  request<DocumentVersion>(`/documents/${documentId}/versions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const generateVersions = (data: GenerateRequest): Promise<GenerateResponse> =>
  request<GenerateResponse>('/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
