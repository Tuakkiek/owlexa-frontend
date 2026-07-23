import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface TemporaryPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  phoneNumber: string;
  temporaryPassword: string;
  roleLabel: string; // e.g. "Teacher", "Student", "Cashier"
}

export const TemporaryPasswordDialog = ({
  isOpen,
  onClose,
  fullName,
  phoneNumber,
  temporaryPassword,
  roleLabel,
}: TemporaryPasswordDialogProps) => {
  const [copied, setCopied] = useState(false);
  const roleLabelVi =
    roleLabel === "Teacher"
      ? "giáo viên"
      : roleLabel === "Student"
        ? "học sinh"
        : roleLabel === "Cashier"
          ? "thu ngân"
          : roleLabel;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = temporaryPassword;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Tạo tài khoản ${roleLabelVi} thành công`}
    >
      <div className="space-y-5">
        {/* Success banner */}
        <div className="rounded-input border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800">
            Đã tạo tài khoản {roleLabelVi} thành công.
          </p>
        </div>

        {/* User info */}
        <div className="space-y-3">
          <div className="rounded-input border border-surface-border bg-surface-hover px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Họ và tên
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {fullName}
            </p>
          </div>

          <div className="rounded-input border border-surface-border bg-surface-hover px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Số điện thoại
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {phoneNumber}
            </p>
          </div>

          <div className="rounded-input border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Mật khẩu tạm thời
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wider text-amber-900">
              {temporaryPassword}
            </p>
            <div className="mt-3">
              <Button
                type="button"
                variant={copied ? "secondary" : "primary"}
                size="sm"
                onClick={handleCopy}
              >
                {copied ? "✓ Đã sao chép" : "Sao chép mật khẩu"}
              </Button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-input border border-red-100 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div className="text-xs text-red-700">
              <p className="font-semibold">
                Mật khẩu này chỉ hiển thị một lần duy nhất.
              </p>
              <p className="mt-1">
                Vui lòng gửi cho {roleLabelVi} ngay lập tức. Nếu
                làm mất, bạn phải sử dụng chức năng <strong>Đặt lại mật khẩu</strong> để tạo
                mật khẩu mới.
              </p>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end border-t border-surface-border pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
