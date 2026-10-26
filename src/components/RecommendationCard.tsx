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
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-emerald-700 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Approved for future execution</span>;
      case 'rejected':
        return <span className="text-stone-500 font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">Rejected</span>;
      case 'investigation':
        return <span className="text-amber-700 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Requires investigation</span>;
      default:
        return <span className="text-stone-600 font-mono text-[11px] bg-stone-50 px-2 py-0.5 rounded border border-stone-200">Pending review</span>;
    }
  };

  return (
    <div className="bg-white border border-[#e6e5e0] rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getRiskBadgeColor(recommendation.risk_level)}`}>
              {recommendation.risk_level} Risk
            </span>
            {recommendation.column && (
              <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                Column: {recommendation.column}
              </span>
            )}
            {recommendation.confidence !== undefined && (
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                AI Confidence: {Math.round(recommendation.confidence * 100)}%
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-[#1c1c1a] mt-2">
            {recommendation.title}
          </h4>
        </div>
        <div>
          {getStatusBadge(recommendation.execution_status)}
        </div>
      </div>

      <p className="text-xs text-stone-600 leading-relaxed">
        {recommendation.description}
      </p>

      <div className="bg-[#f7f6f3] border border-[#e6e5e0] p-4 rounded text-xs space-y-2 font-mono">
        <div>
          <span className="text-stone-500 font-semibold">Evidence:</span> <span className="text-stone-800">{recommendation.evidence}</span>
        </div>
        <div>
          <span className="text-stone-500 font-semibold">Proposed Action:</span> <span className="text-stone-800">{recommendation.proposed_action}</span>
        </div>
        <div>
          <span className="text-stone-500 font-semibold">Rationale:</span> <span className="text-stone-800">{recommendation.rationale}</span>
        </div>
        {recommendation.alternatives.length > 0 && (
          <div>
            <span className="text-stone-500 font-semibold">Alternatives:</span> <span className="text-stone-800">{recommendation.alternatives.join(' · ')}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#e6e5e0]">
        <div className="text-[11px] text-stone-500 font-mono">
          Affected: {recommendation.affected_rows} rows ({recommendation.affected_percentage.toFixed(1)}%)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateStatus(recommendation.action_id, 'rejected')}
            className={`px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
              recommendation.execution_status === 'rejected'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'border-[#e6e5e0] bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            Reject
          </button>
          <button
            onClick={() => onUpdateStatus(recommendation.action_id, 'approved')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              recommendation.execution_status === 'approved'
                ? 'bg-emerald-700 text-white'
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
