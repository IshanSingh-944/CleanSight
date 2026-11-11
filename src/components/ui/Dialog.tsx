import React from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, description, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-center items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              {title && (
                <div className="sm:flex sm:items-start sm:justify-between">
                  <h3 className="text-base font-semibold leading-6 text-[#252A2E]">{title}</h3>
                </div>
              )}
              {description && (
                <p className="mt-3 text-sm text-[#69747D]">{description}</p>
              )}
            </div>
            <div className="bg-[#F7F7F4] px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                onClick={onClose}
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-[#E1E5E3] px-4 py-2 text-xs font-medium shadow-sm ring-1 ring-inset ring-[#E1E5E3] text-[#252A2E] sm:ml-3 sm:w-auto transition-colors hover:bg-[#E1E5E3]"
              >
                Cancel
              </button>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
