import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import {
  PageHeader,
  SearchInput,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { cashierApi } from "../../api/cashierApi";
import type { CashierRequest, CashierResponse } from "../../types/cashier";

const emptyForm: CashierRequest = { fullName: "", email: "", phoneNumber: "" };

export const CashiersPage = () => {
  const [cashiers, setCashiers] = useState<CashierResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<CashierResponse | null>(
    null,
  );
  const [form, setForm] = useState<CashierRequest>(emptyForm);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadCashiers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setCashiers(await cashierApi.findAll());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách thu ngân.",
      );
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
      (c) =>
        c.fullName.toLowerCase().includes(keyword) ||
        c.phoneNumber.includes(keyword),
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
      <PageHeader title="Thu ngân">
        <Button onClick={openCreate}>Tạo thu ngân</Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tên hoặc số điện thoại..."
      />

      {isLoading ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Đang tải thu ngân...
        </div>
      ) : filteredCashiers.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Chưa có thu ngân nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Họ tên</th>
                <th className="px-6 py-3">Số điện thoại</th>
                <th className="px-6 py-3">Center ID</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredCashiers.map((cashier) => (
                <tr
                  key={cashier.userId}
                  className="transition-colors hover:bg-surface-hover"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {cashier.fullName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {cashier.phoneNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {cashier.centerId}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <button
                        className="text-primary hover:text-primary-hover transition-colors"
                        onClick={() => openEdit(cashier)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDelete(cashier)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCashier ? "Chỉnh sửa thu ngân" : "Tạo thu ngân"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {temporaryPassword && (
            <div className="rounded-input border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Mật khẩu tạm:{" "}
              <span className="font-semibold">{temporaryPassword}</span>
            </div>
          )}
          <Input
            label="Họ tên"
            value={form.fullName}
            onChange={(e) =>
              setForm((c) => ({ ...c, fullName: e.target.value }))
            }
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
          />
          <Input
            label="Số điện thoại"
            value={form.phoneNumber}
            onChange={(e) =>
              setForm((c) => ({ ...c, phoneNumber: e.target.value }))
            }
            placeholder="0901234567"
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
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
