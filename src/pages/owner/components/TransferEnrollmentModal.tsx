import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import type { ClassResponse } from "../../../types/class";

interface TransferEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetClassId: number, note: string) => Promise<void>;
  studentName: string;
  currentClass: ClassResponse;
  availableClasses: ClassResponse[];
}

export const TransferEnrollmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  currentClass,
  availableClasses,
}: TransferEnrollmentModalProps) => {
  const [targetClassId, setTargetClassId] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTargetClassId("");
      setNote("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClassId) {
      setError("Vui lòng chọn lớp đích.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await onConfirm(Number(targetClassId), note);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể chuyển lớp.");
    } finally {
      setIsLoading(false);
    }
  };

  const validClasses = availableClasses.filter(
    (c) => c.id !== currentClass.id && c.status === "ACTIVE",
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chuyển lớp: ${studentName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="border border-red-200 bg-red-50 p-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Lớp hiện tại
          </label>
          <div className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            {currentClass.name}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Lớp đích
          </label>
          <select
            value={targetClassId}
            onChange={(e) =>
              setTargetClassId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          >
            <option value="" disabled>
              -- Chọn lớp --
            </option>
            {validClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.studentCount} học sinh)
              </option>
            ))}
          </select>
          {validClasses.length === 0 && (
            <p className="mt-1 text-xs text-orange-600">
              Không có lớp ACTIVE khác để chuyển.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ghi chú thêm
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px] w-full border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="Chi tiết lý do chuyển lớp..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!targetClassId || validClasses.length === 0}>
            Xác nhận
          </Button>
        </div>
      </form>
    </Modal>
  );
};
