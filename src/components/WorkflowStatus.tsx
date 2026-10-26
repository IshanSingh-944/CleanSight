import React from 'react';

interface WorkflowStatusProps {
  step: number;
}

export const WorkflowStatus: React.FC<WorkflowStatusProps> = ({ step }) => {
  const steps = [
    "File uploaded",
    "Dataset profiled",
    "Recommendations reviewed",
    "Ready for next phase"
  ];

  return (
    <div className="bg-white border border-[#e6e5e0] rounded-lg p-4 flex items-center justify-between text-xs text-stone-600">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isCurrent = step === stepNum;
        const isCompleted = step > stepNum;
        return (
          <div key={label} className="flex items-center space-x-2">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                isCompleted
                  ? 'bg-emerald-600 text-white'
                  : isCurrent
                  ? 'bg-[#1c1c1a] text-white'
                  : 'bg-stone-100 text-stone-500 border border-stone-300'
              }`}
            >
              {isCompleted ? '✓' : stepNum}
            </div>
            <span className={isCurrent ? 'font-semibold text-[#1c1c1a]' : 'text-stone-500'}>
              {label}
            </span>
            {idx < steps.length - 1 && <span className="text-stone-300 px-2">→</span>}
          </div>
        );
      })}
    </div>
  );
};
