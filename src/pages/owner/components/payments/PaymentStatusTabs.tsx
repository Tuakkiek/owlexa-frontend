import { FilterTabs } from "../../../../components/ui/SharedComponents";

interface PaymentStatusTabsProps {
  activeStatus: string;
  onChange: (status: string) => void;
}

export const PaymentStatusTabs = ({
  activeStatus,
  onChange,
}: PaymentStatusTabsProps) => {
  const tabs = [
    { key: "", label: "Tất cả" },
    { key: "ACTIVE", label: "Thành công" },
    { key: "PENDING", label: "Chờ xử lý" },
    { key: "VOIDED", label: "Đã hủy" },
    { key: "EXPIRED", label: "Hết hạn" },
  ];

  return (
    <FilterTabs tabs={tabs} activeKey={activeStatus} onChange={onChange} />
  );
};
