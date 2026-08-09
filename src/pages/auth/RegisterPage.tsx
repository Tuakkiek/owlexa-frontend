import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { applyAuthFromResponse } from "../../auth/authService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const normalizeSubdomain = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const RegisterPage = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [centerName, setCenterName] = useState("");
  const [subdomain, setSubdomain] = useState("");
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
      setError("Vui lòng nhập họ tên chủ trung tâm.");
      return;
    }
    if (!centerName.trim()) {
      setError("Vui lòng nhập tên trung tâm.");
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
      const response = await authApi.registerOwner({
        fullName: fullName.trim(),
        centerName: centerName.trim(),
        subdomain: normalizeSubdomain(subdomain) || undefined,
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
        password,
      });

      applyAuthFromResponse(response);
      navigate("/owner/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Đăng ký thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4 py-8">
      <div className="w-full max-w-md rounded-card border border-surface-border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <img src="/logo1.png" alt="Owlexa Logo" className="mx-auto mb-4 h-14 w-14 object-contain" />
          <h1 className="text-2xl font-semibold text-gray-900">
            Đăng ký trung tâm
          </h1>
          <p className="mt-1 text-sm text-gray-500">Khởi tạo trung tâm & tài khoản Quản trị viên Owlexa</p>
        </div>

        {error && (
          <div className="mb-6 rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Họ tên chủ trung tâm"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            required
          />

          <Input
            label="Tên trung tâm"
            type="text"
            value={centerName}
            onChange={(e) => setCenterName(e.target.value)}
            placeholder="Trung tâm Anh ngữ Owlexa"
            required
          />

          <div>
            <Input
              label="Subdomain (tùy chọn)"
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(normalizeSubdomain(e.target.value))}
              placeholder="owlexa-english"
            />
            <p className="mt-1 text-xs text-gray-400">
              Đường dẫn: {subdomain ? normalizeSubdomain(subdomain) : "subdomain"}.owlexa.vn
            </p>
          </div>

          <Input
            label="Số điện thoại Quản trị"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0901234567"
            required
          />

          <Input
            label="Email liên hệ (tùy chọn)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
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
                required
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
            required
          />

          <Button type="submit" isLoading={isLoading} className="w-full">
            Đăng ký trung tâm
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
