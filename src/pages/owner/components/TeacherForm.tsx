import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { TeacherRequest } from "../../../types/teacher";

interface TeacherFormProps {
  initialData?: Partial<TeacherRequest>;
  onSubmit: (data: TeacherRequest) => Promise<void>;
  onCancel: () => void;
}

export const TeacherForm = ({ initialData, onSubmit, onCancel }: TeacherFormProps) => {
  const [formData, setFormData] = useState<TeacherRequest>({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<TeacherRequest>>({});

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
    const newErrors: Partial<TeacherRequest> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Họ tên không được để trống";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Số điện thoại không được để trống";
    } else if (!/^0\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "SĐT phải gồm 10 chữ số, bắt đầu bằng 0 (VD: 0912345678)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsLoading(true);
      await onSubmit(formData);
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
        placeholder="VD: Nguyễn Văn A"
      />

      <Input
        label="Email (tùy chọn)"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        placeholder="VD: nguyenvana@email.com"
      />

      <Input
        label="Số điện thoại"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        error={errors.phoneNumber}
        placeholder="0912345678"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Cập nhật" : "Thêm giáo viên"}
        </Button>
      </div>
    </form>
  );
};
