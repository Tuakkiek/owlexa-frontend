import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { CourseRequest, CourseResponse } from "../../../types/course";

interface CourseFormProps {
  initialData?: CourseResponse;
  onSubmit: (data: CourseRequest) => Promise<void>;
  onCancel: () => void;
}

export const CourseForm = ({
  initialData,
  onSubmit,
  onCancel,
}: CourseFormProps) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultMonthlyFee, setDefaultMonthlyFee] = useState("");
  const [defaultMaxStudents, setDefaultMaxStudents] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setDescription(initialData.description ?? "");
      setDefaultMonthlyFee(initialData.defaultMonthlyFee?.toString() ?? "");
      setDefaultMaxStudents(initialData.defaultMaxStudents?.toString() ?? "");
      setIsActive(initialData.isActive);
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Mã khóa học không được để trống.");
      return;
    }
    if (!name.trim()) {
      setError("Tên khóa học không được để trống.");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        defaultMonthlyFee: defaultMonthlyFee
          ? Number(defaultMonthlyFee)
          : undefined,
        defaultMaxStudents: defaultMaxStudents
          ? Number(defaultMaxStudents)
          : undefined,
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
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Mã khóa học *
        </label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="VD: VSTEP-B1"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tên khóa học *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: VSTEP B1"
        />
      </div>


      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Mô tả
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="Mô tả khóa học..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Học phí mặc định
          </label>
          <Input
            type="number"
            value={defaultMonthlyFee}
            onChange={(e) => setDefaultMonthlyFee(e.target.value)}
            placeholder="VD: 1500000"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Sĩ số tối đa
          </label>
          <Input
            type="number"
            value={defaultMaxStudents}
            onChange={(e) => setDefaultMaxStudents(e.target.value)}
            placeholder="VD: 20"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="accent-primary"
        />
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
