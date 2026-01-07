/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link as LinkIcon, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { potemkinService } from '../services/potemkinService';
import { useQueryClient } from '@tanstack/react-query';

export default function DocumentUpload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'url' | 'paste'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleVerify = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let result;
      
      if (uploadType === 'file' && file) {
        result = await potemkinService.verifyDocument(file);
      } else if (uploadType === 'url') {
        if (!content.trim()) {
          throw new Error('Please enter a URL');
        }
        result = await potemkinService.verifyUrl(content);
      } else if (uploadType === 'paste') {
        if (!content.trim()) {
          throw new Error('Please paste content to verify');
        }
        result = await potemkinService.verifyContent(content);
      } else {
        throw new Error('Please provide a file, URL, or content to verify');
      }

      // Store result in query cache
      queryClient.setQueryData(['verification-results'], (old: any[]) => {
        return [...(old || []), { ...result, timestamp: new Date().toISOString() }];
      });

      navigate('/results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-warm-white mb-2">Document Verification</h1>
        <p className="text-warm-white/70">Upload documents, URLs, or paste content for verification</p>
      </div>

      {/* Upload Type Selector */}
      <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setUploadType('file')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              uploadType === 'file'
                ? 'bg-accent-gold text-charcoal'
                : 'bg-gray-700 text-warm-white/70 hover:text-warm-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            onClick={() => setUploadType('url')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              uploadType === 'url'
                ? 'bg-accent-gold text-charcoal'
                : 'bg-gray-700 text-warm-white/70 hover:text-warm-white'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Enter URL
          </button>
          <button
            onClick={() => setUploadType('paste')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              uploadType === 'paste'
                ? 'bg-accent-gold text-charcoal'
                : 'bg-gray-700 text-warm-white/70 hover:text-warm-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste Content
          </button>
        </div>

        {uploadType === 'file' && (
          <div className="space-y-4">
            <label className="block">
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-accent-gold transition-colors">
                {file ? (
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-accent-gold" />
                    <p className="text-warm-white">{file.name}</p>
                    <p className="text-sm text-warm-white/50">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-warm-white/50" />
                    <p className="text-warm-white/70">Click to select a file</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.md"
                />
              </div>
            </label>
          </div>
        )}

        {uploadType === 'url' && (
          <div className="space-y-4">
            <input
              type="url"
              placeholder="https://example.com/article"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-2 bg-primary-dark border border-gray-700 rounded-lg text-warm-white placeholder-warm-white/50 focus:outline-none focus:ring-2 focus:ring-accent-gold"
            />
          </div>
        )}

        {uploadType === 'paste' && (
          <div className="space-y-4">
            <textarea
              placeholder="Paste content to verify..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError(null);
              }}
              rows={12}
              className="w-full px-4 py-2 bg-primary-dark border border-gray-700 rounded-lg text-warm-white placeholder-warm-white/50 focus:outline-none focus:ring-2 focus:ring-accent-gold font-mono text-sm"
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-alert-red/10 border border-alert-red/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-alert-red flex-shrink-0 mt-0.5" />
            <p className="text-alert-red">{error}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={isProcessing || (uploadType === 'file' && !file) || (uploadType !== 'file' && !content.trim())}
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-gold hover:bg-accent-gold/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-charcoal font-semibold rounded-lg transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Verify Document
            </>
          )}
        </button>
      </div>
    </div>
  );
}
