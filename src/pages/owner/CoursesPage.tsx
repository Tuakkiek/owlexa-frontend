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
import { CourseDetailDrawer } from "./components/CourseDetailDrawer";
import { courseApi } from "../../api/courseApi";
import type { CourseRequest, CourseResponse } from "../../types/course";

import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";

const CoursesPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseResponse | null>(
    null,
  );
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(null);

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
      const confirmed = await confirm({
        title: "Cập nhật khóa học?",
        message: `Bạn có chắc chắn muốn cập nhật thông tin khóa học "${editingCourse.name}"?`,
        confirmText: "Lưu thay đổi",
        variant: "primary",
      });
      if (!confirmed) return;

      try {
        await courseApi.update(editingCourse.id, request);
        toast.success("Cập nhật khóa học thành công.");
        setIsModalOpen(false);
        setEditingCourse(null);
        await loadCourses();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Không thể cập nhật khóa học.");
      }
    } else {
      try {
        await courseApi.create(request);
        toast.success("Tạo khóa học thành công.");
        setIsModalOpen(false);
        setEditingCourse(null);
        await loadCourses();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Không thể tạo khóa học.");
      }
    }
  };

  const handleDelete = async (course: CourseResponse) => {
    try {
      const validation = await courseApi.validateDelete(course.id);
      if (!validation.canDelete) {
        let msg = `${validation.message}\n\nĐang được liên kết bởi các lớp học:\n`;
        validation.dependencies.forEach((d) => {
          msg += `- Lớp ${d.className} (Sĩ số: ${d.studentCount}, Trạng thái: ${d.status})\n`;
        });
        msg += `\nVui lòng điều chỉnh hoặc xóa các lớp học này trước khi xóa khóa học. Bạn cũng có thể Tắt kích hoạt khóa học này thay vì xóa.`;
        toast.warning(msg);
        return;
      }

      const confirmed = await confirm({
        title: "Xóa khóa học?",
        message: `Bạn có chắc chắn muốn xóa khóa học "${course.name}" không?`,
        confirmText: "Xóa",
        variant: "danger",
      });
      if (!confirmed) return;

      await courseApi.delete(course.id);
      toast.success("Xóa khóa học thành công.");
      await loadCourses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa khóa học.");
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
                <tr
                  key={course.id}
                  className="hover:bg-surface-hover cursor-pointer"
                  onClick={() => setSelectedCourse(course)}
                >
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
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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

      {selectedCourse && (
        <CourseDetailDrawer
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onRefresh={async () => {
            await loadCourses();
            try {
              const updated = await courseApi.findById(selectedCourse.id);
              setSelectedCourse(updated);
            } catch {
              setSelectedCourse(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default CoursesPage;
