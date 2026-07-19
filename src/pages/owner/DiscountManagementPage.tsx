import { useCallback, useEffect, useState } from "react";
import {
  PageHeader,
  Badge,
  EmptyState,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import axiosClient from "../../api/axiosClient";
import { formatMoney } from "../../utils/money";

interface DiscountItem {
  id: number;
  feeRecordId: number;
  name: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  reason?: string;
  createdByUserName: string;
  createdAt: string;
}

const DiscountManagementPage = () => {
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [feeRecordId, setFeeRecordId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!feeRecordId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axiosClient.get(
        `/owner/fee-record/${feeRecordId}/discounts`,
      );
      setDiscounts(res.data);
    } catch {
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }, [feeRecordId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!name || !value || !feeRecordId) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }
    const numValue = Number(value);
    if (type === "PERCENTAGE" && numValue > 100) {
      setError("Phần trăm không được vượt quá 100%");
      return;
    }
    if (numValue <= 0) {
      setError("Giá trị phải lớn hơn 0");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const payload = {
        name,
        type,
        value: numValue,
        reason: reason || undefined,
      };
      if (editId) {
        await axiosClient.put(`/owner/discounts/${editId}`, payload);
      } else {
        await axiosClient.post(
          `/owner/fee-record/${feeRecordId}/discounts`,
          payload,
        );
      }
      setShowForm(false);
      setName("");
      setValue("");
      setReason("");
      setEditId(null);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa chiết khấu này?")) return;
    await axiosClient.delete(`/owner/discounts/${id}`);
    load();
  };

  const openEdit = (d: DiscountItem) => {
    setEditId(d.id);
    setName(d.name);
    setType(d.type);
    setValue(String(d.value));
    setReason(d.reason || "");
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Quản lý chiết khấu">
        <Button
          size="sm"
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setName("");
            setValue("");
            setReason("");
            setError("");
          }}
        >
          {showForm ? "Đóng" : "Thêm chiết khấu"}
        </Button>
      </PageHeader>

      <div className="flex gap-3">
        <input
          className="flex-1 rounded-input border border-gray-300 p-2 text-sm"
          placeholder="Fee Record ID"
          value={feeRecordId}
          onChange={(e) => setFeeRecordId(e.target.value)}
        />
        <Button size="sm" variant="secondary" onClick={load}>
          Tải
        </Button>
      </div>

      {showForm && (
        <div className="rounded-card border border-surface-border bg-white p-6 space-y-3">
          <h3 className="font-semibold">
            {editId ? "Sửa chiết khấu" : "Thêm chiết khấu mới"}
          </h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            className="w-full rounded-input border border-gray-300 p-2 text-sm"
            placeholder="Tên chiết khấu"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="w-full rounded-input border border-gray-300 p-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="FIXED">Cố định (VND)</option>
            <option value="PERCENTAGE">Phần trăm (%)</option>
          </select>
          <input
            type="number"
            className="w-full rounded-input border border-gray-300 p-2 text-sm"
            placeholder="Giá trị"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <textarea
            className="w-full rounded-input border border-gray-300 p-2 text-sm"
            rows={2}
            placeholder="Lý do"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Hủy
            </Button>
            <Button size="sm" onClick={handleSubmit} isLoading={submitting}>
              {editId ? "Cập nhật" : "Tạo"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Đang tải...</p>
      ) : discounts.length === 0 ? (
        <EmptyState message="Chưa có chiết khấu nào." icon="🏷️" />
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-hover text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3 text-right">Giá trị</th>
                <th className="px-4 py-3">Người tạo</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={d.type === "PERCENTAGE" ? "info" : "default"}
                    >
                      {d.type === "PERCENTAGE" ? "%" : "VND"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {d.type === "PERCENTAGE"
                      ? `${d.value}%`
                      : formatMoney(String(d.value))}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.createdByUserName}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(d.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(d)}
                      className="mr-2 text-xs text-primary hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DiscountManagementPage;
