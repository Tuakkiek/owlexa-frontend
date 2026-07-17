import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { applyAuthFromResponse } from "../../auth/authService";
import { useAuthStore } from "../../store/authStore";
import { detectDeviceInfo } from "../../utils/device";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

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
    const rolePath: Record<string, string> = {
      ADMIN: "/admin/dashboard",
      OWNER: "/owner/dashboard",
      MANAGER: "/owner/dashboard",
      ACADEMIC_STAFF: "/owner/students",
      TEACHER: "/teacher/dashboard",
      STUDENT: "/student/dashboard",
      CASHIER: "/cashier/dashboard",
    };
    return <Navigate to={rolePath[user.roleName] || "/"} replace />;
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

      const rolePath: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        OWNER: "/owner/dashboard",
        TEACHER: "/teacher/dashboard",
        STUDENT: "/student/dashboard",
        CASHIER: "/cashier/dashboard",
      };
      navigate(rolePath[response.roleName] || "/");
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-btn bg-primary text-lg font-semibold text-white">
            O
          </div>
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
          Chưa có tài khoản?{" "}
          <Link
            to="/register/student"
            className="font-medium text-gray-900 hover:text-primary transition-colors"
          >
            Đăng ký
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
