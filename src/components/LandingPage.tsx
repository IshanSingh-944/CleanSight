import React from 'react';
import { Database, ShieldCheck, ArrowRight, CheckCircle2, Cpu, Lock } from 'lucide-react';

interface LandingPageProps {
  onOpenWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenWorkspace }) => {
  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#252A2E] font-sans selection:bg-[#E1E5E3]">
      {/* Navigation */}
      <header className="border-b border-[#E1E5E3] bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#2868A6] text-white flex items-center justify-center font-mono text-xs font-bold shadow-xs">
              CS
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#252A2E]">CleanSight AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#69747D]">
            <a href="#product" className="hover:text-[#252A2E] transition-colors">Product</a>
            <a href="#workflow" className="hover:text-[#252A2E] transition-colors">How it works</a>
            <a href="#safety" className="hover:text-[#252A2E] transition-colors">Safety</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenWorkspace}
              className="flex items-center gap-2 px-4 py-2 bg-[#252A2E] hover:bg-black text-white text-xs font-semibold rounded transition-colors shadow-xs"
            >
              Open workspace
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 md:py-24">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-[#2868A6] text-xs font-mono font-medium">
            <Database className="w-3.5 h-3.5" />
            <span>Deterministic Data Quality & AI Cleaning Platform</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#252A2E] leading-[1.1]">
            Make messy data ready for analysis.
          </h1>
          
          <p className="text-base sm:text-lg text-[#69747D] leading-relaxed max-w-2xl">
            Profile your data, uncover quality issues, and review AI-assisted cleaning recommendations before applying any changes. Built for rigorous data engineering and analytics teams.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onOpenWorkspace}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#252A2E] hover:bg-black text-white text-sm font-semibold rounded shadow-xs transition-colors"
            >
              Open workspace
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#workflow"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#E1E5E3] hover:bg-stone-50 text-[#252A2E] text-sm font-semibold rounded transition-colors shadow-xs"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Realistic Product Preview Box */}
        <div className="mt-16 bg-white border border-[#E1E5E3] rounded-lg shadow-sm overflow-hidden max-w-5xl">
          <div className="px-5 py-3 border-b border-[#E1E5E3] bg-[#F7F7F4] flex items-center justify-between text-xs font-mono text-[#69747D]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
              <span className="ml-2 text-[#252A2E] font-medium">customer_transactions_Q3.csv</span>
            </div>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Profiled · 3 Issues Detected
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E1E5E3] border-b border-[#E1E5E3] text-xs font-mono">
            <div className="p-4 bg-white">
              <span className="text-[#69747D] block text-[10px] uppercase">Rows</span>
              <span className="text-sm font-bold text-[#252A2E] mt-0.5 block">24,500</span>
            </div>
            <div className="p-4 bg-white">
              <span className="text-[#69747D] block text-[10px] uppercase">Columns</span>
              <span className="text-sm font-bold text-[#252A2E] mt-0.5 block">12</span>
            </div>
            <div className="p-4 bg-white">
              <span className="text-[#69747D] block text-[10px] uppercase">Missing Cells</span>
              <span className="text-sm font-bold text-amber-700 mt-0.5 block">142 (0.48%)</span>
            </div>
            <div className="p-4 bg-white">
              <span className="text-[#69747D] block text-[10px] uppercase">Duplicates</span>
              <span className="text-sm font-bold text-[#252A2E] mt-0.5 block">18</span>
            </div>
          </div>

          <div className="p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E5E3] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#252A2E]">Active Recommendation Preview</h3>
              <span className="text-xs font-mono text-[#2868A6]">Medium Risk · Imputation Required</span>
            </div>
            <div className="bg-[#F7F7F4] border border-[#E1E5E3] p-4 rounded text-xs space-y-2 font-mono">
              <div className="font-bold text-[#252A2E]">Impute Missing Values in 'revenue'</div>
              <div className="text-[#69747D]">Proposed Action: Apply median imputation across 45 null records in column 'revenue'.</div>
              <div className="text-emerald-800 text-[11px] font-sans pt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Explicit approval required before execution. Original data is fully preserved.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="border-t border-[#E1E5E3] bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-xl space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#2868A6] font-semibold">Workflow</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#252A2E]">Four steps to pristine data.</h2>
            <p className="text-sm text-[#69747D]">CleanSight AI combines deterministic profiling with controlled AI planning to ensure absolute data integrity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#F7F7F4] border border-[#E1E5E3] p-6 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded bg-[#2868A6] text-white flex items-center justify-center font-mono text-xs font-bold">1</div>
              <h3 className="text-sm font-bold text-[#252A2E]">Upload</h3>
              <p className="text-xs text-[#69747D] leading-relaxed">Import CSV, Excel (.xlsx, .xls), or JSON files securely with automatic size and type validation.</p>
            </div>

            <div className="bg-[#F7F7F4] border border-[#E1E5E3] p-6 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded bg-[#2868A6] text-white flex items-center justify-center font-mono text-xs font-bold">2</div>
              <h3 className="text-sm font-bold text-[#252A2E]">Profile</h3>
              <p className="text-xs text-[#69747D] leading-relaxed">Automatically detect missing values, duplicates, constant columns, whitespace anomalies, and statistical outliers.</p>
            </div>

            <div className="bg-[#F7F7F4] border border-[#E1E5E3] p-6 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded bg-[#2868A6] text-white flex items-center justify-center font-mono text-xs font-bold">3</div>
              <h3 className="text-sm font-bold text-[#252A2E]">Review</h3>
              <p className="text-xs text-[#69747D] leading-relaxed">Inspect AI cleaning recommendations, risk levels, and evidence. Approve or reject actions individually.</p>
            </div>

            <div className="bg-[#F7F7F4] border border-[#E1E5E3] p-6 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded bg-[#2868A6] text-white flex items-center justify-center font-mono text-xs font-bold">4</div>
              <h3 className="text-sm font-bold text-[#252A2E]">Clean & Export</h3>
              <p className="text-xs text-[#69747D] leading-relaxed">Execute approved changes on an independent working copy. Verify before/after metrics and download CSV or Excel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="border-t border-[#E1E5E3] bg-[#F7F7F4] py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-xl space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#2868A6] font-semibold">Safety & Trust</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#252A2E]">Engineered for zero data risk.</h2>
            <p className="text-sm text-[#69747D]">CleanSight AI enforces strict data preservation and risk policies on every operation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E1E5E3] p-6 rounded-lg space-y-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm font-bold text-[#252A2E]">Original Data Immutability</h3>
              <p className="text-xs text-[#69747D] leading-relaxed">Uploaded raw files are stored securely and never mutated. All operations execute on isolated working copies.</p>
            </div>

            <div className="bg-white border border-[#E1E5E3] p-6 rounded-lg space-y-3">
              <Cpu className="w-5 h-5 text-[#2868A6]" />
              <h3 className="text-sm font-bold text-[#252A2E]">Deterministic Execution</h3>
              <p className="text-xs text-[#69747D] leading-relaxed">No arbitrary code execution. All transformations run via tested, modular Pandas routines with strict Pydantic validation.</p>
            </div>

            <div className="bg-white border border-[#E1E5E3] p-6 rounded-lg space-y-3">
              <Lock className="w-5 h-5 text-amber-700" />
              <h3 className="text-sm font-bold text-[#252A2E]">Explicit Risk Controls</h3>
              <p className="text-xs text-[#69747D] leading-relaxed">High-risk changes on critical fields require mandatory review and cannot be executed automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-[#E1E5E3] bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-[#252A2E]">Ready to inspect your dataset?</h2>
          <button
            onClick={onOpenWorkspace}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#252A2E] hover:bg-black text-white text-sm font-semibold rounded shadow-xs transition-colors"
          >
            Open workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-[#E1E5E3] bg-[#F7F7F4] py-8 px-6 text-xs text-[#69747D] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#252A2E]">CleanSight AI</span>
          <span>© 2026</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-[11px]">
          <span>FastAPI</span>
          <span>React & TypeScript</span>
          <span>Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
};
