import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`max-h-[calc(100vh-2rem)] w-full ${maxWidth} overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl text-left animate-scale-in`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-slate-50/50">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition-all active:scale-95"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
