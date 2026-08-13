import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
  StatCard,
} from "../ui/SharedComponents";
import type { FeeStatus, PaymentMethod, PaymentPage, PaymentResponse, PaymentStatus } from "../../types/fee";
import {
  FEE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../../types/fee";
import { formatMoney } from "../../utils/money";

interface PaymentHistoryViewProps {
  title: string;
  description: string;
  page: PaymentPage | null;
  isLoading: boolean;
  error: string;
  query: string;
  filterMethod: string;
  filterStartDate: string;
  filterEndDate: string;
  currentPage: number;
  refundPayment: PaymentResponse | null;
  refundAmount: string;
  refundReason: string;
  actionLoading: boolean;
  actionError: string;
  receiptPath: (paymentId: number) => string;
  canRefundPayment: (payment: PaymentResponse) => boolean;
  onQueryChange: (value: string) => void;
  onFilterMethodChange: (value: string) => void;
  onFilterStartDateChange: (value: string) => void;
  onFilterEndDateChange: (value: string) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onOpenRefund: (payment: PaymentResponse) => void;
  onCloseRefund: () => void;
  onRefundAmountChange: (value: string) => void;
  onRefundReasonChange: (value: string) => void;
  onConfirmRefund: () => void;
  refundMethod?: PaymentMethod;
  refundMethods?: PaymentMethod[];
  onRefundMethodChange?: (method: PaymentMethod) => void;
}

const paymentMethods: Array<{ value: "" | PaymentMethod; label: string }> = [
  { value: "", label: "Tất cả phương thức" },
  { value: "CASH", label: PAYMENT_METHOD_LABELS.CASH },
  { value: "BANK_TRANSFER", label: PAYMENT_METHOD_LABELS.BANK_TRANSFER },
  { value: "QR_CODE", label: PAYMENT_METHOD_LABELS.QR_CODE },
  { value: "ONLINE", label: PAYMENT_METHOD_LABELS.ONLINE },
  { value: "SEPAY", label: PAYMENT_METHOD_LABELS.SEPAY },
];

const feeStatusVariants: Record<FeeStatus, "default" | "success" | "warning" | "error" | "info"> = {
  UNPAID: "warning",
  PARTIAL: "info",
  PAID: "success",
  OVERDUE: "error",
};

const paymentStatusVariants: Record<PaymentStatus, "default" | "success" | "warning" | "error" | "info"> = {
  PENDING: "warning",
  ACTIVE: "success",
  VOIDED: "error",
  EXPIRED: "default",
};

const selectClassName =
  "w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary disabled:bg-surface-hover disabled:text-gray-400";

const textareaClassName =
  "w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary";

const formatPaymentDate = (value: string) => {
  const date = new Date(value);

  return {
    date: date.toLocaleDateString("vi-VN"),
    time: date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const hasFilters = (
  query: string,
  method: string,
  startDate: string,
  endDate: string,
) => Boolean(query.trim() || method || startDate || endDate);

const currentPageAmount = (payments: PaymentResponse[]) =>
  payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

const TransactionMeta = ({ payment }: { payment: PaymentResponse }) => (
  <div className="min-w-0">
    <div className="truncate font-mono text-xs text-gray-500">
      {payment.receiptNumber}
    </div>
    {payment.sepayRef && (
      <div className="mt-1 truncate text-xs text-gray-400">
        SePay: {payment.sepayRef}
      </div>
    )}
  </div>
);

const StudentCell = ({ payment }: { payment: PaymentResponse }) => (
  <div className="min-w-0">
    <div className="truncate font-medium text-gray-900">
      {payment.studentFullName}
    </div>
    <div className="mt-1 truncate text-xs text-gray-500">
      {payment.studentPhoneNumber || "-"}
    </div>
  </div>
);

const ClassCell = ({ payment }: { payment: PaymentResponse }) => (
  <div className="min-w-0">
    <div className="truncate text-gray-700">{payment.className || "-"}</div>
    {payment.courseName && (
      <div className="mt-1 truncate text-xs text-gray-500">
        {payment.courseName}
      </div>
    )}
  </div>
);

const DateCell = ({ value }: { value: string }) => {
  const createdAt = formatPaymentDate(value);

  return (
    <div className="text-right">
      <div className="text-sm text-gray-700">{createdAt.date}</div>
      <div className="mt-1 text-xs text-gray-500">{createdAt.time}</div>
    </div>
  );
};

const StatusPills = ({ payment }: { payment: PaymentResponse }) => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge variant={feeStatusVariants[payment.feeRecordStatus]}>
      {FEE_STATUS_LABELS[payment.feeRecordStatus]}
    </Badge>
    <Badge variant={paymentStatusVariants[payment.status]}>
      {PAYMENT_STATUS_LABELS[payment.status]}
    </Badge>
  </div>
);

const PaymentActions = ({
  payment,
  receiptPath,
  canRefundPayment,
  onOpenRefund,
}: Pick<
  PaymentHistoryViewProps,
  "receiptPath" | "canRefundPayment" | "onOpenRefund"
> & {
  payment: PaymentResponse;
}) => (
  <div className="flex items-center justify-end gap-2">
    <Link
      to={receiptPath(payment.id)}
      className="inline-flex h-8 items-center rounded-btn border border-surface-border bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-surface-hover"
    >
      Biên lai
    </Link>
    {canRefundPayment(payment) && (
      <button
        type="button"
        onClick={() => onOpenRefund(payment)}
        className="inline-flex h-8 items-center rounded-btn border border-amber-200 bg-white px-3 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
      >
        Hoàn
      </button>
    )}
  </div>
);

const DesktopPaymentTable = ({
  payments,
  receiptPath,
  canRefundPayment,
  onOpenRefund,
}: Pick<
  PaymentHistoryViewProps,
  "receiptPath" | "canRefundPayment" | "onOpenRefund"
> & {
  payments: PaymentResponse[];
}) => (
  <div className="hidden overflow-hidden rounded-card border border-surface-border bg-white lg:block">
    <div className="overflow-x-auto">
      <table className="min-w-[1120px] text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-white text-left text-xs font-medium uppercase text-gray-500">
            <th className="px-4 py-3">Mã biên lai</th>
            <th className="px-4 py-3">Học sinh</th>
            <th className="px-4 py-3">Lớp / Khóa</th>
            <th className="px-4 py-3">Phương thức</th>
            <th className="px-4 py-3">Người thu</th>
            <th className="px-4 py-3 text-right">Số tiền</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3 text-right">Ngày</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {payments.map((payment) => (
            <tr
              key={payment.id}
              className="transition-colors duration-150 hover:bg-surface-hover"
            >
              <td className="max-w-40 px-4 py-4">
                <TransactionMeta payment={payment} />
              </td>
              <td className="max-w-52 px-4 py-4">
                <StudentCell payment={payment} />
              </td>
              <td className="max-w-52 px-4 py-4">
                <ClassCell payment={payment} />
              </td>
              <td className="px-4 py-4">
                <Badge>{PAYMENT_METHOD_LABELS[payment.method]}</Badge>
              </td>
              <td className="max-w-40 px-4 py-4 text-gray-600">
                <div className="truncate">
                  {payment.collectedByUserName || "-"}
                </div>
              </td>
              <td className="px-4 py-4 text-right font-semibold text-gray-900">
                {formatMoney(payment.amount)}
              </td>
              <td className="px-4 py-4">
                <StatusPills payment={payment} />
              </td>
              <td className="px-4 py-4">
                <DateCell value={payment.createdAt} />
              </td>
              <td className="px-4 py-4">
                <PaymentActions
                  payment={payment}
                  receiptPath={receiptPath}
                  canRefundPayment={canRefundPayment}
                  onOpenRefund={onOpenRefund}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MobilePaymentList = ({
  payments,
  receiptPath,
  canRefundPayment,
  onOpenRefund,
}: Pick<
  PaymentHistoryViewProps,
  "receiptPath" | "canRefundPayment" | "onOpenRefund"
> & {
  payments: PaymentResponse[];
}) => (
  <div className="space-y-3 lg:hidden">
    {payments.map((payment) => {
      const createdAt = formatPaymentDate(payment.createdAt);

      return (
        <Card key={payment.id} className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-4">
            <StudentCell payment={payment} />
            <div className="shrink-0 text-right font-semibold text-gray-900">
              {formatMoney(payment.amount)}
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <div className="text-xs text-gray-500">Mã biên lai</div>
              <TransactionMeta payment={payment} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Lớp / Khóa</div>
              <ClassCell payment={payment} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Phương thức</div>
              <div className="mt-1">
                <Badge>{PAYMENT_METHOD_LABELS[payment.method]}</Badge>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Ngày thu</div>
              <div className="mt-1 text-gray-700">
                {createdAt.date} · {createdAt.time}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-surface-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <StatusPills payment={payment} />
            <PaymentActions
              payment={payment}
              receiptPath={receiptPath}
              canRefundPayment={canRefundPayment}
              onOpenRefund={onOpenRefund}
            />
          </div>
        </Card>
      );
    })}
  </div>
);

export const PaymentHistoryView = ({
  title,
  description,
  page,
  isLoading,
  error,
  query,
  filterMethod,
  filterStartDate,
  filterEndDate,
  currentPage,
  refundPayment,
  refundAmount,
  refundReason,
  actionLoading,
  actionError,
  receiptPath,
  canRefundPayment,
  onQueryChange,
  onFilterMethodChange,
  onFilterStartDateChange,
  onFilterEndDateChange,
  onSearch,
  onClearFilters,
  onPageChange,
  onOpenRefund,
  onCloseRefund,
  onRefundAmountChange,
  onRefundReasonChange,
  onConfirmRefund,
  refundMethod,
  refundMethods,
  onRefundMethodChange,
}: PaymentHistoryViewProps) => {
  const payments = page?.content ?? [];
  const totalPages = Math.max(page?.totalPages ?? 0, 1);
  const activeFilters = hasFilters(
    query,
    filterMethod,
    filterStartDate,
    filterEndDate,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={title} description={description} />

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Tổng giao dịch"
          value={page?.totalElements ?? 0}
          helper={isLoading ? "Đang cập nhật" : "Theo bộ lọc hiện tại"}
        />
        <StatCard
          label="Đang hiển thị"
          value={payments.length}
          helper={`Tối đa ${page?.size ?? 15} giao dịch mỗi trang`}
        />
        <StatCard
          label="Giá trị trang này"
          value={formatMoney(currentPageAmount(payments))}
          helper="Tổng số tiền đang hiển thị"
        />
      </div>

      <Card className="space-y-4">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_180px_180px_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <SearchInput
            value={query}
            onChange={onQueryChange}
            placeholder="Tên hoặc SĐT học sinh..."
          />
          <select
            className={selectClassName}
            value={filterMethod}
            onChange={(event) => onFilterMethodChange(event.target.value)}
          >
            {paymentMethods.map((method) => (
              <option key={method.value || "ALL"} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          <Input
            type="date"
            aria-label="Từ ngày"
            value={filterStartDate}
            onChange={(event) => onFilterStartDateChange(event.target.value)}
          />
          <Input
            type="date"
            aria-label="Đến ngày"
            value={filterEndDate}
            onChange={(event) => onFilterEndDateChange(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Tìm
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!activeFilters}
            onClick={onClearFilters}
          >
            Xóa lọc
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <LoadingSkeleton count={5} height="h-16" />
      ) : payments.length === 0 ? (
        <EmptyState message="Chưa có thanh toán nào." icon={ClipboardList} />
      ) : (
        <>
          <DesktopPaymentTable
            payments={payments}
            receiptPath={receiptPath}
            canRefundPayment={canRefundPayment}
            onOpenRefund={onOpenRefund}
          />
          <MobilePaymentList
            payments={payments}
            receiptPath={receiptPath}
            canRefundPayment={canRefundPayment}
            onOpenRefund={onOpenRefund}
          />

          <div className="flex flex-col gap-3 rounded-card border border-surface-border bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-500">
              Tổng: {page?.totalElements ?? 0} giao dịch · Trang{" "}
              {(page?.number ?? currentPage) + 1}/{totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Trước
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!page || currentPage >= totalPages - 1}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={Boolean(refundPayment)}
        onClose={onCloseRefund}
        title="Hoàn tiền"
      >
        {refundPayment && (
          <div className="space-y-4">
            <div className="rounded-card border border-surface-border bg-surface-page p-4">
              <div className="text-xs font-medium uppercase text-gray-500">
                Biên lai
              </div>
              <div className="mt-1 font-mono text-sm text-gray-900">
                {refundPayment.receiptNumber}
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">Đã thu</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(refundPayment.amount)}
                </span>
              </div>
            </div>

            {actionError && (
              <ErrorBanner message={actionError} />
            )}

            <Input
              type="number"
              min="0"
              label="Số tiền hoàn"
              placeholder="Nhập số tiền"
              value={refundAmount}
              onChange={(event) => onRefundAmountChange(event.target.value)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Lý do hoàn tiền
              </label>
              <textarea
                className={textareaClassName}
                rows={3}
                placeholder="Nhập lý do"
                value={refundReason}
                onChange={(event) => onRefundReasonChange(event.target.value)}
              />
            </div>

            {refundMethod && refundMethods && onRefundMethodChange && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Phương thức hoàn
                </label>
                <select
                  className={selectClassName}
                  value={refundMethod}
                  onChange={(event) =>
                    onRefundMethodChange(event.target.value as PaymentMethod)
                  }
                >
                  {refundMethods.map((method) => (
                    <option key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onCloseRefund}
                disabled={actionLoading}
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={onConfirmRefund}
                isLoading={actionLoading}
                disabled={
                  !refundAmount ||
                  Number(refundAmount) <= 0 ||
                  !refundReason.trim()
                }
              >
                Xác nhận hoàn
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
