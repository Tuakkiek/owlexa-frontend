import { useEffect, useState, useRef } from "react";
import { Search, X, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "../../../../types/fee";

interface PaymentFilterToolbarProps {
  query: string;
  method: string;
  startDate: string;
  endDate: string;
  onQueryChange: (query: string) => void;
  onMethodChange: (method: string) => void;
  onDateRangeChange: (start: string, end: string) => void;
}

const paymentMethods: Array<{ value: "" | PaymentMethod; label: string }> = [
  { value: "", label: "Tất cả phương thức" },
  { value: "CASH", label: PAYMENT_METHOD_LABELS.CASH },
  { value: "BANK_TRANSFER", label: PAYMENT_METHOD_LABELS.BANK_TRANSFER },
  { value: "QR_CODE", label: PAYMENT_METHOD_LABELS.QR_CODE },
  { value: "ONLINE", label: PAYMENT_METHOD_LABELS.ONLINE },
  { value: "SEPAY", label: PAYMENT_METHOD_LABELS.SEPAY },
];

export const PaymentFilterToolbar = ({
  query,
  method,
  startDate,
  endDate,
  onQueryChange,
  onMethodChange,
  onDateRangeChange,
}: PaymentFilterToolbarProps) => {
  const [localQuery, setLocalQuery] = useState(query);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localQuery !== query) {
        onQueryChange(localQuery);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localQuery, onQueryChange, query]);

  // Sync external query changes
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Handle outside click for date picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyDate = () => {
    onDateRangeChange(localStart, localEnd);
    setShowDatePicker(false);
  };

  const handleClearDate = () => {
    setLocalStart("");
    setLocalEnd("");
    onDateRangeChange("", "");
    setShowDatePicker(false);
  };
  
  const hasDateFilter = startDate || endDate;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-card border border-surface-border">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Tìm tên, SĐT hoặc biên lai..."
          className="w-full rounded-input border border-surface-border bg-surface-page py-2 pl-9 pr-8 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-500 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20"
        />
        {localQuery && (
          <button
            type="button"
            onClick={() => setLocalQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Method Select */}
        <div className="relative">
          <select
            value={method}
            onChange={(e) => onMethodChange(e.target.value)}
            className="appearance-none rounded-input border border-surface-border bg-surface-page py-2 pl-3 pr-8 text-sm text-gray-700 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 cursor-pointer font-medium"
          >
            {paymentMethods.map((m) => (
              <option key={m.value || "ALL"} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Date Picker Trigger */}
        <div className="relative" ref={datePickerRef}>
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-2 rounded-input border px-3 py-2 text-sm font-medium transition-colors ${
              hasDateFilter
                ? "border-primary bg-primary/5 text-primary"
                : "border-surface-border bg-surface-page text-gray-700 hover:bg-white hover:border-gray-300"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>
              {hasDateFilter ? "Đang lọc ngày" : "Thời gian"}
            </span>
          </button>

          {/* Date Picker Popover */}
          {showDatePicker && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-card border border-surface-border bg-white p-4 shadow-lg z-20">
              <div className="mb-3 font-semibold text-gray-900">Tùy chọn thời gian</div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={localStart}
                    onChange={(e) => setLocalStart(e.target.value)}
                    className="w-full rounded-input border border-surface-border px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={localEnd}
                    onChange={(e) => setLocalEnd(e.target.value)}
                    className="w-full rounded-input border border-surface-border px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={handleClearDate}
                    className="rounded-input px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Bỏ lọc
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyDate}
                    className="rounded-input bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors shadow-sm"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
