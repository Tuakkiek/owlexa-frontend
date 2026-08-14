import { useCallback, useEffect, useState } from "react";
import { Monitor, Smartphone, Tablet, HelpCircle, RefreshCw, LogOut } from "lucide-react";
import { authApi, type SessionResponse } from "../../api/authApi";
import {
  PageHeader,
  ErrorBanner,
  EmptyState,
  LoadingSkeleton,
} from "../../components/ui/SharedComponents";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";

const SessionManagementPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await authApi.getSessions();
      setSessions(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Không thể tải danh sách phiên đăng nhập.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId: string) => {
    const confirmed = await confirm({
      title: "Đăng xuất phiên?",
      message: "Bạn có chắc chắn muốn đăng xuất khỏi phiên này?",
      confirmText: "Đăng xuất",
      variant: "warning",
    });
    if (!confirmed) return;

    try {
      setRevokingId(sessionId);
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      toast.success("Hủy phiên đăng nhập thành công.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể hủy phiên đăng nhập.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    const confirmed = await confirm({
      title: "Đăng xuất tất cả phiên khác?",
      message: "Bạn có chắc chắn muốn đăng xuất tất cả các phiên làm việc khác?",
      confirmText: "Đăng xuất tất cả",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      setIsRevokingAll(true);
      await authApi.revokeAllSessions();
      toast.success("Hủy tất cả các phiên đăng nhập khác thành công.");
      loadSessions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể hủy tất cả phiên.");
    } finally {
      setIsRevokingAll(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case "DESKTOP":
        return <Monitor className="h-5 w-5 text-gray-600" />;
      case "MOBILE":
        return <Smartphone className="h-5 w-5 text-gray-600" />;
      case "TABLET":
        return <Tablet className="h-5 w-5 text-gray-600" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Quản lý phiên đăng nhập">
        <button
          onClick={loadSessions}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-btn border border-surface-border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-surface-hover disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Đang tải..." : "Làm mới"}</span>
        </button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-20" />
      ) : sessions.length === 0 ? (
        <EmptyState message="Không có phiên đăng nhập nào." />
      ) : (
        <div className="space-y-4">
          {sessions.length > 1 && (
            <div className="flex justify-end">
              <button
                onClick={handleRevokeAll}
                disabled={isRevokingAll}
                className="inline-flex items-center gap-1.5 rounded-btn border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{isRevokingAll ? "Đang xử lý..." : "Đăng xuất tất cả phiên khác"}</span>
              </button>
            </div>
          )}

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`flex items-center justify-between rounded-card border p-4 transition-colors ${
                  session.current
                    ? "border-blue-200 bg-blue-50"
                    : "border-surface-border bg-white"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(session.deviceType)}
                    <span className="font-medium text-gray-900">
                      {session.deviceName || "Thiết bị không rõ"}
                    </span>
                    {session.current && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Phiên hiện tại
                      </span>
                    )}
                  </div>
                  <div className="mt-1 ml-7 text-xs text-gray-500">
                    <span>IP: {session.ipAddress || "—"}</span>
                    {session.createdAt && (
                      <span className="ml-3">
                        Tạo lúc: {formatDate(session.createdAt)}
                      </span>
                    )}
                    {session.lastUsedAt && (
                      <span className="ml-3">
                        Truy cập cuối: {formatDate(session.lastUsedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {!session.current && (
                  <button
                    onClick={() => handleRevoke(session.sessionId)}
                    disabled={revokingId === session.sessionId}
                    className="ml-4 shrink-0 rounded-btn border border-surface-border bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
                  >
                    {revokingId === session.sessionId ? "Đang xử lý..." : "Đăng xuất"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagementPage;
