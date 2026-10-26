import React from 'react';
import type { DatasetProfile } from '../types';

interface DatasetSummaryProps {
  profile: DatasetProfile;
}

export const DatasetSummary: React.FC<DatasetSummaryProps> = ({ profile }) => {
  const formatBytes = (bytes: number) => {
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
            .{profile.file_extension}
          </span>
          <h3 className="text-base font-semibold text-[#1c1c1a] mt-2">
            {profile.filename}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-stone-500 font-mono">{formatBytes(profile.file_size_bytes)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-[#f7f6f3] border border-[#e6e5e0] p-3 rounded">
          <span className="block text-stone-500 text-[10px] uppercase">Rows</span>
          <span className="block text-sm font-semibold text-[#1c1c1a] mt-0.5">{profile.row_count.toLocaleString()}</span>
        </div>
        <div className="bg-[#f7f6f3] border border-[#e6e5e0] p-3 rounded">
          <span className="block text-stone-500 text-[10px] uppercase">Columns</span>
          <span className="block text-sm font-semibold text-[#1c1c1a] mt-0.5">{profile.column_count}</span>
        </div>
        <div className="bg-[#f7f6f3] border border-[#e6e5e0] p-3 rounded">
          <span className="block text-stone-500 text-[10px] uppercase">Missing Cells</span>
          <span className="block text-sm font-semibold text-[#1c1c1a] mt-0.5">
            {profile.total_missing_cells} ({profile.missing_percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="bg-[#f7f6f3] border border-[#e6e5e0] p-3 rounded">
          <span className="block text-stone-500 text-[10px] uppercase">Duplicates</span>
          <span className="block text-sm font-semibold text-[#1c1c1a] mt-0.5">{profile.duplicate_row_count}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between bg-[#f7f6f3] border border-[#e6e5e0] p-4 rounded text-xs">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-[#1c1c1a]">Risk Distribution:</span>
          <span className="text-emerald-700 font-mono">Low: {profile.risk_summary.Low}</span>
          <span className="text-amber-700 font-mono">Medium: {profile.risk_summary.Medium}</span>
          <span className="text-red-700 font-mono">High: {profile.risk_summary.High}</span>
        </div>
        <div className="text-stone-500 font-mono">
          Total Issues Detected: {profile.issue_count}
        </div>
      </div>
    </div>
  );
};
