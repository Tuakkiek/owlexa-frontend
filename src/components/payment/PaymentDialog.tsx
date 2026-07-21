import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { feeApi } from "../../api/feeApi";
import type {
  FeeRecordResponse,
  CashPaymentRequest,
  PaymentResponse,
  BankTransferQrResponse,
  PaymentMethod,
} from "../../types/fee";
import { PAYMENT_METHOD_LABELS } from "../../types/fee";
import { formatMoney, remainingBalance } from "../../utils/money";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  feeRecord: FeeRecordResponse | null;
  onPaymentComplete: () => void;
}

type DialogStep =
  | "input"
  | "cash-success"
  | "qr-waiting"
  | "qr-success"
  | "qr-expired";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000; // 5 minutes max polling

export const PaymentDialog = ({
  isOpen,
  onClose,
  feeRecord,
  onPaymentComplete,
}: PaymentDialogProps) => {
  // ── ALL hooks must be declared before any conditional return ──
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState<DialogStep>("input");
  const [qrData, setQrData] = useState<BankTransferQrResponse | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PaymentResponse | null>(
    null,
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  // ── Reset on open ──
  useEffect(() => {
    if (isOpen && feeRecord) {
      const remaining = remainingBalance(feeRecord);
      setAmount(remaining);
      setMethod("CASH");
      setNote("");
      setError("");
      setStep("input");
      setQrData(null);
      setPendingPayment(null);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, feeRecord]);

  // ── Poll helpers (must be before any early return) ──
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (paymentId: number) => {
      stopPolling();
      pollStartRef.current = Date.now();

      const poll = async () => {
        try {
          if (Date.now() - pollStartRef.current > MAX_POLL_DURATION_MS) {
            stopPolling();
            return;
          }

          const qr = await feeApi.getPaymentQr(paymentId);
          setQrData(qr);

          if (qr.status === "PAID") {
            stopPolling();
            setStep("qr-success");
            onPaymentComplete();
          } else if (qr.status === "EXPIRED" || qr.status === "CANCELLED") {
            stopPolling();
            setStep("qr-expired");
          }
        } catch {
          // Silently retry on next poll
        }
      };

      poll();
      pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    },
    [stopPolling, onPaymentComplete],
  );

  // ── ALL hooks above this line. Early returns below are safe now. ──

  if (!feeRecord) return null;

  const remaining = remainingBalance(feeRecord);

  // ── Submit handler ──
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

    const requestData: CashPaymentRequest = {
      amount: String(amount),
      method,
      note: note || undefined,
    };

    try {
      setIsLoading(true);

      if (method === "CASH") {
        await feeApi.collectCash(feeRecord.id, requestData);
        setStep("cash-success");
        onPaymentComplete();
        setTimeout(() => onClose(), 1500);
      } else {
        // Bank Transfer
        const payment = await feeApi.createBankTransfer(
          feeRecord.id,
          requestData,
        );
        setPendingPayment(payment);

        const qr = await feeApi.getPaymentQr(payment.id);
        setQrData(qr);
        setStep("qr-waiting");

        // Start polling for payment confirmation
        startPolling(payment.id);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Giao dịch thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Close handler ──
  const handleClose = () => {
    stopPolling();
    onClose();
  };

  // ── Get dialog title ──
  const getTitle = () => {
    switch (step) {
      case "cash-success":
        return "Thanh toán thành công";
      case "qr-waiting":
        return "Chờ thanh toán chuyển khoản";
      case "qr-success":
        return "Thanh toán thành công";
      case "qr-expired":
        return "Mã QR đã hết hạn";
      default:
        return "Ghi nhận thanh toán";
    }
  };

  // ── Render: Success states ──
  if (step === "cash-success" || step === "qr-success") {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
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
            {step === "qr-success"
              ? "Xác nhận chuyển khoản thành công!"
              : "Thanh toán thành công!"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {method === "CASH"
              ? `Đã thu ${formatMoney(String(amount))}`
              : `Đã nhận ${formatMoney(String(amount))} qua chuyển khoản`}
          </p>
          {step === "qr-success" && (
            <p className="mt-1 text-xs text-gray-400">Đang đóng...</p>
          )}
          {step === "qr-success" && (
            <Button variant="primary" className="mt-4" onClick={handleClose}>
              Đóng
            </Button>
          )}
        </div>
      </Modal>
    );
  }

  // ── Render: QR Expired ──
  if (step === "qr-expired") {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-6 w-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-amber-700">
            Mã QR đã hết hạn
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Vui lòng tạo giao dịch mới nếu học sinh chưa thanh toán.
          </p>
          <Button variant="secondary" className="mt-4" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      </Modal>
    );
  }

  // ── Render: QR Waiting (Bank Transfer) ──
  if (step === "qr-waiting" && qrData) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
        <div className="space-y-5">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <QRCodeSVG
                value={qrData.qrContent}
                size={200}
                level="M"
                includeMargin
              />
            </div>
            <p className="mt-2 text-xs font-mono text-gray-500">
              {qrData.paymentCode}
            </p>
          </div>

          {/* Bank Info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Ngân hàng:</span>
              <span className="font-semibold text-gray-900">
                {qrData.bankName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số tài khoản:</span>
              <span className="font-mono font-semibold text-gray-900">
                {qrData.accountNumber || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Chủ tài khoản:</span>
              <span className="font-semibold text-gray-900">
                {qrData.accountHolder}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số tiền:</span>
              <span className="font-bold text-red-600">
                {formatMoney(qrData.amount)}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <span className="text-gray-500 text-xs">
                Nội dung chuyển khoản:
              </span>
              <p className="mt-1 font-mono text-sm font-semibold text-gray-900 break-all">
                {qrData.transferContent}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            <span className="text-amber-700 font-medium">
              Đang chờ thanh toán...
            </span>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Mã QR hết hạn lúc{" "}
            {qrData.expiresAt
              ? new Date(qrData.expiresAt).toLocaleTimeString("vi-VN")
              : "—"}
            . Trạng thái sẽ tự động cập nhật khi nhận được thanh toán.
          </p>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Render: Input form ──
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
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
            <span className="font-medium text-gray-900">{feeRecord.month}</span>
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

        {/* Amount */}
        <Input
          label="Số tiền thu (VND)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          error={error}
          placeholder="Nhập số tiền..."
        />

        {/* Payment Method */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Phương thức thanh toán
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["CASH", "BANK_TRANSFER"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-btn border px-4 py-3 text-sm font-medium transition-colors ${
                  method === m
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-surface-hover"
                }`}
              >
                {m === "CASH" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {PAYMENT_METHOD_LABELS[m]}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                    {PAYMENT_METHOD_LABELS[m]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ghi chú (tùy chọn)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Thanh toán đủ bởi mẹ em..."
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {method === "BANK_TRANSFER" ? "Tạo mã QR" : "Xác nhận thu tiền"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
