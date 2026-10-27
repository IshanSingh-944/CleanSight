import React from 'react';
import { Database, ShieldCheck, ArrowLeft } from 'lucide-react';

interface WorkspaceHeaderProps {
  onBackToLanding: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ onBackToLanding }) => {
  return (
    <header className="border-b border-[#E1E5E3] bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 text-xs text-[#69747D] hover:text-[#252A2E] transition-colors mr-2 font-medium"
            title="Return to landing page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <div className="w-7 h-7 rounded bg-[#2868A6] text-white flex items-center justify-center font-mono text-xs font-semibold shadow-xs">
            CS
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-[#252A2E]">CleanSight AI</span>
            <span className="text-[#E1E5E3]">/</span>
            <span className="text-xs text-[#69747D] font-medium">Dataset Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-[#69747D] font-mono text-[11px] bg-[#F7F7F4] px-2.5 py-1 rounded border border-[#E1E5E3]">
            <Database className="w-3.5 h-3.5 text-[#69747D]" />
            <span>Deterministic Engine</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-800 font-medium bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
};
