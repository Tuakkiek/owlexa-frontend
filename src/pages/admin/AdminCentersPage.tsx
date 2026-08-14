import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { TableActionButton, tableActionIcons } from "../../components/ui/TableActionButton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
  StatCard,
} from "../../components/ui/SharedComponents";
import type { AdminCenter, AdminCenterPage } from "../../types/admin";
import { AdminPagination } from "./components/AdminPagination";
import { AdminStatusDialog } from "./components/AdminStatusDialog";

const emptyPage: AdminCenterPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
};

export default function AdminCentersPage() {
  const { toast } = useToast();
  const [centersPage, setCentersPage] = useState<AdminCenterPage>(emptyPage);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<AdminCenter | null>(null);
  const [pendingCenter, setPendingCenter] = useState<AdminCenter | null>(null);
  const [updatingCenterId, setUpdatingCenterId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadCenters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setCentersPage(
        await adminApi.getCenters({
          search: debouncedSearch || undefined,
          page,
          size: 20,
        }),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách trung tâm.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadCenters();
  }, [loadCenters]);

  const viewCenter = async (centerId: number) => {
    try {
      setSelectedCenter(await adminApi.getCenter(centerId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể tải chi tiết trung tâm.");
    }
  };

  const toggleCenterStatus = async (reason: string) => {
    if (!pendingCenter) return;
    const center = pendingCenter;
    const nextActive = !center.active;
    try {
      setUpdatingCenterId(center.id);
      await adminApi.updateCenterStatus(center.id, nextActive, reason);
      toast.success(nextActive ? "Đã mở lại trung tâm." : "Đã tạm khóa trung tâm.");
      setPendingCenter(null);
      await loadCenters();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái trung tâm.");
    } finally {
      setUpdatingCenterId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Trung tâm trên hệ thống"
        description="Theo dõi chủ sở hữu và quy mô của từng trung tâm."
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Tổng trung tâm" value={centersPage.totalElements} />
        <StatCard label="Đang hiển thị" value={centersPage.content.length} />
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Tìm theo tên hoặc subdomain..."
      />

      {isLoading ? (
        <LoadingSkeleton count={5} height="h-20" />
      ) : centersPage.content.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Không tìm thấy trung tâm phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Trung tâm</th>
                  <th className="px-6 py-3">Chủ sở hữu</th>
                  <th className="px-6 py-3 text-center">Thành viên</th>
                  <th className="px-6 py-3">Ngày tạo</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {centersPage.content.map((center) => (
                  <tr key={center.id} className="hover:bg-surface-hover">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {center.name}
                      </div>
                      <div className="mt-0.5 text-xs text-primary">
                        {center.subdomain}.owlexa.vn
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>{center.ownerName || `User #${center.ownerId}`}</div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {center.ownerPhoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-900">
                      {center.memberCount}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(center.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={center.active ? "success" : "warning"}>
                        {center.active ? "Hoạt động" : "Tạm khóa"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <TableActionButton
                          variant="ghost"
                          icon={tableActionIcons.preview()}
                          onClick={() => viewCenter(center.id)}
                        >
                          Chi tiết
                        </TableActionButton>
                        <TableActionButton
                          variant={center.active ? "danger" : "secondary"}
                          icon={center.active ? tableActionIcons.close() : tableActionIcons.restore()}
                          loading={updatingCenterId === center.id}
                          onClick={() => setPendingCenter(center)}
                        >
                          {center.active ? "Tạm khóa" : "Mở lại"}
                        </TableActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminPagination
        page={centersPage.number}
        totalPages={centersPage.totalPages}
        totalElements={centersPage.totalElements}
        onPageChange={setPage}
      />

      <Modal
        isOpen={selectedCenter !== null}
        onClose={() => setSelectedCenter(null)}
        title="Chi tiết trung tâm"
      >
        {selectedCenter && (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-gray-400">Tên trung tâm</dt>
              <dd className="mt-1 font-medium text-gray-900">{selectedCenter.name}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Subdomain</dt>
              <dd className="mt-1 text-primary">{selectedCenter.subdomain}.owlexa.vn</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-gray-400">Chủ sở hữu</dt>
                <dd className="mt-1 text-gray-900">
                  {selectedCenter.ownerName || `User #${selectedCenter.ownerId}`}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Số điện thoại</dt>
                <dd className="mt-1 text-gray-900">{selectedCenter.ownerPhoneNumber}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-gray-400">Thành viên</dt>
                <dd className="mt-1 text-gray-900">{selectedCenter.memberCount}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Ngày tạo</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(selectedCenter.createdAt).toLocaleDateString("vi-VN")}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-gray-400">Trạng thái</dt>
              <dd className="mt-1">
                <Badge variant={selectedCenter.active ? "success" : "warning"}>
                  {selectedCenter.active ? "Đang hoạt động" : "Tạm khóa"}
                </Badge>
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <AdminStatusDialog
        isOpen={pendingCenter !== null}
        title={pendingCenter?.active ? "Tạm khóa trung tâm?" : "Mở lại trung tâm?"}
        description={
          pendingCenter?.active
            ? `${pendingCenter.name} sẽ được đánh dấu tạm ngưng trên toàn hệ thống.`
            : `Khôi phục trạng thái hoạt động cho ${pendingCenter?.name || "trung tâm"}?`
        }
        confirmText={pendingCenter?.active ? "Tạm khóa" : "Mở lại"}
        confirmVariant={pendingCenter?.active ? "danger" : "primary"}
        isSubmitting={updatingCenterId !== null}
        onClose={() => setPendingCenter(null)}
        onConfirm={toggleCenterStatus}
      />
    </div>
  );
}
