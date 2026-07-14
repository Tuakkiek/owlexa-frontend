import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { applyAuthFromResponse } from "../../auth/authService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface RegisterPageProps {
  mode: "student" | "owner";
}

const RegisterPage = ({ mode }: RegisterPageProps) => {
  const navigate = useNavigate();
  const isOwner = mode === "owner";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên.");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!/^0\d{9}$/.test(phoneNumber.trim())) {
      setError("Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0).");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setIsLoading(true);
      const response = isOwner
        ? await authApi.registerOwner({
            fullName: fullName.trim(),
            email: email.trim() || undefined,
            phoneNumber: phoneNumber.trim(),
            password,
          })
        : await authApi.registerStudent({
            fullName: fullName.trim(),
            email: email.trim() || undefined,
            phoneNumber: phoneNumber.trim(),
            password,
          });

      applyAuthFromResponse(response);
      navigate(isOwner ? "/owner/dashboard" : "/student/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Đăng ký thất bại. Vui lòng thử lại.";
      setError(msg);
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
          <h1 className="text-2xl font-semibold text-gray-900">
            {isOwner ? "Đăng ký trung tâm" : "Đăng ký học sinh"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Owlexa Management System</p>
        </div>

        {error && (
          <div className="mb-6 rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Họ tên"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
          />

          <Input
            label="Email (tùy chọn)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />

          <Input
            label="Số điện thoại"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0901234567"
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
                placeholder="Ít nhất 8 ký tự"
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

          <Input
            label="Xác nhận mật khẩu"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
          />

          <Button type="submit" isLoading={isLoading} className="w-full">
            Đăng ký
          </Button>
        </form>

        <div className="mt-6 border-t border-surface-border pt-4 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Đăng nhập
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-gray-400">
          © 2026 Owlexa
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
