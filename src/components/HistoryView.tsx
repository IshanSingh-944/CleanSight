import React from 'react';
import { History } from 'lucide-react';

export const HistoryView: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <History className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Cleaning History</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Past cleaning jobs and audit logs will appear here in future phases. No cleaning history records are stored in Phase 1.
        </p>
      </div>
    </div>
  );
};
