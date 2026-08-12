import { Button } from "../../../components/ui/Button";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
      <span>{totalElements.toLocaleString("vi-VN")} kết quả</span>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Trang trước
        </Button>
        <span>
          Trang {page + 1}/{totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Trang sau
        </Button>
      </div>
    </div>
  );
}
