import React from 'react';
import type { Recommendation } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onUpdateStatus: (actionId: string, status: 'pending' | 'approved' | 'rejected' | 'investigation') => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onUpdateStatus,
}) => {
  const getRiskBadgeStyles = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'High':
        return 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-emerald-800 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">Approved for execution</span>;
      case 'rejected':
        return <span className="text-stone-500 font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">Rejected</span>;
      case 'investigation':
        return <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Requires review</span>;
      default:
        return <span className="text-stone-600 font-mono text-[11px] bg-stone-50 px-2 py-0.5 rounded border border-[#e2e1dc]">Pending decision</span>;
    }
  };

  return (
    <div className="bg-white border border-[#e2e1dc] rounded-lg p-5 shadow-xs space-y-4 hover:border-stone-400 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getRiskBadgeStyles(recommendation.risk_level)}`}>
              {recommendation.risk_level} Risk
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs font-mono text-stone-600">
              Type: <strong className="text-[#1c1c1a]">{recommendation.issue_type}</strong>
            </span>
            {recommendation.column && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-xs font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  Column: <strong className="text-[#1c1c1a]">{recommendation.column}</strong>
                </span>
              </>
            )}
            {recommendation.confidence !== undefined && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-xs font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Confidence: {Math.round(recommendation.confidence * 100)}%
                </span>
              </>
            )}
          </div>
          <h4 className="text-sm font-semibold text-[#1c1c1a] pt-1">
            {recommendation.title}
          </h4>
        </div>
        <div className="shrink-0">
          {getStatusBadge(recommendation.execution_status)}
        </div>
      </div>

      <p className="text-xs text-stone-600 leading-relaxed">
        {recommendation.description}
      </p>

      {/* Action Details Grid */}
      <div className="bg-[#fbfbfa] border border-[#e2e1dc] p-3.5 rounded text-xs space-y-2 font-mono">
        <div className="flex items-start gap-2">
          <span className="text-stone-500 font-semibold w-32 shrink-0">Evidence:</span>
          <span className="text-stone-800">{recommendation.evidence}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-stone-500 font-semibold w-32 shrink-0">Proposed Action:</span>
          <span className="text-stone-800 font-medium">{recommendation.proposed_action}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-stone-500 font-semibold w-32 shrink-0">Rationale:</span>
          <span className="text-stone-800">{recommendation.rationale}</span>
        </div>
        {recommendation.alternatives.length > 0 && (
          <div className="flex items-start gap-2 pt-1 border-t border-[#e2e1dc]">
            <span className="text-stone-500 font-semibold w-32 shrink-0">Alternatives:</span>
            <span className="text-stone-600">{recommendation.alternatives.join(' · ')}</span>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-[#e2e1dc]">
        <div className="text-[11px] text-stone-500 font-mono">
          Impact: <strong className="text-[#1c1c1a]">{recommendation.affected_rows} rows</strong> ({recommendation.affected_percentage.toFixed(1)}%)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateStatus(recommendation.action_id, 'rejected')}
            className={`px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
              recommendation.execution_status === 'rejected'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'border-[#e2e1dc] bg-white text-stone-700 hover:bg-stone-100'
            }`}
          >
            Reject
          </button>
          <button
            onClick={() => onUpdateStatus(recommendation.action_id, 'approved')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-xs ${
              recommendation.execution_status === 'approved'
                ? 'bg-emerald-700 text-white border border-emerald-800'
                : 'bg-[#1c1c1a] text-white hover:bg-black'
            }`}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};
