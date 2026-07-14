import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
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

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassResponse | null>(null);

  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await classApi.findAll();
      setClasses(data);
    } catch {
      // silent
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
    <div className="space-y-6 text-gray-900 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-gray-200 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Lớp học</h1>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="border border-primary bg-primary text-white hover:bg-primary-hover rounded-lg px-4 py-2 text-sm transition-colors"
        >
          + Tạo lớp mới
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md w-full">
        <Input
          label=""
          placeholder="Tìm theo tên lớp hoặc cấp độ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Tổng lớp
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {classes.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Đang hoạt động
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {classes.filter((c) => c.isActive).length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Tổng học sinh
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {classes.reduce((s, c) => s + c.maxStudents, 0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Đang tải lớp học...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Không tìm thấy lớp học nào.
          </div>
        ) : (
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 text-xs uppercase tracking-wide">
                <th className="pb-3 pr-4 text-left font-medium">Tên lớp</th>
                <th className="pb-3 px-4 text-left font-medium">Cấp độ</th>
                <th className="pb-3 px-4 text-right font-medium">
                  Sĩ số tối đa
                </th>
                <th className="pb-3 px-4 text-right font-medium">
                  Học phí/tháng
                </th>
                <th className="pb-3 px-4 text-center font-medium">
                  Trạng thái
                </th>
                <th className="pb-3 pl-4 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((cls) => (
                <tr
                  key={cls.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedClass(cls)}
                >
                  <td className="py-4 pr-4 font-semibold text-gray-900">
                    {cls.name}
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {cls.vstepLevel}
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-right">
                    {cls.maxStudents}
                  </td>
                  <td className="py-4 px-4 text-gray-900 text-right font-medium">
                    {formatCurrency(cls.monthFee)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        cls.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cls.isActive ? "Đang hoạt động" : "Tạm dừng"}
                    </span>
                  </td>
                  <td
                    className="py-4 pl-4 text-right text-xs space-x-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="text-gray-600 hover:text-gray-900 underline underline-offset-4"
                      onClick={() => {
                        setEditingClass(cls);
                        setIsAddModalOpen(true);
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-700 underline underline-offset-4"
                      onClick={() => handleDelete(cls)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
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

      {/* Detail Drawer */}
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
