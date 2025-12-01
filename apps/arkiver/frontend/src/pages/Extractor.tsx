/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, Clock, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadFile, processFile, getJobStatus } from '../lib/arkiver-api';

interface UploadedFile {
  file: File;
  fileId?: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  progress?: number;
  error?: string;
}

export default function Extractor() {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [extractionMode, setExtractionMode] = useState<'standard' | 'deep' | 'fast'>('standard');
  const [enableOCR, setEnableOCR] = useState(false);
  const [extractCitations, setExtractCitations] = useState(true);
  const [extractEntities, setExtractEntities] = useState(true);
  const [extractTimeline, setExtractTimeline] = useState(true);
  const [useLLM, setUseLLM] = useState(false);
  const [llmProvider, setLlmProvider] = useState<'perplexity' | 'anthropic' | 'openai'>('perplexity');
  const [insightType, setInsightType] = useState<'general' | 'legal' | 'medical' | 'business'>('general');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: UploadedFile[] = Array.from(e.target.files).map((file: File) => ({
        file,
        status: 'uploading' as const,
      }));
      setFiles(prev => [...prev, ...newFiles]);
      
      // Upload files
      newFiles.forEach(async (uploadedFile, index) => {
        const result = await uploadFile(uploadedFile.file);
        if (result.success && result.fileId) {
          setFiles(prev => prev.map((f, i) => 
            i === prev.length - newFiles.length + index
              ? { ...f, fileId: result.fileId!, status: 'uploaded' as const }
              : f
          ));
        } else {
          setFiles(prev => prev.map((f, i) => 
            i === prev.length - newFiles.length + index
              ? { ...f, status: 'failed' as const, error: result.error?.message || 'Upload failed' }
              : f
          ));
        }
      });
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processMutation = useMutation({
    mutationFn: async (uploadedFile: UploadedFile) => {
      if (!uploadedFile.fileId) throw new Error('File not uploaded');
      
      const result = await processFile(uploadedFile.fileId, {
        extractionMode,
        enableOCR,
        extractCitations,
        extractEntities,
        extractTimeline,
        useLLM: useLLM || extractionMode === 'deep',
        llmProvider,
        insightType,
      });
      
      if (!result.success || !result.jobId) {
        throw new Error(result.error?.message || 'Processing failed');
      }
      
      return { ...uploadedFile, jobId: result.jobId, status: 'processing' as const };
    },
    onSuccess: (updatedFile, originalFile) => {
      setFiles(prev => prev.map(f => f === originalFile ? updatedFile : f));
      
      // Poll for job status
      if (updatedFile.jobId) {
        const pollInterval = setInterval(async () => {
          const status = await getJobStatus(updatedFile.jobId!);
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setFiles(prev => prev.map(f => 
              f.jobId === updatedFile.jobId ? { ...f, status: 'completed' as const, progress: 100 } : f
            ));
            queryClient.invalidateQueries({ queryKey: ['insights'] });
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setFiles(prev => prev.map(f => 
              f.jobId === updatedFile.jobId 
                ? { ...f, status: 'failed' as const, error: status.error?.message || 'Processing failed' }
                : f
            ));
          } else {
            setFiles(prev => prev.map(f => 
              f.jobId === updatedFile.jobId ? { ...f, progress: status.progress } : f
            ));
          }
        }, 3000);
        
        // Cleanup after 10 minutes
        setTimeout(() => clearInterval(pollInterval), 600000);
      }
    },
    onError: (error, uploadedFile) => {
      setFiles(prev => prev.map(f => 
        f === uploadedFile 
          ? { ...f, status: 'failed' as const, error: error instanceof Error ? error.message : 'Processing failed' }
          : f
      ));
    },
  });

  const handleProcess = useCallback(async () => {
    const uploadedFiles = files.filter(f => f.status === 'uploaded');
    for (const file of uploadedFiles) {
      processMutation.mutate(file);
    }
  }, [files, processMutation]);

  const uploadedCount = files.filter(f => f.status === 'uploaded' || f.status === 'processing' || f.status === 'completed').length;
  const processingCount = files.filter(f => f.status === 'processing').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const canProcess = uploadedCount > 0 && processingCount === 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C3E50' }}>Document Extractor</h1>
          <p style={{ color: '#5B8FA3' }}>Upload and process documents for insight extraction</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="w-5 h-5" style={{ color: '#D89B6A' }} />
            <h2 className="text-xl font-bold" style={{ color: '#2C3E50' }}>Extraction Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extraction Mode
              </label>
              <select
                value={extractionMode}
                onChange={(e) => setExtractionMode(e.target.value as 'standard' | 'deep' | 'fast')}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fast">Fast - Quick extraction</option>
                <option value="standard">Standard - Balanced extraction</option>
                <option value="deep">Deep - Comprehensive extraction</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={enableOCR}
                  onChange={(e) => setEnableOCR(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Enable OCR</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={extractCitations}
                  onChange={(e) => setExtractCitations(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Extract Citations</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={extractEntities}
                  onChange={(e) => setExtractEntities(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Extract Entities</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={extractTimeline}
                  onChange={(e) => setExtractTimeline(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Extract Timeline</span>
              </label>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#2C3E50' }}>AI-Powered Extraction</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useLLM || extractionMode === 'deep'}
                    onChange={(e) => setUseLLM(e.target.checked)}
                    disabled={extractionMode === 'deep'}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Use LLM for intelligent extraction {extractionMode === 'deep' && '(enabled in deep mode)'}
                  </span>
                </label>
                {(useLLM || extractionMode === 'deep') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AI Provider
                      </label>
                      <select
                        value={llmProvider}
                        onChange={(e) => setLlmProvider(e.target.value as 'perplexity' | 'anthropic' | 'openai')}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="perplexity">Perplexity</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="openai">OpenAI (GPT-4)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insight Type
                      </label>
                      <select
                        value={insightType}
                        onChange={(e) => setInsightType(e.target.value as 'general' | 'legal' | 'medical' | 'business')}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General</option>
                        <option value="legal">Legal</option>
                        <option value="medical">Medical</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2C3E50' }}>Upload Files</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: '#D89B6A' }} />
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.docx,.txt,.eml,.json,.png,.jpg,.jpeg,.tiff,.csv,.xlsx,.xls"
              />
              <span className="text-blue-600 hover:text-blue-700 font-semibold">
                Click to upload or drag and drop
              </span>
              <p className="text-sm text-gray-600 mt-2">
                PDF, DOCX, TXT, EML, JSON, CSV, Excel, Images (for OCR) supported
              </p>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              {files.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-5 h-5 flex-shrink-0" style={{ color: '#D89B6A' }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: '#2C3E50' }}>{uploadedFile.file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{(uploadedFile.file.size / 1024).toFixed(2)} KB</span>
                        {uploadedFile.status === 'uploading' && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-spin" />
                            Uploading...
                          </span>
                        )}
                        {uploadedFile.status === 'processing' && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-spin" />
                            Processing... {uploadedFile.progress ? `${uploadedFile.progress}%` : ''}
                          </span>
                        )}
                        {uploadedFile.status === 'completed' && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                        {uploadedFile.status === 'failed' && (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            {uploadedFile.error || 'Failed'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-600 hover:text-red-700 ml-4 flex-shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={!canProcess || processMutation.isPending}
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          style={{ backgroundColor: '#D89B6A' }}
        >
          {processMutation.isPending || processingCount > 0 ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              Processing {processingCount > 0 ? `${processingCount} ` : ''}File{processingCount !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Process {uploadedCount > 0 ? `${uploadedCount} ` : ''}File{uploadedCount !== 1 ? 's' : ''}
            </>
          )}
        </button>

        {files.length > 0 && (
          <div className="mt-4 text-sm text-center" style={{ color: '#5B8FA3' }}>
            {completedCount > 0 && <span className="text-green-600">{completedCount} completed</span>}
            {completedCount > 0 && processingCount > 0 && <span className="mx-2">•</span>}
            {processingCount > 0 && <span style={{ color: '#5B8FA3' }}>{processingCount} processing</span>}
          </div>
        )}
      </div>
    </div>
  );
}
