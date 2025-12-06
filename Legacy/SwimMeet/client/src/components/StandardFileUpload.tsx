import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface StandardFileUploadProps {
  onFilesSelected: (files: FileList) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
}

// Standard HTML5 file upload component - 100% portable
export function StandardFileUpload({ 
  onFilesSelected, 
  maxFiles = 5, 
  maxSizeBytes = 50 * 1024 * 1024,
  disabled = false 
}: StandardFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Validate file count
      if (files.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate file sizes
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxSizeBytes) {
          alert(`File "${files[i].name}" exceeds ${Math.round(maxSizeBytes / 1024 / 1024)}MB limit`);
          return;
        }
      }

      onFilesSelected(files);
    }
    
    // Reset input for re-selection
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        multiple
        accept="*/*"
        onChange={handleFileSelect}
        ref={fileInputRef}
        style={{ display: 'none' }}
        disabled={disabled}
        data-testid="input-file-upload"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: disabled ? '#6b7280' : '#0ea5e9',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px'
        }}
        data-testid="button-upload-files"
      >
        <Upload className="w-4 h-4" />
        Upload Files
      </button>
    </>
  );
}