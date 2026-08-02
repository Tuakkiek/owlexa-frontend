import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { teacherApi } from "../../../api/teacherApi";
import type { CourseRequest, CourseResponse } from "../../../types/course";
import type { TeacherResponse } from "../../../types/teacher";

interface CourseFormProps {
  initialData?: CourseResponse;
  onSubmit: (data: CourseRequest) => Promise<void>;
  onCancel: () => void;
}

export const CourseForm = ({ initialData, onSubmit, onCancel }: CourseFormProps) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultDuration, setDefaultDuration] = useState("");
  const [defaultSessionCount, setDefaultSessionCount] = useState("");
  const [defaultMonthlyFee, setDefaultMonthlyFee] = useState("");
  const [defaultTeacherUserId, setDefaultTeacherUserId] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);

  useEffect(() => {
    teacherApi.findAll().then(setTeachers).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setDescription(initialData.description ?? "");
      setDefaultDuration(initialData.defaultDuration?.toString() ?? "");
      setDefaultSessionCount(initialData.defaultSessionCount?.toString() ?? "");
      setDefaultMonthlyFee(initialData.defaultMonthlyFee?.toString() ?? "");
      setDefaultTeacherUserId(initialData.defaultTeacherUserId ?? "");
      setIsActive(initialData.isActive);
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) return setError("Mã khóa học không được để trống.");
    if (!name.trim()) return setError("Tên khóa học không được để trống.");

    try {
      setIsLoading(true);
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        defaultDuration: defaultDuration ? Number(defaultDuration) : undefined,
        defaultSessionCount: defaultSessionCount ? Number(defaultSessionCount) : undefined,
        defaultMonthlyFee: defaultMonthlyFee ? Number(defaultMonthlyFee) : undefined,
        defaultTeacherUserId: defaultTeacherUserId ? Number(defaultTeacherUserId) : undefined,
        isActive,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu khóa học.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Mã khóa học *" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: VSTEP-B1" />

      <Input label="Tên khóa học *" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: VSTEP B1" />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="Mô tả khóa học..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Số buổi"
          type="number"
          value={defaultSessionCount}
          onChange={(e) => setDefaultSessionCount(e.target.value)}
          placeholder="VD: 24"
          containerClassName="h-full"
        />
        <Input
          label="Thời lượng/buổi (phút)"
          type="number"
          value={defaultDuration}
          onChange={(e) => setDefaultDuration(e.target.value)}
          placeholder="VD: 90"
          containerClassName="h-full"
        />
        <Input
          label="Học phí mặc định"
          type="number"
          value={defaultMonthlyFee}
          onChange={(e) => setDefaultMonthlyFee(e.target.value)}
          placeholder="VD: 1500000"
          containerClassName="h-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Giáo viên mặc định</label>
        <select
          value={defaultTeacherUserId}
          onChange={(e) => setDefaultTeacherUserId(e.target.value ? Number(e.target.value) : "")}
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">-- Chưa gán --</option>
          {teachers.map((teacher) => (
            <option key={teacher.userId} value={teacher.userId}>
              {teacher.fullName}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-primary" />
        <span className="text-gray-700">Đang hoạt động</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );
};
