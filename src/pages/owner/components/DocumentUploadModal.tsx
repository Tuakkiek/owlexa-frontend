import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import {
  documentApi,
  type StudentDocumentRequest,
} from "../../../api/documentApi";
import type { StudentDocumentResponse } from "../../../types/document";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  className: string;
  onUploaded: (doc: StudentDocumentResponse) => void;
}

const DOCUMENT_TYPES: Array<{
  value: StudentDocumentRequest["type"];
  label: string;
}> = [
  { value: "PDF", label: "PDF" },
  { value: "VIDEO", label: "Video" },
  { value: "OTHER", label: "Khác" },
];

export const DocumentUploadModal = ({
  isOpen,
  onClose,
  classId,
  className,
  onUploaded,
}: DocumentUploadModalProps) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<StudentDocumentRequest["type"]>("PDF");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setType("PDF");
      setUrl("");
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }
    if (!url.trim()) {
      setError("Vui lòng nhập URL tài liệu.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await documentApi.createForClass(classId, {
        title: title.trim(),
        type,
        url: url.trim(),
      });
      setSuccess(true);
      onUploaded(result);
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải lên tài liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tải tài liệu lên lớp ${className}`}
    >
      {success ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-emerald-700">
            Tải lên thành công!
          </p>
          <p className="mt-1 text-sm text-gray-500">Đang đóng...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tiêu đề tài liệu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Bài tập Unit 5"
            error={error && !title ? error : ""}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Loại tài liệu
            </label>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as StudentDocumentRequest["type"])
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-black"
            >
              {DOCUMENT_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="URL tài liệu"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            error={error && !url ? error : ""}
          />

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Tải lên
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
