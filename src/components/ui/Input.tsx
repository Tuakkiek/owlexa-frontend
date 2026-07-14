import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary disabled:bg-surface-hover disabled:text-gray-400 ${
            error ? "border-red-300 focus:border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  },
);

Input.displayName = "Input";
