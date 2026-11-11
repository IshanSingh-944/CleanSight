import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onOpenWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenWorkspace }) => {
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] font-sans antialiased selection:bg-[#E5E7EB]">
      <header className="border-b border-[#E5E7EB] bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#2563EB] flex items-center justify-center text-[10px] font-bold text-white tracking-wider">
              CS
            </div>
            <span className="font-bold text-sm tracking-tight text-[#111827]">CleanSight</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            <a href="#product" className="hover:text-[#111827] transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-[#111827] transition-colors">How it works</a>
            <a href="#security" className="hover:text-[#111827] transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenWorkspace}
              className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
            >
              Open workspace
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-6 py-20 md:py-32">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[10px] font-mono font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
            <span>Deterministic data quality · AI-assisted cleaning</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111827] leading-[1.1] mb-6">
            Make messy data analysis-ready.
          </h1>

          <p className="text-lg text-[#6B7280] leading-relaxed max-w-2xl mb-10">
            Profile your datasets, surface quality issues, and review cleaning recommendations before applying anything.
            Built for engineers and analysts who own their data pipelines.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenWorkspace}
              className="flex items-center gap-2 px-5 py-3 bg-[#111827] hover:bg-black text-white text-sm font-semibold rounded-md shadow-sm transition-colors"
            >
              Open workspace
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section id="product" className="border-t border-[#E5E7EB] bg-[#F9FAFB] py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-[#111827] mb-4">A workspace built for data quality.</h2>
              <p className="text-[#6B7280] leading-relaxed">
                Upload a CSV or Excel file, run deterministic profiling checks, and review AI-suggested
                cleaning actions. Nothing is executed without your explicit approval.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#111827] mb-2">Upload & validate</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Import CSV, Excel (.xlsx), or JSON files. Automatic size, type, and schema validation before ingestion.
                </p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#111827] mb-2">Profile & detect</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Surface missing values, duplicates, constant columns, whitespace anomalies, and statistical outliers.
                </p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#111827] mb-2">Review & clean</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Inspect each recommendation with risk level and evidence. Approve or reject individually on a working copy.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="border-t border-[#E5E7EB] bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-[#111827] mb-4">Zero data risk by design.</h2>
              <p className="text-[#6B7280] leading-relaxed">
                Your raw uploads are stored immutably. All transformations run on isolated working copies through tested,
                modular routines — never arbitrary code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-xs font-bold">✓</span>
                <div>
                  <div className="font-semibold text-[#111827]">Immutable originals</div>
                  <div className="text-xs text-[#6B7280]">Raw files never mutated.</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-xs font-bold">✓</span>
                <div>
                  <div className="font-semibold text-[#111827]">Deterministic execution</div>
                  <div className="text-xs text-[#6B7280]">Tested Pandas routines, Pydantic validation.</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center text-xs font-bold">✓</span>
                <div>
                  <div className="font-semibold text-[#111827]">Explicit approval</div>
                  <div className="text-xs text-[#6B7280]">High-risk changes require manual review.</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5E7EB] bg-[#F9FAFB] py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#374151]">CleanSight AI</span>
            <span>© 2026</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="hover:text-[#111827] transition-colors">Terms</a>
            <a href="#" className="hover:text:#111827] transition-colors">Privacy</a>
            <a href="#" className="hover:text:#111827] transition-colors">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
