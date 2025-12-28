/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { uploadLibraryDocument, LibraryLocation } from '@/lib/library-api';

interface UploadDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locations: LibraryLocation[];
}

export function UploadDocumentDialog({
  isOpen,
  onClose,
  onSuccess,
  locations,
}: UploadDocumentDialogProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other'>('other');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        // Auto-fill title from filename
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!selectedLocation) {
      setError('Please select a storage location');
      return;
    }

    setLoading(true);

    try {
      await uploadLibraryDocument({
        locationId: selectedLocation,
        file,
        title,
        description: description || undefined,
        sourceType,
      });

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setSourceType('other');
      setSelectedLocation('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-primary-dark border border-gray-600 rounded-lg w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-600">
            <h2 className="text-xl font-bold text-warm-white">Upload Document</h2>
            <button
              onClick={onClose}
              className="text-warm-white/70 hover:text-warm-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Storage Location */}
            <div>
              <label className="block text-sm font-medium text-warm-white mb-1">
                Storage Location
              </label>
              <select
                required
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
              >
                <option value="">Select a location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-warm-white mb-1">
                Document File
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-aqua transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.rtf,.xlsx,.xls,.csv,.html,.htm,.json,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center gap-2 text-warm-white">
                    <FileText className="h-5 w-5 text-aqua" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-warm-white/50">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-warm-white/70">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Click to select file</span>
                    <span className="text-xs">PDF, DOCX, TXT, and more</span>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-warm-white mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                placeholder="Document title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-warm-white mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                placeholder="Brief description of the document"
              />
            </div>

            {/* Source Type */}
            <div>
              <label className="block text-sm font-medium text-warm-white mb-1">
                Document Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
              >
                <option value="rule">Rule</option>
                <option value="standing-order">Standing Order</option>
                <option value="template">Template</option>
                <option value="playbook">Playbook</option>
                <option value="case-law">Case Law</option>
                <option value="statute">Statute</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-alert-red/10 border border-alert-red rounded text-sm text-alert-red flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-navy border border-gray-600 rounded-lg text-warm-white hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="flex-1 px-4 py-2 bg-aqua text-primary-dark rounded-lg font-medium hover:bg-light-green transition-colors disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

