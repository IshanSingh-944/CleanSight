import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { EmptyState } from './ui/Layout';

type Tab = 'overview' | 'columns' | 'types' | 'missing' | 'quality';

interface DataIntelligenceProps {
  datasetId: string;
}

export const DataIntelligence: React.FC<DataIntelligenceProps> = ({ datasetId }) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [extended, setExtended] = useState<any>(null);
  const [quality, setQuality] = useState<any>(null);
  const [missing, setMissing] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pResp, qResp, mResp, cResp] = await Promise.all([
        fetch(`${API_BASE_URL}/api/profiling/datasets/${datasetId}/profile`),
        fetch(`${API_BASE_URL}/api/profiling/datasets/${datasetId}/quality-score`),
        fetch(`${API_BASE_URL}/api/profiling/datasets/${datasetId}/missing-analysis`),
        fetch(`${API_BASE_URL}/api/profiling/datasets/${datasetId}/columns`),
      ]);
      if (!pResp.ok) throw new Error('Failed to load profile');
      if (!qResp.ok) throw new Error('Failed to load quality score');
      if (!mResp.ok) throw new Error('Failed to load missing analysis');
      if (!cResp.ok) throw new Error('Failed to load columns');

      const [p, q, m, c] = await Promise.all([pResp.json(), qResp.json(), mResp.json(), cResp.json()]);
      setExtended(p);
      setQuality(q);
      setMissing(m);
      setColumns(c);
    } catch (err: any) {
      setError(err.message || 'Failed to load data intelligence.');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F4] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#252A2E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F7F4] flex items-center justify-center p-6">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center max-w-md">
          <h3 className="text-sm font-semibold text-rose-800 mb-2">Failed to load intelligence</h3>
          <p className="text-xs text-[#69747D] mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchAll}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#252A2E] font-sans antialiased">
      <div className="border-b border-[#E1E5E3] bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="text-xs font-medium text-[#69747D] hover:text-[#252A2E] flex items-center gap-1"
              onClick={() => {}}
            >
              ← Back to dataset
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#2868A6] flex items-center justify-center text-[10px] font-bold text-white tracking-wider">
                CS
              </div>
              <span className="font-bold text-sm tracking-tight text-[#252A2E]">CleanSight AI</span>
            </div>
            <span className="text-[10px] font-mono text-[#69747D] bg-[#F7F7F4] px-2.5 py-1 rounded border border-[#E1E5E3]">
              Dataset {datasetId}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#E1E5E3] mb-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'columns', label: 'Column Profiling' },
            { id: 'types', label: 'Data Types' },
            { id: 'missing', label: 'Missing Values' },
            { id: 'quality', label: 'Data Quality' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`-mb-px border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'border-[#2868A6] text-[#252A2E]'
                  : 'border-transparent text-[#69747D] hover:text-[#252A2E] hover:bg-[#F7F7F4]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab extended={extended} quality={quality} />}
        {tab === 'columns' && <ColumnsTab columns={columns} />}
        {tab === 'types' && <TypesTab columns={columns} />}
        {tab === 'missing' && <MissingTab missing={missing} columns={columns} />}
        {tab === 'quality' && <QualityTab quality={quality} />}
      </div>
    </div>
  );
};

type StatCardProps = { label: string; value: string | number; sub?: string; };
const StatCard: React.FC<StatCardProps> = ({ label, value, sub }) => (
  <Card padding="md" className="border">
    <p className="text-[10px] font-medium uppercase tracking-wider text-[#69747D] mb-1">{label}</p>
    <div className="text-2xl font-bold text-[#252A2E]">{value}</div>
    {sub && <p className="text-[10px] text-[#69747D] mt-1">{sub}</p>}
  </Card>
);

const OverviewTab: React.FC<{ extended: any; quality: any }> = ({
  extended, quality,
}) => {
  const qs = quality?.overall_score;
  const missingPct = extended?.missing_percentage ?? 0;
  const dupCount = extended?.duplicate_row_count ?? 0;
  const typeDist = extended?.type_distribution || {};
  const totalCols = extended?.column_count ?? 0;

  const topIssues = [];
  if (missingPct > 0) topIssues.push({ label: 'Missing values', count: extended?.total_missing_cells ?? 0 });
  if (dupCount > 0) topIssues.push({ label: 'Duplicate rows', count: dupCount });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#252A2E]">Data Overview</h2>
        <p className="text-xs text-[#69747D] mt-1">Dataset-level summary for {extended?.filename}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total records" value={extended?.row_count?.toLocaleString() ?? 0} sub="Rows in dataset" />
        <StatCard label="Total columns" value={totalCols} sub="Profiled columns" />
        <StatCard label="Quality score" value={qs == null ? 'N/A' : qs} sub="0 = poor, 100 = excellent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Missing cells" value={extended?.total_missing_cells ?? 0} sub={`${missingPct.toFixed(2)}% of all cells`} />
        <StatCard label="Duplicate rows" value={dupCount} sub="Exact duplicate records" />
        <StatCard label="Memory usage" value={extended?.memory_usage_bytes ? (extended.memory_usage_bytes / 1024).toFixed(1) + ' KB' : 'N/A'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(typeDist as Record<string, number>).map(([type, count]) => (
            <Card key={type} padding="sm" className="border text-center">
              <p className="text-[10px] font-medium text-[#69747D]">{type}</p>
              <p className="text-xs font-bold text-[#252A2E]">{count}</p>
            </Card>
          ))}
        </div>
      </div>

      {topIssues.length > 0 && (
        <div className="bg-[#FFF3E2] border border-[#FDE68A] rounded-lg p-4">
          <h4 className="text-xs font-semibold text-[#92400E] mb-2">Top data-quality issues</h4>
          <div className="space-y-2">
            {topIssues.map((issue) => (
              <div key={issue.label} className="flex justify-between text-xs">
                <span className="text-[#69747D]">{issue.label}</span>
                <span className="font-mono text-[#252A2E]">{issue.count}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-[#69747D]">
            Review details in the Column Profiling and Data Quality tabs.
          </p>
        </div>
      )}
    </div>
  );
};

const ColumnsTab: React.FC<{ columns: any[] }> = ({ columns }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#252A2E]">Column Profiling</h2>
        <p className="text-xs text-[#69747D] mt-1">Per-column statistics and data quality.</p>
      </div>

      {columns.length === 0 && (
        <EmptyState title="No columns" description="No column profiles available." />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E1E5E3] text-[10px] font-medium uppercase tracking-wider text-[#69747D]">
              <th className="pb-3 font-medium text-[#252A2E]">Column</th>
              <th className="pb-3 font-medium text-[#252A2E]">Detected type</th>
              <th className="pb-3 font-medium text-[#252A2E]">Missing %</th>
              <th className="pb-3 font-medium text-[#252A2E]">Unique values</th>
              <th className="pb-3 font-medium text-[#252A2E]">Quality status</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col) => (
              <tr key={col.name} className="border-b border-[#E1E5E3] hover:bg-[#F7F7F4] transition-colors">
                <td className="py-4 text-sm font-medium text-[#252A2E]">{col.name}</td>
                <td className="py-4 text-xs font-mono">
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] ${
                    col.semantic_type === 'numeric' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    col.semantic_type === 'categorical' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    col.semantic_type === 'datetime' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-stone-50 text-stone-700 border-stone-200'
                  }`}>{col.semantic_type}</span>
                </td>
                <td className="py-4 text-xs font-mono text-[#69747D]">{col.null_percentage.toFixed(1)}%</td>
                <td className="py-4 text-xs font-mono text-[#69747D]">{col.unique_count}</td>
                <td className="py-4">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${
                    col.null_percentage > 20 ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    col.null_percentage > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {col.null_percentage > 20 ? 'Review needed' : col.null_percentage > 0 ? 'Minor issues' : 'Clean'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-[#69747D] mt-2">
        Select the Data Types tab to review suggested semantic types, or the Missing Values tab for treatment recommendations.
      </p>
    </div>
  );
};

const TypesTab: React.FC<{ columns: any[] }> = ({ columns }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#252A2E]">Data Types</h2>
        <p className="text-xs text-[#69747D] mt-1">Original vs suggested semantic types with confidence.</p>
      </div>

      {columns.length === 0 && (
        <EmptyState title="No column types" description="No type inference results available." />
      )}

      <div className="space-y-3">
        {columns.map((col) => (
          <Card key={col.name} padding="md" className="border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-medium text-[#252A2E] text-sm">{col.name}</div>
                <div className="text-[10px] text-[#69747D] font-mono">Original: {col.original_type}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${
                  col.semantic_type === 'identifier' || col.semantic_type === 'phone' || col.semantic_type === 'postal_code'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>{col.semantic_type}</span>
                <span className={`text-[10px] font-mono ${col.confidence >= 0.8 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {(col.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
            <p className="text-xs text-[#69747D] mt-3">{col.explanation}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-[#69747D] font-mono">Examples:</span>
              <span className="text-[10px] text-[#9CA3AF] break-all">{col.example_values.join(', ')}</span>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-[#69747D]">
        Identifier, phone, and postal-code columns are kept as text (not converted to numeric) to preserve their meaning.
      </p>
    </div>
  );
};

const MissingTab: React.FC<{ missing: any; columns: any[] }> = ({ missing }) => {
  const cols: any[] = missing?.columns || [];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#252A2E]">Missing Values</h2>
        <p className="text-xs text-[#69747D] mt-1">
          Missing-value analysis with defensible treatment recommendations. Nothing is executed automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total missing cells" value={missing?.total_missing_cells ?? 0} />
        <StatCard label="Columns affected" value={missing?.columns_with_missing ?? 0} />
        <StatCard label="Overall missing %" value={`${(missing?.overall_missing_percentage ?? 0).toFixed(2)}%`} />
        <StatCard label="Rows" value={missing?.total_rows ?? 0} />
      </div>

      {cols.length === 0 && (
        <EmptyState title="No missing values" description="All columns are fully populated." />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E1E5E3] text-[10px] font-medium uppercase tracking-wider text-[#69747D]">
              <th className="pb-3 font-medium text-[#252A2E]">Column</th>
              <th className="pb-3 font-medium text-[#252A2E]">Missing</th>
              <th className="pb-3 font-medium text-[#252A2E]">Pattern</th>
              <th className="pb-3 font-medium text-[#252A2E]">Recommended treatment</th>
              <th className="pb-3 font-medium text-[#252A2E]">Risk</th>
            </tr>
          </thead>
          <tbody>
            {cols.map((col: any) => (
              <tr key={col.column} className="border-b border-[#E1E5E3] hover:bg-[#F7F7F4] transition-colors">
                <td className="py-4 text-sm font-medium text-[#252A2E]">{col.column}</td>
                <td className="py-4 text-xs font-mono text-[#69747D]">
                  {col.missing_count} ({col.missing_percentage.toFixed(1)}%)
                </td>
                <td className="py-4 text-xs font-mono text-[#69747D]">{col.missing_pattern}</td>
                <td className="py-4 text-xs text-[#69747D]">{col.recommendation.method ?? '—'}</td>
                <td className="py-4">
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${
                    col.recommendation.risk_level === 'High' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    col.recommendation.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>{col.recommendation.risk_level}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cols.length > 0 && (
        <div className="bg-[#F7F7F4] border border-[#E1E5E3] rounded-lg p-4">
          <h4 className="text-xs font-semibold text-[#252A2E] mb-2">Recommendation details</h4>
          <div className="space-y-2">
            {cols.slice(0, 3).map((col) => (
              <div key={col.column} className="text-xs">
                <div className="font-medium text-[#252A2E]">{col.column} → {col.recommendation.method}</div>
                <div className="text-[10px] text-[#69747D]">{col.recommendation.reason}</div>
                {col.recommendation.approval_required && (
                  <span className="text-[10px] text-[#92400E] font-medium mt-1">⚠ Requires approval before execution</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const QualityTab: React.FC<{ quality: any }> = ({ quality }) => {
  const qs = quality?.overall_score;
  const dims = quality?.dimensions || {};
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#252A2E]">Data Quality Score</h2>
        <p className="text-xs text-[#69747D] mt-1">
          Transparent 0-100 score across completeness, validity, uniqueness, and consistency. An estimate, not a guarantee.
        </p>
      </div>

      const qs = quality?.overall_score;

      <div className="flex items-center gap-8">
        <div className="w-32 h-32 flex flex-col items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90" fill="none" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" stroke="#E1E5E3" strokeWidth="3" />
            <Circle stroke="#2868A6" strokeWidth="3" strokeDasharray={`${qs == null ? 0 : (qs/100)*97.3} 97.3`} cx="18" cy="18" r="15.5" />
          </svg>
          <div className="mt-2 text-2xl font-bold text-[#252A2E]">{qs == null ? 'N/A' : qs}</div>
          <div className="text-[10px] text-[#69747D]">0–100</div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#252A2E] mb-4">Dimension scores</h3>
          <div className="space-y-3">
            {['completeness', 'uniqueness', 'validity', 'consistency'].map((key) => {
              const d = dims[key];
              const score = d?.score;
              return (
                <div key={key} className="flex items-center gap-4">
                  <span className="w-16 text-[10px] font-medium text-[#69747D]">{key}</span>
                  <div className="flex-1 h-1.5 bg-[#E1E5E3] rounded overflow-hidden">
                    <div className={`h-full bg-[#2868A6] w-[${score == null ? 0 : score}%]`} />
                  </div>
                  <span className="w-10 text-xs font-mono text-right text-[#252A2E]">{score == null ? 'N/A' : score}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[10px] text-[#69747D]">{quality?.note}</p>
        </div>
      </div>

      {quality?.issues?.length > 0 && (
        <Card padding="md" className="border">
          <h3 className="text-sm font-semibold text-[#252A2E] mb-3">Issue breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quality.issues.map((issue: any) => (
              <div key={issue.type} className="flex justify-between items-center p-3 bg-white border border-[#E1E5E3] rounded">
                <div>
                  <div className="text-xs font-medium text-[#252A2E]">{issue.type}</div>
                  <div className="text-[10px] text-[#69747D]">{issue.dimension} dimension</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#252A2E]">{issue.count}</div>
                  <div className="text-[10px] text-[#69747D]">records</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const Circle = ({ stroke, strokeWidth, strokeDasharray, cx, cy, r }: any) => (
  <circle cx={cx} cy={cy} r={r} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} fill="none" strokeLinecap="round" />
);
