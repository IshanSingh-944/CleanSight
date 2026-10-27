import React from 'react';
import { FileText, Layers, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { DatasetProfile } from '../types';

interface DatasetSummaryProps {
  profile: DatasetProfile;
}

export const DatasetSummary: React.FC<DatasetSummaryProps> = ({ profile }) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white border border-[#e2e1dc] rounded-lg shadow-xs overflow-hidden">
      {/* File Metadata Header */}
      <div className="px-6 py-4 border-b border-[#e2e1dc] flex flex-wrap items-center justify-between gap-3 bg-[#fbfbfa]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#1c1c1a] truncate">{profile.filename}</span>
              <span className="text-[10px] font-mono uppercase bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-medium">
                {profile.file_extension}
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-mono mt-0.5">
              ID: {profile.dataset_id} · Size: {formatBytes(profile.file_size_bytes)}
            </div>
          </div>
        </div>

        {/* Risk Distribution Pills */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-500 font-medium mr-1 hidden sm:inline">Risk Profile:</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Low: {profile.risk_summary.Low}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Med: {profile.risk_summary.Medium}
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
              High: {profile.risk_summary.High}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#e2e1dc] text-xs">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-stone-500 text-[11px] font-mono uppercase">
            <span>Total Rows</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1c1c1a] mt-1.5">
            {profile.row_count.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">100% active sample</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-stone-500 text-[11px] font-mono uppercase">
            <span>Columns</span>
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1c1c1a] mt-1.5">
            {profile.column_count}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {profile.constant_columns.length > 0 ? `${profile.constant_columns.length} constant column(s)` : 'No zero-variance fields'}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-stone-500 text-[11px] font-mono uppercase">
            <span>Missing Cells</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1c1c1a] mt-1.5">
            {profile.total_missing_cells.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {profile.missing_percentage.toFixed(2)}% of dataset values
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-stone-500 text-[11px] font-mono uppercase">
            <span>Duplicate Rows</span>
            <ShieldAlert className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1c1c1a] mt-1.5">
            {profile.duplicate_row_count.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {profile.duplicate_row_count > 0 ? 'Exact row-wise duplicates' : 'Zero duplicate records'}
          </div>
        </div>
      </div>
    </div>
  );
};
