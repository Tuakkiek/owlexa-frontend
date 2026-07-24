import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import homeworkApi from "../../api/homeworkApi";
import { classApi } from "../../api/classApi";
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
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import type { HomeworkAssignmentResponse, HomeworkAssignmentStatus } from "../../types/homework";
import type { ClassResponse } from "../../types/class";

const statusLabels: Record<HomeworkAssignmentStatus, string> = {
  DRAFT: "Bản nháp",
  SCHEDULED: "Đã lên lịch",
  OPEN: "Đang mở",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã hủy",
  ARCHIVED: "Đã lưu trữ",
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

export default function TeacherHomeworkAssignmentsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [assignments, setAssignments] = useState<HomeworkAssignmentResponse[]>([]);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // URL synced state
  const searchQuery = searchParams.get("keyword") || "";
  const selectedStatus = (searchParams.get("status") as HomeworkAssignmentStatus | "all") || "all";
  const selectedClassId = searchParams.get("classId") || "all";
  
  // Local state for debounced search
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
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
  }, [searchParams, setSearchParams]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        updateFilters({ keyword: localSearchQuery });
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery, updateFilters]);

  // Sync local search when URL changes externally
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const [assignmentsData, classesData] = await Promise.all([
        homeworkApi.getAssignmentLibrary({
          keyword: searchQuery ? searchQuery : undefined,
          status: selectedStatus === "all" ? undefined : selectedStatus,
          classId: selectedClassId === "all" ? undefined : Number(selectedClassId)
        }),
        classApi.findMyClasses()
      ]);
      
      // Sort by newest first
      assignmentsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAssignments(assignmentsData);
      setClasses(classesData);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách bài tập đã giao.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedStatus, selectedClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number) => {
    try {
      await homeworkApi.deleteAssignment(id);
      showToast("Xóa bài tập thành công.", "success");
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Không thể xóa bài tập.", "error");
    }
  };

  const handleViewDetails = (id: number) => {
    navigate(`/teacher/homework-assignments/${id}`);
  };
  
  // Client-side pagination logic
  const totalPages = Math.ceil(assignments.length / pageSize);
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return assignments.slice(start, start + pageSize);
  }, [assignments, currentPage, pageSize]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <PageHeader title="Quản lý Giao Bài Tập">
        <Button
          onClick={() => navigate("/teacher/homework-assignments/new")}
          size="sm"
        >
          Giao Bài Tập Mới
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Tổng cộng" value={assignments.length} />
        <StatCard
          label="Đang mở"
          value={assignments.filter((a) => a.status === "OPEN").length}
        />
        <StatCard
          label="Đã lên lịch"
          value={assignments.filter((a) => a.status === "SCHEDULED").length}
        />
        <StatCard
          label="Đã đóng"
          value={assignments.filter((a) => a.status === "CLOSED").length}
        />
        <StatCard
          label="Bản nháp"
          value={assignments.filter((a) => a.status === "DRAFT").length}
        />
      </div>

      <section className="rounded-card border border-surface-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row items-center w-full max-w-3xl">
            <FilterTabs
              tabs={[
                { key: "all", label: "Tất cả trạng thái" },
                { key: "DRAFT", label: "Bản nháp" },
                { key: "SCHEDULED", label: "Lên lịch" },
                { key: "OPEN", label: "Đang mở" },
                { key: "CLOSED", label: "Đã đóng" },
              ]}
              activeKey={selectedStatus}
              onChange={(key) => updateFilters({ status: key })}
            />
            
            <select
              className="rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary transition-colors"
              value={selectedClassId}
              onChange={(e) => updateFilters({ classId: e.target.value })}
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="relative max-w-sm w-full lg:w-64">
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
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Tìm theo mẫu bài tập..."
              className="w-full rounded-input border border-surface-border bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            <LoadingSkeleton count={5} height="h-16" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="mt-6">
            <EmptyState message="Chưa có bài tập nào phù hợp.">
              <Button onClick={() => navigate("/teacher/homework-assignments/new")}>
                Giao bài tập mới
              </Button>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-6">
            <div className="overflow-x-auto rounded-card border border-surface-border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3 min-w-[200px]">Mẫu Bài Tập</th>
                    <th className="px-6 py-3">Lớp học</th>
                    <th className="px-6 py-3 text-center">Trạng thái</th>
                    <th className="px-6 py-3">Thời gian (Mở - Đóng)</th>
                    <th className="px-6 py-3 text-center">Tiến độ nộp</th>
                    <th className="px-6 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {paginatedAssignments.map((assignment) => (
                    <tr key={assignment.id} className="transition-colors hover:bg-surface-hover">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 line-clamp-2">
                          {assignment.templateTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {assignment.clazzName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge 
                          variant={
                            assignment.status === "OPEN" ? "success" : 
                            assignment.status === "SCHEDULED" ? "warning" :
                            assignment.status === "CLOSED" ? "error" :
                            "info"
                          }
                        >
                          {statusLabels[assignment.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          <div><span className="font-medium text-gray-500">Từ:</span> {formatDateTime(assignment.availableFrom)}</div>
                          <div><span className="font-medium text-red-400">Đến:</span> {formatDateTime(assignment.dueDate)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-medium text-gray-900">
                            {assignment.submittedCount} / {assignment.totalStudents}
                          </span>
                          <span className="text-[10px] text-gray-500">Đã chấm: {assignment.gradedCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewDetails(assignment.id)}
                          >
                            Chi tiết
                          </Button>
                          {assignment.status === "DRAFT" && (
                            <ConfirmDialog
                              title="Xóa bài tập"
                              message="Bạn có chắc chắn muốn xóa bài tập nháp này không?"
                              onConfirm={() => handleDelete(assignment.id)}
                            >
                              <Button variant="danger" size="sm">
                                Xóa
                              </Button>
                            </ConfirmDialog>
                          )}
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
                  Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, assignments.length)} trong {assignments.length} kết quả
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
