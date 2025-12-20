import React, { useState } from 'react';
import { potemkinService } from '../services/potemkinService';

interface DocumentUploadProps {
  onVerificationComplete: (result: unknown) => void;
}

/**
 * Document Upload Component
 * 
 * Provides interface for uploading documents, webpages, or pasted content
 * for verification by the Potemkin engine.
 */
export function DocumentUpload({ onVerificationComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'url' | 'paste'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleVerify = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let result;
      
      if (uploadType === 'file' && file) {
        // Upload file and verify
        result = await potemkinService.verifyDocument(file);
      } else if (uploadType === 'url') {
        // Fetch URL content and verify
        result = await potemkinService.verifyUrl(content);
      } else if (uploadType === 'paste') {
        // Verify pasted content
        result = await potemkinService.verifyContent(content);
      } else {
        throw new Error('Please provide a file, URL, or content to verify');
      }

      onVerificationComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="document-upload">
      <h2>Upload Document for Verification</h2>
      
      <div className="upload-type-selector">
        <label>
          <input
            type="radio"
            value="file"
            checked={uploadType === 'file'}
            onChange={(e) => setUploadType(e.target.value as 'file')}
          />
          Upload File
        </label>
        <label>
          <input
            type="radio"
            value="url"
            checked={uploadType === 'url'}
            onChange={(e) => setUploadType(e.target.value as 'url')}
          />
          Enter URL
        </label>
        <label>
          <input
            type="radio"
            value="paste"
            checked={uploadType === 'paste'}
            onChange={(e) => setUploadType(e.target.value as 'paste')}
          />
          Paste Content
        </label>
      </div>

      {uploadType === 'file' && (
        <div className="file-upload">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.md"
          />
          {file && <p>Selected: {file.name}</p>}
        </div>
      )}

      {uploadType === 'url' && (
        <div className="url-input">
          <input
            type="url"
            placeholder="https://example.com/article"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      )}

      {uploadType === 'paste' && (
        <div className="content-input">
          <textarea
            placeholder="Paste content to verify..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
          />
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <button
        onClick={handleVerify}
        disabled={isProcessing || (!file && !content)}
      >
        {isProcessing ? 'Verifying...' : 'Verify Document'}
      </button>
    </div>
  );
}

