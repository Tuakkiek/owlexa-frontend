import { useCallback, useEffect, useMemo, useState } from "react";
import { documentApi } from "../../api/documentApi";
import type { StudentDocumentResponse } from "../../types/document";

const StudentDocumentsPage = () => {
  const [documents, setDocuments] = useState<StudentDocumentResponse[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | "all">("all");
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
      new Map(documents.map((doc) => [doc.classId, doc.className])),
    ).map(([classId, className]) => ({ classId, className }));
    return classes;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (selectedClassId === "all") return documents;
    return documents.filter((doc) => doc.classId === selectedClassId);
  }, [documents, selectedClassId]);

  return (
    <div className="p-4 space-y-4 text-sm">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-2">
        <div>
          <h1 className="text-xl font-bold">Thư viện tài liệu</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <label className="text-xs whitespace-nowrap">Lọc theo lớp:</label>
            <select
              value={selectedClassId}
              onChange={(e) =>
                setSelectedClassId(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="all">Tất cả các lớp</option>
              {classOptions.map((item) => (
                <option key={item.classId} value={item.classId}>
                  {item.className}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadDocuments}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-3 py-1 text-xs disabled:opacity-50"
          >
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-500 p-2 text-red-600 text-xs">
          Lỗi: {error}
        </div>
      )}

      {/* Content State */}
      {isLoading ? (
        <div className="text-xs">Đang tải danh sách tài liệu...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-gray-500">
          Không có tài liệu nào cho lựa chọn hiện tại.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="rounded-lg border p-4">
              <div className="flex justify-between items-start border-b pb-2 mb-2">
                <div>
                  <span className="text-xs uppercase text-gray-500">
                    [{doc.type}]
                  </span>
                  <h2 className="font-bold text-base mt-1">{doc.title}</h2>
                </div>
                <span className="rounded-lg text-xs border px-2 py-0.5 whitespace-nowrap">
                  Lớp: {doc.className}
                </span>
              </div>

              <p className="text-xs text-gray-500">
                Ngày đăng:{" "}
                {new Date(doc.uploadedAt).toLocaleDateString("vi-VN")}
              </p>

              <div className="mt-4">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg inline-block border border-primary px-4 py-1 text-xs font-medium"
                >
                  Mở tài liệu
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDocumentsPage;
