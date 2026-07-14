import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  accent?: boolean;
}

export const StatCard = ({ label, value, helper, accent }: StatCardProps) => (
  <div
    className={`rounded-xl border border-gray-200 bg-white p-5 ${accent ? "border-l-4 border-l-primary" : ""}`}
  >
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
  </div>
);

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
  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
    <div className="text-3xl mb-3">{icon}</div>
    <p className="text-sm text-gray-500">{message}</p>
    {children && <div className="mt-4">{children}</div>}
  </div>
);

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
        className={`${height} animate-pulse rounded-lg bg-gray-100`}
      />
    ))}
  </div>
);

interface ErrorBannerProps {
  message: string;
}

export const ErrorBanner = ({ message }: ErrorBannerProps) => (
  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {message}
  </div>
);

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
  <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
    {children}
  </div>
);
