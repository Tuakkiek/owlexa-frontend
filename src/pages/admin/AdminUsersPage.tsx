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
import type {
  AdminRole,
  AdminUser,
  AdminUserPage,
} from "../../types/admin";
import { AdminPagination } from "./components/AdminPagination";
import { AdminStatusDialog } from "./components/AdminStatusDialog";

const emptyPage: AdminUserPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
};

const roleLabels: Record<AdminRole, string> = {
  ADMIN: "Quản trị viên",
  OWNER: "Chủ trung tâm",
  MANAGER: "Quản lý",
  ACADEMIC_STAFF: "Giáo vụ",
  TEACHER: "Giáo viên",
  STUDENT: "Học viên",
  CASHIER: "Thu ngân",
};

const roleOptions = Object.entries(roleLabels) as Array<[AdminRole, string]>;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [usersPage, setUsersPage] = useState<AdminUserPage>(emptyPage);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<AdminRole | "">("");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const result = await adminApi.getUsers({
        search: debouncedSearch || undefined,
        role: role || undefined,
        page,
        size: 20,
      });
      setUsersPage(result);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách người dùng.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, role]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const viewUser = async (userId: number) => {
    try {
      setSelectedUser(await adminApi.getUser(userId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể tải chi tiết người dùng.");
    }
  };

  const toggleUserStatus = async (reason: string) => {
    if (!pendingUser) return;
    const user = pendingUser;
    const nextActive = !user.active;
    try {
      setUpdatingUserId(user.id);
      await adminApi.updateUserStatus(user.id, nextActive, reason);
      toast.success(nextActive ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.");
      setPendingUser(null);
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái tài khoản.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Người dùng hệ thống"
        description="Tra cứu tài khoản trên toàn bộ trung tâm Owlexa."
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Kết quả phù hợp"
          value={usersPage.totalElements}
        />
        <StatCard label="Đang hiển thị" value={usersPage.content.length} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tên, SĐT hoặc email..."
        />
        <select
          value={role}
          onChange={(event) => {
            setRole(event.target.value as AdminRole | "");
            setPage(0);
          }}
          className="rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
        >
          <option value="">Tất cả vai trò</option>
          {roleOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={6} height="h-16" />
      ) : usersPage.content.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Không tìm thấy người dùng phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Người dùng</th>
                  <th className="px-6 py-3">Liên hệ</th>
                  <th className="px-6 py-3">Vai trò</th>
                  <th className="px-6 py-3">Trung tâm</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {usersPage.content.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-hover">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {user.fullName || "Chưa cập nhật"}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        ID #{user.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>{user.phoneNumber}</div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {user.email || "Chưa có email"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === "ADMIN" ? "info" : "default"}>
                        {roleLabels[user.role]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.centerName || "Toàn hệ thống / chưa gán"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.active ? "success" : "error"}>
                        {user.active ? "Hoạt động" : "Đã khóa"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <TableActionButton
                          variant="ghost"
                          icon={tableActionIcons.preview()}
                          onClick={() => viewUser(user.id)}
                        >
                          Chi tiết
                        </TableActionButton>
                        {user.role === "ADMIN" ? (
                          <span className="self-center px-2 text-xs text-gray-400">
                            Được bảo vệ
                          </span>
                        ) : (
                          <TableActionButton
                            variant={user.active ? "danger" : "secondary"}
                            icon={user.active ? tableActionIcons.close() : tableActionIcons.restore()}
                            loading={updatingUserId === user.id}
                            onClick={() => setPendingUser(user)}
                          >
                            {user.active ? "Khóa" : "Mở khóa"}
                          </TableActionButton>
                        )}
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
        page={usersPage.number}
        totalPages={usersPage.totalPages}
        totalElements={usersPage.totalElements}
        onPageChange={setPage}
      />

      <Modal
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title="Chi tiết người dùng"
      >
        {selectedUser && (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-gray-400">Họ tên</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {selectedUser.fullName || "Chưa cập nhật"}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-gray-400">Số điện thoại</dt>
                <dd className="mt-1 text-gray-900">{selectedUser.phoneNumber}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Vai trò</dt>
                <dd className="mt-1 text-gray-900">{roleLabels[selectedUser.role]}</dd>
              </div>
            </div>
            <div>
              <dt className="text-gray-400">Email</dt>
              <dd className="mt-1 text-gray-900">
                {selectedUser.email || "Chưa có email"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Trung tâm</dt>
              <dd className="mt-1 text-gray-900">
                {selectedUser.centerName || "Toàn hệ thống / chưa gán"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Trạng thái</dt>
              <dd className="mt-1">
                <Badge variant={selectedUser.active ? "success" : "error"}>
                  {selectedUser.active ? "Đang hoạt động" : "Đã khóa"}
                </Badge>
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <AdminStatusDialog
        isOpen={pendingUser !== null}
        title={pendingUser?.active ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}
        description={
          pendingUser?.active
            ? `${pendingUser.fullName || pendingUser.phoneNumber} sẽ bị đăng xuất và không thể đăng nhập.`
            : `Cho phép ${pendingUser?.fullName || pendingUser?.phoneNumber || "tài khoản"} đăng nhập lại?`
        }
        confirmText={pendingUser?.active ? "Khóa tài khoản" : "Mở khóa"}
        confirmVariant={pendingUser?.active ? "danger" : "primary"}
        isSubmitting={updatingUserId !== null}
        onClose={() => setPendingUser(null)}
        onConfirm={toggleUserStatus}
      />
    </div>
  );
}
