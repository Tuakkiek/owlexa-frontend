import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CircleCheck, CircleX, TriangleAlert, Info, X } from "lucide-react";
import {
  ToastContext,
  type ToastItem,
  type ToastType,
} from "./Toast";

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

  const toastObj = useMemo(
    () =>
      Object.assign(
        (message: string, type: ToastType = "info") =>
          addToast(message, type),
        {
          success: (message: string) => addToast(message, "success"),
          error: (message: string) => addToast(message, "error"),
          info: (message: string) => addToast(message, "info"),
          warning: (message: string) => addToast(message, "warning"),
        },
      ),
    [addToast],
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
      icon: <CircleCheck className="h-5 w-5" />,
    },
    error: {
      borderColor: "border-red-200 bg-red-50/90 text-red-950",
      iconBg: "bg-red-100 text-red-600",
      icon: <CircleX className="h-5 w-5" />,
    },
    warning: {
      borderColor: "border-amber-200 bg-amber-50/90 text-amber-950",
      iconBg: "bg-amber-100 text-amber-600",
      icon: <TriangleAlert className="h-5 w-5" />,
    },
    info: {
      borderColor: "border-blue-200 bg-blue-50/90 text-blue-950",
      iconBg: "bg-blue-100 text-blue-600",
      icon: <Info className="h-5 w-5" />,
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
        aria-label="Đóng thông báo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
