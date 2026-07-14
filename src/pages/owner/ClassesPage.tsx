import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  SearchInput,
  PageHeader,
  Badge,
  StatCard,
} from "../../components/ui/SharedComponents";
import { ClassForm } from "./components/ClassForm";
import { ClassDetailDrawer } from "./components/ClassDetailDrawer";
import { classApi } from "../../api/classApi";
import { formatCurrency } from "../../utils/money";
import type { ClassResponse, ClassRequest } from "../../types/class";

export const ClassesPage = () => {
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
    if (!searchQuery) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.vstepLevel.toLowerCase().includes(q),
    );
  }, [classes, searchQuery]);

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
                <th className="px-6 py-3">Cấp độ</th>
                <th className="px-6 py-3 text-right">Sĩ số tối đa</th>
                <th className="px-6 py-3 text-right">Học phí/tháng</th>
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
                  <td className="px-6 py-4 text-gray-600">{cls.vstepLevel}</td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {cls.maxStudents}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(cls.monthFee)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={cls.isActive ? "success" : "default"}>
                      {cls.isActive ? "Đang hoạt động" : "Tạm dừng"}
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
