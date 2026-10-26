import React from 'react';
import { Settings } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <Settings className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Application Settings</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Configure cleaning preferences, LLM provider keys, and workspace parameters in future releases.
        </p>
      </div>
    </div>
  );
};
