import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { feeApi } from "../../api/feeApi";
import type {
  FeeRecordResponse,
  PaymentResponse,
  BankTransferQrResponse,
} from "../../types/fee";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "../../types/fee";
import { formatMoney, remainingBalance } from "../../utils/money";

// ── Types ──────────────────────────────────────────────────────────────

interface PendingPaymentState {
  payment: PaymentResponse;
  qr: BankTransferQrResponse | null;
  qrLoading: boolean;
}

type DialogStep = "confirm" | "qr" | "expired" | "success" | "cancelled";

// ── Helpers ────────────────────────────────────────────────────────────

/** Generate a v4 UUID for idempotency key */
const generateIdempotencyKey = (): string =>
  crypto.randomUUID?.() ??
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

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

// ── Constants ──────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5000;

// ── Component ──────────────────────────────────────────────────────────

const StudentFeesPage = () => {
  // Core data
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Payment flow state
  const [activeFeeId, setActiveFeeId] = useState<number | null>(null);
  const [dialogStep, setDialogStep] = useState<DialogStep>("confirm");
  const [pendingState, setPendingState] = useState<PendingPaymentState | null>(
    null,
  );
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [error, setError] = useState("");

  // Idempotency key — generated once per payment attempt, reused until complete
  const idempotencyKeyRef = useRef<string>("");

  // Polling refs
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown state
  const [countdown, setCountdown] = useState("");

  // ── Load data ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [feesData, paymentsData] = await Promise.all([
        feeApi.getMyFees(),
        feeApi.getMyPayments(),
      ]);
      setFees(feesData);
      setPayments(paymentsData);
    } catch (err) {
      console.error("Failed to load student fees and payments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Stop helpers ─────────────────────────────────────────────────────

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

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  // ── Countdown timer ──────────────────────────────────────────────────

  const startCountdown = useCallback(
    (expiresAt: string) => {
      stopCountdown();
      setCountdown(formatCountdown(expiresAt));

      countdownRef.current = setInterval(() => {
        const remaining = getRemainingSeconds(expiresAt);
        if (remaining <= 0) {
          setCountdown("00:00");
          stopCountdown();
          setDialogStep("expired");
          stopPolling();
        } else {
          setCountdown(formatCountdown(expiresAt));
        }
      }, 1000);
    },
    [stopCountdown, stopPolling],
  );

  // ── Auto-polling for payment status ──────────────────────────────────

  const startPolling = useCallback(
    (paymentId: number, expiresAt: string) => {
      stopPolling();

      const poll = async () => {
        try {
          // Check if expired first
          if (getRemainingSeconds(expiresAt) <= 0) {
            stopPolling();
            setDialogStep("expired");
            return;
          }

          const qr = await feeApi.getStudentPaymentQr(paymentId);
          setPendingState((prev) => (prev ? { ...prev, qr } : null));

          if (qr.status === "PAID") {
            stopPolling();
            stopCountdown();
            setDialogStep("success");
            // Reload data to refresh payment history
            loadData();
          } else if (qr.status === "EXPIRED" || qr.status === "CANCELLED") {
            stopPolling();
            stopCountdown();
            setDialogStep("expired");
          }
        } catch {
          // Silently retry on next poll
        }
      };

      poll(); // Immediate first poll
      pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    },
    [stopPolling, stopCountdown, loadData],
  );

  // ── Check existing pending on open ───────────────────────────────────

  const checkExistingPending = useCallback(
    async (record: FeeRecordResponse): Promise<PendingPaymentState | null> => {
      try {
        // First check for an existing valid pending payment via the dedicated endpoint
        const existing = await feeApi.getCurrentPendingPayment(record.id);
        if (existing && existing.status === "PENDING") {
          // Fetch its QR
          let qr: BankTransferQrResponse | null = null;
          try {
            qr = await feeApi.getStudentPaymentQr(existing.id);
          } catch {
            // QR fetch may fail if expired — that's ok
          }
          return { payment: existing, qr, qrLoading: false };
        }
      } catch {
        // No pending payment — that's fine
      }
      return null;
    },
    [],
  );

  // ── Open payment flow ────────────────────────────────────────────────

  const handleOpenPayment = useCallback(
    async (record: FeeRecordResponse) => {
      // Toggle off if same fee clicked
      if (activeFeeId === record.id) {
        closePaymentFlow();
        return;
      }

      setActiveFeeId(record.id);
      setError("");
      setDialogStep("confirm");
      setIsCreatingPayment(false);
      idempotencyKeyRef.current = "";

      // Check for existing pending payment first
      const existing = await checkExistingPending(record);
      if (existing) {
        setPendingState(existing);
        // If there's a valid QR, go straight to QR display
        if (existing.qr && existing.qr.status === "PENDING") {
          setDialogStep("qr");
          startCountdown(existing.payment.expiresAt!);
          startPolling(existing.payment.id, existing.payment.expiresAt!);
        } else if (
          existing.qr?.status === "EXPIRED" ||
          existing.qr?.status === "CANCELLED"
        ) {
          setDialogStep("expired");
        } else {
          // Payment exists but QR not loaded yet — load it
          try {
            const qr = await feeApi.getStudentPaymentQr(existing.payment.id);
            setPendingState({ ...existing, qr });
            if (qr.status === "PENDING") {
              setDialogStep("qr");
              startCountdown(existing.payment.expiresAt!);
              startPolling(existing.payment.id, existing.payment.expiresAt!);
            } else {
              setDialogStep("expired");
            }
          } catch {
            setDialogStep("expired");
          }
        }
      }
      // If no existing payment, user sees confirmation dialog
    },
    [activeFeeId, checkExistingPending, startCountdown, startPolling],
  );

  // ── Close payment flow ───────────────────────────────────────────────

  const closePaymentFlow = useCallback(() => {
    stopAll();
    setActiveFeeId(null);
    setDialogStep("confirm");
    setPendingState(null);
    setIsCreatingPayment(false);
    setError("");
    setCountdown("");
  }, [stopAll]);

  // ── Create payment (after confirmation) ──────────────────────────────

  const handleCreatePayment = useCallback(
    async (record: FeeRecordResponse) => {
      setError("");
      setIsCreatingPayment(true);

      // Generate idempotency key once
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = generateIdempotencyKey();
      }

      try {
        const payment = await feeApi.createStudentQrPayment(
          record.id,
          idempotencyKeyRef.current,
        );

        // Fetch QR for the new payment
        const qr = await feeApi.getStudentPaymentQr(payment.id);

        setPendingState({ payment, qr, qrLoading: false });

        if (qr.status === "PENDING") {
          setDialogStep("qr");
          startCountdown(payment.expiresAt!);
          startPolling(payment.id, payment.expiresAt!);
        } else {
          setDialogStep("expired");
        }

        // Refresh payment list
        const updatedPayments = await feeApi.getMyPayments();
        setPayments(updatedPayments);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
            "Không thể tạo thanh toán. Vui lòng thử lại.",
        );
      } finally {
        setIsCreatingPayment(false);
      }
    },
    [startCountdown, startPolling],
  );

  // ── Cancel payment ───────────────────────────────────────────────────

  const handleCancelPayment = useCallback(async () => {
    if (!pendingState) return;

    try {
      await feeApi.cancelPayment(pendingState.payment.id);
      stopAll();
      setDialogStep("cancelled");
      setPendingState((prev) =>
        prev
          ? {
              ...prev,
              payment: { ...prev.payment, status: "VOIDED" },
            }
          : null,
      );
      // Reload data
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể hủy thanh toán.");
    }
  }, [pendingState, stopAll, loadData]);

  // ── Generate new QR after expiration ─────────────────────────────────

  const handleNewQr = useCallback(
    async (record: FeeRecordResponse) => {
      setError("");
      setDialogStep("confirm");
      setPendingState(null);
      setIsCreatingPayment(false);
      idempotencyKeyRef.current = "";
      stopAll();
    },
    [stopAll],
  );

  // ── Resume existing payment from banner ──────────────────────────────

  const handleResumePayment = useCallback(
    async (record: FeeRecordResponse) => {
      await handleOpenPayment(record);
    },
    [handleOpenPayment],
  );

  // ── Derived data ─────────────────────────────────────────────────────

  const unpaidFees = useMemo(
    () => fees.filter((f) => f.status !== "PAID"),
    [fees],
  );
  const paidFees = useMemo(
    () => fees.filter((f) => f.status === "PAID"),
    [fees],
  );

  // Find pending payment for each unpaid fee (for banners)
  const pendingPaymentMap = useMemo(() => {
    const map: Record<number, PaymentResponse> = {};
    payments.forEach((p) => {
      if (
        p.status === "PENDING" &&
        (p.method === "BANK_TRANSFER" ||
          p.method === "SEPAY" ||
          p.method === "QR_CODE")
      ) {
        // Only map if not already set or if this one is newer
        if (
          !map[p.feeRecordId] ||
          new Date(p.createdAt) > new Date(map[p.feeRecordId].createdAt)
        ) {
          map[p.feeRecordId] = p;
        }
      }
    });
    return map;
  }, [payments]);

  const activeFee = useMemo(
    () => fees.find((f) => f.id === activeFeeId),
    [fees, activeFeeId],
  );

  const remaining = activeFee ? remainingBalance(activeFee) : 0;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="p-4 space-y-6 text-sm">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <div>
          <h1 className="text-xl font-bold">Học phí & Thanh toán</h1>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs disabled:opacity-50 hover:bg-gray-50"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* SUSPENDED enrollment warning */}
      {fees.some((f) => f.enrollmentStatus === "SUSPENDED") && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm">
          <p className="font-bold text-red-700">
            ⚠️ Tài khoản của bạn đang bị tạm dừng
          </p>
          <p className="mt-1 text-red-600">
            Bạn có hóa đơn chưa thanh toán quá hạn. Vui lòng thanh toán để tiếp
            tục tham gia lớp học. Lịch sử học tập, điểm danh và bài tập của bạn
            vẫn được giữ nguyên.
          </p>
        </div>
      )}

      {/* ── Pending payment banners ─────────────────────────────────── */}
      {unpaidFees
        .filter((f) => pendingPaymentMap[f.id])
        .map((record) => {
          const pending = pendingPaymentMap[record.id];
          const bannerRemaining = pending.expiresAt
            ? formatCountdown(pending.expiresAt)
            : "";
          const isExpired =
            pending.expiresAt && getRemainingSeconds(pending.expiresAt) <= 0;

          return (
            <div
              key={`banner-${record.id}`}
              className="rounded-lg border border-amber-300 bg-amber-50 p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-amber-800">
                    🕐 Bạn có một giao dịch chưa hoàn tất
                  </p>
                  <div className="text-xs text-amber-700 space-y-0.5">
                    <p>
                      <span className="font-medium">Mã giao dịch:</span>{" "}
                      <span className="font-mono">
                        {pending.sepayRef || pending.receiptNumber}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Số tiền:</span>{" "}
                      {formatMoney(pending.amount)}
                    </p>
                    {!isExpired && bannerRemaining && (
                      <p>
                        <span className="font-medium">Hết hạn sau:</span>{" "}
                        <span className="font-mono text-amber-600 font-bold">
                          {bannerRemaining}
                        </span>
                      </p>
                    )}
                    {isExpired && (
                      <p className="text-red-600 font-medium">Đã hết hạn</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!isExpired && (
                    <button
                      onClick={() => handleResumePayment(record)}
                      className="rounded-lg bg-amber-600 text-white px-4 py-1.5 text-xs font-medium hover:bg-amber-700"
                    >
                      Tiếp tục thanh toán
                    </button>
                  )}
                  {isExpired && (
                    <button
                      onClick={() => handleOpenPayment(record)}
                      className="rounded-lg border border-amber-600 text-amber-700 px-4 py-1.5 text-xs font-medium hover:bg-amber-100"
                    >
                      Tạo QR mới
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

      {/* Hóa đơn chưa thanh toán */}
      {unpaidFees.length > 0 && (
        <section className="rounded-lg border p-4">
          <h2 className="font-bold mb-3 border-b pb-1">
            Hóa đơn chưa thanh toán ({unpaidFees.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unpaidFees.map((record) => {
              const remaining = remainingBalance(record);

              return (
                <div key={record.id} className="rounded-lg border p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs uppercase text-gray-500">
                        {record.className}
                      </p>
                      <h3 className="font-bold">{record.month}</h3>
                    </div>
                    <span className="rounded-lg text-xs border px-1.5 py-0.5">
                      {record.status === "PARTIAL"
                        ? "Đã trả một phần"
                        : "Chưa trả"}
                    </span>
                  </div>

                  <div className="space-y-1 border-t border-dashed pt-2 mb-3">
                    <div className="flex justify-between">
                      <span>Tổng học phí:</span>
                      <span>{formatMoney(record.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Đã thanh toán:</span>
                      <span>{formatMoney(record.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Còn nợ:</span>
                      <span>{formatMoney(String(remaining))}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-2">
                    Hạn: {record.dueDate}
                  </div>

                  <button
                    onClick={() => handleOpenPayment(record)}
                    disabled={isCreatingPayment && activeFeeId === record.id}
                    className={`rounded-lg w-full border border-gray-300 py-1 text-xs font-medium transition-colors
                      ${activeFeeId === record.id ? "bg-gray-100" : "hover:bg-gray-50"}
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isCreatingPayment && activeFeeId === record.id
                      ? "Đang tạo thanh toán..."
                      : activeFeeId === record.id
                        ? "Đóng QR"
                        : "Thanh toán QR"}
                  </button>

                  {/* ── Payment Flow Panel ────────────────────────── */}
                  {activeFeeId === record.id && (
                    <div className="mt-3 rounded-lg border bg-gray-50 p-3 space-y-3">
                      {/* Error */}
                      {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                          {error}
                        </div>
                      )}

                      {/* Step: Confirm */}
                      {dialogStep === "confirm" && (
                        <div className="space-y-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">
                              Bạn sắp thanh toán
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatMoney(String(remaining))}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Thanh toán toàn bộ số dư còn lại qua chuyển khoản
                              ngân hàng
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCreatePayment(record)}
                              disabled={isCreatingPayment}
                              className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCreatingPayment
                                ? "Đang tạo..."
                                : "Xác nhận thanh toán"}
                            </button>
                            <button
                              onClick={closePaymentFlow}
                              disabled={isCreatingPayment}
                              className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step: QR Display */}
                      {dialogStep === "qr" && pendingState && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-center uppercase">
                            Quét QR để thanh toán
                          </p>

                          {/* QR Image */}
                          <div className="flex justify-center">
                            <div className="rounded-lg border bg-white p-2">
                              {pendingState.qr?.qrImage ? (
                                <img
                                  src={pendingState.qr.qrImage}
                                  alt={`VietQR ${pendingState.qr.paymentCode}`}
                                  width={180}
                                  height={180}
                                  className="block"
                                />
                              ) : (
                                <div className="w-[180px] h-[180px] flex items-center justify-center">
                                  <span className="text-xs text-gray-400">
                                    Đang tải QR...
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Countdown */}
                          {countdown && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500">
                                Thời gian còn lại
                              </p>
                              <p
                                className={`text-lg font-bold font-mono ${
                                  getRemainingSeconds(
                                    pendingState.payment.expiresAt!,
                                  ) < 60
                                    ? "text-red-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {countdown}
                              </p>
                            </div>
                          )}

                          {/* Payment info summary */}
                          <div className="rounded-lg border bg-white p-2 text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Mã giao dịch:
                              </span>
                              <span className="font-mono font-medium">
                                {pendingState.payment.sepayRef ||
                                  pendingState.payment.receiptNumber}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Số tiền:</span>
                              <span className="font-bold">
                                {formatMoney(pendingState.payment.amount)}
                              </span>
                            </div>
                            {pendingState.qr && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Ngân hàng:
                                  </span>
                                  <span>{pendingState.qr.bankName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">STK:</span>
                                  <span className="font-mono">
                                    {pendingState.qr.accountNumber}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-500">Trạng thái:</span>
                              <span
                                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS.PENDING}`}
                              >
                                {PAYMENT_STATUS_LABELS.PENDING}
                              </span>
                            </div>
                          </div>

                          {/* Transfer content */}
                          {pendingState.qr && (
                            <p className="text-xs text-center text-gray-400 font-mono break-all">
                              ND: {pendingState.qr.transferContent}
                            </p>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={handleCancelPayment}
                              className="flex-1 rounded-lg border border-red-300 text-red-600 py-1.5 text-xs font-medium hover:bg-red-50"
                            >
                              Hủy thanh toán
                            </button>
                            <button
                              onClick={closePaymentFlow}
                              className="flex-1 rounded-lg border border-gray-300 py-1.5 text-xs font-medium hover:bg-gray-100"
                            >
                              Đóng
                            </button>
                          </div>

                          <p className="text-xs text-center text-gray-400">
                            Hệ thống tự động kiểm tra trạng thái sau mỗi 5 giây.
                            Sau khi chuyển khoản, vui lòng đợi trong giây lát.
                          </p>
                        </div>
                      )}

                      {/* Step: Expired */}
                      {(dialogStep === "expired" ||
                        (dialogStep === "qr" &&
                          pendingState &&
                          getRemainingSeconds(
                            pendingState.payment.expiresAt!,
                          ) <= 0)) && (
                        <div className="space-y-3 text-center">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                            <svg
                              className="h-5 w-5 text-amber-600"
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
                          <p className="font-bold text-amber-700">
                            Mã QR đã hết hạn
                          </p>
                          <p className="text-xs text-gray-500">
                            Mã QR có hiệu lực trong 30 phút. Vui lòng tạo mã mới
                            để tiếp tục.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleNewQr(record)}
                              className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-xs font-medium hover:bg-blue-700"
                            >
                              Tạo QR mới
                            </button>
                            <button
                              onClick={closePaymentFlow}
                              className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium hover:bg-gray-100"
                            >
                              Đóng
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step: Success */}
                      {dialogStep === "success" && (
                        <div className="space-y-3 text-center">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                            <svg
                              className="h-5 w-5 text-emerald-600"
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
                          <p className="font-bold text-emerald-700">
                            Thanh toán thành công!
                          </p>
                          <p className="text-xs text-gray-500">
                            Cảm ơn bạn đã thanh toán. Hóa đơn của bạn đã được
                            cập nhật.
                          </p>
                          <button
                            onClick={closePaymentFlow}
                            className="rounded-lg bg-emerald-600 text-white px-6 py-2 text-xs font-medium hover:bg-emerald-700"
                          >
                            Đóng
                          </button>
                        </div>
                      )}

                      {/* Step: Cancelled */}
                      {dialogStep === "cancelled" && (
                        <div className="space-y-3 text-center">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                            <svg
                              className="h-5 w-5 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                          <p className="font-bold text-gray-700">
                            Đã hủy thanh toán
                          </p>
                          <p className="text-xs text-gray-500">
                            Bạn có thể tạo giao dịch mới bất cứ lúc nào.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleNewQr(record)}
                              className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-xs font-medium hover:bg-blue-700"
                            >
                              Tạo QR mới
                            </button>
                            <button
                              onClick={closePaymentFlow}
                              className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium hover:bg-gray-100"
                            >
                              Đóng
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Hóa đơn đã thanh toán */}
      {paidFees.length > 0 && (
        <section className="rounded-lg border p-4">
          <h2 className="font-bold mb-3 border-b pb-1">
            Hóa đơn đã thanh toán ({paidFees.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paidFees.map((record) => (
              <div key={record.id} className="rounded-lg border p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {record.className}
                    </p>
                    <h3 className="font-bold">{record.month}</h3>
                  </div>
                  <span className="rounded-lg text-xs border border-gray-200 px-1.5 py-0.5">
                    Đã trả
                  </span>
                </div>

                <div className="space-y-1 border-t border-dashed pt-2">
                  <div className="flex justify-between">
                    <span>Tổng học phí:</span>
                    <span>{formatMoney(record.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đã thanh toán:</span>
                    <span>{formatMoney(record.paidAmount)}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Hạn: {record.dueDate}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Payment History ──────────────────────────────────────────── */}
      {payments.length > 0 && (
        <section className="rounded-lg border p-4">
          <h2 className="font-bold mb-3 border-b pb-1">Lịch sử thanh toán</h2>
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border-b pb-2 last:border-0 last:pb-0 flex justify-between items-center"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-xs">
                      {new Date(payment.createdAt).toLocaleDateString("vi-VN")}{" "}
                      {new Date(payment.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[payment.status]}`}
                    >
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                    {payment.note && ` — ${payment.note}`}
                  </p>
                  {payment.sepayRef && (
                    <p className="text-xs font-mono text-gray-400">
                      Mã: {payment.sepayRef}
                    </p>
                  )}
                </div>
                <div className="font-bold text-sm">
                  {formatMoney(payment.amount)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trạng thái trống */}
      {!isLoading && fees.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          <h3 className="font-bold">Không có hóa đơn</h3>
          <p className="text-xs mt-1">
            Bạn đã thanh toán hết học phí hoặc chưa có hóa đơn nào.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentFeesPage;
