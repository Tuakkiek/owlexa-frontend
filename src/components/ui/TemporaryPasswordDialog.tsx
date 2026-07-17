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
      title={`${roleLabel} created successfully`}
    >
      <div className="space-y-5">
        {/* Success banner */}
        <div className="rounded-input border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800">
            {roleLabel} has been created successfully.
          </p>
        </div>

        {/* User info */}
        <div className="space-y-3">
          <div className="rounded-input border border-surface-border bg-surface-hover px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Full Name
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {fullName}
            </p>
          </div>

          <div className="rounded-input border border-surface-border bg-surface-hover px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Phone Number
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {phoneNumber}
            </p>
          </div>

          <div className="rounded-input border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Temporary Password
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
                {copied ? "✓ Copied" : "Copy Password"}
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
                This password will only be shown once.
              </p>
              <p className="mt-1">
                Please send it to the {roleLabel.toLowerCase()} immediately. If
                lost, you must use <strong>Reset Password</strong> to generate a
                new one.
              </p>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end border-t border-surface-border pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
