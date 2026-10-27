import React from 'react';
import type { DatasetFile } from '../types';

interface SelectedFileRowProps {
  selectedFile: DatasetFile;
  onApprove: () => void;
  onRemove: () => void;
}

export const SelectedFileRow: React.FC<SelectedFileRowProps> = ({
  selectedFile,
  onApprove,
  onRemove,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white border border-[#E1E5E3] rounded-lg p-6 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#E1E5E3] pb-4">
        <div>
          <span className="text-xs font-mono uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
            .{selectedFile.extension}
          </span>
          <h3 className="text-sm font-semibold text-[#252A2E] mt-2 truncate max-w-lg" title={selectedFile.name}>
            {selectedFile.name}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-[#69747D] font-mono">{formatFileSize(selectedFile.size)}</span>
        </div>
      </div>

      <div className="text-xs text-[#252A2E] bg-[#F7F7F4] border border-[#E1E5E3] p-3.5 rounded font-medium flex items-center justify-between">
        <span>File staged successfully. Click "Run Profiler & AI Plan" to analyze data quality.</span>
        <span className="text-[10px] font-mono text-[#2868A6] uppercase">Ready</span>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          onClick={onRemove}
          className="px-4 py-2 rounded border border-[#E1E5E3] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors shadow-xs"
        >
          Remove file
        </button>
        <button
          onClick={onApprove}
          className="px-5 py-2 rounded bg-[#2868A6] hover:bg-[#1f5282] text-white text-xs font-semibold transition-colors shadow-xs"
        >
          Run Profiler & AI Plan
        </button>
      </div>
    </div>
  );
};
