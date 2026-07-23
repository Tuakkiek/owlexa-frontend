import { useEffect, useState, useCallback } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SearchInput } from "../../components/ui/SharedComponents";
import {
  PageHeader,
  ErrorBanner,
  LoadingSkeleton,
  StatCard,
} from "../../components/ui/SharedComponents";
import { TeacherForm } from "./components/TeacherForm";
import { BulkAddTeacherForm } from "./components/BulkAddTeacherForm";
import { TeacherSalaryModal } from "./components/TeacherSalaryModal";
import { PermissionModal } from "../../components/permission/PermissionModal";
import { TemporaryPasswordDialog } from "../../components/ui/TemporaryPasswordDialog";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
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
  const confirm = useConfirm();
  const { toast } = useToast();

  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherResponse | null>(
    null,
  );
  const [salaryTeacher, setSalaryTeacher] = useState<TeacherResponse | null>(
    null,
  );
  const [permissionTeacher, setPermissionTeacher] =
    useState<TeacherResponse | null>(null);

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

  const loadTeachers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setTeachers(await teacherApi.findAll());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách giáo viên.",
      );
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
    try {
      setError("");
      setFieldError(null);
      const created = await teacherApi.create(data);
      setIsAddModalOpen(false);
      setFieldError(null);
      toast.success("Thêm giáo viên thành công.");
      if (created.temporaryPassword) {
        setCreatedUser({
          fullName: created.fullName,
          phoneNumber: created.phoneNumber,
          temporaryPassword: created.temporaryPassword,
        });
      }
      loadTeachers();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Không thể tạo giáo viên.";
      setError(message);
      toast.error(`${message}`);
      if (message.includes("Email")) {
        setFieldError("email");
      } else if (message.includes("Phone")) {
        setFieldError("phoneNumber");
      }
    }
  };
  const handleUpdate = async (data: TeacherRequest) => {
    if (!editingTeacher) return;
    const confirmed = await confirm({
      title: "Chỉnh sửa giáo viên?",
      message: `Xác nhận cập nhật thông tin cho giáo viên "${editingTeacher.fullName}"?`,
      confirmText: "Lưu thay đổi",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      setError("");
      setFieldError(null);
      await teacherApi.update(editingTeacher.userId, data);
      setEditingTeacher(null);
      setFieldError(null);
      toast.success("Cập nhật thông tin giáo viên thành công.");
      loadTeachers();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Không thể cập nhật giáo viên.";
      setError(message);
      toast.error(`${message}`);
      if (message.includes("Email")) {
        setFieldError("email");
      } else if (message.includes("Phone")) {
        setFieldError("phoneNumber");
      }
    }
  };
  const handleDelete = async (teacher: TeacherResponse) => {
    const confirmed = await confirm({
      title: "Gỡ giáo viên khỏi trung tâm?",
      message: `Bạn có chắc chắn muốn gỡ giáo viên "${teacher.fullName}" khỏi trung tâm không?`,
      confirmText: "Gỡ",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await teacherApi.delete(teacher.userId);
      toast.success("Đã gỡ giáo viên khỏi trung tâm thành công.");
      loadTeachers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể gỡ giáo viên.");
    }
  };
  const handleBulkCreate = async (
    data: BulkTeacherRequest,
  ): Promise<BulkTeacherResult[]> => {
    try {
      const results = await teacherApi.bulkCreate(data);
      toast.success("Nhập danh sách giáo viên thành công.");
      loadTeachers();
      return results;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể nhập danh sách giáo viên.");
      throw err;
    }
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
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Giáo viên">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsBulkAddModalOpen(true)}
          >
            Nhập nhiều
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            + Thêm giáo viên
          </Button>
        </div>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng giáo viên" value={teachers.length} />
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
            ? "Không tìm thấy giáo viên phù hợp."
            : "Chưa có giáo viên nào."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Họ tên</th>
                <th className="px-6 py-3">Số điện thoại</th>
                <th className="px-6 py-3">Lương</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((teacher) => (
                <tr
                  key={teacher.userId}
                  className="transition-colors hover:bg-surface-hover"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {teacher.fullName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {teacher.phoneNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {formatSalary(teacher.salary, teacher.currency)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <button
                        className="text-primary hover:text-primary-hover transition-colors"
                        onClick={() => setPermissionTeacher(teacher)}
                      >
                        Phân quyền
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        onClick={() => setEditingTeacher(teacher)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        onClick={() => setSalaryTeacher(teacher)}
                      >
                        Lương
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDelete(teacher)}
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
        title="Thêm giáo viên mới"
      >
        <TeacherForm
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
        isOpen={!!editingTeacher}
        onClose={() => {
          setEditingTeacher(null);
          setFieldError(null);
          setError("");
        }}
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
            onCancel={() => {
              setEditingTeacher(null);
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
        title="Nhập nhiều giáo viên"
      >
        <BulkAddTeacherForm
          onSubmit={handleBulkCreate}
          onCancel={() => setIsBulkAddModalOpen(false)}
        />
      </Modal>

      <TeacherSalaryModal
        isOpen={salaryTeacher !== null}
        onClose={() => setSalaryTeacher(null)}
        teacher={salaryTeacher}
        onSaved={handleSalarySaved}
      />

      <PermissionModal
        userId={permissionTeacher?.userId ?? 0}
        userName={permissionTeacher?.fullName ?? ""}
        isOpen={permissionTeacher !== null}
        onClose={() => setPermissionTeacher(null)}
      />

      <TemporaryPasswordDialog
        isOpen={createdUser !== null}
        onClose={() => setCreatedUser(null)}
        fullName={createdUser?.fullName ?? ""}
        phoneNumber={createdUser?.phoneNumber ?? ""}
        temporaryPassword={createdUser?.temporaryPassword ?? ""}
        roleLabel="Teacher"
      />
    </div>
  );
};

export default TeachersPage;
