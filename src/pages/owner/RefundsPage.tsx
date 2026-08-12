import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { refundApi } from "../../api/refundApi";
import type { RefundResponse } from "../../types/refund";
import type { PaymentMethod } from "../../types/fee";
import { formatMoney } from "../../utils/money";
import { RefundDecisionModal } from "./components/RefundDecisionModal";
import { RefundPayoutModal } from "./components/RefundPayoutModal";

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  PAID: "Đã hoàn tiền",
  REJECTED: "Từ chối",
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [decisionModalRefund, setDecisionModalRefund] = useState<RefundResponse | null>(null);
  const [payoutModalRefund, setPayoutModalRefund] = useState<RefundResponse | null>(null);

  const loadRefunds = async () => {
    try {
      setIsLoading(true);
      const data = await refundApi.getRefunds();
      setRefunds(data);
    } catch (err) {
      toast.error("Không thể tải danh sách hoàn tiền.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  const handleDecision = async (approved: boolean, rejectionReason?: string) => {
    if (!decisionModalRefund) return;
    await refundApi.decideRefund(decisionModalRefund.id, {
      approve: approved,
      rejectedReason: rejectionReason,
    });
    toast.success("Cập nhật quyết định thành công.");
    loadRefunds();
  };

  const handlePayout = async (refundMethod: PaymentMethod) => {
    if (!payoutModalRefund) return;
    await refundApi.payoutRefund(payoutModalRefund.id, { refundMethod });
    toast.success("Đã ghi nhận hoàn tiền.");
    loadRefunds();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý Hoàn Tiền</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : refunds.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có yêu cầu hoàn tiền nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50/80 text-gray-900 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Học sinh</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Số tiền</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{r.studentFullName}</div>
                      <div className="text-xs text-gray-500">{r.studentPhoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatMoney(r.amount)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          r.status === "PAID"
                            ? "success"
                            : r.status === "REQUESTED"
                            ? "warning"
                            : r.status === "REJECTED"
                            ? "error"
                            : "info"
                        }
                      >
                        {STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {r.status === "REQUESTED" && (
                        <Button size="sm" onClick={() => setDecisionModalRefund(r)}>
                          Duyệt / Từ chối
                        </Button>
                      )}
                      {r.status === "APPROVED" && (
                        <Button size="sm" onClick={() => setPayoutModalRefund(r)}>
                          Hoàn tiền
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {decisionModalRefund && (
        <RefundDecisionModal
          isOpen={!!decisionModalRefund}
          onClose={() => setDecisionModalRefund(null)}
          onConfirm={handleDecision}
          refund={decisionModalRefund}
        />
      )}
      {payoutModalRefund && (
        <RefundPayoutModal
          isOpen={!!payoutModalRefund}
          onClose={() => setPayoutModalRefund(null)}
          onConfirm={handlePayout}
          refund={payoutModalRefund}
        />
      )}
    </div>
  );
}
