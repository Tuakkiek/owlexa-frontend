import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  toast: {
    (message: string, type?: ToastType): void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const toastObj = useCallback(
    Object.assign(
      (message: string, type: ToastType = "info") => addToast(message, type),
      {
        success: (message: string) => addToast(message, "success"),
        error: (message: string) => addToast(message, "error"),
        info: (message: string) => addToast(message, "info"),
        warning: (message: string) => addToast(message, "warning"),
      }
    ),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: toastObj, showToast: addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-md w-full px-4 sm:px-0 sm:w-auto">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback stub if used outside provider (prevents crash)
    const fallback = (msg: string) => console.log("[Toast]", msg);
    return {
      toast: Object.assign(fallback, {
        success: fallback,
        error: fallback,
        info: fallback,
        warning: fallback,
      }),
      showToast: fallback,
    };
  }
  return context;
};

const ToastCard = ({ toast, onClose }: { toast: ToastItem; onClose: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const config = {
    success: {
      borderColor: "border-emerald-200 bg-emerald-50/90 text-emerald-950",
      iconBg: "bg-emerald-100 text-emerald-600",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      borderColor: "border-red-200 bg-red-50/90 text-red-950",
      iconBg: "bg-red-100 text-red-600",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      borderColor: "border-amber-200 bg-amber-50/90 text-amber-950",
      iconBg: "bg-amber-100 text-amber-600",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      borderColor: "border-blue-200 bg-blue-50/90 text-blue-950",
      iconBg: "bg-blue-100 text-blue-600",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const style = config[toast.type] || config.info;

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 min-w-[300px] max-w-md rounded-xl border p-4 shadow-xl backdrop-blur-xs transition-all duration-300 transform ${
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
      } ${style.borderColor}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}>
          {style.icon}
        </div>
        <p className="text-sm font-medium leading-snug break-words">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-black/5 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
