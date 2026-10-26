import React from 'react';
import { FileText, ShieldAlert, Trash2, ArrowRight } from 'lucide-react';
import type { DatasetFile } from '../types';

interface FileReviewPanelProps {
  selectedFile: DatasetFile;
  onApprove: () => void;
  onRemove: () => void;
}

export const FileReviewPanel: React.FC<FileReviewPanelProps> = ({
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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Dataset Review Panel</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify dataset attributes before approving for analysis phase.
          </p>
        </div>
        <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-medium">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Pending Approval</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Filename
          </span>
          <span className="block text-sm font-semibold text-slate-800 truncate" title={selectedFile.name}>
            {selectedFile.name}
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            File Size
          </span>
          <span className="block text-sm font-semibold text-slate-800">
            {formatFileSize(selectedFile.size)}
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            File Format
          </span>
          <span className="block text-sm font-semibold text-slate-800 uppercase">
            .{selectedFile.extension} ({selectedFile.type})
          </span>
        </div>
      </div>

      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3 text-xs text-indigo-900">
        <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          No cleaning or AI profiling has occurred yet. Your source file is safely staged for frontend validation and review only.
        </p>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          onClick={onRemove}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-600 text-sm font-medium transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove File</span>
        </button>
        <button
          onClick={onApprove}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/25 transition-all"
        >
          <span>Approve & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
