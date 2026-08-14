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
  Shield,
  DollarSign,
  KeyRound,
  Check,
  X,
  UserX,
  UserCheck,
  Play,
  History,
  Receipt,
  Pause,
  RefreshCw,
} from "lucide-react";

export type TableActionVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "outline"
  | "ghost";

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-btn border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariants: Record<TableActionVariant, string> = {
  primary: "border-primary bg-primary text-white hover:bg-primary-hover",
  secondary:
    "border-surface-border bg-white text-gray-700 hover:bg-surface-hover hover:text-gray-900",
  danger:
    "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300",
  outline:
    "border-surface-border bg-transparent text-gray-700 hover:bg-surface-hover",
  ghost:
    "border-transparent bg-transparent text-gray-600 hover:bg-surface-hover hover:text-gray-900",
};

const Spinner = () => <Loader2 className="h-3.5 w-3.5 animate-spin" />;

export const tableActionIcons = {
  preview: () => <Eye className="h-3.5 w-3.5 shrink-0" />,
  edit: () => <Pencil className="h-3.5 w-3.5 shrink-0" />,
  publish: () => <Send className="h-3.5 w-3.5 shrink-0" />,
  submissions: () => <FileText className="h-3.5 w-3.5 shrink-0" />,
  review: () => <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />,
  close: () => <Lock className="h-3.5 w-3.5 shrink-0" />,
  archive: () => <Archive className="h-3.5 w-3.5 shrink-0" />,
  restore: () => <RotateCcw className="h-3.5 w-3.5 shrink-0" />,
  delete: () => <Trash2 className="h-3.5 w-3.5 shrink-0" />,
  permissions: () => <Shield className="h-3.5 w-3.5 shrink-0" />,
  salary: () => <DollarSign className="h-3.5 w-3.5 shrink-0" />,
  key: () => <KeyRound className="h-3.5 w-3.5 shrink-0" />,
  approve: () => <Check className="h-3.5 w-3.5 shrink-0" />,
  reject: () => <X className="h-3.5 w-3.5 shrink-0" />,
  suspend: () => <Pause className="h-3.5 w-3.5 shrink-0" />,
  drop: () => <UserX className="h-3.5 w-3.5 shrink-0" />,
  reactivate: () => <UserCheck className="h-3.5 w-3.5 shrink-0" />,
  start: () => <Play className="h-3.5 w-3.5 shrink-0" />,
  history: () => <History className="h-3.5 w-3.5 shrink-0" />,
  receipt: () => <Receipt className="h-3.5 w-3.5 shrink-0" />,
  refund: () => <RefreshCw className="h-3.5 w-3.5 shrink-0" />,
};

export const TableActionButton = ({
  variant = "secondary",
  disabled,
  loading = false,
  loadingLabel,
  icon,
  onClick,
  title,
  className = "",
  type = "button",
  children,
}: {
  variant?: TableActionVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  children: ReactNode;
}) => (
  <button
    type={type}
    title={title}
    disabled={disabled || loading}
    onClick={onClick}
    className={`${buttonClass} ${buttonVariants[variant]} ${className}`}
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

