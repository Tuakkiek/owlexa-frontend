import { useCallback, useEffect, useState } from "react";
import { accountApi, type AccountResponse } from "../../api/accountApi";
import { applyAccountUpdate } from "../../auth/authService";
import {
  PageHeader,
  ErrorBanner,
  LoadingSkeleton,
} from "../../components/ui/SharedComponents";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";

const AccountPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();
  // ── Account info ──────────────────────────────────────────────────────
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Edit profile ──────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // ── Change password ───────────────────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // ═══════════════════════════════════════════════════════════════
  // LOAD
  // ═══════════════════════════════════════════════════════════════

  const loadAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await accountApi.getMyAccount();
      setAccount(data);
      applyAccountUpdate(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải thông tin tài khoản.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  // ═══════════════════════════════════════════════════════════════
  // EDIT PROFILE
  // ═══════════════════════════════════════════════════════════════

  const startEditing = () => {
    setEditFullName(account?.fullName || "");
    setEditEmail(account?.email || "");
    setEditError("");
    setEditSuccess("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError("");
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      setEditError("Họ và tên không được để trống.");
      return;
    }
    const confirmed = await confirm({
      title: "Cập nhật hồ sơ?",
      message: "Bạn có chắc chắn muốn lưu thay đổi hồ sơ cá nhân?",
      confirmText: "Lưu thay đổi",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      setIsSaving(true);
      setEditError("");
      setEditSuccess("");
      const updated = await accountApi.updateMyAccount({
        fullName: editFullName.trim(),
        email: editEmail.trim(),
      });
      setAccount(updated);
      applyAccountUpdate(updated);
      toast.success("Cập nhật hồ sơ thành công.");
      setEditSuccess("Cập nhật hồ sơ thành công.");
      setIsEditing(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Không thể cập nhật hồ sơ.";
      setEditError(msg);
      toast.error(`${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CHANGE PASSWORD
  // ═══════════════════════════════════════════════════════════════

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError("");
    setPasswordSuccess("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }
    const confirmed = await confirm({
      title: "Đổi mật khẩu?",
      message: "Bạn có chắc chắn muốn đổi mật khẩu tài khoản?",
      confirmText: "Đổi mật khẩu",
      variant: "warning",
    });
    if (!confirmed) return;

    try {
      setIsChangingPassword(true);
      setPasswordError("");
      setPasswordSuccess("");
      await accountApi.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Đổi mật khẩu thành công.");
      setPasswordSuccess("Đổi mật khẩu thành công.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Không thể đổi mật khẩu.";
      setPasswordError(msg);
      toast.error(`${msg}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  const roleLabels: Record<string, string> = {
    ADMIN: "Quản trị viên",
    OWNER: "Chủ trung tâm",
    MANAGER: "Quản lý",
    ACADEMIC_STAFF: "Nhân viên học vụ",
    TEACHER: "Giáo viên",
    STUDENT: "Học viên",
    CASHIER: "Thu ngân",
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Tài khoản của tôi" />

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : account ? (
        <>
          {/* ── Profile card ────────────────────────────────────────── */}
          <div className="rounded-card border border-surface-border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Thông tin hồ sơ
              </h2>
              {!isEditing && (
                <button
                  onClick={startEditing}
                  className="rounded-btn border border-surface-border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-surface-hover transition-colors"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            {editSuccess && (
              <div className="mb-4 rounded-btn bg-green-50 px-4 py-3 text-sm text-green-700">
                {editSuccess}
              </div>
            )}
            {editError && <ErrorBanner message={editError} />}

            {isEditing ? (
              /* ── Edit mode ──────────────────────────────────────── */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full rounded-btn border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-btn border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Nhập email"
                  />
                </div>

                {/* Phone number — read only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                      {account.phoneNumber}
                    </span>
                    <span className="text-xs text-gray-400">
                      Số điện thoại không thể thay đổi. Vui lòng liên hệ quản
                      trị viên nếu cần cập nhật.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="rounded-btn bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60 transition-colors"
                  >
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="rounded-btn border border-surface-border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-surface-hover disabled:opacity-60 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ──────────────────────────────────────── */
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-28">
                    Họ và tên
                  </span>
                  <span className="text-sm text-gray-900">
                    {account.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-28">
                    Email
                  </span>
                  <span className="text-sm text-gray-900">
                    {account.email || (
                      <span className="text-gray-400">Chưa có</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-28">
                    Số điện thoại
                  </span>
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                    {account.phoneNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-28">
                    Vai trò
                  </span>
                  <span className="text-sm text-gray-900">
                    {roleLabels[account.roleName] || account.roleName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-28">
                    Trung tâm
                  </span>
                  <span className="text-sm text-gray-900">
                    {account.centerName || (
                      <span className="text-gray-400">—</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Security card ───────────────────────────────────────── */}
          <div className="rounded-card border border-surface-border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Bảo mật
              </h2>
              <button
                onClick={openPasswordModal}
                className="rounded-btn border border-surface-border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-surface-hover transition-colors"
              >
                Đổi mật khẩu
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Bạn có thể thay đổi mật khẩu để bảo vệ tài khoản của mình. Mật
              khẩu mới cần có ít nhất 8 ký tự.
            </p>
          </div>
        </>
      ) : null}

      {/* ── Change Password Modal ───────────────────────────────────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-card border border-surface-border bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Đổi mật khẩu
            </h3>

            {passwordSuccess && (
              <div className="mb-4 rounded-btn bg-green-50 px-4 py-3 text-sm text-green-700">
                {passwordSuccess}
              </div>
            )}
            {passwordError && <ErrorBanner message={passwordError} />}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-btn border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-btn border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ít nhất 8 ký tự"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full rounded-btn border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closePasswordModal}
                disabled={isChangingPassword}
                className="rounded-btn border border-surface-border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-surface-hover disabled:opacity-60 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="rounded-btn bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60 transition-colors"
              >
                {isChangingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
