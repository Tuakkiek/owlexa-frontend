import type { ButtonHTMLAttributes, ReactNode } from "react";

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
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
