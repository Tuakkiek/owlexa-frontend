import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { FeeRecordResponse, CashPaymentRequest } from "../../../types/fee";
import { formatMoney, remainingBalance } from "../../../utils/money";

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeRecord: FeeRecordResponse | null;
  onSubmit: (feeRecordId: number, data: CashPaymentRequest) => Promise<void>;
}

export const CollectFeeModal = ({
  isOpen,
  onClose,
  feeRecord,
  onSubmit,
}: CollectFeeModalProps) => {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && feeRecord) {
      const remaining = remainingBalance(feeRecord);
      setAmount(remaining);
      setNote("");
      setError("");
      setSuccess(false);
    }
  }, [isOpen, feeRecord]);

  if (!feeRecord) return null;

  const remaining = remainingBalance(feeRecord);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (amount <= 0) {
      setError("Số tiền phải lớn hơn 0.");
      return;
    }
    if (amount > remaining) {
      setError(
        `Số tiền không được vượt quá số dư còn lại (${formatMoney(String(remaining))}).`,
      );
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(feeRecord.id, {
        amount: String(amount),
        note: note || undefined,
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Ghi nhận thanh toán thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ghi nhận thanh toán tiền mặt"
    >
      {success ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-emerald-700">
            Thanh toán thành công!
          </p>
          <p className="mt-1 text-sm text-gray-500">Đang đóng...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info */}
          <div className="rounded border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Học sinh:</span>
              <span className="font-semibold text-gray-900">
                {feeRecord.studentFullName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Lớp:</span>
              <span className="font-medium text-gray-900">
                {feeRecord.className}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tháng:</span>
              <span className="font-medium text-gray-900">
                {feeRecord.month}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-500">Tổng học phí:</span>
              <span className="font-semibold text-gray-900">
                {formatMoney(feeRecord.amount)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Đã thanh toán:</span>
              <span>{formatMoney(feeRecord.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-red-600">
              <span>Còn lại:</span>
              <span>{formatMoney(String(remaining))}</span>
            </div>
          </div>

          <Input
            label="Số tiền thu (VND)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            error={error}
            placeholder="Nhập số tiền..."
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ghi chú (tùy chọn)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Thanh toán đủ bởi mẹ em..."
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Xác nhận thu tiền
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
