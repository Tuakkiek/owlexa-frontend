import { useCallback, useEffect, useMemo, useState } from "react";
import { gradingCriteriaApi } from "../../api/gradingCriteriaApi";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import {
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
} from "../../components/ui/SharedComponents";
import type {
  GradingCriteriaRequest,
  GradingCriteriaResponse,
} from "../../types/gradingCriteria";
import { formatDateTime } from "../../utils/dateTime";
import { editorDocumentToPlainText } from "../../components/editor";
import { GradingCriteriaForm } from "./components/GradingCriteriaForm";

const previewContent = (document: GradingCriteriaResponse["content"]) => {
  const text = editorDocumentToPlainText(document);
  if (text.length <= 100) return text || "-";
  return `${text.slice(0, 100)}...`;
};

const GradingCriteriaPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [criteria, setCriteria] = useState<GradingCriteriaResponse[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] =
    useState<GradingCriteriaResponse | null>(null);

  const loadCriteria = useCallback(async (search?: string) => {
    try {
      setIsLoading(true);
      setError("");
      setCriteria(await gradingCriteriaApi.findAll(search));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách tiêu chí chấm điểm.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadCriteria(query);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadCriteria, query]);

  const sortedCriteria = useMemo(
    () =>
      [...criteria].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [criteria],
  );

  const openCreate = () => {
    setEditingCriteria(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: GradingCriteriaResponse) => {
    setEditingCriteria(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCriteria(null);
  };

  const handleSave = async (request: GradingCriteriaRequest) => {
    if (editingCriteria) {
      await gradingCriteriaApi.update(editingCriteria.id, request);
      toast.success("Cập nhật tiêu chí chấm điểm thành công.");
    } else {
      await gradingCriteriaApi.create(request);
      toast.success("Tạo mới tiêu chí chấm điểm thành công.");
    }

    closeModal();
    await loadCriteria(query);
  };

  const handleDelete = async (item: GradingCriteriaResponse) => {
    const confirmed = await confirm({
      title: "Xóa tiêu chí?",
      message: `Bạn có chắc chắn muốn xóa tiêu chí "${item.name}"?`,
      confirmText: "Xóa",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await gradingCriteriaApi.delete(item.id);
      toast.success("Đã xóa tiêu chí chấm điểm.");
      await loadCriteria(query);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể xóa tiêu chí chấm điểm.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Tiêu chí chấm điểm"
        description="Quản lý danh sách tiêu chí chấm bài tự luận cho trung tâm."
      >
        <Button onClick={openCreate}>Tạo mới tiêu chí</Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm theo tên tiêu chí..."
      />

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-16" />
      ) : sortedCriteria.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Không tìm thấy tiêu chí chấm điểm nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-3">Tên tiêu chí</th>
                  <th className="px-6 py-3">Nội dung xem trước</th>
                  <th className="px-6 py-3">Cập nhật</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {sortedCriteria.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover">
                    <td className="max-w-xs px-6 py-4 font-medium text-gray-900">
                      <span className="line-clamp-2 break-words">
                        {item.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="line-clamp-2 min-w-[18rem] max-w-2xl break-words">
                        {previewContent(item.content)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTime(item.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs text-blue-600 underline"
                          onClick={() => openEdit(item)}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-600 underline"
                          onClick={() => handleDelete(item)}
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
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCriteria ? "Chỉnh sửa tiêu chí" : "Tạo mới tiêu chí"}
        maxWidth="max-w-3xl"
      >
        <GradingCriteriaForm
          initialData={editingCriteria ?? undefined}
          onSubmit={handleSave}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default GradingCriteriaPage;
