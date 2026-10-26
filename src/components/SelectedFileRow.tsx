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
    <div className="bg-white border border-[#e6e5e0] rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#e6e5e0] pb-4">
        <div>
          <span className="text-xs font-mono uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
            .{selectedFile.extension}
          </span>
          <h3 className="text-sm font-semibold text-[#1c1c1a] mt-2 truncate max-w-lg" title={selectedFile.name}>
            {selectedFile.name}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-stone-500 font-mono">{formatFileSize(selectedFile.size)}</span>
        </div>
      </div>

      <div className="text-xs text-stone-600 bg-[#f7f6f3] border border-[#e6e5e0] p-3 rounded">
        Your file has not been analyzed or modified.
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          onClick={onRemove}
          className="px-4 py-2 rounded border border-[#e6e5e0] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors"
        >
          Remove file
        </button>
        <button
          onClick={onApprove}
          className="px-4 py-2 rounded bg-[#1c1c1a] hover:bg-black text-white text-xs font-medium transition-colors"
        >
          Approve & continue
        </button>
      </div>
    </div>
  );
};
