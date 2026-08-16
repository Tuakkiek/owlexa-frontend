import { StatCard } from "../../../../components/ui/SharedComponents";
import { formatMoney } from "../../../../utils/money";

interface PaymentSummaryCardsProps {
  totalTransactions: number;
  totalRevenue: number;
  pendingCount: number;
  isLoading: boolean;
}

export const PaymentSummaryCards = ({
  totalTransactions,
  totalRevenue,
  pendingCount,
  isLoading,
}: PaymentSummaryCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="Tổng giao dịch"
        value={isLoading ? "-" : totalTransactions}
        helper={isLoading ? "Đang cập nhật..." : "Theo bộ lọc hiện tại"}
      />
      <StatCard
        label="Tổng thu"
        value={isLoading ? "-" : formatMoney(totalRevenue)}
        helper={isLoading ? "Đang cập nhật..." : "Theo bộ lọc hiện tại"}
      />
      <StatCard
        label="Cần xử lý"
        value={isLoading ? "-" : pendingCount}
        helper={isLoading ? "Đang cập nhật..." : "Theo bộ lọc hiện tại"}
      />
    </div>
  );
};
