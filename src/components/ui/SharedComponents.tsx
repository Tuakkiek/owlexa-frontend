import type { ReactNode } from "react";

/* ───────────────────────────────────────────
 *  PageHeader — unified page title + actions
 * ─────────────────────────────────────────── */
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export const PageHeader = ({
  title,
  description,
  children,
}: PageHeaderProps) => (
  <div className="flex flex-col gap-4 border-b border-surface-border pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
    {children && <div className="flex items-center gap-3">{children}</div>}
  </div>
);

/* ───────────────────────────────────────────
 *  StatCard — consistent stats display
 * ─────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export const StatCard = ({ label, value, helper }: StatCardProps) => (
  <div className="rounded-card border border-surface-border bg-white p-6">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
  </div>
);

/* ───────────────────────────────────────────
 *  Card — standard container
 * ─────────────────────────────────────────── */
interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => (
  <div
    className={`rounded-card border border-surface-border bg-white p-6 ${className}`}
  >
    {children}
  </div>
);

/* ───────────────────────────────────────────
 *  EmptyState
 * ─────────────────────────────────────────── */
interface EmptyStateProps {
  message: string;
  icon?: string;
  children?: ReactNode;
}

export const EmptyState = ({
  message,
  icon = "📭",
  children,
}: EmptyStateProps) => (
  <div className="rounded-card border border-dashed border-surface-border bg-surface-page p-12 text-center">
    <div className="mb-4 text-4xl">{icon}</div>
    <p className="text-sm text-gray-500">{message}</p>
    {children && <div className="mt-4">{children}</div>}
  </div>
);

/* ───────────────────────────────────────────
 *  LoadingSkeleton
 * ─────────────────────────────────────────── */
interface LoadingSkeletonProps {
  count?: number;
  height?: string;
}

export const LoadingSkeleton = ({
  count = 3,
  height = "h-20",
}: LoadingSkeletonProps) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`${height} animate-pulse rounded-card bg-surface-hover`}
      />
    ))}
  </div>
);

/* ───────────────────────────────────────────
 *  ErrorBanner
 * ─────────────────────────────────────────── */
interface ErrorBannerProps {
  message: string;
}

export const ErrorBanner = ({ message }: ErrorBannerProps) => (
  <div className="rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {message}
  </div>
);

/* ───────────────────────────────────────────
 *  Badge — status pill
 * ─────────────────────────────────────────── */
interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const badgeVariants = {
  default: "bg-surface-hover text-gray-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
};

export const Badge = ({ children, variant = "default" }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeVariants[variant]}`}
  >
    {children}
  </span>
);

/* ───────────────────────────────────────────
 *  SearchInput — standardized search field
 * ─────────────────────────────────────────── */
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
}: SearchInputProps) => (
  <div className="relative max-w-sm">
    <svg
      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-input border border-surface-border bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary"
    />
  </div>
);

/* ───────────────────────────────────────────
 *  FilterTabs — pill-style filter tabs
 * ─────────────────────────────────────────── */
interface FilterTab {
  key: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export const FilterTabs = ({ tabs, activeKey, onChange }: FilterTabsProps) => (
  <div className="flex flex-wrap gap-2">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onChange(tab.key)}
        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          activeKey === tab.key
            ? "bg-primary text-white"
            : "border border-surface-border bg-white text-gray-600 hover:bg-surface-hover"
        }`}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span className="ml-1.5 text-xs opacity-75">({tab.count})</span>
        )}
      </button>
    ))}
  </div>
);

/* ───────────────────────────────────────────
 *  DataTable — consistent table wrapper
 * ─────────────────────────────────────────── */
interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyMessage = "Không có dữ liệu.",
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingSkeleton count={4} height="h-16" />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-surface-border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-6 py-3 ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left"
                  } ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {data.map((row) => (
              <tr
                key={String(row[keyField])}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors hover:bg-surface-hover ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-6 py-4 ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
