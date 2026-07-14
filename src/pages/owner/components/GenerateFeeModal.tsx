import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";

interface GenerateFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (month: string, dueDate: string) => Promise<void>;
  className: string;
  existingMonths: string[];
}

export const GenerateFeeModal = ({
  isOpen,
  onClose,
  onSubmit,
  className,
  existingMonths,
}: GenerateFeeModalProps) => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [month, setMonth] = useState(defaultMonth);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 5);
    return d.toISOString().slice(0, 10);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMonth(defaultMonth);
      setError("");
    }
  }, [isOpen, defaultMonth]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const monthPattern = /^\d{4}-\d{2}$/;
    if (!monthPattern.test(month)) {
      setError("Tháng phải có định dạng YYYY-MM (VD: 2025-06)");
      return;
    }
    if (!dueDate) {
      setError("Vui lòng chọn ngày đến hạn.");
      return;
    }
    if (existingMonths.includes(month)) {
      setError(`Đã có học phí cho tháng ${month} của lớp này.`);
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(month, dueDate);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tạo học phí.");
    } finally {
      setIsLoading(false);
    }
  };

  const monthOptions: string[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
    for (let m = 12; m >= 1; m--) {
      monthOptions.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tạo học phí tháng cho lớp ${className}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Hệ thống sẽ tự động tạo bản ghi học phí cho tất cả học sinh đang học
          của lớp này.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tháng học phí
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {error && month && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ngày đến hạn
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Tạo học phí
          </Button>
        </div>
      </form>
    </Modal>
  );
};
