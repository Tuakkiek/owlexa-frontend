import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import homeworkApi from "../../api/homeworkApi";
import { Button } from "../../components/ui/Button";
import {
  PageHeader,
  ErrorBanner,
  StatCard,
  Badge,
  FilterTabs,
  LoadingSkeleton,
  EmptyState,
} from "../../components/ui/SharedComponents";
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

export default function OwnerHomeworkTemplatesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [templates, setTemplates] = useState<HomeworkTemplate[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const searchQuery = searchParams.get("keyword") || "";
  const selectedType = (searchParams.get("type") as HomeworkType) || "all";
  const selectedDifficulty = (searchParams.get("difficulty") as HomeworkDifficulty) || "all";
  const currentPage = Number(searchParams.get("page")) || 0;
  const pageSize = 10;
  
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const updateFilters = (updates: Record<string, string | number | null>) => {
    const newParams = new URLSearchParams(searchParams);
    let pageChanged = false;
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
      if (key !== "page") {
         pageChanged = true;
      }
    });
    if (pageChanged) {
        newParams.set("page", "0");
    }
    setSearchParams(newParams, { replace: true });
  };

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await homeworkApi.getOwnerTemplateLibrary(
        searchQuery ? searchQuery : undefined,
        selectedType === "all" ? undefined : selectedType,
        selectedDifficulty === "all" ? undefined : selectedDifficulty,
        currentPage,
        pageSize
      );
      setTemplates(data.content);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách mẫu bài tập.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedType, selectedDifficulty, currentPage, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        updateFilters({ keyword: localSearchQuery });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Mẫu Bài Tập Toàn Trung Tâm" />

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng số mẫu" value={totalElements} />
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
              placeholder="Tìm theo tiêu đề..."
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
            <EmptyState message="Không có mẫu bài tập nào." />
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
                    <th className="px-6 py-3 text-center">Trạng thái</th>
                    <th className="px-6 py-3 text-right">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {templates.map((template) => (
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
                      <td className="px-6 py-4 text-center">
                        {template.status === "ARCHIVED" ? (
                          <Badge variant="error">Đã lưu trữ</Badge>
                        ) : template.status === "ACTIVE" ? (
                          <Badge variant="success">Hoạt động</Badge>
                        ) : (
                          <Badge variant="info">Bản nháp</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {formatDateTime(template.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-4">
                <span className="text-sm text-gray-600">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={currentPage === 0}
                    onClick={() => updateFilters({ page: currentPage - 1 })}
                  >
                    Trang trước
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => updateFilters({ page: currentPage + 1 })}
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
