import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import type { HomeworkAssignmentStatus } from "../../types/homework";
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

export default function OwnerHomeworkAssignmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const searchQuery = searchParams.get("keyword") || "";
  const selectedStatus = (searchParams.get("status") as HomeworkAssignmentStatus | "all") || "all";
  const selectedClassId = searchParams.get("classId") || "all";
  const currentPage = Number(searchParams.get("page")) || 0;
  const pageSize = 10;
  
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const updateFilters = useCallback((updates: Record<string, string | number | null>) => {
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
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        updateFilters({ keyword: localSearchQuery });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery, updateFilters]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const [assignmentsData, classesData] = await Promise.all([
        homeworkApi.getOwnerAssignmentLibrary(
          searchQuery ? searchQuery : undefined,
          selectedClassId === "all" ? undefined : Number(selectedClassId),
          undefined,
          selectedStatus === "all" ? undefined : selectedStatus,
          currentPage,
          pageSize
        ),
        classApi.getAllClasses()
      ]);
      
      setAssignments(assignmentsData.content);
      setTotalElements(assignmentsData.totalElements);
      setClasses(classesData.content || classesData);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách bài tập đã giao.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedStatus, selectedClassId, currentPage, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <PageHeader title="Quản lý Bài Tập Trung Tâm" />

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng số bài giao" value={totalElements} />
      </div>

      <section className="rounded-card border border-surface-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row items-center w-full max-w-3xl">
            <FilterTabs
              tabs={[
                { key: "all", label: "Tất cả" },
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
              {Array.isArray(classes) && classes.map(c => (
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
              placeholder="Tìm kiếm..."
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
            <EmptyState message="Không có bài tập nào phù hợp." />
          </div>
        ) : (
          <div className="mt-6">
            <div className="overflow-x-auto rounded-card border border-surface-border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3 min-w-[200px]">Mẫu Bài Tập</th>
                    <th className="px-6 py-3">Lớp học</th>
                    <th className="px-6 py-3">Giáo viên</th>
                    <th className="px-6 py-3 text-center">Trạng thái</th>
                    <th className="px-6 py-3">Thời gian (Mở - Đóng)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="transition-colors hover:bg-surface-hover">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 line-clamp-2">
                          {assignment.homeworkTemplate?.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {assignment.clazz?.name}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {assignment.teacher?.fullName}
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
                          {statusLabels[assignment.status as HomeworkAssignmentStatus]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          <div><span className="font-medium text-gray-500">Từ:</span> {formatDateTime(assignment.availableFrom)}</div>
                          <div><span className="font-medium text-red-400">Đến:</span> {formatDateTime(assignment.dueDate)}</div>
                        </div>
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
