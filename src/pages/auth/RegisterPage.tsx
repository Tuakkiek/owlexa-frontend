import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { applyAuthFromResponse } from "../../auth/authService";

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

      if (isOwner) {
        navigate("/owner/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Đăng ký thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-lg font-semibold text-white">
            O
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isOwner ? "Đăng ký trung tâm" : "Đăng ký học sinh"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Owlexa Management System</p>
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Họ tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email (tùy chọn)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0901234567"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-black"
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-12 text-sm text-gray-900 outline-none focus:border-black"
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-medium text-black hover:underline">
            Đăng nhập
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          © 2026 Owlexa
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
