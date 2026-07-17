import { useEffect, useState, useCallback } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { permissionApi } from "../../api/permissionApi";
import type {
  EffectivePermission,
  UserPermissionsResponse,
} from "../../types/permission";

interface PermissionModalProps {
  userId: number;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface PermissionRowState {
  code: string;
  description: string;
  enabled: boolean;
  dirty: boolean; // true if user toggled from original state
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Chủ trung tâm",
  MANAGER: "Quản lý",
  ACADEMIC_STAFF: "Nhân viên học vụ",
  TEACHER: "Giáo viên",
  STUDENT: "Học viên",
  CASHIER: "Thu ngân",
  ADMIN: "Quản trị viên",
};

export const PermissionModal = ({
  userId,
  userName,
  isOpen,
  onClose,
}: PermissionModalProps) => {
  const [permissions, setPermissions] = useState<PermissionRowState[]>([]);
  const [roleName, setRoleName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPermissions = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError("");
      const data: UserPermissionsResponse =
        await permissionApi.getUserPermissions(userId);
      setRoleName(data.roleName);
      setPermissions(
        data.permissions.map((p: EffectivePermission) => ({
          code: p.code,
          description: p.description,
          enabled: p.source === "ENABLED",
          dirty: false,
        })),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách quyền.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen, loadPermissions]);

  const handleToggle = (code: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.code === code ? { ...p, enabled: !p.enabled, dirty: true } : p,
      ),
    );
  };

  const changedCount = permissions.filter((p) => p.dirty).length;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      // Send only DISABLED permissions as overrides
      const overrides = permissions
        .filter((p) => !p.enabled)
        .map((p) => ({
          permissionCode: p.code,
          type: "DISABLED",
        }));
      await permissionApi.bulkUpdateOverrides(userId, { overrides });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu thay đổi quyền.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm("Khôi phục tất cả quyền về mặc định của vai trò?"))
      return;
    try {
      setIsSaving(true);
      setError("");
      await permissionApi.removeAllOverrides(userId);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể khôi phục quyền mặc định.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Phân quyền — ${userName}`}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-500">
          Vai trò:{" "}
          <span className="font-medium text-gray-700">
            {ROLE_LABELS[roleName] ?? roleName}
          </span>
          <span className="ml-2 text-xs text-gray-400">
            (hiển thị {permissions.length} quyền của vai trò)
          </span>
        </p>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Đang tải danh sách quyền...
          </div>
        ) : permissions.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Vai trò này không có quyền nào.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <div className="space-y-1">
              {permissions.map((perm) => (
                <label
                  key={perm.code}
                  className={`flex cursor-pointer items-center gap-3 rounded-btn px-3 py-2 transition-colors hover:bg-surface-hover ${
                    perm.dirty ? "bg-amber-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={perm.enabled}
                    onChange={() => handleToggle(perm.code)}
                    className="h-4 w-4 rounded border-surface-border text-primary focus:ring-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {perm.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {perm.description}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      perm.enabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {perm.enabled ? "Bật" : "Tắt"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {changedCount > 0 && (
          <p className="text-xs text-amber-600">
            Đã thay đổi {changedCount} quyền. Nhấn Lưu để áp dụng.
          </p>
        )}

        <div className="flex items-center justify-between border-t border-surface-border pt-4">
          <Button
            variant="danger"
            size="sm"
            onClick={handleRestoreDefaults}
            disabled={isSaving || isLoading}
          >
            Khôi phục mặc định
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isLoading}
            >
              Lưu
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
