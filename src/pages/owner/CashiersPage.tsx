import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { cashierApi } from "../../api/cashierApi";
import type { CashierRequest, CashierResponse } from "../../types/cashier";

const emptyForm: CashierRequest = { fullName: "", email: "", phoneNumber: "" };

export const CashiersPage = () => {
  const [cashiers, setCashiers] = useState<CashierResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<CashierResponse | null>(null);
  const [form, setForm] = useState<CashierRequest>(emptyForm);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadCashiers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setCashiers(await cashierApi.findAll());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách thu ngân.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCashiers();
  }, [loadCashiers]);

  const filteredCashiers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return cashiers;
    return cashiers.filter(
      (cashier) =>
        cashier.fullName.toLowerCase().includes(keyword) ||
        cashier.phoneNumber.includes(keyword),
    );
  }, [cashiers, query]);

  const openCreate = () => {
    setEditingCashier(null);
    setTemporaryPassword("");
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (cashier: CashierResponse) => {
    setEditingCashier(cashier);
    setTemporaryPassword("");
    setForm({
      fullName: cashier.fullName,
      phoneNumber: cashier.phoneNumber,
      email: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      if (editingCashier) {
        await cashierApi.update(editingCashier.userId, form);
      } else {
        const created = await cashierApi.create(form);
        setTemporaryPassword(created.temporaryPassword ?? "");
      }
      await loadCashiers();
      if (editingCashier) setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu thu ngân.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cashier: CashierResponse) => {
    if (!window.confirm(`Xóa thu ngân "${cashier.fullName}"?`)) return;
    await cashierApi.delete(cashier.userId);
    await loadCashiers();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Thu ngân</h1>
        </div>
        <Button onClick={openCreate}>Tạo thu ngân</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="max-w-md">
        <Input
          label="Tìm kiếm"
          placeholder="Tên hoặc số điện thoại"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Đang tải thu ngân...</div>
        ) : filteredCashiers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">Chưa có thu ngân nào.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Họ tên</th>
                <th className="px-5 py-3 font-medium">Số điện thoại</th>
                <th className="px-5 py-3 font-medium">Center ID</th>
                <th className="px-5 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCashiers.map((cashier) => (
                <tr key={cashier.userId} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">{cashier.fullName}</td>
                  <td className="px-5 py-4 text-gray-600">{cashier.phoneNumber}</td>
                  <td className="px-5 py-4 text-gray-600">{cashier.centerId}</td>
                  <td className="space-x-3 px-5 py-4 text-right">
                    <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => openEdit(cashier)}>
                      Sửa
                    </button>
                    <button className="text-sm text-red-600 hover:text-red-800" onClick={() => handleDelete(cashier)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCashier ? "Chỉnh sửa thu ngân" : "Tạo thu ngân"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {temporaryPassword && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Mật khẩu tạm: <span className="font-semibold">{temporaryPassword}</span>
            </div>
          )}
          <Input
            label="Họ tên"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <Input
            label="Số điện thoại"
            value={form.phoneNumber}
            onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
            placeholder="0901234567"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Đóng
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingCashier ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CashiersPage;
