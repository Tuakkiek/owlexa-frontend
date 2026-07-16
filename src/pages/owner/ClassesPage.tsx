import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  SearchInput,
  PageHeader,
  Badge,
  StatCard,
  FilterTabs,
} from "../../components/ui/SharedComponents";
import { ClassForm } from "./components/ClassForm";
import { ClassDetailDrawer } from "./components/ClassDetailDrawer";
import { classApi } from "../../api/classApi";
import type { ClassResponse, ClassRequest } from "../../types/class";
import { CLASS_STATUS_LABELS } from "../../types/class";

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "PLANNING", label: "Lên kế hoạch" },
  { key: "OPEN", label: "Mở đăng ký" },
  { key: "IN_PROGRESS", label: "Đang học" },
  { key: "FINISHED", label: "Đã kết thúc" },
];

export const ClassesPage = () => {
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState<ClassResponse | null>(
    null,
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassResponse | null>(null);

  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      setClasses(await classApi.findAll());
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filtered = useMemo(() => {
    let result = classes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.vstepLevel.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [classes, searchQuery, statusFilter]);

  const handleCreate = async (data: ClassRequest) => {
    await classApi.create(data);
    setIsAddModalOpen(false);
    loadClasses();
  };
  const handleUpdate = async (data: ClassRequest) => {
    if (editingClass) {
      await classApi.update(editingClass.id, data);
      setEditingClass(null);
      loadClasses();
    }
  };
  const handleDelete = async (cls: ClassResponse) => {
    if (!window.confirm(`Xóa lớp "${cls.name}"?`)) return;
    await classApi.delete(cls.id);
    loadClasses();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Lớp học">
        <Button onClick={() => setIsAddModalOpen(true)}>+ Tạo lớp mới</Button>
      </PageHeader>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Tìm theo tên lớp hoặc cấp độ..."
      />

      <FilterTabs
        tabs={STATUS_FILTERS}
        activeKey={statusFilter}
        onChange={setStatusFilter}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng lớp" value={classes.length} />
        <StatCard
          label="Đang hoạt động"
          value={classes.filter((c) => c.isActive).length}
        />
        <StatCard
          label="Tổng sĩ số"
          value={classes.reduce((s, c) => s + c.maxStudents, 0)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-card bg-surface-hover"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Không tìm thấy lớp học nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Tên lớp</th>
                <th className="px-6 py-3">Khóa học</th>
                <th className="px-6 py-3">Giáo viên</th>
                <th className="px-6 py-3">Cấp độ</th>
                <th className="px-6 py-3 text-right">Sĩ số</th>
                <th className="px-6 py-3 text-center">Trạng thái</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((cls) => (
                <tr
                  key={cls.id}
                  className="cursor-pointer transition-colors hover:bg-surface-hover"
                  onClick={() => setSelectedClass(cls)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {cls.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {cls.courseName ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {cls.teacherFullName ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{cls.vstepLevel}</td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {cls.maxStudents}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={cls.isActive ? "success" : "default"}>
                      {CLASS_STATUS_LABELS[cls.status] ?? cls.status}
                    </Badge>
                  </td>
                  <td
                    className="px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-3 text-sm">
                      <button
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        onClick={() => {
                          setEditingClass(cls);
                          setIsAddModalOpen(true);
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDelete(cls)}
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
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingClass(null);
        }}
        title={editingClass ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
      >
        <ClassForm
          initialData={
            editingClass
              ? {
                  name: editingClass.name,
                  courseId: editingClass.courseId ?? undefined,
                  teacherUserId: editingClass.teacherUserId ?? undefined,
                  vstepLevel: editingClass.vstepLevel,
                  maxStudent: editingClass.maxStudents,
                  monthlyFee: editingClass.monthFee,
                }
              : undefined
          }
          onSubmit={editingClass ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsAddModalOpen(false);
            setEditingClass(null);
          }}
        />
      </Modal>

      {selectedClass && (
        <ClassDetailDrawer
          cls={selectedClass}
          onClose={() => setSelectedClass(null)}
          onRefresh={loadClasses}
        />
      )}
    </div>
  );
};

export default ClassesPage;
