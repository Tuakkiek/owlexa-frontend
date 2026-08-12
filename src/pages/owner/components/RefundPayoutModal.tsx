import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "../../../types/fee";
import type { RefundResponse } from "../../../types/refund";
import { formatMoney } from "../../../utils/money";

interface RefundPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (refundMethod: PaymentMethod) => Promise<void>;
  refund: RefundResponse;
}

export const RefundPayoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  refund,
}: RefundPayoutModalProps) => {
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("CASH");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setRefundMethod("CASH");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      await onConfirm(refundMethod);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể ghi nhận hoàn tiền.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận hoàn tiền">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="border border-red-200 bg-red-50 p-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p>
            <span className="font-medium text-emerald-800">Học sinh:</span>{" "}
            <span className="text-emerald-900">{refund.studentFullName}</span>
          </p>
          <p>
            <span className="font-medium text-emerald-800">Số tiền cần hoàn:</span>{" "}
            <span className="font-bold text-emerald-900">
              {formatMoney(refund.amount)}
            </span>
          </p>
        </div>

        <p className="my-2 text-sm text-gray-600">
          Hành động này xác nhận trung tâm đã chi tiền hoàn cho học sinh.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Phương thức hoàn tiền
          </label>
          <select
            value={refundMethod}
            onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {(["CASH", "BANK_TRANSFER"] as PaymentMethod[]).map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Đã hoàn tiền
          </Button>
        </div>
      </form>
    </Modal>
  );
};
