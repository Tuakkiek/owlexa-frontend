import { useCallback, useEffect, useState } from "react";
import { PageHeader, EmptyState } from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import axiosClient from "../../api/axiosClient";

interface AuditEntry {
  id: number; action: string; entityType: string; entityId: number;
  description: string; ipAddress?: string; createdAt: string;
  user?: { fullName: string; phoneNumber: string };
}

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async (p: number) => {
    try { setLoading(true);
      const res = await axiosClient.get("/owner/audit-logs", { params: { page: p, size: 20 } });
      setLogs(res.data.content); setTotalPages(res.data.totalPages);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Nhật ký hoạt động" />
      {loading ? <p className="text-sm text-gray-400">Đang tải...</p> :
       logs.length === 0 ? <EmptyState message="Chưa có hoạt động nào." icon="📋" /> : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-hover text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Hành động</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Mô tả</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{l.user?.fullName || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">{l.action}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{l.entityType}#{l.entityId}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{l.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Trang {page + 1}/{totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
