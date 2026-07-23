import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  SearchInput,
  PageHeader,
  ErrorBanner,
  LoadingSkeleton,
  StatCard,
} from "../../components/ui/SharedComponents";
import { StudentForm } from "./components/StudentForm";
import { BulkAddStudentForm } from "./components/BulkAddStudentForm";
import { TemporaryPasswordDialog } from "../../components/ui/TemporaryPasswordDialog";
import { studentApi } from "../../api/studentApi";
import type {
  StudentResponse,
  StudentRequest,
  BulkStudentRequest,
  BulkStudentResult,
} from "../../types/student";

import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";

export const StudentsPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentResponse | null>(
    null,
  );

  // Temporary password dialog state
  const [createdUser, setCreatedUser] = useState<{
    fullName: string;
    phoneNumber: string;
    temporaryPassword: string;
  } | null>(null);

  // Field-level error for create/edit forms (409 highlighting)
  const [fieldError, setFieldError] = useState<"email" | "phoneNumber" | null>(
    null,
  );

  const loadStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setStudents(await studentApi.findAll());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách học sinh.",
      );
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
        s.fullName.toLowerCase().includes(q) || s.phoneNumber.includes(search),
    );
  }, [students, search]);

  const handleCreate = async (data: StudentRequest) => {
    try {
      setError("");
      setFieldError(null);
      const created = await studentApi.create(data);
      setIsAddModalOpen(false);
      setFieldError(null);
      toast.success("Thêm học sinh thành công.");
      if (created.temporaryPassword) {
        setCreatedUser({
          fullName: created.fullName,
          phoneNumber: created.phoneNumber,
          temporaryPassword: created.temporaryPassword,
        });
      }
      loadStudents();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Không thể tạo học sinh.";
      setError(message);
      toast.error(`${message}`);
      if (message.includes("Email")) {
        setFieldError("email");
      } else if (message.includes("Phone")) {
        setFieldError("phoneNumber");
      }
    }
  };

  const handleUpdate = async (data: StudentRequest) => {
    if (!editingStudent) return;
    const confirmed = await confirm({
      title: "Chỉnh sửa học sinh?",
      message: `Xác nhận cập nhật thông tin cho học sinh "${editingStudent.fullName}"?`,
      confirmText: "Lưu thay đổi",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      setError("");
      setFieldError(null);
      await studentApi.update(editingStudent.userId, data);
      setEditingStudent(null);
      setFieldError(null);
      toast.success("Cập nhật thông tin học sinh thành công.");
      loadStudents();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Không thể cập nhật học sinh.";
      setError(message);
      toast.error(`${message}`);
      if (message.includes("Email")) {
        setFieldError("email");
      } else if (message.includes("Phone")) {
        setFieldError("phoneNumber");
      }
    }
  };

  const handleDelete = async (student: StudentResponse) => {
    const confirmed = await confirm({
      title: "Gỡ học sinh khỏi trung tâm?",
      message: `Bạn có chắc chắn muốn gỡ học sinh "${student.fullName}" khỏi trung tâm?`,
      confirmText: "Gỡ học sinh",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await studentApi.delete(student.userId);
      toast.success("Đã xóa học sinh khỏi trung tâm thành công.");
      loadStudents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể gỡ học sinh.");
    }
  };

  const handleBulkCreate = async (
    data: BulkStudentRequest,
  ): Promise<BulkStudentResult[]> => {
    try {
      const results = await studentApi.bulkCreate(data);
      toast.success("Nhập danh sách học sinh thành công.");
      loadStudents();
      return results;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể nhập danh sách học sinh.");
      throw err;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Học sinh">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsBulkAddModalOpen(true)}
          >
            Nhập nhiều
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            + Thêm học sinh
          </Button>
        </div>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng học sinh" value={students.length} />
        <StatCard label="Đang hiển thị" value={filtered.length} />
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Tìm theo tên hoặc SĐT..."
      />

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-16" />
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          {search
            ? "Không tìm thấy học sinh phù hợp."
            : "Chưa có học sinh nào."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Họ tên</th>
                <th className="px-6 py-3">Số điện thoại</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((student) => (
                <tr
                  key={student.userId}
                  className="transition-colors hover:bg-surface-hover"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {student.fullName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {student.phoneNumber}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <button
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        onClick={() => setEditingStudent(student)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDelete(student)}
                      >
                        Gỡ
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
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm học sinh mới"
      >
        <StudentForm
          onSubmit={handleCreate}
          onCancel={() => {
            setIsAddModalOpen(false);
            setFieldError(null);
            setError("");
          }}
          fieldError={fieldError}
        />
      </Modal>
      <Modal
        isOpen={!!editingStudent}
        onClose={() => {
          setEditingStudent(null);
          setFieldError(null);
          setError("");
        }}
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
            onCancel={() => {
              setEditingStudent(null);
              setFieldError(null);
              setError("");
            }}
            fieldError={fieldError}
          />
        )}
      </Modal>
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

      <TemporaryPasswordDialog
        isOpen={createdUser !== null}
        onClose={() => setCreatedUser(null)}
        fullName={createdUser?.fullName ?? ""}
        phoneNumber={createdUser?.phoneNumber ?? ""}
        temporaryPassword={createdUser?.temporaryPassword ?? ""}
        roleLabel="Student"
      />
    </div>
  );
};

export default StudentsPage;
