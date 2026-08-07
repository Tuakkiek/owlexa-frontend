import { useCallback, useEffect, useMemo, useState } from "react";
import { documentApi } from "../../api/documentApi";
import type { StudentDocumentResponse } from "../../types/document";

export default function StudentDocumentsPage() {
  const [documents, setDocuments] = useState<StudentDocumentResponse[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | "all">("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await documentApi.getMyDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải tài liệu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const classOptions = useMemo(() => {
    const classes = Array.from(
      new Map(documents.map((doc) => [doc.classId, doc.className]))
    ).map(([classId, className]) => ({ classId, className }));
    return classes;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchClass = selectedClassId === "all" || doc.classId === selectedClassId;
      const matchType = selectedType === "all" || doc.type === selectedType;
      const matchSearch =
        !searchTerm.trim() ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchClass && matchType && matchSearch;
    });
  }, [documents, selectedClassId, selectedType, searchTerm]);

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case "PDF":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </span>
        );
      case "VIDEO":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Video
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Tài liệu
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thư viện tài liệu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng hợp tài liệu học tập và bài giảng từ các lớp học của bạn
          </p>
        </div>
        <button
          onClick={loadDocuments}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-xs"
        >
          <svg className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Lớp:</label>
            <select
              value={selectedClassId}
              onChange={(e) =>
                setSelectedClassId(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 focus:border-primary focus:outline-none"
            >
              <option value="all">Tất cả các lớp ({classOptions.length})</option>
              {classOptions.map((item) => (
                <option key={item.classId} value={item.classId}>
                  {item.className}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Loại:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 focus:border-primary focus:outline-none"
            >
              <option value="all">Tất cả loại</option>
              <option value="PDF">PDF</option>
              <option value="VIDEO">Video</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
        </div>

        <div className="relative sm:w-64">
          <input
            type="text"
            placeholder="Tìm theo tên tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-1.5 text-xs focus:border-primary focus:outline-none"
          />
          <svg
            className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Lỗi: {error}</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-xl border border-gray-200 bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-base font-semibold text-gray-700">Chưa có tài liệu nào</p>
          <p className="mt-1 text-xs text-gray-500">
            Không tìm thấy tài liệu phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  {getDocTypeBadge(doc.type)}
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 truncate max-w-[140px]">
                    Lớp: {doc.className}
                  </span>
                </div>

                <h2 className="font-bold text-gray-900 text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors" title={doc.title}>
                  {doc.title}
                </h2>

                {doc.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="text-[11px] text-gray-400">
                  <p>{new Date(doc.uploadedAt).toLocaleDateString("vi-VN")}</p>
                  {doc.uploaderName && <p className="text-gray-500">Đăng: {doc.uploaderName}</p>}
                </div>

                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors shadow-xs"
                >
                  <span>Mở tài liệu</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
