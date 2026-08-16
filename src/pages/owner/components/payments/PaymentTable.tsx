import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentResponse,
  type PaymentStatus,
} from "../../../../types/fee";
import { formatMoney } from "../../../../utils/money";
import { Badge, EmptyState, LoadingSkeleton } from "../../../../components/ui/SharedComponents";
import { ClipboardList, ExternalLink } from "lucide-react";

interface PaymentTableProps {
  payments: PaymentResponse[];
  isLoading: boolean;
  onRowClick: (payment: PaymentResponse) => void;
}

const paymentStatusVariants: Record<
  PaymentStatus,
  "default" | "success" | "warning" | "error" | "info"
> = {
  PENDING: "warning",
  ACTIVE: "success",
  VOIDED: "error",
  EXPIRED: "default",
};

export const PaymentTable = ({
  payments,
  isLoading,
  onRowClick,
}: PaymentTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-card border border-surface-border p-4">
        <LoadingSkeleton count={5} height="h-14" />
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-white rounded-card border border-surface-border py-12">
        <EmptyState message="Không tìm thấy giao dịch nào." icon={ClipboardList} />
      </div>
    );
  }

  return (
    <div className="rounded-card border border-surface-border bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-page text-gray-500 text-xs uppercase font-semibold border-b border-surface-border">
            <tr>
              <th className="px-5 py-4 whitespace-nowrap">Ngày & Mã BL</th>
              <th className="px-5 py-4">Học sinh</th>
              <th className="px-5 py-4">Phương thức</th>
              <th className="px-5 py-4 text-right">Số tiền</th>
              <th className="px-5 py-4 text-center">Trạng thái</th>
              <th className="px-5 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {payments.map((payment) => {
              const date = new Date(payment.createdAt);
              return (
                <tr
                  key={payment.id}
                  onClick={() => onRowClick(payment)}
                  className="hover:bg-primary/5 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">
                      {date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })} {date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      {payment.receiptNumber}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900 truncate max-w-[200px]">
                      {payment.studentFullName}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">
                      {payment.className || "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                      {PAYMENT_METHOD_LABELS[payment.method]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="font-semibold text-gray-900">
                      {formatMoney(payment.amount)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge variant={paymentStatusVariants[payment.status]}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
