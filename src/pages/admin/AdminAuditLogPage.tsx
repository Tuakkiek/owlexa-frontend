import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
} from "../../components/ui/SharedComponents";
import type {
  AdminAuditAction,
  AdminAuditLogPage,
  AdminAuditTargetType,
} from "../../types/admin";
import { AdminPagination } from "./components/AdminPagination";

const emptyPage: AdminAuditLogPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
};

const actionLabels: Record<AdminAuditAction, string> = {
  USER_LOCKED: "Khóa tài khoản",
  USER_UNLOCKED: "Mở khóa tài khoản",
  CENTER_LOCKED: "Khóa trung tâm",
  CENTER_UNLOCKED: "Mở lại trung tâm",
};

export default function AdminAuditLogPage() {
  const [logsPage, setLogsPage] = useState<AdminAuditLogPage>(emptyPage);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [targetType, setTargetType] = useState<AdminAuditTargetType | "">("");
  const [action, setAction] = useState<AdminAuditAction | "">("");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setLogsPage(
        await adminApi.getAuditLogs({
          search: debouncedSearch || undefined,
          targetType: targetType || undefined,
          action: action || undefined,
          page,
          size: 20,
        }),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải nhật ký quản trị.");
    } finally {
      setIsLoading(false);
    }
  }, [action, debouncedSearch, page, targetType]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Nhật ký quản trị"
        description="Lịch sử khóa và mở khóa trên toàn hệ thống."
      />

      {error && <ErrorBanner message={error} />}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm đối tượng, lý do hoặc Admin..."
        />
        <select
          value={targetType}
          onChange={(event) => {
            setTargetType(event.target.value as AdminAuditTargetType | "");
            setPage(0);
          }}
          className="rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
        >
          <option value="">Tất cả đối tượng</option>
          <option value="USER">Người dùng</option>
          <option value="CENTER">Trung tâm</option>
        </select>
        <select
          value={action}
          onChange={(event) => {
            setAction(event.target.value as AdminAuditAction | "");
            setPage(0);
          }}
          className="rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
        >
          <option value="">Tất cả hành động</option>
          {(Object.entries(actionLabels) as Array<[AdminAuditAction, string]>).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={6} height="h-20" />
      ) : logsPage.content.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Chưa có hoạt động quản trị phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Admin</th>
                  <th className="px-5 py-3">Hành động</th>
                  <th className="px-5 py-3">Đối tượng</th>
                  <th className="px-5 py-3">Thay đổi</th>
                  <th className="px-5 py-3">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {logsPage.content.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-surface-hover">
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {log.adminName || `Admin #${log.adminUserId}`}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {log.adminPhoneNumber}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={log.newStatus === "ACTIVE" ? "success" : "error"}>
                        {actionLabels[log.action]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{log.targetName}</div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {log.targetType === "USER" ? "Người dùng" : "Trung tâm"} #{log.targetId}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-600 flex items-center">
                      <span>{log.previousStatus === "ACTIVE" ? "Hoạt động" : "Đã khóa"}</span>
                      <ArrowRight className="mx-2 h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{log.newStatus === "ACTIVE" ? "Hoạt động" : "Đã khóa"}</span>
                    </td>
                    <td className="max-w-sm px-5 py-4 text-gray-600">
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminPagination
        page={logsPage.number}
        totalPages={logsPage.totalPages}
        totalElements={logsPage.totalElements}
        onPageChange={setPage}
      />
    </div>
  );
}
