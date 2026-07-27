import type { Money } from "../types/fee";

export const parseMoney = (value: Money | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

export const formatMoney = (
  value: Money | null | undefined,
  currency: string = "VND",
  locale: string = "vi-VN",
): string => {
  const numeric = parseMoney(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
};

export const formatCurrency = (
  amount: number,
  currency: string = "VND",
  locale: string = "vi-VN",
  maximumFractionDigits: number = 0,
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(amount ?? 0);
};

export const remainingBalance = (record: {
  amount: Money;
  paidAmount: Money;
}): number => parseMoney(record.amount) - parseMoney(record.paidAmount);
