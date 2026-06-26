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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Thư viện tài liệu
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem tài liệu của lớp và mở nhanh trong tab mới.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Lọc theo lớp
            </label>
            <select
              value={selectedClassId}
              onChange={(e) =>
                setSelectedClassId(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-black"
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
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-3xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
          Không có tài liệu nào cho lựa chọn hiện tại.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredDocuments.map((doc) => (
            <article
              key={doc.id}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    {doc.type}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900">
                    {doc.title}
                  </h2>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {doc.className}
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                >
                  Mở tài liệu
                </a>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {doc.type}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDocumentsPage;
