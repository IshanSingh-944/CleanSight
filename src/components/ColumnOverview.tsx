import React from 'react';
import type { ColumnProfile } from '../types';

interface ColumnOverviewProps {
  columns: ColumnProfile[];
}

export const ColumnOverview: React.FC<ColumnOverviewProps> = ({ columns }) => {
  return (
    <div className="bg-white border border-[#e2e1dc] rounded-lg shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e2e1dc] bg-[#fbfbfa] flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c1c1a] font-mono">
            Column Diagnostics
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">Inferred types, missing rates, and cardinality distribution.</p>
        </div>
        <div className="text-xs font-mono text-stone-500">
          Total Fields: <strong className="text-[#1c1c1a]">{columns.length}</strong>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#fbfbfa] border-b border-[#e2e1dc] text-stone-600">
            <tr>
              <th className="px-6 py-3 font-semibold">Column</th>
              <th className="px-6 py-3 font-semibold">Inferred Type</th>
              <th className="px-6 py-3 font-semibold">Missing Rate</th>
              <th className="px-6 py-3 font-semibold">Unique Count</th>
              <th className="px-6 py-3 font-semibold">Sample Values</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e1dc] text-stone-800">
            {columns.map((col) => (
              <tr key={col.name} className="hover:bg-stone-50/80 transition-colors">
                <td className="px-6 py-3.5 font-bold text-[#1c1c1a]">{col.name}</td>
                <td className="px-6 py-3.5">
                  <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px] border border-stone-200">
                    {col.inferred_type}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className={col.missing_percentage > 0 ? 'text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]' : 'text-stone-500'}>
                    {col.missing_count} ({col.missing_percentage.toFixed(1)}%)
                  </span>
                </td>
                <td className="px-6 py-3.5 text-stone-700">{col.unique_count.toLocaleString()}</td>
                <td className="px-6 py-3.5 text-stone-500 truncate max-w-sm">
                  {col.sample_values.join(', ') || <span className="italic text-stone-400">None</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
