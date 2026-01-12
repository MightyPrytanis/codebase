/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { X, FolderOpen, Cloud, HardDrive, Database } from 'lucide-react';
import { createLibraryLocation, LibraryLocation } from '@/lib/library-api';

interface AddLocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (location: LibraryLocation) => void;
}

export function AddLocationDialog({ isOpen, onClose, onSuccess }: AddLocationDialogProps) {
  const [locationType, setLocationType] = useState<'local' | 'onedrive' | 'gdrive' | 's3'>('local');
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OAuth/credentials fields (conditional based on type)
  const [credentials, setCredentials] = useState<Record<string, any>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const location = await createLibraryLocation({
        type: locationType,
        name,
        path,
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      });

      onSuccess(location);
      // Reset form
      setName('');
      setPath('');
      setCredentials({});
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
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
            <h2 className="text-xl font-bold text-warm-white">Add Storage Location</h2>
            <button
              onClick={onClose}
              className="text-warm-white/70 hover:text-warm-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Location Type */}
            <div>
              <label className="block text-sm font-medium text-warm-white mb-2">
                Storage Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType('local')}
                  className={`p-3 border rounded-lg transition-colors flex flex-col items-center gap-2 ${
                    locationType === 'local'
                      ? 'border-aqua bg-aqua/10 text-aqua'
                      : 'border-gray-600 text-warm-white/70 hover:border-gray-500'
                  }`}
                >
                  <HardDrive className="h-5 w-5" />
                  <span className="text-xs">Local</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('onedrive')}
                  className={`p-3 border rounded-lg transition-colors flex flex-col items-center gap-2 ${
                    locationType === 'onedrive'
                      ? 'border-aqua bg-aqua/10 text-aqua'
                      : 'border-gray-600 text-warm-white/70 hover:border-gray-500'
                  }`}
                >
                  <Cloud className="h-5 w-5" />
                  <span className="text-xs">OneDrive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('gdrive')}
                  className={`p-3 border rounded-lg transition-colors flex flex-col items-center gap-2 ${
                    locationType === 'gdrive'
                      ? 'border-aqua bg-aqua/10 text-aqua'
                      : 'border-gray-600 text-warm-white/70 hover:border-gray-500'
                  }`}
                >
                  <Database className="h-5 w-5" />
                  <span className="text-xs">Google Drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('s3')}
                  className={`p-3 border rounded-lg transition-colors flex flex-col items-center gap-2 ${
                    locationType === 's3'
                      ? 'border-aqua bg-aqua/10 text-aqua'
                      : 'border-gray-600 text-warm-white/70 hover:border-gray-500'
                  }`}
                >
                  <Cloud className="h-5 w-5" />
                  <span className="text-xs">S3</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-warm-white mb-1">
                Location Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                placeholder="e.g., My Documents, Work OneDrive"
              />
            </div>

            {/* Path */}
            <div>
              <label className="block text-sm font-medium text-warm-white mb-1">
                {locationType === 'local' ? 'Directory Path' : locationType === 's3' ? 'Bucket/Prefix' : 'Folder Path'}
              </label>
              <input
                type="text"
                required
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="w-full bg-navy border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                placeholder={
                  locationType === 'local'
                    ? '/path/to/directory'
                    : locationType === 's3'
                    ? 'bucket-name/path/to/folder'
                    : 'Folder path or ID'
                }
              />
            </div>

            {/* Credentials (for cloud storage) */}
            {locationType !== 'local' && (
              <div className="p-3 bg-navy/50 border border-gray-600 rounded text-sm text-warm-white/70">
                <p className="mb-2">Authentication required:</p>
                {locationType === 'onedrive' && (
                  <p>You will be redirected to Microsoft to authenticate with OneDrive.</p>
                )}
                {locationType === 'gdrive' && (
                  <p>You will be redirected to Google to authenticate with Google Drive.</p>
                )}
                {locationType === 's3' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Access Key ID"
                      value={credentials.accessKeyId || ''}
                      onChange={(e) => setCredentials({ ...credentials, accessKeyId: e.target.value })}
                      className="w-full bg-charcoal border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                    />
                    <input
                      type="password"
                      placeholder="Secret Access Key"
                      value={credentials.secretAccessKey || ''}
                      onChange={(e) => setCredentials({ ...credentials, secretAccessKey: e.target.value })}
                      className="w-full bg-charcoal border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                    />
                    <input
                      type="text"
                      placeholder="Region (e.g., us-east-1)"
                      value={credentials.region || ''}
                      onChange={(e) => setCredentials({ ...credentials, region: e.target.value })}
                      className="w-full bg-charcoal border border-gray-600 rounded px-3 py-2 text-sm text-warm-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-alert-red/10 border border-alert-red rounded text-sm text-alert-red">
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
                disabled={loading}
                className="flex-1 px-4 py-2 bg-aqua text-primary-dark rounded-lg font-medium hover:bg-light-green transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Location'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

}
}
}
}