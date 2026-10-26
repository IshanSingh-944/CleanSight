import React from 'react';

export const WorkspaceHeader: React.FC = () => {
  return (
    <header className="border-b border-[#e6e5e0] bg-white px-8 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 rounded bg-[#1c1c1a] text-white flex items-center justify-center font-mono text-xs font-bold">
          C
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm text-[#1c1c1a] tracking-tight">CleanSight AI</span>
          <span className="text-stone-300">/</span>
          <span className="text-xs text-stone-500 font-medium">Dataset preparation</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 text-xs text-stone-600 font-medium bg-[#f7f6f3] px-3 py-1.5 rounded border border-[#e6e5e0]">
        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
        <span>Upload interface ready</span>
      </div>
    </header>
  );
};
