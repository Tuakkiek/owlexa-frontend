import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { applyAuthFromResponse } from "../../auth/authService";
import { useAuthStore } from "../../store/authStore";
import { detectDeviceInfo } from "../../utils/device";

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
    switch (user.roleName) {
      case "ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      case "OWNER":
        return <Navigate to="/owner/dashboard" replace />;
      case "TEACHER":
        return <Navigate to="/teacher/dashboard" replace />;
      case "STUDENT":
        return <Navigate to="/student/dashboard" replace />;
      case "CASHIER":
        return <Navigate to="/cashier/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
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

      switch (response.roleName) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "OWNER":
          navigate("/owner/dashboard");
          break;
        case "TEACHER":
          navigate("/teacher/dashboard");
          break;
        case "STUDENT":
          navigate("/student/dashboard");
          break;
        case "CASHIER":
          navigate("/cashier/dashboard");
          break;
      }
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-white">
            O
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Đăng nhập</h1>
          <p className="mt-1 text-sm text-gray-500">Owlexa Management System</p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="0901234567"
              autoComplete="username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 text-sm text-gray-900 outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-900"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <Link
            to="/register/student"
            className="font-medium text-black hover:underline"
          >
            Đăng ký
          </Link>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
          © 2026 Owlexa
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
