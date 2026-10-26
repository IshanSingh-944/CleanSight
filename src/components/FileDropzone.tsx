import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import type { DatasetFile } from '../types';

interface FileDropzoneProps {
  onFileSelect: (file: DatasetFile) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['csv', 'pdf', 'xls', 'xlsx', 'json'];
  const maxFileSizeMB = 50;

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(extension)) {
      setErrorMessage(`Invalid format (.${extension}). Supported: CSV, XLSX, XLS, JSON, PDF.`);
      return;
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds the ${maxFileSizeMB} MB size limit.`);
      return;
    }

    const newDatasetFile: DatasetFile = {
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      extension,
      uploadProgress: 100,
      status: 'success',
      approved: false,
    };

    onFileSelect(newDatasetFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border rounded-lg p-12 text-center cursor-pointer transition-colors bg-white ${
          isDragging
            ? 'border-[#1c1c1a] bg-stone-50'
            : 'border-[#e6e5e0] hover:border-stone-400'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.pdf,.xls,.xlsx,.json"
          className="hidden"
        />
        <div className="w-10 h-10 rounded border border-[#e6e5e0] bg-[#f7f6f3] text-stone-700 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-4 h-4" />
        </div>
        <p className="text-sm font-medium text-[#1c1c1a] mb-1">
          Drop a file here or browse files
        </p>
        <p className="text-xs text-stone-500">
          CSV, XLSX, XLS, JSON or PDF · Maximum 50 MB
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
