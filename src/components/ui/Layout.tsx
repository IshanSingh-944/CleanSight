import React from 'react';

export const PageHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="space-y-1">
    <h1 className="text-xl font-bold tracking-tight text-[#252A2E]">{title}</h1>
    {description && <p className="text-xs text-[#69747D]">{description}</p>}
  </div>
);

export const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-8 space-y-1">
    <h2 className="text-sm font-semibold uppercase tracking-wider text-[#252A2E]">{title}</h2>
    {description && <p className="mt-0.5 text-xs text-[#69747D]">{description}</p>}
  </div>
);

export const EmptyState = ({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-xl bg-[#F7F7F4] border border-[#E1E5E3] flex items-center justify-center text-[#9CA3AF] mb-4">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21-3.582-4-8-4S0 4.79 0 7z" /></svg>
    </div>
    <h3 className="text-sm font-semibold text-[#252A2E] mb-1">{title}</h3>
    {description && <p className="text-xs text-[#69747D] max-w-xs mb-6">{description}</p>}
    {action}
  </div>
);
