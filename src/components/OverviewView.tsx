import React from 'react';
import { UploadCloud, FileSpreadsheet, Shield, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

interface OverviewViewProps {
  onNavigateUpload: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigateUpload }) => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-indigo-200 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Phase 1 Preview</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Turn raw data into analysis-ready datasets.
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed">
            CleanSight AI prepares messy spreadsheets and data exports for Exploratory Data Analysis with intelligent formatting, anomaly detection, and type inference.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateUpload}
              className="inline-flex items-center space-x-2 bg-white text-indigo-900 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all text-sm"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Upload New Dataset</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Supported Formats</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Seamlessly ingest CSV, XLS, XLSX, JSON, and document headers with robust local validation and parsing preview.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Verified Pipeline</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review dataset metadata and size prior to ingestion. Full isolation guarantees your raw source files remain untouched.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">EDA Ready</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Designed specifically to streamline data hygiene tasks before feeding notebooks, pandas, or custom analytical models.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Navigation</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onNavigateUpload}
            className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-slate-900">Upload Dataset</span>
              <span className="block text-xs text-slate-500">Drag & drop or browse files</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
