import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Upload,
  Search,
  Trash2,
  ExternalLink,
  FolderPlus,
  FileText,
  Video,
} from "lucide-react";
import { classApi } from "../../api/classApi";
import { documentApi } from "../../api/documentApi";
import type { ClassResponse } from "../../types/class";
import type { StudentDocumentResponse } from "../../types/document";
import { DocumentUploadModal } from "../owner/components/DocumentUploadModal";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { PageHeader, Card, LoadingSkeleton, ErrorBanner } from "../../components/ui/SharedComponents";

export default function TeacherDocumentsPage() {
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<StudentDocumentResponse[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [deletingDoc, setDeletingDoc] = useState<StudentDocumentResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load teacher's assigned classes
  const loadClasses = useCallback(async () => {
    try {
      setIsLoadingClasses(true);
      setError(null);
      const data = await classApi.findMyClasses();
      setClasses(data);
      if (data.length > 0 && selectedClassId === null) {
        setSelectedClassId(data[0].id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách lớp học.");
    } finally {
      setIsLoadingClasses(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Load documents for selected class
  const loadDocuments = useCallback(async () => {
    if (!selectedClassId) {
      setDocuments([]);
      return;
    }
    try {
      setIsLoadingDocs(true);
      setError(null);
      const docs = await documentApi.findClassDocumentsAsTeacher(selectedClassId);
      setDocuments(docs);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải tài liệu của lớp.");
    } finally {
      setIsLoadingDocs(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    const term = searchTerm.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(term) ||
        (doc.description && doc.description.toLowerCase().includes(term))
    );
  }, [documents, searchTerm]);

  const handleDocumentUploaded = (newDoc: StudentDocumentResponse) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDeleteDocument = async () => {
    if (!selectedClassId || !deletingDoc) return;
    try {
      setIsDeleting(true);
      setError(null);
      await documentApi.deleteForClassAsTeacher(selectedClassId, deletingDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deletingDoc.id));
      setDeletingDoc(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể xóa tài liệu.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case "PDF":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
            <FileText className="w-3.5 h-3.5" />
            PDF
          </span>
        );
      case "VIDEO":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 border border-purple-200">
            <Video className="w-3.5 h-3.5" />
            Video
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
            <FileText className="w-3.5 h-3.5" />
            Tài liệu
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Quản lý Tài liệu Lớp học">
        {selectedClassId && (
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Tải tài liệu lên
          </Button>
        )}
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {/* Class Selector Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Chọn lớp học:
            </label>
            {isLoadingClasses ? (
              <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />
            ) : classes.length === 0 ? (
              <span className="text-sm text-gray-500">Bạn chưa được phân công lớp nào</span>
            ) : (
              <select
                value={selectedClassId ?? ""}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.courseName ? `(${c.courseName})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedClassId && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Tìm kiếm tài liệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="secondary" size="sm" onClick={loadDocuments} isLoading={isLoadingDocs}>
                Làm mới
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Document List */}
      {isLoadingDocs ? (
        <LoadingSkeleton count={3} height="h-28" />
      ) : !selectedClassId ? (
        <Card className="py-12 text-center text-gray-500">Vui lòng chọn lớp học để xem tài liệu.</Card>
      ) : filteredDocuments.length === 0 ? (
        <Card className="py-12 text-center text-gray-500">
          <FolderPlus className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-base font-medium text-gray-700">Chưa có tài liệu nào cho lớp này</p>
          <p className="mt-1 text-sm text-gray-500">Nhấn nút "Tải tài liệu lên" để chia sẻ tài liệu với học sinh.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  {getDocTypeBadge(doc.type)}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString("vi-VN")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeletingDoc(doc)}
                      className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-base line-clamp-2 mb-2" title={doc.title}>
                  {doc.title}
                </h3>
                {doc.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 truncate max-w-[150px]">
                  {doc.uploaderName ? `Đăng bởi: ${doc.uploaderName}` : "Giáo viên"}
                </span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  <span>Mở tài liệu</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {selectedClassId && selectedClass && (
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          classId={selectedClassId}
          className={selectedClass.name}
          onUploaded={handleDocumentUploaded}
          isTeacher={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <Modal
          isOpen={!!deletingDoc}
          onClose={() => setDeletingDoc(null)}
          title="Xác nhận xóa tài liệu"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn xóa tài liệu{" "}
              <strong className="text-gray-900 font-semibold">
                "{deletingDoc.title}"
              </strong>{" "}
              khỏi lớp học này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => setDeletingDoc(null)}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteDocument}
                isLoading={isDeleting}
              >
                Xóa tài liệu
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
