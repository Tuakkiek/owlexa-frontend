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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

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
    [
      activeFeeId,
      checkExistingPending,
      closePaymentFlow,
      startCountdown,
      startPolling,
    ],
  );

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
    () => {
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
            Tài khoản của bạn đang bị tạm dừng
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
                    Bạn có một giao dịch chưa hoàn tất
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
                        <div className="space-y-4 animate-scale-in">
                          {/* Header Alert / Countdown banner */}
                          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <span className="text-[11px] font-bold text-amber-900">
                                Kiểm tra tự động
                              </span>
                            </div>
                            {countdown && (
                              <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                                getRemainingSeconds(pendingState.payment.expiresAt!) < 60
                                  ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
                                  : "bg-white text-amber-800 border-amber-200"
                              }`}>
                                {countdown}
                              </span>
                            )}
                          </div>

                          {/* QR Image Frame */}
                          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-orange-50/40 via-white to-amber-50/20 border border-orange-200/70 shadow-2xs p-4 rounded-2xl relative">
                            {pendingState.qr?.qrImage ? (
                              <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-xs">
                                <img
                                  src={pendingState.qr.qrImage}
                                  alt={`VietQR ${pendingState.qr.paymentCode}`}
                                  className="block max-w-[190px] h-auto rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="w-[190px] h-[190px] flex flex-col items-center justify-center gap-2">
                                <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-xs text-gray-400">Đang tải QR...</span>
                              </div>
                            )}
                            
                            <div className="mt-3 text-center">
                              
                             
                            </div>
                          </div>

                          {/* Detail Card with copy-to-clipboard */}
                          <div className="bg-gray-50/90 p-3 rounded-xl space-y-2.5 text-xs border border-gray-200">
                            {pendingState.qr && (
                              <>
                                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                                  <span className="text-gray-500 font-medium">Ngân hàng</span>
                                  <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                                    {pendingState.qr.bankName}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                                  <span className="text-gray-500 font-medium">Số tài khoản</span>
                                  <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900">
                                    <span>{pendingState.qr.accountNumber}</span>
                                    <button
                                      onClick={() => handleCopy(pendingState.qr!.accountNumber, "accountNumber")}
                                      className="px-1.5 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-600 hover:text-primary transition-colors"
                                      title="Sao chép số tài khoản"
                                    >
                                      {copiedField === "accountNumber" ? "✓ Đã chép" : "Chép"}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Transfer Amount */}
                            <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                              <span className="text-gray-500 font-medium">Số tiền chuyển</span>
                              <div className="flex items-center gap-1.5 font-black text-primary text-sm">
                                <span>{formatMoney(pendingState.payment.amount)}</span>
                                <button
                                  onClick={() => handleCopy(String(pendingState.payment.amount), "amount")}
                                  className="px-1.5 py-0.5 bg-white hover:bg-orange-50 border border-gray-200 rounded text-[10px] font-semibold text-gray-600 hover:text-primary transition-colors"
                                  title="Sao chép số tiền chuyển"
                                >
                                  {copiedField === "amount" ? "✓ Đã chép" : "Chép"}
                                </button>
                              </div>
                            </div>

                            {/* Transfer Content */}
                            {pendingState.qr && (
                              <div className="pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-gray-600 font-bold text-[11px]">Nội dung ghi</span>
                               </div>
                                <div className="flex items-center justify-between gap-2 bg-white border border-primary/30 rounded-lg p-2 hover:border-primary transition-colors">
                                  <span className="font-mono font-bold text-gray-900 text-xs tracking-wide select-all break-words leading-normal">
                                    {pendingState.qr.transferContent}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(pendingState.qr!.transferContent, "transferContent")}
                                    className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded text-[11px] font-bold shrink-0 transition-colors"
                                    title="Sao chép nội dung chuyển khoản"
                                  >
                                    {copiedField === "transferContent" ? "✓ Đã sao chép" : "Sao chép"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bottom Status Info / Action buttons */}
                          <div className="flex flex-col items-center justify-center text-center space-y-2 pt-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span className="font-semibold text-emerald-800">Đang chờ chuyển khoản, vui lòng đợi trong giây lát...</span>
                            </div>

                            <div className="flex gap-2 w-full pt-2">
                              <button
                                onClick={handleCancelPayment}
                                className="flex-1 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors"
                              >
                                Hủy thanh toán
                              </button>
                              <button
                                onClick={closePaymentFlow}
                                className="flex-1 py-1.5 text-xs font-semibold bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg transition-colors"
                              >
                                Đóng
                              </button>
                            </div>
                          </div>
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
                              onClick={handleNewQr}
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
                              onClick={handleNewQr}
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
