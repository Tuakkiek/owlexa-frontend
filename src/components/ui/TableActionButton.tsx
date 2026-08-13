import type { ReactNode } from "react";
import {
  Eye,
  Pencil,
  Send,
  FileText,
  ClipboardCheck,
  Lock,
  Archive,
  RotateCcw,
  Trash2,
  Loader2,
} from "lucide-react";

export type TableActionVariant = "primary" | "secondary" | "danger";

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariants: Record<TableActionVariant, string> = {
  primary: "border-primary bg-primary text-white hover:bg-primary-hover",
  secondary:
    "border-surface-border bg-white text-gray-700 hover:bg-surface-hover",
  danger: "border-red-200 bg-white text-red-600 hover:bg-red-50",
};

const Spinner = () => <Loader2 className="h-3.5 w-3.5 animate-spin" />;

export const tableActionIcons = {
  preview: () => <Eye className="h-4 w-4 shrink-0" />,
  edit: () => <Pencil className="h-4 w-4 shrink-0" />,
  publish: () => <Send className="h-4 w-4 shrink-0" />,
  submissions: () => <FileText className="h-4 w-4 shrink-0" />,
  review: () => <ClipboardCheck className="h-4 w-4 shrink-0" />,
  close: () => <Lock className="h-4 w-4 shrink-0" />,
  archive: () => <Archive className="h-4 w-4 shrink-0" />,
  restore: () => <RotateCcw className="h-4 w-4 shrink-0" />,
  delete: () => <Trash2 className="h-4 w-4 shrink-0" />,
};

export const TableActionButton = ({
  variant = "secondary",
  disabled,
  loading = false,
  loadingLabel,
  icon,
  onClick,
  title,
  children,
}: {
  variant?: TableActionVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
  onClick?: () => void;
  title?: string;
  children: ReactNode;
}) => (
  <button
    type="button"
    title={title}
    disabled={disabled || loading}
    onClick={onClick}
    className={`${buttonClass} ${buttonVariants[variant]}`}
  >
    {loading ? (
      <>
        <Spinner />
        <span>{loadingLabel ?? "Đang xử lý..."}</span>
      </>
    ) : (
      <>
        {icon}
        <span>{children}</span>
      </>
    )}
  </button>
);
