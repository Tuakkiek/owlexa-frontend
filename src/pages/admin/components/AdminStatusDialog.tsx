import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";

interface AdminStatusDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  confirmVariant: "danger" | "primary";
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function AdminStatusDialog({
  isOpen,
  title,
  description,
  confirmText,
  confirmVariant,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminStatusDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen, title]);

  const submit = async () => {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3) {
      setError("Vui lòng nhập lý do ít nhất 3 ký tự.");
      return;
    }
    await onConfirm(normalizedReason);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Lý do <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
            maxLength={500}
            rows={4}
            placeholder="Nhập lý do để lưu vào nhật ký quản trị..."
            className={`w-full resize-none rounded-input border bg-white px-3 py-2 text-sm outline-none focus:border-primary ${
              error ? "border-red-300" : "border-surface-border"
            }`}
          />
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-red-600">{error}</span>
            <span className="text-gray-400">{reason.length}/500</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-surface-border pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            variant={confirmVariant}
            onClick={submit}
            isLoading={isSubmitting}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
