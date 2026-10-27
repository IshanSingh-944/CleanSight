import React, { useState } from 'react';
import { Play, Download, CheckCircle2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { WorkflowStatus } from './WorkflowStatus';
import { DatasetSummary } from './DatasetSummary';
import { ColumnOverview } from './ColumnOverview';
import { RecommendationCard } from './RecommendationCard';
import { API_BASE_URL } from '../config';
import type { DatasetProfile, Recommendation, ReviewFilter } from '../types';

interface ReviewWorkspaceProps {
  profile: DatasetProfile;
  recommendations: Recommendation[];
  datasetId: string;
  onUpdateRecommendationStatus: (actionId: string, status: 'pending' | 'approved' | 'rejected' | 'investigation') => void;
  onGeneratePlan: (objective: string) => Promise<void>;
  onReset: () => void;
}

export const ReviewWorkspace: React.FC<ReviewWorkspaceProps> = ({
  profile,
  recommendations,
  datasetId,
  onUpdateRecommendationStatus,
  onGeneratePlan,
  onReset,
}) => {
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'columns' | 'execution'>('recommendations');
  const [objective, setObjective] = useState<string>('Prepare dataset for Exploratory Data Analysis');
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePlanClick = async () => {
    setIsPlanning(true);
    setErrorMessage(null);
    try {
      await onGeneratePlan(objective);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate AI plan.');
    } finally {
      setIsPlanning(false);
    }
  };

  const approvedCount = recommendations.filter(r => r.execution_status === 'approved').length;

  const handleExecuteCleaning = async () => {
    const approvedIds = recommendations
      .filter(r => r.execution_status === 'approved')
      .map(r => r.action_id);

    if (approvedIds.length === 0) {
      setErrorMessage('Please approve at least one recommendation before applying changes.');
      return;
    }

    setIsExecuting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/${datasetId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_action_ids: approvedIds })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Cleaning execution failed.');
      }

      const result = await response.json();
      setExecutionResult(result);
      setActiveTab('execution');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during execution.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownload = (format: 'csv' | 'xlsx') => {
    window.open(`${API_BASE_URL}/api/datasets/${datasetId}/export?format=${format}`, '_blank');
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    if (filter === 'all') return true;
    if (filter === 'Low' || filter === 'Medium' || filter === 'High') {
      return rec.risk_level === filter;
    }
    if (filter === 'pending') return rec.execution_status === 'pending';
    if (filter === 'approved') return rec.execution_status === 'approved';
    if (filter === 'rejected') return rec.execution_status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e2e1dc] pb-6">
        <div>
          <div className="text-xs text-stone-500 font-mono mb-1">
            Workspace / Dataset Studio / Review & Execution
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1c1c1a] m-0">
            Data Quality & Cleaning Workbench
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Inspect profile diagnostics, customize your cleaning plan, approve actions, and execute deterministic transformations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExecuteCleaning}
            disabled={isExecuting || approvedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded shadow-xs transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isExecuting ? 'Applying Changes...' : `Apply Approved Changes (${approvedCount})`}
          </button>
          <button
            onClick={onReset}
            className="px-3 py-2 rounded border border-[#e2e1dc] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors shadow-xs"
          >
            Upload New Dataset
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded text-xs flex items-center justify-between shadow-xs">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900 font-bold px-2">&times;</button>
        </div>
      )}

      <WorkflowStatus step={3} />

      <DatasetSummary profile={profile} />

      {/* AI Cleaning Planner Toolbar */}
      <div className="bg-white border border-[#e2e1dc] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-stone-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c1c1a]">AI Cleaning Planner</h3>
        </div>
        <p className="text-xs text-stone-600">
          Tailor recommendations by defining your downstream analytical objective (e.g., regression modeling, summary dashboard, exploratory EDA).
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. Prepare dataset for regression modeling"
            className="flex-1 px-3 py-2 text-xs border border-[#e2e1dc] rounded bg-[#fbfbfa] focus:outline-none focus:border-stone-500 font-mono text-stone-800"
          />
          <button
            onClick={handlePlanClick}
            disabled={isPlanning}
            className="px-4 py-2 bg-[#1c1c1a] hover:bg-black text-white text-xs font-medium rounded transition-colors disabled:opacity-50 shrink-0 shadow-xs"
          >
            {isPlanning ? 'Generating Plan...' : 'Generate Recommendations'}
          </button>
        </div>
      </div>

      {/* Tabs & Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e1dc] pb-3 gap-3">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`text-xs font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === 'recommendations'
                ? 'border-[#1c1c1a] text-[#1c1c1a]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Cleaning Recommendations ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('columns')}
            className={`text-xs font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === 'columns'
                ? 'border-[#1c1c1a] text-[#1c1c1a]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Column Diagnostic Overview ({profile.columns.length})
          </button>
          {executionResult && (
            <button
              onClick={() => setActiveTab('execution')}
              className={`text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'execution'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              Execution & Audit Log
            </button>
          )}
        </div>

        {activeTab === 'recommendations' && (
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            <span className="text-stone-500 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Filter:
            </span>
            {(['all', 'Low', 'Medium', 'High', 'pending', 'approved', 'rejected'] as ReviewFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  filter === f
                    ? 'bg-[#1c1c1a] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#e2e1dc] text-stone-700 hover:bg-stone-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'columns' ? (
        <ColumnOverview columns={profile.columns} />
      ) : activeTab === 'execution' && executionResult ? (
        <div className="space-y-6">
          <div className="bg-white border border-[#e2e1dc] rounded-lg p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e2e1dc] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  Transaction Successful
                </span>
                <h3 className="text-base font-bold text-[#1c1c1a] mt-1.5">Deterministic Cleaning Results</h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">Execution ID: {executionResult.execution_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload('csv')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1c1c1a] hover:bg-black text-white text-xs font-semibold rounded transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
                <button
                  onClick={() => handleDownload('xlsx')}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-[#e2e1dc] bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Excel
                </button>
              </div>
            </div>

            {/* Before / After Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-[#fbfbfa] border border-[#e2e1dc] p-3.5 rounded">
                <div className="text-[10px] uppercase text-stone-500 font-medium">Row Count</div>
                <div className="text-lg font-bold text-[#1c1c1a] mt-1">
                  {executionResult.original_row_count.toLocaleString()} → {executionResult.final_row_count.toLocaleString()}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  {executionResult.original_row_count - executionResult.final_row_count} rows removed
                </div>
              </div>
              <div className="bg-[#fbfbfa] border border-[#e2e1dc] p-3.5 rounded">
                <div className="text-[10px] uppercase text-stone-500 font-medium">Missing Cells</div>
                <div className="text-lg font-bold text-[#1c1c1a] mt-1">
                  {executionResult.total_missing_before} → {executionResult.total_missing_after}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  {executionResult.total_missing_before - executionResult.total_missing_after} imputed / resolved
                </div>
              </div>
              <div className="bg-[#fbfbfa] border border-[#e2e1dc] p-3.5 rounded">
                <div className="text-[10px] uppercase text-stone-500 font-medium">Duplicate Rows</div>
                <div className="text-lg font-bold text-[#1c1c1a] mt-1">
                  {executionResult.duplicate_rows_before} → {executionResult.duplicate_rows_after}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Exact duplicates removed</div>
              </div>
              <div className="bg-[#fbfbfa] border border-[#e2e1dc] p-3.5 rounded">
                <div className="text-[10px] uppercase text-stone-500 font-medium">Transaction Status</div>
                <div className="text-xs font-bold text-emerald-800 uppercase mt-1 tracking-wide">
                  {executionResult.status}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Immutable copy verified</div>
              </div>
            </div>

            {/* Audit Log */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Operation Audit Log</h4>
              <div className="space-y-2">
                {executionResult.audit_log.map((log: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between p-3.5 border border-[#e2e1dc] rounded bg-white text-xs gap-4 shadow-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          log.status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          log.status === 'blocked' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          log.status === 'skipped' ? 'bg-stone-100 text-stone-700 border border-stone-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                        <span className="font-semibold text-[#1c1c1a] truncate">{log.title}</span>
                      </div>
                      <p className="text-stone-600 leading-relaxed">{log.message}</p>
                    </div>
                    <div className="text-right font-mono text-[11px] text-stone-500 shrink-0">
                      Rows affected: <strong>{log.rows_affected}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cleaned Dataset Preview */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Cleaned Dataset Preview (First 10 Rows)</h4>
              <div className="overflow-x-auto border border-[#e2e1dc] rounded bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbfbfa] border-b border-[#e2e1dc] font-mono text-stone-600">
                    <tr>
                      {Object.keys(executionResult.preview_rows[0] || {}).map((col) => (
                        <th key={col} className="p-3 font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e1dc]">
                    {executionResult.preview_rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-stone-50">
                        {Object.values(row).map((val: any, cIdx: number) => (
                          <td key={cIdx} className="p-3 font-mono text-stone-800 truncate max-w-xs">
                            {val !== null && val !== undefined ? String(val) : <span className="text-stone-400 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.length === 0 ? (
            <div className="bg-white border border-[#e2e1dc] rounded-lg p-12 text-center text-xs text-stone-500 shadow-xs">
              No recommendations match the selected filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec.action_id}
                  recommendation={rec}
                  onUpdateStatus={onUpdateRecommendationStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
