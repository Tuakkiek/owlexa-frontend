import { useState, useEffect, useRef } from "react";
import type { FormEvent, DragEvent } from "react";
import { UploadCloud, Link as LinkIcon, Check, FileText, X } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import {
  documentApi,
  type StudentDocumentRequest,
} from "../../../api/documentApi";
import type { StudentDocumentResponse } from "../../../types/document";
import {
  editorFileUploadService,
  EDITOR_FILE_ACCEPT,
} from "../../../components/editor/services/fileUploadService";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  className: string;
  onUploaded: (doc: StudentDocumentResponse) => void;
  isTeacher?: boolean;
}

export const DocumentUploadModal = ({
  isOpen,
  onClose,
  classId,
  className,
  onUploaded,
  isTeacher = false,
}: DocumentUploadModalProps) => {
  const [uploadMode, setUploadMode] = useState<"FILE" | "LINK">("FILE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<StudentDocumentRequest["type"]>("OTHER");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading_file" | "saving_doc">("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUploadMode("FILE");
      setSelectedFile(null);
      setUploadProgress(0);
      setIsDragging(false);
      setTitle("");
      setType("OTHER");
      setUrl("");
      setDescription("");
      setError("");
      setSuccess(false);
      setUploadStep("idle");
    }
  }, [isOpen]);

  const detectDocumentType = (fileNameOrUrl: string): StudentDocumentRequest["type"] => {
    const cleanName = fileNameOrUrl.split("?")[0].toLowerCase();
    const ext = cleanName.split(".").pop();
    if (ext === "pdf") return "PDF";
    if (["mp4", "webm", "mkv", "mov", "avi"].includes(ext || "")) return "VIDEO";
    return "OTHER";
  };

  const formatDefaultTitle = (fileName: string) => {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError("");
    if (!title.trim()) {
      setTitle(formatDefaultTitle(file.name));
    }
    setType(detectDocumentType(file.name));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }

    let finalUrl = url.trim();
    let finalType = type;

    if (uploadMode === "FILE") {
      if (!selectedFile) {
        setError("Vui lòng chọn hoặc kéo thả một tệp để tải lên.");
        return;
      }
      finalType = detectDocumentType(selectedFile.name);
    } else {
      if (!finalUrl) {
        setError("Vui lòng nhập URL tài liệu.");
        return;
      }
      finalType = detectDocumentType(finalUrl);
    }

    try {
      setIsLoading(true);

      if (uploadMode === "FILE" && selectedFile) {
        setUploadStep("uploading_file");
        setUploadProgress(0);
        const uploadedFile = await editorFileUploadService.upload(
          selectedFile,
          (progress) => setUploadProgress(progress)
        );
        finalUrl = uploadedFile.url;
      }

      setUploadStep("saving_doc");
      const req: StudentDocumentRequest = {
        title: title.trim(),
        type: finalType,
        url: finalUrl,
        description: description.trim() || undefined,
      };

      const result = isTeacher
        ? await documentApi.createForClassAsTeacher(classId, req)
        : await documentApi.createForClass(classId, req);

      setSuccess(true);
      onUploaded(result);
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Không thể tải lên tài liệu. Vui lòng kiểm tra dung lượng tệp và thử lại."
      );
    } finally {
      setIsLoading(false);
      setUploadStep("idle");
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
            <Check className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-emerald-700">
            Tải lên thành công!
          </p>
          <p className="mt-1 text-sm text-gray-500">Đang đóng cửa sổ...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tabs: Choose File vs URL Link */}
          <div className="flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setUploadMode("FILE");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-all ${
                uploadMode === "FILE"
                  ? "bg-white text-primary shadow-xs font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Tải tệp từ máy tính
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode("LINK");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 transition-all ${
                uploadMode === "LINK"
                  ? "bg-white text-primary shadow-xs font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Liên kết URL (Google Drive...)
            </button>
          </div>

          {/* Mode 1: Direct File Selection */}
          {uploadMode === "FILE" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Chọn tài liệu đính kèm *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={EDITOR_FILE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-gray-300 hover:border-primary/60 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    Kéo thả tệp vào đây, hoặc{" "}
                    <span className="text-primary hover:underline">
                      bấm để chọn tệp
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Hỗ trợ PDF, Word, Excel, PowerPoint, Ảnh, Video, Zip, Rar... (Tối đa 2GB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/80 p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p
                        className="text-sm font-semibold text-gray-900 truncate"
                        title={selectedFile.name}
                      >
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={isLoading}
                    className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
                    title="Đổi tệp khác"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Progress bar when uploading */}
              {isLoading && uploadStep === "uploading_file" && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs font-medium text-gray-600">
                    <span>Đang tải tệp lên server...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Link Input */}
          {uploadMode === "LINK" && (
            <Input
              label="URL tài liệu *"
              value={url}
              onChange={(e) => {
                const newUrl = e.target.value;
                setUrl(newUrl);
                setType(detectDocumentType(newUrl));
              }}
              placeholder="https://drive.google.com/..."
              error={error && !url ? error : ""}
            />
          )}

          <Input
            label="Tiêu đề tài liệu *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Bài tập Unit 5"
            error={error && !title ? error : ""}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mô tả ngắn (tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập ghi chú hoặc hướng dẫn sử dụng tài liệu..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {uploadStep === "uploading_file"
                ? `Đang tải ${uploadProgress}%`
                : uploadStep === "saving_doc"
                ? "Đang lưu..."
                : "Tải lên"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
