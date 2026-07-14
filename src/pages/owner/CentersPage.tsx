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
import { centerApi } from "../../api/centerApi";
import type { CenterRequest, CenterResponse } from "../../types/center";

const emptyForm: CenterRequest = { name: "", subdomain: "" };

const normalizeSubdomain = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export const CentersPage = () => {
  const [centers, setCenters] = useState<CenterResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CenterResponse | null>(
    null,
  );
  const [form, setForm] = useState<CenterRequest>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadCenters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setCenters(await centerApi.findAll());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách trung tâm.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCenters();
  }, [loadCenters]);

  const filteredCenters = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return centers;
    return centers.filter(
      (center) =>
        center.name.toLowerCase().includes(keyword) ||
        center.subdomain.toLowerCase().includes(keyword),
    );
  }, [centers, query]);

  const openCreate = () => {
    setEditingCenter(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };
  const openEdit = (center: CenterResponse) => {
    setEditingCenter(center);
    setForm({ name: center.name, subdomain: center.subdomain });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        ...form,
        subdomain: normalizeSubdomain(form.subdomain),
      };
      if (editingCenter) await centerApi.update(editingCenter.id, payload);
      else await centerApi.create(payload);
      setIsModalOpen(false);
      await loadCenters();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu trung tâm.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (center: CenterResponse) => {
    if (!window.confirm(`Xóa trung tâm "${center.name}"?`)) return;
    await centerApi.delete(center.id);
    await loadCenters();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Trung tâm">
        <Button onClick={openCreate}>Tạo trung tâm</Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tên trung tâm hoặc subdomain..."
      />

      {isLoading ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Đang tải trung tâm...
        </div>
      ) : filteredCenters.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Chưa có trung tâm nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Tên trung tâm</th>
                <th className="px-6 py-3">Subdomain</th>
                <th className="px-6 py-3">Ngày tạo</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredCenters.map((center) => (
                <tr
                  key={center.id}
                  className="transition-colors hover:bg-surface-hover"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {center.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {center.subdomain}.owlexa.vn
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(center.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <button
                        className="text-primary hover:text-primary-hover transition-colors"
                        onClick={() => openEdit(center)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDelete(center)}
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
        title={editingCenter ? "Chỉnh sửa trung tâm" : "Tạo trung tâm"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Tên trung tâm"
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            required
          />
          <Input
            label="Subdomain"
            value={form.subdomain}
            onChange={(e) =>
              setForm((c) => ({
                ...c,
                subdomain: normalizeSubdomain(e.target.value),
              }))
            }
            placeholder="abc-english"
            required
          />
          <p className="text-xs text-gray-400">
            Đường dẫn: {form.subdomain || "subdomain"}.owlexa.vn
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingCenter ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CentersPage;
