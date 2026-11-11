import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { Card } from './ui/Card';
import { EmptyState } from './ui/Layout';
import { Upload, Clock, Database, CheckCircle } from 'lucide-react';

interface DatasetHistoryItem {
  dataset_id: string;
  filename: string;
  file_size: number;
  extension: string;
  row_count: number;
  column_count: number;
  status: string;
  created_at: string;
}

interface AuthenticatedWorkspaceProps {
  user: { user_id: string; email: string; full_name?: string | null };
  onSignOut: () => void;
  onFileUpload: (file: File) => void;
}

export const AuthenticatedWorkspace: React.FC<AuthenticatedWorkspaceProps> = ({
  user,
  onSignOut,
  onFileUpload,
}) => {
  const [activeNav, setActiveNav] = useState<'overview' | 'datasets' | 'history' | 'enquire' | 'settings'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [datasets, setDatasets] = useState<DatasetHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/datasets/my-history`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load datasets.');
      const data = await res.json();
      setDatasets(data.datasets || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load datasets.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const openFilePicker = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls,.json';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) onFileUpload(f);
    };
    input.click();
  }, [onFileUpload]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#252A2E] font-sans antialiased">
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={onSignOut}
        onNavSelect={(id) => setActiveNav(id as typeof activeNav)}
        activeNavId={activeNav}
      />

      <div className={`flex flex-col ${isMobile ? '' : 'ml-64'}`}>
        <header className="border-b border-[#E1E5E3] bg-white sticky top-0 z-30 h-14">
          <div className="max-w-full mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-[#69747D] hover:text-[#252A2E] sm:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#2868A6] flex items-center justify-center text-[10px] font-bold text-white tracking-wider">
                  CS
                </div>
                <span className="font-bold text-sm tracking-tight text-[#252A2E]">CleanSight AI</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-[#E1E5E3] pl-4">
              <div className="flex items-center gap-2 text-[#69747D]">
                <span className="font-mono text-[11px]">{user.email}</span>
              </div>
              <button
                onClick={onSignOut}
                className="flex items-center gap-1 text-xs text-[#69747D] hover:text-[#252A2E] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          {activeNav === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#252A2E]">Overview</h2>
                <p className="text-xs text-[#69747D] mt-1">
                  Welcome back, {user.full_name || user.email}. Here's a summary of your recent data-cleaning activity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#69747D] font-mono uppercase">Total datasets</p>
                      <h3 className="text-2xl font-bold text-[#252A2E]">{datasets.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-700">
                      <Database className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
                <Card padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#69747D] font-mono uppercase">Cleaned datasets</p>
                      <h3 className="text-2xl font-bold text-[#252A2E]">
                        {datasets.filter((d) => d.status === 'cleaned').length}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center text-emerald-700">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
                <Card padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#69747D] font-mono uppercase">Total rows processed</p>
                      <h3 className="text-2xl font-bold text-[#252A2E]">
                        {datasets.reduce((sum, d) => sum + d.row_count, 0).toLocaleString()}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded bg-amber-50 flex items-center justify-center text-amber-700">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </div>

              <h3 className="font-semibold text-sm text-[#252A2E] mb-4">Quick actions</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv,.xlsx,.xls,.json';
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) onFileUpload(f);
                    };
                    input.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-[#E1E5E3] rounded-md text-sm font-medium text-[#252A2E] hover:bg-[#F7F7F4] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload dataset</span>
                </button>
              </div>
            </div>
          )}

          {activeNav === 'datasets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#252A2E]">My Datasets</h2>
                  <p className="text-xs text-[#69747D] mt-1">Your previously uploaded and cleaned datasets.</p>
                </div>
              </div>

              {isLoading && (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-[#252A2E] border-t-transparent animate-spin" />
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">{error}</div>
              )}

              {!isLoading && !error && datasets.length === 0 && (
                <EmptyState
                  title="No datasets yet"
                  description="Upload your first dataset to get started. Your files and cleaning history will be saved here."
                    action={
                      <button
                        onClick={openFilePicker}
                        className="px-4 py-2 border border-[#E1E5E3] rounded-md text-sm font-medium text-[#252A2E] hover:bg-[#F7F7F4]"
                      >
                        Upload dataset
                      </button>
                    }
                />
              )}

              {!isLoading && !error && datasets.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E1E5E3] text-[10px] font-medium uppercase tracking-wider text-[#69747D]">
                        <th className="pb-3 font-medium text-[#252A2E]">File</th>
                        <th className="pb-3 font-medium text-[#252A2E]">Rows × Cols</th>
                        <th className="pb-3 font-medium text-[#252A2E]">Size</th>
                        <th className="pb-3 font-medium text-[#252A2E]">Status</th>
                        <th className="pb-3 font-medium text-[#252A2E]">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datasets.map((ds) => (
                        <tr key={ds.dataset_id} className="border-b border-[#E1E5E3] hover:bg-[#F7F7F4] transition-colors">
                          <td className="py-4 text-sm text-[#252A2E]">{ds.filename}</td>
                          <td className="py-4 text-xs font-mono text-[#69747D]">{ds.row_count} × {ds.column_count}</td>
                          <td className="py-4 text-xs font-mono text-[#69747D]">{formatBytes(ds.file_size)}</td>
                          <td className="py-4">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              ds.status === 'cleaned'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : ds.status === 'active'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-stone-50 text-stone-700 border-stone-200'
                            }`}>
                              {ds.status}
                            </span>
                          </td>
                          <td className="py-4 text-xs font-mono text-[#69747D]">{new Date(ds.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeNav === 'history' && (
            <EmptyState
              title="Cleaning history"
              description="View your past cleaning executions and audit logs here."
                  action={
                    <button
                      onClick={openFilePicker}
                      className="px-4 py-2 border border-[#E1E5E3] rounded-md text-sm font-medium text-[#252A2E] hover:bg-[#F7F7F4]"
                    >
                      Upload dataset
                    </button>
                  }
            />
          )}

          {activeNav === 'enquire' && (
            <EmptyState
              title="AI Enquire"
              description="Ask questions about your datasets. Select a dataset from My Datasets to begin."
            />
          )}

          {activeNav === 'settings' && (
            <Card padding="md">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#252A2E] mb-6">Account settings</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#69747D] font-mono uppercase mb-1">Email</p>
                  <p className="text-sm text-[#252A2E]">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#69747D] font-mono uppercase mb-1">User ID</p>
                  <p className="text-sm font-mono text-[#69747D]">{user.user_id}</p>
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};
