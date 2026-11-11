import React from 'react';
import { ArrowRight, LayoutGrid, Cpu, CheckCircle, Clock, Save } from 'lucide-react';

interface LandingPageProps {
  onOpenWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenWorkspace }) => {
  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#252A2E] font-sans antialiased selection:bg-[#E1E5E3]">
      <header className="border-b border-[#E1E5E3] bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#2868A6] flex items-center justify-center text-[10px] font-bold text-white tracking-wider">
              CS
            </div>
            <span className="font-bold text-sm tracking-tight text-[#252A2E]">CleanSight AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[11px] font-medium text-[#69747D] uppercase tracking-wider">
            <a href="#product" className="hover:text-[#252A2E] transition-colors">Product</a>
            <a href="#features" className="hover:text-[#252A2E] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#252A2E] transition-colors">How it works</a>
            <a href="#documentation" className="hover:text-[#252A2E] transition-colors">Documentation</a>
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={onOpenWorkspace} className="text-xs font-medium text-[#69747D] hover:text-[#252A2E] transition-colors">
              Sign in
            </button>
            <button onClick={onOpenWorkspace} className="px-4 py-2 bg-[#252A2E] hover:bg-black text-white text-xs font-semibold rounded-md transition-colors">
              Get started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-6 py-20 md:py-32">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[10px] font-mono font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
            <span>No account required to start</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#252A2E] leading-[1.1] mb-6">
            Turn messy data into analysis-ready data.
          </h1>

          <p className="text-lg text-[#69747D] leading-relaxed max-w-2xl mb-10">
            Profile your datasets, uncover data-quality issues, and get explainable AI-powered cleaning recommendations.
            You stay in control of every change.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenWorkspace}
              className="flex items-center gap-2 px-5 py-3 bg-[#252A2E] hover:bg-black text-white text-sm font-semibold rounded-md shadow-sm transition-colors"
            >
              Start cleaning — free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="px-5 py-3 bg-white border border-[#E1E5E3] hover:bg-[#F7F7F4] text-[#252A2E] text-sm font-semibold rounded-md transition-colors shadow-sm"
            >
              Explore the product
            </button>
          </div>

          <p className="mt-6 text-xs text-[#69747D] font-medium">
            No account required. Start with a temporary guest session.
          </p>
        </section>

        <section id="how-it-works" className="border-t border-[#E1E5E3] bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-[#252A2E] mb-4">How CleanSight AI works</h2>
              <p className="text-[#69747D] leading-relaxed">
                Upload your dataset, let CleanSight profile it for quality issues, review explainable AI recommendations,
                and apply only the changes you approve. Your original data is never touched.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Upload & validate',
                  body: 'Import CSV, Excel (.xlsx), or JSON files. Automatic size, type, and schema validation before ingestion.',
                  icon: <LayoutGrid className="w-5 h-5" />,
                },
                {
                  title: 'Profile & detect',
                  body: 'Surface missing values, duplicates, constant columns, whitespace anomalies, and statistical outliers.',
                  icon: <Cpu className="w-5 h-5" />,
                },
                {
                  title: 'Review & clean',
                  body: 'Inspect each recommendation with risk level and evidence. Approve or reject individually on a working copy.',
                  icon: <CheckCircle className="w-5 h-5" />,
                },
              ].map((item) => (
                <div key={item.title} className="bg-[#F7F7F4] border border-[#E1E5E3] rounded-lg p-6">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold mb-4 bg-[#2868A6] text-white">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-sm text-[#252A2E] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#69747D] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-[#E1E5E3] bg-[#F7F7F4] py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-[#252A2E] mb-4">Dataset profiling capabilities</h2>
              <p className="text-[#69747D] leading-relaxed">
                Deterministic analysis of your data — no black boxes. See exactly what CleanSight finds before anything changes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Missing values',
                  body: 'Detect null and empty cells across every column with affected-row counts.',
                },
                {
                  title: 'Duplicates',
                  body: 'Identify exact row-wise duplicate records and near-duplicate entries.',
                },
                {
                  title: 'Outliers',
                  body: 'Flag statistical outliers and inconsistent data types per column.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-white border border-[#E1E5E3] rounded-lg p-6">
                  <h3 className="font-bold text-sm text-[#252A2E] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#69747D] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="risk" className="border-t border-[#E1E5E3] bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-[#252A2E] mb-4">Explainable AI cleaning recommendations</h2>
              <p className="text-[#69747D] leading-relaxed">
                Every recommendation includes a plain-language explanation, risk level, affected rows, and alternatives.
                Nothing executes without your explicit approval.
              </p>
            </div>

            <div className="bg-[#F7F7F4] border border-[#E1E5E3] rounded-lg p-8">
              <div className="flex items-center justify-between border-b border-[#E1E5E3] pb-4 mb-4">
                <h3 className="font-bold text-sm text-[#252A2E]">Active recommendation preview</h3>
                <span className="text-xs font-mono text-[#2868A6]">Medium risk · Imputation required</span>
              </div>
              <div className="bg-white border border-[#E1E5E3] p-4 rounded text-xs space-y-2 font-mono">
                <div className="font-bold text-[#252A2E]">Impute missing values in 'revenue'</div>
                <div className="text-[#69747D]">Proposed action: Apply median imputation across 45 null records in column 'revenue'.</div>
                <div className="text-emerald-800 text-[11px] font-sans pt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Explicit approval required before execution. Original data is fully preserved.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="guest-vs-account" className="border-t border-[#E1E5E3] bg-[#F7F7F4] py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-[#252A2E] mb-4">Guest vs account experience</h2>
              <p className="text-[#69747D] leading-relaxed">
                Start cleaning immediately as a guest, or create an account to keep your projects accessible.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-[#E1E5E3] rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Clock className="w-5 h-5 text-[#69747D]" />
                  <h3 className="font-bold text-sm text-[#252A2E]">Continue as Guest</h3>
                </div>
                <p className="text-xs text-[#69747D] mb-4">No account or registration required.</p>
                <ul className="space-y-2 text-xs text-[#69747D] mb-6">
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#2868A6] mt-1 shrink-0" />Start cleaning immediately</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#2868A6] mt-1 shrink-0" />Upload and analyze datasets</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#2868A6] mt-1 shrink-0" />Download cleaned results</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#2868A6] mt-1 shrink-0" />Temporary session; no persistent history</li>
                </ul>
              </div>
              <div className="bg-[#252A2E] rounded-lg p-6 text-white">
                <div className="flex items-start gap-3 mb-4">
                  <Save className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-sm text-white">Create a Free Account</h3>
                </div>
                <p className="text-[#9CA3AF] mb-4">Keep your data-cleaning projects accessible.</p>
                <ul className="space-y-2 text-xs text-[#9CA3AF] mb-6">
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#2868A6] mt-1 shrink-0" />Save datasets and projects</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#2868A6] mt-1 shrink-0" />Access previous cleaning sessions</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#2868A6] mt-1 shrink-0" />Revisit recommendations and reports</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#2868A6] mt-1 shrink-0" />Persistent cleaning history</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E1E5E3] bg-[#F9FAFB] py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#374151]">CleanSight AI</span>
            <span>© 2026</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="hover:text-[#252A2E] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#252A2E] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#252A2E] transition-colors">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
