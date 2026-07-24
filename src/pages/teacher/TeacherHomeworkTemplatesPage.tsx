import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import homeworkApi from "../../api/homeworkApi";
import { Button } from "../../components/ui/Button";
import {
  PageHeader,
  ErrorBanner,
  StatCard,
  Badge,
  FilterTabs,
  SearchInput,
  LoadingSkeleton,
  EmptyState,
} from "../../components/ui/SharedComponents";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import type { HomeworkTemplate, HomeworkType, HomeworkDifficulty } from "../../types/homework";

const typeLabels: Record<HomeworkType, string> = {
  QUIZ: "Trắc nghiệm",
  ESSAY: "Tự luận",
  MIXED: "Hỗn hợp",
};

const difficultyLabels: Record<HomeworkDifficulty, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

export default function TeacherHomeworkTemplatesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [templates, setTemplates] = useState<HomeworkTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // URL synced state
  const searchQuery = searchParams.get("keyword") || "";
  const selectedType = (searchParams.get("type") as HomeworkType) || "all";
  const selectedDifficulty = (searchParams.get("difficulty") as HomeworkDifficulty) || "all";
  const showArchived = searchParams.get("archived") === "true";
  
  // Local state for debounce
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const updateFilters = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
    setCurrentPage(1); // Reset page on filter change
  };

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await homeworkApi.getTemplateLibrary(
        searchQuery ? searchQuery : undefined,
        selectedType === "all" ? undefined : selectedType,
        selectedDifficulty === "all" ? undefined : selectedDifficulty,
        showArchived
      );
      setTemplates(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách mẫu bài tập.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedType, selectedDifficulty, showArchived]);

  // Sync local query to URL with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        updateFilters({ keyword: localSearchQuery });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTemplates();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadTemplates]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await homeworkApi.deleteTemplate(id);
      showToast("Lưu trữ mẫu bài tập thành công.", "success");
      loadTemplates();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Không thể lưu trữ mẫu bài tập.", "error");
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/teacher/homework-templates/${id}`);
  };

  const handleDuplicate = async (id: number) => {
    try {
      const newTemplateId = await homeworkApi.duplicateTemplate(id);
      showToast("Nhân bản mẫu bài tập thành công.", "success");
      loadTemplates();
      // Optionally navigate to the new template
      // navigate(`/teacher/homework-templates/${newTemplateId}`);
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Không thể nhân bản mẫu bài tập.", "error");
    }
  };
  
  // Client-side pagination logic
  const totalPages = Math.ceil(templates.length / pageSize);
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return templates.slice(start, start + pageSize);
  }, [templates, currentPage, pageSize]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Thư viện Bài Tập">
        <Button
          variant="secondary"
          onClick={() => updateFilters({ archived: showArchived ? null : "true" })}
          size="sm"
        >
          {showArchived ? "Ẩn mẫu đã lưu trữ" : "Xem mẫu đã lưu trữ"}
        </Button>
        <Button
          onClick={() => navigate("/teacher/homework-templates/new")}
          size="sm"
        >
          Tạo Mẫu Mới
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng số mẫu" value={templates.length} />
        <StatCard
          label="Trắc nghiệm"
          value={templates.filter((t) => t.homeworkType === "QUIZ").length}
        />
        <StatCard
          label="Tự luận"
          value={templates.filter((t) => t.homeworkType === "ESSAY").length}
        />
      </div>

      <section className="rounded-card border border-surface-border bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <FilterTabs
              tabs={[
                { key: "all", label: "Tất cả loại" },
                { key: "QUIZ", label: "Trắc nghiệm" },
                { key: "ESSAY", label: "Tự luận" },
                { key: "MIXED", label: "Hỗn hợp" },
              ]}
              activeKey={selectedType}
              onChange={(key) => updateFilters({ type: key })}
            />
            <FilterTabs
              tabs={[
                { key: "all", label: "Tất cả độ khó" },
                { key: "EASY", label: "Dễ" },
                { key: "MEDIUM", label: "Trung bình" },
                { key: "HARD", label: "Khó" },
              ]}
              activeKey={selectedDifficulty}
              onChange={(key) => updateFilters({ difficulty: key })}
            />
          </div>
          <div className="relative max-w-sm w-full">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề (Ctrl + /)..."
              className="w-full rounded-input border border-surface-border bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            <LoadingSkeleton count={5} height="h-16" />
          </div>
        ) : templates.length === 0 ? (
          <div className="mt-6">
            <EmptyState message="Chưa có mẫu bài tập nào phù hợp.">
              <Button onClick={() => navigate("/teacher/homework-templates/new")}>
                Tạo mẫu mới
              </Button>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-6">
            <div className="overflow-hidden rounded-card border border-surface-border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3">Tiêu đề</th>
                    <th className="px-6 py-3">Loại</th>
                    <th className="px-6 py-3">Độ khó</th>
                    <th className="px-6 py-3 text-center">Thời gian (phút)</th>
                    <th className="px-6 py-3 text-center">Trạng thái</th>
                    <th className="px-6 py-3 text-right">Ngày tạo</th>
                    <th className="px-6 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {paginatedTemplates.map((template) => (
                    <tr key={template.id} className="transition-colors hover:bg-surface-hover">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {template.title}
                          {template.version > 1 && (
                            <span className="ml-2 text-xs text-gray-400">v{template.version}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {typeLabels[template.homeworkType]}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {template.difficulty ? difficultyLabels[template.difficulty] : "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {template.estimatedTime ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {template.status === "ARCHIVED" ? (
                          <Badge variant="error">Đã lưu trữ</Badge>
                        ) : template.status === "ACTIVE" ? (
                          <Badge variant="success">Hoạt động</Badge>
                        ) : (
                          <Badge variant="info">Bản nháp</Badge>
                        )}
                        {template.assignmentCount !== undefined && template.assignmentCount > 0 && (
                          <div className="mt-1 text-[10px] text-gray-500">
                            (Đã giao {template.assignmentCount} lần)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {formatDateTime(template.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(template.id)}
                          >
                            Sửa
                          </Button>
                          <ConfirmDialog
                            title="Lưu trữ mẫu bài tập"
                            message="Bạn có chắc chắn muốn lưu trữ mẫu bài tập này? (Các bài tập đã giao sẽ không bị ảnh hưởng)."
                            onConfirm={() => handleDelete(template.id)}
                          >
                            <Button variant="danger" size="sm">
                              Lưu trữ
                            </Button>
                          </ConfirmDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-4">
                <span className="text-sm text-gray-600">
                  Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, templates.length)} trong {templates.length} kết quả
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Trang trước
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
