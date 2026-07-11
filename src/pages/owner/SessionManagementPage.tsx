import { useCallback, useEffect, useState } from "react";
import { authApi, type SessionResponse } from "../../api/authApi";
import {
  PageHeader,
  ErrorBanner,
  EmptyState,
  LoadingSkeleton,
} from "../../components/ui/SharedComponents";

const SessionManagementPage = () => {
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
    if (!window.confirm("Bạn có chắc muốn đăng xuất phiên này?")) return;
    try {
      setRevokingId(sessionId);
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể hủy phiên đăng nhập.",
      );
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm("Bạn có chắc muốn đăng xuất tất cả các phiên khác?"))
      return;
    try {
      setIsRevokingAll(true);
      await authApi.revokeAllSessions();
      loadSessions();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể hủy tất cả phiên.");
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

  const deviceLabels: Record<string, string> = {
    DESKTOP: "💻 Máy tính",
    MOBILE: "📱 Điện thoại",
    TABLET: "📋 Máy tính bảng",
    UNKNOWN: "❓ Không rõ",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Quản lý phiên đăng nhập"
      >
        <button
          onClick={loadSessions}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : sessions.length === 0 ? (
        <EmptyState message="Không có phiên đăng nhập nào." icon="🔒" />
      ) : (
        <>
          <div className="flex justify-end">
            <button
              onClick={handleRevokeAll}
              disabled={isRevokingAll}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {isRevokingAll ? "Đang xử lý..." : "Đăng xuất tất cả phiên khác"}
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  session.isCurrentSession
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {deviceLabels[session.deviceType] ?? "❓"}
                    </span>
                    <span className="font-medium text-gray-900">
                      {session.deviceName || "Thiết bị không rõ"}
                    </span>
                    {session.isCurrentSession && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Phiên hiện tại
                      </span>
                    )}
                  </div>
                  <div className="mt-1 ml-7 text-xs text-gray-500">
                    <span>IP: {session.ipAddress || "—"}</span>
                    <span className="mx-2">·</span>
                    <span>Đăng nhập: {formatDate(session.createdAt)}</span>
                    <span className="mx-2">·</span>
                    <span>Hoạt động: {formatDate(session.lastUsedAt)}</span>
                  </div>
                </div>

                {!session.isCurrentSession && (
                  <button
                    onClick={() => handleRevoke(session.sessionId)}
                    disabled={revokingId === session.sessionId}
                    className="ml-4 rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {revokingId === session.sessionId
                      ? "Đang hủy..."
                      : "Đăng xuất"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SessionManagementPage;
