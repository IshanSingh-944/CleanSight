import React from 'react';
import type { DatasetFile } from '../types';

interface ApprovalConfirmationProps {
  selectedFile: DatasetFile;
  onReset: () => void;
}

export const ApprovalConfirmation: React.FC<ApprovalConfirmationProps> = ({
  selectedFile,
  onReset,
}) => {
  return (
    <div className="bg-white border border-[#e6e5e0] rounded-lg p-8 space-y-6 max-w-xl mx-auto text-center">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[#1c1c1a]">
          File approved for the next phase.
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          AI profiling and data cleaning have not been implemented yet.
        </p>
      </div>

      <div className="bg-[#f7f6f3] border border-[#e6e5e0] rounded p-4 text-left text-xs space-y-1.5 font-mono">
        <div className="flex justify-between">
          <span className="text-stone-500">File:</span>
          <span className="text-[#1c1c1a] font-medium truncate max-w-[240px]">{selectedFile.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Format:</span>
          <span className="text-[#1c1c1a] uppercase">.{selectedFile.extension}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Status:</span>
          <span className="text-emerald-700 font-medium">Approved</span>
        </div>
      </div>

      <div>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded border border-[#e6e5e0] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors"
        >
          Upload another dataset
        </button>
      </div>
    </div>
  );
};
