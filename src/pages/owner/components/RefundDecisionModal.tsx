import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import type { RefundResponse } from "../../../types/refund";
import { formatMoney } from "../../../utils/money";

interface RefundDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (approved: boolean, rejectionReason?: string) => Promise<void>;
  refund: RefundResponse;
}

export const RefundDecisionModal = ({
  isOpen,
  onClose,
  onConfirm,
  refund,
}: RefundDecisionModalProps) => {
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | "">("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDecision("");
      setRejectionReason("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) {
      setError("Vui lòng chọn Duyệt hoặc Từ chối.");
      return;
    }
    if (decision === "REJECT" && !rejectionReason.trim()) {
      setError("Vui lòng nhập lý do từ chối.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await onConfirm(decision === "APPROVE", decision === "REJECT" ? rejectionReason : undefined);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu quyết định.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Duyệt yêu cầu hoàn tiền`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 p-2">
            {error}
          </p>
        )}

        <div className="text-sm space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p><span className="font-medium text-gray-700">Học sinh:</span> {refund.studentFullName}</p>
          <p><span className="font-medium text-gray-700">Số tiền:</span> {formatMoney(refund.amount)}</p>
          <p><span className="font-medium text-gray-700">Lý do:</span> {refund.reason}</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Quyết định
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="decision"
                value="APPROVE"
                checked={decision === "APPROVE"}
                onChange={() => setDecision("APPROVE")}
                className="accent-primary"
              />
              <span className="text-sm text-gray-800">Duyệt hoàn tiền</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="decision"
                value="REJECT"
                checked={decision === "REJECT"}
                onChange={() => setDecision("REJECT")}
                className="accent-primary"
              />
              <span className="text-sm text-gray-800">Từ chối</span>
            </label>
          </div>
        </div>

        {decision === "REJECT" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Lý do từ chối
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none min-h-[80px]"
              placeholder="Nhập chi tiết lý do từ chối..."
              required={decision === "REJECT"}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!decision}>
            Xác nhận
          </Button>
        </div>
      </form>
    </Modal>
  );
};
