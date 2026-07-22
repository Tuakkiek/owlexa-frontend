import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  PageHeader,
  SearchInput,
  ErrorBanner,
  LoadingSkeleton,
  Badge,
} from "../../components/ui/SharedComponents";
import { CourseForm } from "./components/CourseForm";
import { courseApi } from "../../api/courseApi";
import type { CourseRequest, CourseResponse } from "../../types/course";

const CoursesPage = () => {
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseResponse | null>(
    null,
  );

  const loadCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setCourses(await courseApi.findAllIncludingInactive());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách khóa học.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [courses, query]);

  const openCreate = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const openEdit = (course: CourseResponse) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleSave = async (request: CourseRequest) => {
    if (editingCourse) {
      await courseApi.update(editingCourse.id, request);
    } else {
      await courseApi.create(request);
    }
    setIsModalOpen(false);
    setEditingCourse(null);
    await loadCourses();
  };

  const handleDelete = async (course: CourseResponse) => {
    if (!window.confirm(`Xóa khóa học "${course.name}"?`)) return;
    try {
      await courseApi.delete(course.id);
      await loadCourses();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể xóa khóa học.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Khóa học" description="Quản lý chương trình đào tạo">
        <Button onClick={openCreate}>Tạo khóa học</Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm theo tên hoặc mã..."
      />

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-16" />
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Chưa có khóa học nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-6 py-3">Mã</th>
                <th className="px-6 py-3">Tên khóa học</th>
                <th className="px-6 py-3">Học phí mặc định</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((course) => (
                <tr key={course.id} className="hover:bg-surface-hover">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {course.code}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{course.name}</td>
                  <td className="px-6 py-4 text-gray-900">
                    {course.defaultMonthlyFee != null
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          maximumFractionDigits: 0,
                        }).format(course.defaultMonthlyFee)
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={course.isActive ? "success" : "default"}>
                      {course.isActive ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="text-xs text-blue-600 underline"
                        onClick={() => openEdit(course)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-xs text-red-600 underline"
                        onClick={() => handleDelete(course)}
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
        onClose={() => {
          setIsModalOpen(false);
          setEditingCourse(null);
        }}
        title={editingCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
      >
        <CourseForm
          initialData={editingCourse ?? undefined}
          onSubmit={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default CoursesPage;
