import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { StudentForm } from "./components/StudentForm";
import { BulkAddStudentForm } from "./components/BulkAddStudentForm";
import { studentApi } from "../../api/studentApi";
import type { StudentResponse, StudentRequest, BulkStudentRequest, BulkStudentResult } from "../../types/student";

export const StudentsPage = () => {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentResponse | null>(null);

  const loadStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await studentApi.findAll();
      setStudents(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách học sinh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.phoneNumber.includes(search),
    );
  }, [students, search]);

  const handleCreate = async (data: StudentRequest) => {
    await studentApi.create(data);
    setIsAddModalOpen(false);
    loadStudents();
  };

  const handleUpdate = async (data: StudentRequest) => {
    if (editingStudent) {
      await studentApi.update(editingStudent.userId, data);
      setEditingStudent(null);
      loadStudents();
    }
  };

  const handleDelete = async (student: StudentResponse) => {
    if (!window.confirm(`Xóa học sinh "${student.fullName}"?`)) return;
    await studentApi.delete(student.userId);
    loadStudents();
  };

  const handleBulkCreate = async (data: BulkStudentRequest): Promise<BulkStudentResult[]> => {
    const results = await studentApi.bulkCreate(data);
    loadStudents();
    return results;
  };

  return (
    <div className="space-y-6 text-gray-900 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-gray-200 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Học sinh</h1>
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
            + Thêm học sinh
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
          <p className="text-xs text-gray-500 uppercase tracking-wide">Tổng học sinh</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{students.length}</p>
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
          <div className="py-12 text-center text-sm text-gray-400">Đang tải học sinh...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {search ? "Không tìm thấy học sinh phù hợp." : "Chưa có học sinh nào."}
          </div>
        ) : (
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 text-xs uppercase tracking-wide">
                <th className="pb-3 pr-4 text-left font-medium">Họ tên</th>
                <th className="pb-3 px-4 text-left font-medium">Số điện thoại</th>
                <th className="pb-3 pl-4 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((student) => (
                <tr key={student.userId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pr-4 font-semibold text-gray-900">{student.fullName}</td>
                  <td className="py-4 px-4 text-gray-600">{student.phoneNumber}</td>
                  <td className="py-4 pl-4 text-right text-xs space-x-4">
                    <button
                      className="text-gray-600 hover:text-gray-900 underline underline-offset-4"
                      onClick={() => setEditingStudent(student)}
                    >
                      Sửa
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-700 underline underline-offset-4"
                      onClick={() => handleDelete(student)}
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
        title="Thêm học sinh mới"
      >
        <StudentForm
          onSubmit={handleCreate}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Chỉnh sửa học sinh"
      >
        {editingStudent && (
          <StudentForm
            initialData={{
              fullName: editingStudent.fullName,
              phoneNumber: editingStudent.phoneNumber,
              email: "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingStudent(null)}
          />
        )}
      </Modal>

      {/* Bulk Add Modal */}
      <Modal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        title="Nhập nhiều học sinh"
      >
        <BulkAddStudentForm
          onSubmit={handleBulkCreate}
          onCancel={() => setIsBulkAddModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default StudentsPage;
