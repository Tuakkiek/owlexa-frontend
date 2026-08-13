import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md";
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  const variants = {
    primary: "border-primary bg-primary text-white hover:bg-primary-hover",
    secondary:
      "border-surface-border bg-white text-gray-900 hover:bg-surface-hover",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    outline:
      "border-surface-border bg-transparent text-gray-700 hover:bg-surface-hover",
    ghost:
      "border-transparent bg-transparent text-gray-600 hover:bg-surface-hover hover:text-gray-900",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-btn border font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${sizeStyles[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-current" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
