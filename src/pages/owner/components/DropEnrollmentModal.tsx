import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import type { DropReason } from "../../../types/enrollment";

interface DropEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: DropReason, note: string) => Promise<void>;
  studentName: string;
}

const REASON_OPTIONS: { value: DropReason; label: string }[] = [
  { value: "PERSONAL", label: "Lý do cá nhân" },
  { value: "RELOCATION", label: "Chuyển nơi sinh sống" },
  { value: "DISSATISFACTION", label: "Không hài lòng chất lượng" },
  { value: "FINANCIAL", label: "Khó khăn tài chính" },
  { value: "OTHER", label: "Lý do khác" },
];

export const DropEnrollmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
}: DropEnrollmentModalProps) => {
  const [reason, setReason] = useState<DropReason>("PERSONAL");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("PERSONAL");
      setNote("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");
      await onConfirm(reason, note);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể cập nhật trạng thái nghỉ ngang.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Báo nghỉ ngang: ${studentName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 p-2">
            {error}
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Lý do nghỉ
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as DropReason)}
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ghi chú thêm (Tùy chọn)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none min-h-[80px]"
            placeholder="Chi tiết lý do..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Xác nhận
          </Button>
        </div>
      </form>
    </Modal>
  );
};
