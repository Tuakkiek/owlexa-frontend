import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { feeApi } from "../../api/feeApi";
import { useAuthStore } from "../../store/authStore";
import type { PaymentResponse, PaymentHistoryResponse } from "../../types/fee";
import { TuitionReceipt } from "../../components/payment/TuitionReceipt";

const ReceiptPage = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [payment, setPayment] = useState<PaymentResponse | PaymentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const role = user?.roleName === "CASHIER" ? "cashier" : "owner";

  const load = useCallback(async () => {
    if (!paymentId) return;
    try {
      setLoading(true);
      if (user?.roleName === "STUDENT") {
        const history = await feeApi.getMyPaymentHistory();
        const found = history.find(
          (p) =>
            p.paymentId === Number(paymentId) ||
            p.id === paymentId ||
            String(p.id) === paymentId ||
            p.receiptNumber === paymentId
        );
        setPayment(found || null);
      } else {
        const numId = Number(paymentId);
        if (!isNaN(numId)) {
          try {
            const data = await feeApi.getReceipt(role, numId);
            if (data) {
              setPayment(data);
              return;
            }
          } catch {
            // fallback if getReceipt failed or record is a duplicate sepay event
          }
        }
        const historyPage = await feeApi.getPaymentHistoryPaginated(role, { size: 100 });
        const found = historyPage.content.find(
          (p) =>
            p.id === paymentId ||
            String(p.paymentId) === paymentId ||
            p.receiptNumber === paymentId ||
            p.paymentId === Number(paymentId)
        );
        setPayment(found || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [paymentId, role, user?.roleName]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-gray-400">
        Đang tải biên lai...
      </div>
    );
  }
  if (!payment) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-gray-400">
        Không tìm thấy biên lai.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <TuitionReceipt payment={payment} onBack={() => navigate(-1)} />
    </div>
  );
};

export default ReceiptPage;

