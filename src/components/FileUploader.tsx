import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, X, CheckCircle, FileSpreadsheet } from 'lucide-react';
import type { DatasetFile } from '../types';

interface FileUploaderProps {
  selectedFile: DatasetFile | null;
  onFileSelect: (file: DatasetFile) => void;
  onFileRemove: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  selectedFile,
  onFileSelect,
  onFileRemove,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['csv', 'pdf', 'xls', 'xlsx', 'json'];
  const maxFileSizeMB = 50;

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(extension)) {
      setErrorMessage(`Invalid file format (.${extension}). Supported formats: CSV, PDF, XLS, XLSX, JSON.`);
      return;
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setErrorMessage(`File size exceeds the ${maxFileSizeMB}MB limit.`);
      return;
    }

    const newDatasetFile: DatasetFile = {
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      extension,
      uploadProgress: 0,
      status: 'uploading',
      approved: false,
    };

    onFileSelect(newDatasetFile);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        newDatasetFile.uploadProgress = 100;
        newDatasetFile.status = 'success';
        onFileSelect({ ...newDatasetFile });
      } else {
        newDatasetFile.uploadProgress = progress;
        onFileSelect({ ...newDatasetFile });
      }
    }, 150);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 bg-white shadow-sm'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.pdf,.xls,.xlsx,.json"
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Drag and drop your dataset here
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Supports CSV, PDF, XLS, XLSX, and JSON files up to {maxFileSizeMB}MB
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20"
          >
            Browse Files
          </button>
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700 text-xs max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-space space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 break-all">{selectedFile.name}</h4>
                <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                  <span className="uppercase bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px]">
                    {selectedFile.extension}
                  </span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span className="flex items-center space-x-1 text-emerald-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Uploaded Successfully</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onFileRemove}
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
              title="Remove File"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedFile.status === 'uploading' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Ingesting file locally...</span>
                <span>{selectedFile.uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-150"
                  style={{ width: `${selectedFile.uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
