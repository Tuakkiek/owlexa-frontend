import { createContext, useContext } from "react";

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

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    const fallback = (message: string) => console.log("[Toast]", message);
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
