import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ConfirmVariant = "danger" | "warning" | "primary" | "emerald";

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
};

interface ConfirmModalProps extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bgIcon: "bg-red-100 text-red-600",
      btnConfirm: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    warning: {
      bgIcon: "bg-amber-100 text-amber-600",
      btnConfirm: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    emerald: {
      bgIcon: "bg-emerald-100 text-emerald-600",
      btnConfirm: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    primary: {
      bgIcon: "bg-blue-100 text-blue-600",
      btnConfirm: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const style = variantStyles[variant] || variantStyles.primary;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]">
      <div
        className="fixed inset-0"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 transform transition-all animate-[slideIn_0.2s_ease-out]">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${style.bgIcon}`}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-semibold text-gray-900 leading-6">
              {title}
            </h3>
            <div className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {message}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-hidden transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-xs focus:outline-hidden transition-colors ${style.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    if (confirmState) {
      confirmState.resolve(true);
      setConfirmState(null);
    }
  };

  const handleCancel = () => {
    if (confirmState) {
      confirmState.resolve(false);
      setConfirmState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState && (
        <ConfirmDialog
          isOpen={true}
          title={confirmState.options.title}
          message={confirmState.options.message}
          confirmText={confirmState.options.confirmText}
          cancelText={confirmState.options.cancelText}
          variant={confirmState.options.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};
