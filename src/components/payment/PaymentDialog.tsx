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
import { useAuthStore } from "../../store/authStore";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  feeRecord: FeeRecordResponse | null;
  onPaymentComplete: () => void;
}

type DialogStep =
  | "input"
  | "confirm-transfer"
  | "cash-success"
  | "qr-waiting"
  | "qr-success"
  | "qr-expired";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000; // 5 minutes max polling

/** Format remaining time as mm:ss */
const formatCountdown = (expiresAt: string): string => {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return "00:00";
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/** Get remaining seconds from expiresAt */
const getRemainingSeconds = (expiresAt: string): number => {
  return Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
};

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
  const [countdown, setCountdown] = useState("");
  const roleName = useAuthStore((state) => state.user?.roleName);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setCountdown("");
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isOpen, feeRecord]);

  // ── Poll helpers ──
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const stopAll = useCallback(() => {
    stopPolling();
    stopCountdown();
  }, [stopPolling, stopCountdown]);

  // ── Countdown timer ──
  const startCountdown = useCallback(
    (expiresAt: string) => {
      stopCountdown();
      setCountdown(formatCountdown(expiresAt));

      countdownRef.current = setInterval(() => {
        const remaining = getRemainingSeconds(expiresAt);
        if (remaining <= 0) {
          setCountdown("00:00");
          stopCountdown();
          setStep("qr-expired");
          stopPolling();
        } else {
          setCountdown(formatCountdown(expiresAt));
        }
      }, 1000);
    },
    [stopCountdown, stopPolling],
  );

  const startPolling = useCallback(
    (paymentId: number, expiresAt: string) => {
      stopPolling();
      pollStartRef.current = Date.now();

      const poll = async () => {
        try {
          if (Date.now() - pollStartRef.current > MAX_POLL_DURATION_MS) {
            stopPolling();
            return;
          }

          // Check if expired
          if (getRemainingSeconds(expiresAt) <= 0) {
            stopPolling();
            stopCountdown();
            setStep("qr-expired");
            return;
          }

          const qr = await feeApi.getPaymentQr(paymentId, roleName);
          setQrData(qr);

          if (qr.status === "PAID") {
            stopPolling();
            stopCountdown();
            setStep("qr-success");
            onPaymentComplete();
          } else if (qr.status === "EXPIRED" || qr.status === "CANCELLED") {
            stopPolling();
            stopCountdown();
            setStep("qr-expired");
          }
        } catch {
          // Silently retry on next poll
        }
      };

      poll();
      pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    },
    [stopPolling, stopCountdown, onPaymentComplete, roleName],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

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
        await feeApi.collectCash(feeRecord.id, requestData, roleName);
        setStep("cash-success");
        onPaymentComplete();
        setTimeout(() => onClose(), 1500);
      } else {
        // Bank Transfer — requires confirmation step first
        setStep("confirm-transfer");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Giao dịch thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Confirm and create bank transfer + QR ──
  const handleConfirmTransfer = async () => {
    setError("");
    setIsLoading(true);

    const requestData: CashPaymentRequest = {
      amount: String(amount),
      method,
      note: note || undefined,
    };

    try {
      const payment = await feeApi.createBankTransfer(
        feeRecord.id,
        requestData,
        roleName,
      );
      setPendingPayment(payment);

      const qr = await feeApi.getPaymentQr(payment.id, roleName);
      setQrData(qr);
      setStep("qr-waiting");

      // Start countdown if we have expiration
      if (payment.expiresAt) {
        startCountdown(payment.expiresAt);
      }

      // Start polling for payment confirmation
      if (payment.expiresAt) {
        startPolling(payment.id, payment.expiresAt);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Không thể tạo giao dịch. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Close handler ──
  const handleClose = () => {
    stopAll();
    onClose();
  };

  // ── Get dialog title ──
  const getTitle = () => {
    switch (step) {
      case "cash-success":
        return "Thanh toán thành công";
      case "confirm-transfer":
        return "Xác nhận chuyển khoản";
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

  // ── Render: Confirm transfer step ──
  if (step === "confirm-transfer") {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
        <div className="py-4 space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Bạn sắp tạo giao dịch chuyển khoản
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatMoney(String(amount))}
            </p>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Học sinh:</span>
              <span className="font-medium">{feeRecord.studentFullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Lớp:</span>
              <span className="font-medium">{feeRecord.className}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tháng:</span>
              <span className="font-medium">{feeRecord.month}</span>
            </div>
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmTransfer}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Đang tạo..." : "Xác nhận"}
            </button>
            <button
              type="button"
              onClick={() => setStep("input")}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Quay lại
            </button>
          </div>
        </div>
      </Modal>
    );
  }

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
    const expiresAtStr = pendingPayment?.expiresAt || qrData.expiresAt;
    const isUrgent = expiresAtStr ? getRemainingSeconds(expiresAtStr) < 60 : false;

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
        <div className="space-y-4">
          {/* Top Auto Completion & Countdown Pill */}
          <div className="flex items-center justify-between rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              </span>
              <span className="text-xs font-medium text-amber-800">
                Tự động hoàn thành sau khi chuyển
              </span>
            </div>
            {countdown ? (
              <span
                className={`rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold ${
                  isUrgent
                    ? "animate-pulse border-red-200 bg-red-50 text-red-700"
                    : "border-amber-200 bg-white text-amber-800"
                }`}
              >
                {countdown}
              </span>
            ) : null}
          </div>

          {/* QR Code — VietQR image from backend API */}
          <div className="flex flex-col items-center justify-center">
            <div className="rounded-card border border-surface-border bg-white p-3 shadow-sm">
              {qrData.qrImage ? (
                <img
                  src={qrData.qrImage}
                  alt={`VietQR ${qrData.paymentCode}`}
                  className="h-48 w-48 object-contain block"
                />
              ) : (
                <QRCodeSVG
                  value={qrData.qrContent}
                  size={192}
                  level="M"
                  includeMargin
                />
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Quét mã bằng ứng dụng ngân hàng hỗ trợ VietQR
            </p>
          </div>

          {/* Bank Info */}
          <div className="space-y-3 rounded-[12px] border border-surface-border bg-surface-page p-3.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 font-medium">Ngân hàng</span>
              <span className="text-right font-semibold text-gray-900 truncate">
                {qrData.bankName}
              </span>
            </div>

            {qrData.accountNumber && (
              <div className="flex items-center justify-between gap-3 border-t border-surface-border/80 pt-2.5">
                <span className="text-gray-500 font-medium">Số tài khoản</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">
                    {qrData.accountNumber}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => navigator.clipboard?.writeText(qrData.accountNumber!)}
                    className="h-6 px-2 text-[10px]"
                  >
                    Sao chép
                  </Button>
                </div>
              </div>
            )}

            {qrData.accountHolder && (
              <div className="flex items-center justify-between gap-3 border-t border-surface-border/80 pt-2.5">
                <span className="text-gray-500 font-medium">Chủ tài khoản</span>
                <span className="font-semibold text-gray-900">
                  {qrData.accountHolder}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-surface-border/80 pt-2.5">
              <span className="text-gray-500 font-medium">Số tiền chuyển</span>
              <span className="font-bold text-primary text-sm">
                {formatMoney(qrData.amount)}
              </span>
            </div>

            {qrData.transferContent && (
              <div className="pt-1 border-t border-surface-border/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-500 font-medium">
                    Nội dung ghi (bắt buộc chính xác)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white border border-surface-border rounded-lg p-2">
                  <span className="font-mono font-bold text-gray-900 text-xs tracking-wide select-all break-all">
                    {qrData.transferContent}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard?.writeText(qrData.transferContent!)}
                    className="h-6 px-2 text-[10px] shrink-0"
                  >
                    Sao chép
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Đang chờ chuyển khoản, hệ thống sẽ tự động gạch nợ...</span>
          </div>

          <div className="flex justify-end gap-2 border-t border-surface-border pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="w-full py-2.5 font-semibold"
            >
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Render: Input step ──
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
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            {isLoading
              ? "Đang xử lý..."
              : method === "BANK_TRANSFER"
                ? "Tiếp tục"
                : "Xác nhận thu tiền"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
