/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  model: string;
  provider: string;
  prompt: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface Document {
  id: string;
  title: string;
  versions: DocumentVersion[];
  createdAt: string;
  updatedAt: string;
}

const store = new Map<string, Document>();

export function createDocument(id: string, title: string): Document {
  const now = new Date().toISOString();
  const doc: Document = { id, title, versions: [], createdAt: now, updatedAt: now };
  store.set(id, doc);
  return doc;
}

export function getDocument(id: string): Document | undefined {
  return store.get(id);
}

export function listDocuments(): Document[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function addVersion(
  documentId: string,
  version: DocumentVersion,
): DocumentVersion | null {
  const doc = store.get(documentId);
  if (!doc) return null;
  doc.versions.push(version);
  doc.updatedAt = new Date().toISOString();
  return version;
}

export function getVersions(documentId: string): DocumentVersion[] | null {
  const doc = store.get(documentId);
  if (!doc) return null;
  return doc.versions;
}

export function deleteDocument(id: string): boolean {
  return store.delete(id);
}
