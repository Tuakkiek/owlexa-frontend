import React, { useEffect, useState } from "react";
import homeworkApi from "../../api/homeworkApi";
import { Button } from "../../components/ui/Button";
import { PageHeader, ErrorBanner, LoadingSkeleton, EmptyState, SearchInput } from "../../components/ui/SharedComponents";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";

// Using a simple textarea for MVP instead of a complex Rich Text Editor dependency to avoid setup overhead
// We'll simulate rich text with a large text area for now, as Tiptap requires multiple packages.
// In a real app, you'd integrate @tiptap/react here.

export default function TeacherGradingCriteriaPage() {
  const { showToast } = useToast();
  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCriteria();
  }, [keyword]);

  const loadCriteria = async () => {
    try {
      setIsLoading(true);
      const data = await homeworkApi.getGradingCriteriaList(keyword);
      setCriteriaList(data.content || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi khi tải tiêu chí chấm bài");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setTitle(item.title);
      setContent(item.content);
    } else {
      setEditingId(null);
      setTitle("");
      setContent("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showToast("Vui lòng nhập đầy đủ tên và nội dung", "error");
      return;
    }
    
    try {
      setIsSaving(true);
      if (editingId) {
        await homeworkApi.updateGradingCriteria(editingId, { title, content });
        showToast("Cập nhật thành công", "success");
      } else {
        await homeworkApi.createGradingCriteria({ title, content });
        showToast("Tạo mới thành công", "success");
      }
      handleCloseModal();
      loadCriteria();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Lỗi khi lưu", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await homeworkApi.deleteGradingCriteria(id);
      showToast("Xóa thành công", "success");
      loadCriteria();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Lỗi khi xóa", "error");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader title="Quản lý Tiêu chí chấm bài (Grading Criteria)">
        <Button onClick={() => handleOpenModal()}>Tạo tiêu chí mới</Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="rounded-card border border-surface-border bg-white p-6">
        <div className="mb-4 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm tiêu chí..."
            className="w-full rounded-input border border-surface-border px-3 py-2 text-sm outline-none focus:border-primary"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} height="h-16" />
        ) : criteriaList.length === 0 ? (
          <EmptyState message="Chưa có tiêu chí nào." />
        ) : (
          <div className="overflow-hidden rounded-card border border-surface-border">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-hover text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Tên tiêu chí</th>
                  <th className="px-6 py-3 text-left font-medium">Nội dung tóm tắt</th>
                  <th className="px-6 py-3 text-left font-medium">Ngày tạo</th>
                  <th className="px-6 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {criteriaList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{item.content}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenModal(item)}>Sửa</Button>
                        <ConfirmDialog
                          title="Xóa tiêu chí"
                          message="Bạn có chắc muốn xóa tiêu chí này không? Hành động này không thể hoàn tác."
                          onConfirm={() => handleDelete(item.id)}
                        >
                          <Button variant="danger" size="sm">Xóa</Button>
                        </ConfirmDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-card bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? "Sửa tiêu chí" : "Tạo tiêu chí mới"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên tiêu chí</label>
                <input
                  type="text"
                  className="w-full rounded-input border border-surface-border px-3 py-2 outline-none focus:border-primary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: IELTS Writing Task 2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung tiêu chí (Rich Text)</label>
                <textarea
                  className="w-full h-64 rounded-input border border-surface-border px-3 py-2 outline-none focus:border-primary font-mono text-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung tiêu chí, rubric, yêu cầu grammar, vocabulary..."
                />
                <p className="text-xs text-gray-500 mt-1">*Trong MVP, nhập nội dung text/markdown. AI sẽ đọc nội dung này để chấm bài.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={handleCloseModal}>Hủy</Button>
              <Button onClick={handleSave} isLoading={isSaving}>Lưu tiêu chí</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
