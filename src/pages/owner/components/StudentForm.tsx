import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { StudentRequest } from "../../../types/student";

interface StudentFormProps {
  initialData?: Partial<StudentRequest>;
  onSubmit: (data: StudentRequest) => Promise<void>;
  onCancel: () => void;
  /** Highlights the specified field with error styling after a 409 response */
  fieldError?: "email" | "phoneNumber" | null;
}

export const StudentForm = ({
  initialData,
  onSubmit,
  onCancel,
  fieldError,
}: StudentFormProps) => {
  const [formData, setFormData] = useState<StudentRequest>({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<StudentRequest>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName ?? "",
        email: initialData.email ?? "",
        phoneNumber: initialData.phoneNumber ?? "",
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<StudentRequest> = {};
    const trimmedPhone = formData.phoneNumber.trim();
    const trimmedEmail = formData.email.trim();

    if (!formData.fullName.trim())
      newErrors.fullName = "Họ tên không được để trống";
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!trimmedPhone) {
      newErrors.phoneNumber = "Số điện thoại không được để trống";
    } else if (!/^0\d{9}$/.test(trimmedPhone)) {
      newErrors.phoneNumber =
        "SĐT phải gồm 10 chữ số, bắt đầu bằng 0 (VD: 0912345678)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsLoading(true);
      await onSubmit({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Họ tên"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        error={errors.fullName}
        placeholder="VD: Trần Thị B"
      />

      <Input
        label="Email (tùy chọn)"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={fieldError === "email" ? "Email đã tồn tại" : errors.email}
        placeholder="VD: transtb@email.com"
      />

      <Input
        label="Số điện thoại"
        value={formData.phoneNumber}
        onChange={(e) =>
          setFormData({ ...formData, phoneNumber: e.target.value })
        }
        error={
          fieldError === "phoneNumber"
            ? "Số điện thoại đã tồn tại"
            : errors.phoneNumber
        }
        placeholder="0912345678"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Cập nhật" : "Thêm học sinh"}
        </Button>
      </div>
    </form>
  );
};
