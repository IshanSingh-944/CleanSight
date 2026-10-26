import React from 'react';
import { Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  currentTitle: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ currentTitle }) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0 p-0">
          {currentTitle}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Turn raw data into analysis-ready datasets.
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full text-indigo-700 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>UI Mode Active</span>
        </div>
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-sm border border-slate-200">
            DS
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-semibold text-slate-800">Data Scientist</span>
            <span className="block text-[10px] text-slate-500">Workspace User</span>
          </div>
        </div>
      </div>
    </header>
  );
};
