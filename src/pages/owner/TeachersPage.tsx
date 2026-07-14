import { useEffect, useState, useCallback } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { TeacherForm } from "./components/TeacherForm";
import { BulkAddTeacherForm } from "./components/BulkAddTeacherForm";
import { TeacherSalaryModal } from "./components/TeacherSalaryModal";
import { teacherApi } from "../../api/teacherApi";
import type {
  TeacherResponse,
  TeacherRequest,
  BulkTeacherRequest,
  BulkTeacherResult,
  TeacherSalaryResponse,
} from "../../types/teacher";

const formatSalary = (
  salary: string | null | undefined,
  currency: string | null | undefined,
) => {
  if (salary === null || salary === undefined || salary === "") return "—";
  const numeric = Number(salary);
  if (Number.isNaN(numeric)) return salary;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency ?? "VND",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export const TeachersPage = () => {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherResponse | null>(null);
  const [salaryTeacher, setSalaryTeacher] = useState<TeacherResponse | null>(null);

  const loadTeachers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await teacherApi.findAll();
      setTeachers(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách giáo viên.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const filtered = search
    ? teachers.filter(
        (t) =>
          t.fullName.toLowerCase().includes(search.toLowerCase()) ||
          t.phoneNumber.includes(search),
      )
    : teachers;

  const handleCreate = async (data: TeacherRequest) => {
    await teacherApi.create(data);
    setIsAddModalOpen(false);
    loadTeachers();
  };

  const handleUpdate = async (data: TeacherRequest) => {
    if (editingTeacher) {
      await teacherApi.update(editingTeacher.userId, data);
      setEditingTeacher(null);
      loadTeachers();
    }
  };

  const handleDelete = async (teacher: TeacherResponse) => {
    if (!window.confirm(`Xóa giáo viên "${teacher.fullName}"?`)) return;
    await teacherApi.delete(teacher.userId);
    loadTeachers();
  };

  const handleBulkCreate = async (data: BulkTeacherRequest): Promise<BulkTeacherResult[]> => {
    const results = await teacherApi.bulkCreate(data);
    loadTeachers();
    return results;
  };

  const handleSalarySaved = useCallback((updated: TeacherSalaryResponse) => {
    setTeachers((current) =>
      current.map((teacher) =>
        teacher.userId === updated.teacherUserId
          ? { ...teacher, salary: updated.salary, currency: updated.currency }
          : teacher,
      ),
    );
  }, []);

  return (
    <div className="space-y-6 text-gray-900 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-gray-200 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Giáo viên</h1>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsBulkAddModalOpen(true)}
            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm"
          >
            Nhập nhiều
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="border border-primary bg-primary text-white hover:bg-primary-hover rounded-lg px-4 py-2 text-sm"
          >
            + Thêm giáo viên
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Tổng giáo viên</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{teachers.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Đang hiển thị</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{filtered.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          label=""
          placeholder="Tìm theo tên hoặc SĐT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">Đang tải giáo viên...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {search ? "Không tìm thấy giáo viên phù hợp." : "Chưa có giáo viên nào."}
          </div>
        ) : (
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 text-xs uppercase tracking-wide">
                <th className="pb-3 pr-4 text-left font-medium">Họ tên</th>
                <th className="pb-3 px-4 text-left font-medium">Số điện thoại</th>
                <th className="pb-3 px-4 text-left font-medium">Lương</th>
                <th className="pb-3 pl-4 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((teacher) => (
                <tr key={teacher.userId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pr-4 font-semibold text-gray-900">{teacher.fullName}</td>
                  <td className="py-4 px-4 text-gray-600">{teacher.phoneNumber}</td>
                  <td className="py-4 px-4 text-gray-700">
                    {formatSalary(teacher.salary, teacher.currency)}
                  </td>
                  <td className="py-4 pl-4 text-right text-xs space-x-4">
                    <button
                      className="text-gray-600 hover:text-gray-900 underline underline-offset-4"
                      onClick={() => setEditingTeacher(teacher)}
                    >
                      Sửa
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-900 underline underline-offset-4"
                      onClick={() => setSalaryTeacher(teacher)}
                    >
                      Lương
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-700 underline underline-offset-4"
                      onClick={() => handleDelete(teacher)}
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

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm giáo viên mới"
      >
        <TeacherForm
          onSubmit={handleCreate}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        title="Chỉnh sửa giáo viên"
      >
        {editingTeacher && (
          <TeacherForm
            initialData={{
              fullName: editingTeacher.fullName,
              phoneNumber: editingTeacher.phoneNumber,
              email: "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTeacher(null)}
          />
        )}
      </Modal>

      {/* Bulk Add Modal */}
      <Modal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        title="Nhập nhiều giáo viên"
      >
        <BulkAddTeacherForm
          onSubmit={handleBulkCreate}
          onCancel={() => setIsBulkAddModalOpen(false)}
        />
      </Modal>

      {/* Salary Modal */}
      <TeacherSalaryModal
        isOpen={salaryTeacher !== null}
        onClose={() => setSalaryTeacher(null)}
        teacher={salaryTeacher}
        onSaved={handleSalarySaved}
      />
    </div>
  );
};

export default TeachersPage;
