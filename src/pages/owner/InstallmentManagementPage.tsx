import { useCallback, useEffect, useState } from "react";
import { PageHeader, Badge, EmptyState, ErrorBanner } from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import axiosClient from "../../api/axiosClient";
import { formatMoney } from "../../utils/money";

type InstStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";

interface InstallmentItem {
  id: number; feeRecordId: number; dueDate: string;
  expectedAmount: number; paidAmount: number; remainingAmount: number; status: InstStatus;
}

const STATUS_LABELS: Record<InstStatus, string> = {
  PENDING: "Chờ", PARTIALLY_PAID: "Một phần", PAID: "Đã trả", OVERDUE: "Quá hạn",
};
const STATUS_VARIANTS: Record<InstStatus, "warning" | "info" | "success" | "error"> = {
  PENDING: "warning", PARTIALLY_PAID: "info", PAID: "success", OVERDUE: "error",
};

const InstallmentManagementPage = () => {
  const [feeRecordId, setFeeRecordId] = useState("");
  const [installments, setInstallments] = useState<InstallmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Schedule form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleEntries, setScheduleEntries] = useState<{ dueDate: string; expectedAmount: string }[]>([
    { dueDate: "", expectedAmount: "" },
  ]);
  const [scheduleError, setScheduleError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit single installment
  const [editId, setEditId] = useState<number | null>(null);
  const [editDueDate, setEditDueDate] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const load = useCallback(async () => {
    if (!feeRecordId) { setInstallments([]); return; }
    try { setLoading(true); setError("");
      const res = await axiosClient.get(`/owner/fee-record/${feeRecordId}/installments`);
      setInstallments(res.data);
    } catch (err: any) { setError(err?.response?.data?.message ?? "Không thể tải"); setInstallments([]); }
    finally { setLoading(false); }
  }, [feeRecordId]);

  useEffect(() => { load(); }, [load]);

  const handleCreateSchedule = async () => {
    const hasEmpty = scheduleEntries.some(e => !e.dueDate || !e.expectedAmount || Number(e.expectedAmount) <= 0);
    if (hasEmpty) { setScheduleError("Vui lòng điền đầy đủ ngày và số tiền > 0"); return; }
    try { setSubmitting(true); setScheduleError("");
      const payload = { installments: scheduleEntries.map(e => ({ dueDate: e.dueDate, expectedAmount: Number(e.expectedAmount) })) };
      await axiosClient.post(`/owner/fee-record/${feeRecordId}/installments`, payload);
      setShowScheduleForm(false); setScheduleEntries([{ dueDate: "", expectedAmount: "" }]); load();
    } catch (err: any) { setScheduleError(err?.response?.data?.message ?? "Lỗi"); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!editId || !editDueDate || Number(editAmount) <= 0) return;
    try { await axiosClient.put(`/owner/installments/${editId}`, { dueDate: editDueDate, expectedAmount: Number(editAmount) }); setEditId(null); load(); }
    catch (err: any) { setError(err?.response?.data?.message ?? "Lỗi cập nhật"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa kỳ hạn này?")) return;
    try { await axiosClient.delete(`/owner/installments/${id}`); load(); }
    catch (err: any) { setError(err?.response?.data?.message ?? "Lỗi xóa"); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Quản lý kỳ hạn thanh toán">
        <Button size="sm" onClick={() => setShowScheduleForm(!showScheduleForm)}>
          {showScheduleForm ? "Đóng" : "Tạo lịch kỳ hạn"}
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="flex gap-3">
        <input className="flex-1 rounded-input border border-gray-300 p-2 text-sm" placeholder="Fee Record ID"
          value={feeRecordId} onChange={(e) => setFeeRecordId(e.target.value)} />
        <Button size="sm" variant="secondary" onClick={load}>Tải</Button>
      </div>

      {/* Create Schedule Form */}
      {showScheduleForm && (
        <div className="rounded-card border border-surface-border bg-white p-6 space-y-3">
          <h3 className="font-semibold">Tạo lịch kỳ hạn mới</h3>
          {scheduleError && <p className="text-sm text-red-600">{scheduleError}</p>}
          {scheduleEntries.map((entry, i) => (
            <div key={i} className="flex gap-3 items-center">
              <input type="date" className="flex-1 rounded-input border border-gray-300 p-2 text-sm"
                value={entry.dueDate} onChange={(e) => {
                  const updated = [...scheduleEntries]; updated[i].dueDate = e.target.value; setScheduleEntries(updated);
                }} />
              <input type="number" className="w-40 rounded-input border border-gray-300 p-2 text-sm" placeholder="Số tiền"
                value={entry.expectedAmount} onChange={(e) => {
                  const updated = [...scheduleEntries]; updated[i].expectedAmount = e.target.value; setScheduleEntries(updated);
                }} />
              {scheduleEntries.length > 1 && (
                <button onClick={() => setScheduleEntries(scheduleEntries.filter((_, j) => j !== i))}
                  className="text-red-500 text-sm">Xóa</button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setScheduleEntries([...scheduleEntries, { dueDate: "", expectedAmount: "" }])}>
              + Thêm kỳ
            </Button>
            <Button size="sm" onClick={handleCreateSchedule} isLoading={submitting}>Lưu lịch</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-card bg-surface-hover" />)}
        </div>
      ) : installments.length === 0 ? (
        <EmptyState message={feeRecordId ? "Chưa có kỳ hạn nào." : "Nhập Fee Record ID để xem."} icon="📅" />
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-hover text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Đến hạn</th>
                <th className="px-4 py-3 text-right">Dự kiến</th>
                <th className="px-4 py-3 text-right">Đã trả</th>
                <th className="px-4 py-3 text-right">Còn lại</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {installments.map((inst) => (
                <tr key={inst.id} className="hover:bg-surface-hover">
                  {editId === inst.id ? (
                    <>
                      <td className="px-4 py-3"><input type="date" className="w-full rounded-input border p-1 text-sm" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} /></td>
                      <td className="px-4 py-3"><input type="number" className="w-32 rounded-input border p-1 text-sm text-right" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} /></td>
                      <td className="px-4 py-3 text-right">{formatMoney(String(inst.paidAmount))}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(String(inst.remainingAmount))}</td>
                      <td className="px-4 py-3"><Badge variant={STATUS_VARIANTS[inst.status]}>{STATUS_LABELS[inst.status]}</Badge></td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button onClick={handleUpdate} className="text-xs text-primary hover:underline">Lưu</button>
                        <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:underline">Hủy</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-700">{inst.dueDate}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(String(inst.expectedAmount))}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{formatMoney(String(inst.paidAmount))}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatMoney(String(inst.remainingAmount))}</td>
                      <td className="px-4 py-3"><Badge variant={STATUS_VARIANTS[inst.status]}>{STATUS_LABELS[inst.status]}</Badge></td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {inst.status === "PENDING" && (
                          <>
                            <button onClick={() => { setEditId(inst.id); setEditDueDate(inst.dueDate); setEditAmount(String(inst.expectedAmount)); }}
                              className="text-xs text-primary hover:underline">Sửa</button>
                            <button onClick={() => handleDelete(inst.id)} className="text-xs text-red-600 hover:underline">Xóa</button>
                          </>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InstallmentManagementPage;
