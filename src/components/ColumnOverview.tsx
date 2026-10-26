import React from 'react';
import type { ColumnProfile } from '../types';

interface ColumnOverviewProps {
  columns: ColumnProfile[];
}

export const ColumnOverview: React.FC<ColumnOverviewProps> = ({ columns }) => {
  return (
    <div className="bg-white border border-[#e6e5e0] rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e6e5e0]">
        <h3 className="text-sm font-semibold text-[#1c1c1a]">Column Overview</h3>
        <p className="text-xs text-stone-500">Inferred types, missing rates, and cardinality across columns.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#f7f6f3] border-b border-[#e6e5e0] text-stone-600">
            <tr>
              <th className="px-6 py-3 font-semibold">Column</th>
              <th className="px-6 py-3 font-semibold">Type</th>
              <th className="px-6 py-3 font-semibold">Missing %</th>
              <th className="px-6 py-3 font-semibold">Unique Values</th>
              <th className="px-6 py-3 font-semibold">Sample Values</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6e5e0] text-stone-800">
            {columns.map((col) => (
              <tr key={col.name} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-3 font-semibold text-[#1c1c1a]">{col.name}</td>
                <td className="px-6 py-3 text-stone-600">{col.inferred_type}</td>
                <td className="px-6 py-3">
                  <span className={col.missing_percentage > 0 ? 'text-amber-700 font-semibold' : 'text-stone-500'}>
                    {col.missing_percentage.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-3 text-stone-600">{col.unique_count}</td>
                <td className="px-6 py-3 text-stone-500 truncate max-w-xs">
                  {col.sample_values.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
