/**
 * File Upload Component for Arkiver
 * 
 * Drag-and-drop interface with progress tracking
 * Works against HTTP upload endpoint (real or mock)
 * 
 * Created: 2025-11-22
 */

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Upload status
 */
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

/**
 * Uploaded file info
 */
interface UploadedFileInfo {
  file: File;
  status: UploadStatus;
  progress: number;
  fileId?: string;
  jobId?: string;
  error?: string;
}

/**
 * Extraction settings
 */
interface ExtractionSettings {
  extractionMode: 'standard' | 'deep' | 'fast';
  enableOCR: boolean;
  extractEntities: boolean;
  extractCitations: boolean;
  extractTimeline: boolean;
}

/**
 * Component props
 */
interface FileUploadProps {
  uploadEndpoint?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  onUploadComplete?: (fileId: string, jobId: string) => void;
  onError?: (error: string) => void;
}

/**
 * File Upload Component
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  uploadEndpoint = '/api/arkiver/upload',
  maxFileSize = 100 * 1024 * 1024, // 100MB
  allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'message/rfc822',
    'image/png',
    'image/jpeg',
  ],
  onUploadComplete,
  onError,
}) => {
  const [files, setFiles] = useState<UploadedFileInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [settings, setSettings] = useState<ExtractionSettings>({
    extractionMode: 'standard',
    enableOCR: true,
    extractEntities: true,
    extractCitations: true,
    extractTimeline: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle drag events
   */
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  /**
   * Process selected files
   */
  const handleFiles = (selectedFiles: File[]) => {
    const validFiles: UploadedFileInfo[] = [];

    for (const file of selectedFiles) {
      // Validate file size
      if (file.size > maxFileSize) {
        onError?.(`File ${file.name} exceeds maximum size of ${formatFileSize(maxFileSize)}`);
        continue;
      }

      // Validate file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        onError?.(`File type ${file.type} not allowed for ${file.name}`);
        continue;
      }

      validFiles.push({
        file,
        status: 'idle',
        progress: 0,
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      // Start uploading immediately
      validFiles.forEach((fileInfo) => uploadFile(fileInfo));
    }
  };

  /**
   * Upload a file to the server
   */
  const uploadFile = async (fileInfo: UploadedFileInfo) => {
    try {
      // Update status to uploading
      updateFileStatus(fileInfo.file.name, 'uploading', 10);

      // Create form data
      const formData = new FormData();
      formData.append('file', fileInfo.file);
      formData.append('fileName', fileInfo.file.name);
      formData.append('fileType', fileInfo.file.type);
      formData.append('settings', JSON.stringify(settings));

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 50); // 0-50% for upload
          updateFileStatus(fileInfo.file.name, 'uploading', progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          updateFileStatus(fileInfo.file.name, 'processing', 50, response.fileId, response.jobId);
          
          // Start polling job status
          if (response.jobId) {
            pollJobStatus(fileInfo.file.name, response.jobId);
          }
          
          onUploadComplete?.(response.fileId, response.jobId);
        } else {
          const errorMsg = `Upload failed: ${xhr.statusText}`;
          updateFileStatus(fileInfo.file.name, 'error', 0, undefined, undefined, errorMsg);
          onError?.(errorMsg);
        }
      });

      xhr.addEventListener('error', () => {
        const errorMsg = 'Upload failed: Network error';
        updateFileStatus(fileInfo.file.name, 'error', 0, undefined, undefined, errorMsg);
        onError?.(errorMsg);
      });

      xhr.open('POST', uploadEndpoint);
      xhr.send(formData);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown upload error';
      updateFileStatus(fileInfo.file.name, 'error', 0, undefined, undefined, errorMsg);
      onError?.(errorMsg);
    }
  };

  /**
   * Poll job status until completed
   */
  const pollJobStatus = async (fileName: string, jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/arkiver/job-status/${jobId}`);
        const status = await response.json();

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          updateFileStatus(fileName, 'completed', 100);
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          updateFileStatus(fileName, 'error', 0, undefined, undefined, status.error?.message);
        } else if (status.status === 'processing') {
          // Map job progress (0-100) to UI progress (50-100)
          const progress = 50 + Math.round(status.progress / 2);
          updateFileStatus(fileName, 'processing', progress);
        }
      } catch (error) {
        clearInterval(pollInterval);
        const errorMsg = 'Failed to poll job status';
        updateFileStatus(fileName, 'error', 0, undefined, undefined, errorMsg);
      }
    }, 2000); // Poll every 2 seconds
  };

  /**
   * Update file status in state
   */
  const updateFileStatus = (
    fileName: string,
    status: UploadStatus,
    progress: number,
    fileId?: string,
    jobId?: string,
    error?: string
  ) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.file.name === fileName
          ? { ...f, status, progress, fileId, jobId, error }
          : f
      )
    );
  };

  /**
   * Remove a file from the list
   */
  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.file.name !== fileName));
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Upload dropzone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop files here or click to upload
        </p>
        <p className="text-sm text-gray-500">
          Supported: PDF, DOCX, TXT, EML, PNG, JPEG (max {formatFileSize(maxFileSize)})
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Extraction settings */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-3">Extraction Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extraction Mode
            </label>
            <select
              value={settings.extractionMode}
              onChange={(e) =>
                setSettings({ ...settings, extractionMode: e.target.value as any })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="fast">Fast</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep</option>
            </select>
          </div>
          <div className="space-y-2">
            {[
              { key: 'enableOCR', label: 'Enable OCR' },
              { key: 'extractEntities', label: 'Extract Entities' },
              { key: 'extractCitations', label: 'Extract Citations' },
              { key: 'extractTimeline', label: 'Extract Timeline' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings[key as keyof ExtractionSettings] as boolean}
                  onChange={(e) =>
                    setSettings({ ...settings, [key]: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-medium text-gray-700">Uploaded Files</h3>
          {files.map((fileInfo) => (
            <div
              key={fileInfo.file.name}
              className="flex items-center justify-between p-4 bg-white border rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                {getStatusIcon(fileInfo.status)}
                <div className="flex-1">
                  <p className="font-medium text-gray-700">{fileInfo.file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(fileInfo.file.size)}
                    {fileInfo.status === 'error' && fileInfo.error && (
                      <span className="text-red-500 ml-2">• {fileInfo.error}</span>
                    )}
                  </p>
                  {(fileInfo.status === 'uploading' || fileInfo.status === 'processing') && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileInfo.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {fileInfo.status === 'uploading' ? 'Uploading...' : 'Processing...'} {fileInfo.progress}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFile(fileInfo.file.name)}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={fileInfo.status === 'uploading' || fileInfo.status === 'processing'}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

}
}
}
}
)
}
}
)
}
)
}
)