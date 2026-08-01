import type { ReactNode } from "react";

export type TableActionVariant = "primary" | "secondary" | "danger";

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariants: Record<TableActionVariant, string> = {
  primary: "border-primary bg-primary text-white hover:bg-primary-hover",
  secondary:
    "border-surface-border bg-white text-gray-700 hover:bg-surface-hover",
  danger: "border-red-200 bg-white text-red-600 hover:bg-red-50",
};

const Spinner = () => (
  <svg
    className="h-3.5 w-3.5 animate-spin"
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
);

const Icon = ({ paths }: { paths: string[] }) => (
  <svg
    className="h-4 w-4 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    {paths.map((path) => (
      <path
        key={path}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={path}
      />
    ))}
  </svg>
);

export const tableActionIcons = {
  preview: () => (
    <Icon
      paths={[
        "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
      ]}
    />
  ),
  edit: () => (
    <Icon
      paths={[
        "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
      ]}
    />
  ),
  publish: () => <Icon paths={["M12 19l9 2-9-18-9 18 9-2zm0 0v-8"]} />,
  submissions: () => (
    <Icon
      paths={[
        "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      ]}
    />
  ),
  review: () => (
    <Icon
      paths={[
        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
      ]}
    />
  ),
  close: () => (
    <Icon
      paths={[
        "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
      ]}
    />
  ),
  archive: () => (
    <Icon
      paths={[
        "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
      ]}
    />
  ),
  restore: () => (
    <Icon
      paths={[
        "M3 10h7V3",
        "M3 10l5-5a8 8 0 111.5 13.5",
      ]}
    />
  ),
  delete: () => (
    <Icon
      paths={[
        "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
      ]}
    />
  ),
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
