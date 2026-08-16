import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { applyAuthFromResponse } from "../../auth/authService";
import { useAuthStore } from "../../store/authStore";
import { detectDeviceInfo } from "../../utils/device";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { UserInfo } from "../../types/auth";

const firstAllowedRoute = (
  permissions: string[] | undefined,
  routes: Array<{ permission: string; path: string }>,
) => {
  const granted = new Set(permissions ?? []);
  return routes.find((route) => granted.has(route.permission))?.path;
};

const getDefaultRoute = (user: Pick<UserInfo, "roleName" | "permissions">) => {
  if (user.roleName === "TEACHER") {
    return (
      firstAllowedRoute(user.permissions, [
        { permission: "TEACHER_DASHBOARD", path: "/teacher/dashboard" },
        { permission: "TEACHER_SCHEDULE", path: "/teacher/schedule" },
        { permission: "TEACHER_ATTENDANCE", path: "/teacher/attendance" },
        { permission: "TEACHER_GRADING_CRITERIA", path: "/teacher/grading-criteria" },
        { permission: "TEACHER_QUESTION_BANK", path: "/teacher/questions" },
        { permission: "TEACHER_ASSESSMENTS", path: "/teacher/assessments" },
        { permission: "TEACHER_DOCUMENTS", path: "/teacher/documents" },
        { permission: "TEACHER_ASSIGNMENTS", path: "/teacher/assignments" },
      ]) ?? "/unauthorized"
    );
  }

  if (user.roleName === "CASHIER") {
    return (
      firstAllowedRoute(user.permissions, [
        { permission: "CASHIER_DASHBOARD", path: "/cashier/dashboard" },
        { permission: "CASHIER_PAYMENTS", path: "/cashier/payments" },
        { permission: "CASHIER_PAYMENT_HISTORY", path: "/cashier/payment-history" },
      ]) ?? "/unauthorized"
    );
  }

  const rolePath: Record<string, string> = {
    ADMIN: "/admin/dashboard",
    OWNER: "/owner/dashboard",
    MANAGER: "/owner/dashboard",
    ACADEMIC_STAFF: "/owner/students",
    STUDENT: "/student/dashboard",
  };
  return rolePath[user.roleName] || "/";
};

const LoginPage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!phoneNumber.trim() || !password) {
      setError("Vui lòng nhập số điện thoại và mật khẩu.");
      return;
    }

    try {
      setIsLoading(true);
      const deviceInfo = detectDeviceInfo(navigator.userAgent);
      const response = await authApi.login({
        phoneNumber: phoneNumber.trim(),
        password,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
      });

      applyAuthFromResponse(response);

      navigate(getDefaultRoute(response));
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm rounded-card border border-surface-border bg-white p-8">
        <div className="mb-8 text-center">
          <img src="/logo1.png" alt="Owlexa Logo" className="mx-auto mb-4 h-14 w-14 object-contain" />
          <h1 className="text-2xl font-semibold text-gray-900">Đăng nhập</h1>
          <p className="mt-1 text-sm text-gray-500">Owlexa Management System</p>
        </div>

        {error && (
          <div className="mb-6 rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Số điện thoại"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0901234567"
            autoComplete="username"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-input border border-surface-border px-3 py-2 pr-12 text-sm text-gray-900 outline-none transition-colors focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-900"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            Đăng nhập
          </Button>
        </form>

        <div className="mt-6 border-t border-surface-border pt-4 text-center text-sm text-gray-500">
          Chưa có tài khoản trung tâm?{" "}
          <Link
            to="/register/owner"
            className="font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Đăng ký trung tâm
          </Link>
        </div>

        <div className="mt-8 border-t border-surface-border pt-4 text-center text-xs text-gray-400">
          © 2026 Owlexa
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
