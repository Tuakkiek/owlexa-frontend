import { useCallback, useEffect, useState } from "react";
import { PageHeader, Badge, EmptyState, ErrorBanner } from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import axiosClient from "../../api/axiosClient";
import { formatMoney } from "../../utils/money";

interface TimelineEntry {
  timestamp: string; action: string; userName: string;
  description: string; amount?: number; entityId: number; receiptNumber?: string;
}

const ACTION_BADGES: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" }> = {
  PAYMENT_COLLECTED: { label: "Thu tiền", variant: "success" },
  PAYMENT_VOIDED: { label: "Đã hủy", variant: "error" },
  REFUND: { label: "Hoàn tiền", variant: "warning" },
  DISCOUNT_APPLIED: { label: "Chiết khấu", variant: "info" },
};

const FinancialTimelinePage = () => {
  const [studentId, setStudentId] = useState("");
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!studentId) { setEntries([]); return; }
    try { setLoading(true); setError("");
      const res = await axiosClient.get(`/owner/students/${studentId}/timeline`);
      setEntries(res.data);
    } catch (err: any) { setError(err?.response?.data?.message ?? "Không thể tải"); setEntries([]); }
    finally { setLoading(false); }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Dòng thời gian tài chính" />

      {error && <ErrorBanner message={error} />}

      <div className="flex gap-3">
        <input className="flex-1 rounded-input border border-gray-300 p-2 text-sm" placeholder="Student ID"
          value={studentId} onChange={(e) => setStudentId(e.target.value)} />
        <Button size="sm" variant="secondary" onClick={load}>Tải</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse rounded-card bg-surface-hover" />)}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState message={studentId ? "Không có sự kiện tài chính nào." : "Nhập Student ID để xem."} icon="📊" />
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => {
            const badge = ACTION_BADGES[entry.action] || { label: entry.action, variant: "default" as const };
            return (
              <div key={i} className="rounded-card border border-surface-border bg-white p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-24 text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleDateString("vi-VN")}
                  <br />
                  {new Date(entry.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {entry.receiptNumber && (
                      <span className="font-mono text-xs text-gray-500">{entry.receiptNumber}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{entry.description}</p>
                  <p className="text-xs text-gray-400">{entry.userName || "Hệ thống"}</p>
                </div>
                {entry.amount != null && (
                  <div className="flex-shrink-0 text-right">
                    <span className={`font-semibold ${entry.action === "REFUND" || entry.action === "PAYMENT_VOIDED" ? "text-red-600" : "text-emerald-600"}`}>
                      {entry.action === "REFUND" || entry.action === "PAYMENT_VOIDED" ? "-" : "+"}
                      {formatMoney(String(entry.amount))}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FinancialTimelinePage;
