import React, { useState } from 'react';
import { Play, Download, CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-8 max-w-4xl mx-auto py-8 px-6">
      <div className="space-y-2">
        <div className="text-xs text-stone-500 font-mono">
          Workspace / Dataset review, AI planning & deterministic execution
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[#1c1c1a] m-0">
            Data Quality & Cleaning Review
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExecuteCleaning}
              disabled={isExecuting || approvedCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isExecuting ? 'Applying Changes...' : `Apply Approved Changes (${approvedCount})`}
            </button>
            <button
              onClick={onReset}
              className="px-3 py-2 rounded border border-[#e6e5e0] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors"
            >
              Upload new dataset
            </button>
          </div>
        </div>
        <p className="text-xs text-stone-600">
          Inspect profile metrics, generate AI recommendations, approve actions, and execute deterministic cleaning on an independent working copy.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      <WorkflowStatus step={3} />

      <DatasetSummary profile={profile} />

      <div className="bg-white border border-[#e6e5e0] rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#1c1c1a]">AI Cleaning Planner</h3>
        <p className="text-xs text-stone-500">
          Specify your analytical objective to generate context-aware cleaning recommendations from profiler findings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. Prepare dataset for regression modeling"
            className="flex-1 px-3 py-2 text-xs border border-[#e6e5e0] rounded bg-[#f7f6f3] focus:outline-none focus:border-stone-500"
          />
          <button
            onClick={handlePlanClick}
            disabled={isPlanning}
            className="px-4 py-2 bg-[#1c1c1a] hover:bg-black text-white text-xs font-medium rounded transition-colors disabled:opacity-50 shrink-0"
          >
            {isPlanning ? 'Generating Plan...' : 'Generate AI Recommendations'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#e6e5e0] pb-2">
        <div className="flex space-x-4">
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
            Column Overview ({profile.columns.length})
          </button>
          {executionResult && (
            <button
              onClick={() => setActiveTab('execution')}
              className={`text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'execution'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Execution Results & Audit Log
            </button>
          )}
        </div>
      </div>

      {activeTab === 'columns' ? (
        <ColumnOverview columns={profile.columns} />
      ) : activeTab === 'execution' && executionResult ? (
        <div className="space-y-6">
          <div className="bg-white border border-[#e6e5e0] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1c1c1a]">Deterministic Execution Summary</h3>
                <p className="text-xs text-stone-500">Execution ID: {executionResult.execution_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload('csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1a] hover:bg-black text-white text-xs font-medium rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
                <button
                  onClick={() => handleDownload('xlsx')}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e6e5e0] bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Excel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-[#e6e5e0]">
              <div className="bg-[#f7f6f3] p-3 rounded">
                <div className="text-[10px] uppercase font-mono text-stone-500">Row Count</div>
                <div className="text-lg font-bold text-[#1c1c1a]">
                  {executionResult.original_row_count} → {executionResult.final_row_count}
                </div>
                <div className="text-[10px] text-stone-500">
                  {executionResult.original_row_count - executionResult.final_row_count} rows removed
                </div>
              </div>
              <div className="bg-[#f7f6f3] p-3 rounded">
                <div className="text-[10px] uppercase font-mono text-stone-500">Missing Cells</div>
                <div className="text-lg font-bold text-[#1c1c1a]">
                  {executionResult.total_missing_before} → {executionResult.total_missing_after}
                </div>
                <div className="text-[10px] text-stone-500">
                  {executionResult.total_missing_before - executionResult.total_missing_after} imputed/resolved
                </div>
              </div>
              <div className="bg-[#f7f6f3] p-3 rounded">
                <div className="text-[10px] uppercase font-mono text-stone-500">Duplicate Rows</div>
                <div className="text-lg font-bold text-[#1c1c1a]">
                  {executionResult.duplicate_rows_before} → {executionResult.duplicate_rows_after}
                </div>
              </div>
              <div className="bg-[#f7f6f3] p-3 rounded">
                <div className="text-[10px] uppercase font-mono text-stone-500">Execution Status</div>
                <div className="text-xs font-bold text-emerald-700 uppercase mt-1">
                  {executionResult.status}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Audit Log & Actions Applied</h4>
              <div className="space-y-2">
                {executionResult.audit_log.map((log: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between p-3 border border-[#e6e5e0] rounded bg-white text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          log.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                          log.status === 'blocked' ? 'bg-amber-100 text-amber-800' :
                          log.status === 'skipped' ? 'bg-stone-100 text-stone-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                        <span className="font-semibold text-[#1c1c1a]">{log.title}</span>
                      </div>
                      <p className="text-stone-600">{log.message}</p>
                    </div>
                    <div className="text-right font-mono text-[10px] text-stone-500 shrink-0">
                      Rows affected: {log.rows_affected}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Cleaned Dataset Preview (First 10 Rows)</h4>
              <div className="overflow-x-auto border border-[#e6e5e0] rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f7f6f3] border-b border-[#e6e5e0] font-mono text-stone-600">
                    <tr>
                      {Object.keys(executionResult.preview_rows[0] || {}).map((col) => (
                        <th key={col} className="p-2 font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e5e0]">
                    {executionResult.preview_rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-stone-50">
                        {Object.values(row).map((val: any, cIdx: number) => (
                          <td key={cIdx} className="p-2 font-mono text-stone-700 truncate max-w-xs">
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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-500 font-medium mr-2">Filter:</span>
            {(['all', 'Low', 'Medium', 'High', 'pending', 'approved', 'rejected'] as ReviewFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs font-mono capitalize transition-colors ${
                  filter === f
                    ? 'bg-[#1c1c1a] text-white'
                    : 'bg-white border border-[#e6e5e0] text-stone-700 hover:bg-stone-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredRecommendations.length === 0 ? (
            <div className="bg-white border border-[#e6e5e0] rounded-lg p-12 text-center text-xs text-stone-500">
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
