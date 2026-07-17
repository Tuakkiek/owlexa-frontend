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

type OverrideAction = "INHERIT" | "ALLOW" | "DENY";

interface PermissionRowState {
  code: string;
  description: string;
  originalSource: string;
  pendingAction: OverrideAction;
}

const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  ROLE_DEFAULT: {
    label: "Mặc định",
    className: "bg-blue-50 text-blue-700",
  },
  ALLOW: {
    label: "Cho phép",
    className: "bg-emerald-50 text-emerald-700",
  },
  DENY: {
    label: "Từ chối",
    className: "bg-red-50 text-red-700",
  },
};

const ACTION_LABELS: Record<OverrideAction, string> = {
  INHERIT: "Kế thừa",
  ALLOW: "Cho phép",
  DENY: "Từ chối",
};

function deriveAction(source: string): OverrideAction {
  if (source === "ALLOW") return "ALLOW";
  if (source === "DENY") return "DENY";
  return "INHERIT";
}

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
          originalSource: p.source,
          pendingAction: deriveAction(p.source),
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

  const handleActionChange = (code: string, action: OverrideAction) => {
    setPermissions((prev) =>
      prev.map((p) => (p.code === code ? { ...p, pendingAction: action } : p)),
    );
  };

  // Diff used ONLY for UI state (Save button enable/disable, change count badge).
  // The API payload is built from the full permissions state (see handleSave).
  const changedPermissions = permissions.filter((p) => {
    const originalAction = deriveAction(p.originalSource);
    return p.pendingAction !== originalAction;
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      // Send ALL non-INHERIT overrides (complete set), not just the diff.
      // Backend deleteByUser_Id + re-insert requires the full desired state.
      const overrides = permissions
        .filter((p) => p.pendingAction !== "INHERIT")
        .map((p) => ({
          permissionCode: p.code,
          type: p.pendingAction,
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

  const getEffectiveSource = (row: PermissionRowState): string => {
    if (row.pendingAction === "ALLOW") return "ALLOW";
    if (row.pendingAction === "DENY") return "DENY";
    return row.originalSource;
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
          Vai trò: <span className="font-medium text-gray-700">{roleName}</span>
        </p>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Đang tải danh sách quyền...
          </div>
        ) : permissions.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Không có quyền nào.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2 pr-3">Quyền</th>
                  <th className="pb-2 pr-3">Trạng thái</th>
                  <th className="pb-2 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {permissions.map((perm) => {
                  const source = getEffectiveSource(perm);
                  const badge =
                    SOURCE_LABELS[source] ?? SOURCE_LABELS.ROLE_DEFAULT;
                  const isChanged =
                    deriveAction(perm.originalSource) !== perm.pendingAction;
                  return (
                    <tr
                      key={perm.code}
                      className={isChanged ? "bg-amber-50" : ""}
                    >
                      <td className="py-2 pr-3">
                        <div className="font-medium text-gray-900">
                          {perm.code}
                        </div>
                        <div className="text-xs text-gray-500">
                          {perm.description}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <select
                          value={perm.pendingAction}
                          onChange={(e) =>
                            handleActionChange(
                              perm.code,
                              e.target.value as OverrideAction,
                            )
                          }
                          className="rounded-input border border-surface-border bg-white px-2 py-1 text-xs text-gray-700 focus:border-primary focus:outline-none"
                        >
                          <option value="INHERIT">
                            {ACTION_LABELS.INHERIT}
                          </option>
                          <option value="ALLOW">{ACTION_LABELS.ALLOW}</option>
                          <option value="DENY">{ACTION_LABELS.DENY}</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={changedPermissions.length === 0}
            >
              Lưu thay đổi
              {changedPermissions.length > 0 &&
                ` (${changedPermissions.length})`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
