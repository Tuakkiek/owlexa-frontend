import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
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
  const [editingCenter, setEditingCenter] = useState<CenterResponse | null>(null);
  const [form, setForm] = useState<CenterRequest>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadCenters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setCenters(await centerApi.findAll());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách trung tâm.");
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
      const payload = { ...form, subdomain: normalizeSubdomain(form.subdomain) };
      if (editingCenter) {
        await centerApi.update(editingCenter.id, payload);
      } else {
        await centerApi.create(payload);
      }
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
    <div className="p-4 space-y-4 text-sm">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Trung tâm</h1>
          <p className="text-xs text-gray-500">
            Quản lý chi nhánh và subdomain tenant của Owlexa.
          </p>
        </div>
        <div>
          {/* Đảm bảo component Button bên trong không có bo góc nâng cao */}
          <Button onClick={openCreate}>Tạo trung tâm</Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-red-500 p-2 text-red-600 text-xs">
          Lỗi: {error}
        </div>
      )}

      {/* Search Input Filter */}
      <div className="max-w-xs">
        <Input
          label="Tìm kiếm"
          placeholder="Tên trung tâm hoặc subdomain"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {/* Main Table Area */}
      <div className="border border-gray-300 bg-white overflow-x-auto">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-gray-500">Đang tải trung tâm...</div>
        ) : filteredCenters.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">Chưa có trung tâm nào.</div>
        ) : (
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-100 border-b border-gray-300 uppercase font-bold text-gray-700">
              <tr>
                <th className="p-3">Tên trung tâm</th>
                <th className="p-3">Subdomain</th>
                <th className="p-3">Ngày tạo</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCenters.map((center) => (
                <tr key={center.id}>
                  <td className="p-3 font-bold text-gray-900">{center.name}</td>
                  <td className="p-3 text-gray-600">{center.subdomain}.owlexa.vn</td>
                  <td className="p-3 text-gray-600">
                    {new Date(center.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button className="text-blue-600 underline font-medium" onClick={() => openEdit(center)}>
                      Sửa
                    </button>
                    <button className="text-red-600 underline font-medium" onClick={() => handleDelete(center)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form Handling */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCenter ? "Chỉnh sửa trung tâm" : "Tạo trung tâm"}
      >
        <form className="space-y-3 p-1" onSubmit={handleSubmit}>
          <Input
            label="Tên trung tâm"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <Input
            label="Subdomain"
            value={form.subdomain}
            onChange={(event) =>
              setForm((current) => ({ ...current, subdomain: normalizeSubdomain(event.target.value) }))
            }
            placeholder="abc-english"
            required
          />
          <p className="text-xs text-gray-400 border-t border-dashed pt-1">
            Đường dẫn hệ thống: {form.subdomain || "subdomain"}.owlexa.vn
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
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