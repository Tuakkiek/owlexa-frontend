import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import {
  PageHeader,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { centerApi } from "../../api/centerApi";
import type { CenterRequest, CenterResponse } from "../../types/center";

import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";

const emptyForm: CenterRequest = { name: "", subdomain: "" };

const normalizeSubdomain = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export const CentersPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [centers, setCenters] = useState<CenterResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CenterResponse | null>(null);
  const [form, setForm] = useState<CenterRequest>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadCenters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await centerApi.findAll();
      setCenters(res);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải thông tin trung tâm.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCenters();
  }, [loadCenters]);

  const currentCenter = useMemo(() => centers[0] ?? null, [centers]);

  const openInitModal = () => {
    setEditingCenter(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (center: CenterResponse) => {
    setEditingCenter(center);
    setForm({ name: center.name, subdomain: center.subdomain });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (editingCenter) {
      const confirmed = await confirm({
        title: "Cập nhật trung tâm?",
        message: `Bạn có chắc chắn muốn cập nhật thông tin trung tâm "${editingCenter.name}"?`,
        confirmText: "Lưu thay đổi",
        variant: "primary",
      });
      if (!confirmed) return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...form,
        subdomain: normalizeSubdomain(form.subdomain),
      };
      if (editingCenter) {
        await centerApi.update(editingCenter.id, payload);
        toast.success("Cập nhật thông tin trung tâm thành công.");
      } else {
        await centerApi.create(payload);
        toast.success("Khởi tạo trung tâm thành công.");
      }
      setIsModalOpen(false);
      await loadCenters();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể lưu thông tin trung tâm.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Thông tin trung tâm">
        {!currentCenter && !isLoading && (
          <Button onClick={openInitModal}>Khởi tạo trung tâm</Button>
        )}
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Đang tải thông tin trung tâm...
        </div>
      ) : !currentCenter ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-500 space-y-3">
          <p className="text-base font-medium text-gray-800">Bạn chưa thiết lập trung tâm nào.</p>
          <p className="text-sm text-gray-400">Mỗi tài khoản Chủ sở hữu quản lý duy nhất 1 trung tâm trên hệ thống Owlexa.</p>
          <Button onClick={openInitModal} className="mt-2">Khởi tạo trung tâm ngay</Button>
        </div>
      ) : (
        <div className="rounded-card border border-surface-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-surface-border px-6 py-4 flex items-center justify-between bg-surface-hover/50">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{currentCenter.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Trung tâm được quản lý bởi bạn</p>
            </div>
            <Button variant="secondary" onClick={() => openEditModal(currentCenter)}>
              Chỉnh sửa thông tin
            </Button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tên trung tâm</span>
              <p className="text-base font-medium text-gray-900">{currentCenter.name}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tên miền phụ (Subdomain)</span>
              <p className="text-base font-medium text-primary">
                https://{currentCenter.subdomain}.owlexa.vn
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày khởi tạo</span>
              <p className="text-base font-medium text-gray-900">
                {new Date(currentCenter.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái hệ thống</span>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-base font-medium text-green-700">Đang hoạt động</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCenter ? "Chỉnh sửa thông tin trung tâm" : "Khởi tạo trung tâm"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Tên trung tâm"
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            placeholder="Trung tâm Anh ngữ Owlexa"
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
            Đường dẫn truy cập: {form.subdomain ? normalizeSubdomain(form.subdomain) : "subdomain"}.owlexa.vn
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
              {editingCenter ? "Cập nhật" : "Khởi tạo"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CentersPage;
