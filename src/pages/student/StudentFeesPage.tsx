import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { TriangleAlert, PartyPopper, Check } from "lucide-react";
import { feeApi } from "../../api/feeApi";
import type {
  FeeRecordResponse,
  PaymentResponse,
  BankTransferQrResponse,
} from "../../types/fee";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../../types/fee";
import { formatMoney, remainingBalance } from "../../utils/money";
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

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

const mapStatusBadgeVariant = (
  status: string,
): "default" | "success" | "warning" | "error" | "info" => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PENDING":
      return "warning";
    case "EXPIRED":
    case "VOIDED":
      return "error";
    default:
      return "default";
  }
};

// ── Constants ──────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5000;

// ── Component ──────────────────────────────────────────────────────────

const StudentFeesPage = () => {
  // Core data
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentPage, setPaymentPage] = useState(1);
  const PAYMENT_PAGE_SIZE = 5;

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

  const handleNewQr = useCallback(() => {
    setError("");
    setDialogStep("confirm");
    setPendingState(null);
    setIsCreatingPayment(false);
    idempotencyKeyRef.current = "";
    stopAll();
  }, [stopAll]);

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

  const totalUnpaidBalance = useMemo(() => {
    return unpaidFees.reduce(
      (sum, record) => sum + remainingBalance(record),
      0,
    );
  }, [unpaidFees]);

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

  const totalPaymentPages = useMemo(
    () => Math.max(1, Math.ceil(payments.length / PAYMENT_PAGE_SIZE)),
    [payments.length],
  );

  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * PAYMENT_PAGE_SIZE;
    return payments.slice(start, start + PAYMENT_PAGE_SIZE);
  }, [payments, paymentPage]);

  const activeFeeRecord = useMemo(
    () => fees.find((f) => f.id === activeFeeId) ?? null,
    [fees, activeFeeId],
  );

  const modalTitle = useMemo(() => {
    if (!activeFeeRecord) return "Thanh toán học phí";
    switch (dialogStep) {
      case "confirm":
        return `Xác nhận thanh toán ${activeFeeRecord.month}`;
      case "qr":
        return `Thanh toán VietQR - ${activeFeeRecord.className}`;
      case "expired":
        return "Mã QR đã hết hạn";
      case "success":
        return "Thanh toán thành công!";
      case "cancelled":
        return "Đã hủy thanh toán";
      default:
        return "Thanh toán học phí";
    }
  }, [activeFeeRecord, dialogStep]);

  // ── Render ───────────────────────────────────────────────────────────

  if (isLoading && fees.length === 0 && payments.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Học phí & Thanh toán"
          description="Quản lý và thanh toán các khoản học phí trực tuyến"
        />
        <LoadingSkeleton count={3} height="h-28" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Học phí & Thanh toán"
        description="Quản lý hóa đơn và thực hiện thanh toán học phí trực tuyến"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          isLoading={isLoading}
        >
          Làm mới
        </Button>
      </PageHeader>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng dư nợ cần trả"
          value={formatMoney(String(totalUnpaidBalance))}
          helper={
            unpaidFees.length > 0
              ? "Bao gồm chưa trả & đóng một phần"
              : "Không có dư nợ cần thanh toán"
          }
        />
        <StatCard
          label="Hóa đơn chưa hoàn tất"
          value={unpaidFees.length}
          helper="Cần hoàn tất thanh toán đúng hạn"
        />
        <StatCard
          label="Hóa đơn đã gạch nợ"
          value={paidFees.length}
          helper="Đã được xác nhận hệ thống"
        />
      </div>

      {/* SUSPENDED enrollment warning */}
      {fees.some((f) => f.enrollmentStatus === "SUSPENDED") && (
        <Card className="border-red-200 bg-red-50/70">
          <div className="flex gap-3">
            <TriangleAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">
                Tài khoản của bạn đang bị tạm dừng
              </p>
              <p className="mt-1 text-sm text-red-700">
                Bạn có hóa đơn chưa thanh toán quá hạn. Vui lòng thanh toán để tiếp
                tục tham gia lớp học. Lịch sử học tập, điểm danh và bài tập của bạn
                vẫn được giữ nguyên.
              </p>
            </div>
          </div>
        </Card>
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
            <Card
              key={`banner-${record.id}`}
              className="border-amber-200 bg-amber-50/60"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-amber-900">
                    Bạn có một giao dịch chưa hoàn tất
                  </p>
                  <div className="text-xs text-amber-800 space-y-1">
                    <p>
                      <span className="font-medium">Mã giao dịch:</span>{" "}
                      <span className="font-mono bg-white/80 px-1.5 py-0.5 rounded border border-amber-200">
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
                        <span className="font-mono text-amber-700 font-semibold">
                          {bannerRemaining}
                        </span>
                      </p>
                    )}
                    {isExpired && (
                      <p className="text-red-700 font-medium">Mã QR đã hết hạn</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isExpired && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleResumePayment(record)}
                    >
                      Tiếp tục thanh toán
                    </Button>
                  )}
                  {isExpired && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPayment(record)}
                    >
                      Tạo QR mới
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

      {/* Hóa đơn chưa thanh toán */}
      {unpaidFees.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Hóa đơn chưa thanh toán ({unpaidFees.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {unpaidFees.map((record) => {
              const remaining = remainingBalance(record);

              return (
                <Card
                  key={record.id}
                  className="flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          {record.className}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900 mt-0.5">
                          {record.month}
                        </h3>
                      </div>
                      <Badge
                        variant={record.status === "PARTIAL" ? "info" : "warning"}
                      >
                        {record.status === "PARTIAL"
                          ? "Đã trả một phần"
                          : "Chưa trả"}
                      </Badge>
                    </div>

                    <div className="space-y-2 border-t border-surface-border pt-4 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Tổng học phí:</span>
                        <span className="font-medium text-gray-900">
                          {formatMoney(record.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Đã thanh toán:</span>
                        <span className="font-medium text-gray-900">
                          {formatMoney(record.paidAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-surface-border pt-2 font-semibold">
                        <span className="text-gray-900">Còn nợ:</span>
                        <span className="text-primary">
                          {formatMoney(String(remaining))}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">
                      Hạn chót thanh toán: {record.dueDate}
                    </p>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleOpenPayment(record)}
                    >
                      Thanh toán QR
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Hóa đơn đã thanh toán */}
      {paidFees.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Hóa đơn đã thanh toán ({paidFees.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paidFees.map((record) => (
              <Card key={record.id} className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {record.className}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 mt-0.5">
                      {record.month}
                    </h3>
                  </div>
                  <Badge variant="success">Đã trả</Badge>
                </div>

                <div className="space-y-2 border-t border-surface-border pt-4 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Tổng học phí:</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(record.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Đã thanh toán:</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(record.paidAmount)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 border-t border-surface-border pt-2">
                  Hạn chót: {record.dueDate}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment History ──────────────────────────────────────────── */}
      {payments.length > 0 && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Lịch sử thanh toán
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              Tổng số {payments.length} giao dịch
            </span>
          </div>

          <div className="divide-y divide-surface-border">
            {paginatedPayments.map((payment) => (
              <div
                key={payment.id}
                className="py-3 first:pt-0 last:pb-0 flex justify-between items-center"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      {new Date(payment.createdAt).toLocaleDateString("vi-VN")}{" "}
                      {new Date(payment.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Badge variant={mapStatusBadgeVariant(payment.status)}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
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
                <span className="font-semibold text-sm text-gray-900">
                  {formatMoney(payment.amount)}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {payments.length > PAYMENT_PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-surface-border pt-4 text-xs text-gray-500">
              <span>
                Hiển thị {Math.min((paymentPage - 1) * PAYMENT_PAGE_SIZE + 1, payments.length)} -{" "}
                {Math.min(paymentPage * PAYMENT_PAGE_SIZE, payments.length)} trên tổng {payments.length} giao dịch
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                  disabled={paymentPage === 1}
                  className="px-3 py-1 text-xs"
                >
                  Trang trước
                </Button>
                <span className="px-2 font-medium text-gray-700">
                  Trang {paymentPage} / {totalPaymentPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))}
                  disabled={paymentPage === totalPaymentPages}
                  className="px-3 py-1 text-xs"
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Trạng thái trống */}
      {!isLoading && fees.length === 0 && (
        <EmptyState
          message="Bạn đã thanh toán hết học phí hoặc chưa có hóa đơn nào."
          icon={PartyPopper}
        />
      )}

      {/* ── Center Popup Modal for Payment Flow ────────────────────────── */}
      <Modal
        isOpen={activeFeeId !== null && activeFeeRecord !== null}
        onClose={closePaymentFlow}
        title={modalTitle}
        maxWidth="max-w-md"
      >
        {activeFeeRecord && (
          <div className="space-y-4">
            {/* Error Banner */}
            {error && <ErrorBanner message={error} />}

            {/* Step: Confirm */}
            {dialogStep === "confirm" && (
              <div className="space-y-4 text-center">
                <div className="bg-surface-page p-4 rounded-card border border-surface-border space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Số tiền sẽ thanh toán</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMoney(String(remainingBalance(activeFeeRecord)))}
                  </p>
                  <p className="text-xs text-gray-400">
                    Lớp: {activeFeeRecord.className} — Kỳ: {activeFeeRecord.month}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleCreatePayment(activeFeeRecord)}
                    isLoading={isCreatingPayment}
                  >
                    Xác nhận tạo mã QR
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={closePaymentFlow}
                    disabled={isCreatingPayment}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            )}

            {/* Step: QR Display */}
            {dialogStep === "qr" && pendingState && (
              <div className="space-y-4">
                {/* Header Alert / Countdown banner */}
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-2 rounded-full">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-medium text-amber-800">
                      Tự động gạch nợ sau khi chuyển
                    </span>
                  </div>
                  {countdown && (
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${
                        getRemainingSeconds(pendingState.payment.expiresAt!) < 60
                          ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                          : "bg-white text-amber-800 border-amber-200"
                      }`}
                    >
                      {countdown}
                    </span>
                  )}
                </div>

                {/* QR Image Frame */}
                <div className="flex flex-col items-center justify-center bg-white border border-surface-border p-4 rounded-card">
                  {pendingState.qr?.qrImage ? (
                    <div className="p-2 bg-white rounded-card border border-surface-border shadow-xs">
                      <img
                        src={pendingState.qr.qrImage}
                        alt={`VietQR ${pendingState.qr.paymentCode}`}
                        className="block max-w-[200px] h-auto rounded-input"
                      />
                    </div>
                  ) : (
                    <div className="w-[200px] h-[200px] flex flex-col items-center justify-center gap-2">
                      <svg
                        className="w-6 h-6 animate-spin text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="text-xs text-gray-400">
                        Đang tạo mã QR...
                      </span>
                    </div>
                  )}
                </div>

                {/* Details List */}
                <div className="bg-surface-page p-3.5 rounded-card space-y-2.5 text-xs border border-surface-border">
                  {pendingState.qr && (
                    <>
                      <div className="flex justify-between items-center py-1 border-b border-surface-border">
                        <span className="text-gray-500 font-medium">Ngân hàng</span>
                        <span className="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded-input border border-surface-border">
                          {pendingState.qr.bankName}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-surface-border">
                        <span className="text-gray-500 font-medium">Số tài khoản</span>
                        <div className="flex items-center gap-2 font-mono font-semibold text-gray-900">
                          <span>{pendingState.qr.accountNumber}</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleCopy(
                                pendingState.qr!.accountNumber,
                                "accountNumber",
                              )
                            }
                            className="h-6 px-2 text-[10px]"
                          >
                            {copiedField === "accountNumber" ? (
                              <span className="flex items-center gap-1">
                                <Check className="h-3 w-3 text-emerald-600" />
                                Đã chép
                              </span>
                            ) : (
                              "Chép"
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Transfer Amount */}
                  <div className="flex justify-between items-center py-1 border-b border-surface-border">
                    <span className="text-gray-500 font-medium">Số tiền chuyển</span>
                    <div className="flex items-center gap-2 font-bold text-primary text-sm">
                      <span>{formatMoney(pendingState.payment.amount)}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            String(pendingState.payment.amount),
                            "amount",
                          )
                        }
                        className="h-6 px-2 text-[10px]"
                      >
                        {copiedField === "amount" ? (
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-600" />
                            Đã chép
                          </span>
                        ) : (
                          "Chép"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Transfer Content */}
                  {pendingState.qr && (
                    <div className="pt-1">
                      <span className="text-gray-500 font-medium block mb-1">
                        Nội dung ghi (bắt buộc chính xác)
                      </span>
                      <div className="flex items-center justify-between gap-2 bg-white border border-surface-border rounded-input p-2">
                        <span className="font-mono font-bold text-gray-900 text-xs tracking-wide select-all break-all">
                          {pendingState.qr.transferContent}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(
                              pendingState.qr!.transferContent,
                              "transferContent",
                            )
                          }
                          className="h-6 px-2 text-[10px]"
                        >
                          {copiedField === "transferContent" ? (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-emerald-600" />
                              Đã chép
                            </span>
                          ) : (
                            "Sao chép"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action buttons */}
                <div className="space-y-2 pt-1 text-center">
                  <Badge variant="warning">
                    Đang chờ chuyển khoản, vui lòng đợi trong giây lát...
                  </Badge>

                  <div className="flex gap-2 w-full pt-2">
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={handleCancelPayment}
                    >
                      Hủy thanh toán
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={closePaymentFlow}
                    >
                      Đóng
                    </Button>
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
              <div className="space-y-4 text-center py-2">
                <p className="font-semibold text-amber-800">
                  Mã QR đã hết hạn
                </p>
                <p className="text-xs text-gray-500">
                  Mã QR có hiệu lực trong 30 phút. Vui lòng tạo mã mới
                  để tiếp tục.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={handleNewQr}
                  >
                    Tạo QR mới
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={closePaymentFlow}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {dialogStep === "success" && (
              <div className="space-y-4 text-center py-2">
                <p className="text-lg font-bold text-emerald-700">
                  Thanh toán thành công!
                </p>
                <p className="text-xs text-gray-500">
                  Cảm ơn bạn đã thanh toán. Hóa đơn của bạn đã được gạch nợ tự động trên hệ thống.
                </p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={closePaymentFlow}
                >
                  Hoàn tất
                </Button>
              </div>
            )}

            {/* Step: Cancelled */}
            {dialogStep === "cancelled" && (
              <div className="space-y-4 text-center py-2">
                <p className="font-semibold text-gray-700">
                  Đã hủy thanh toán
                </p>
                <p className="text-xs text-gray-500">
                  Bạn có thể tạo giao dịch mới bất cứ lúc nào.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={handleNewQr}
                  >
                    Tạo QR mới
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={closePaymentFlow}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentFeesPage;
