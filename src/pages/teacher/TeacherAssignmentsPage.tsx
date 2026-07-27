import { useCallback, useEffect, useMemo, useState } from "react";
import { assignmentApi } from "../../api/assignmentApi";
import { classApi } from "../../api/classApi";
import { Button } from "../../components/ui/Button";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
} from "../../components/ui/SharedComponents";
import type { AssessmentType } from "../../types/assessmentBuilder";
import type {
  AssignmentDetailResponse,
  AssignmentListResponse,
  AssignmentRequest,
  AssignmentStatus,
  PageResponse,
} from "../../types/assignment";
import type { ClassResponse } from "../../types/class";
import { formatDateTime } from "../../utils/dateTime";
import { AssignmentForm } from "./components/AssignmentForm";
import { AssignmentPreview } from "./components/AssignmentPreview";
import { TeacherReviewQueue } from "./components/TeacherReviewQueue";
import { TeacherSubmissionList } from "./components/TeacherSubmissionList";

const PAGE_SIZE = 20;

const typeLabel: Record<AssessmentType, string> = {
  QUIZ: "Trắc nghiệm",
  HOMEWORK: "Bài tập về nhà",
  EXAM: "Bài kiểm tra",
};

const statusLabel: Record<AssignmentStatus, string> = {
  DRAFT: "Nháp",
  SCHEDULED: "Đã lên lịch",
  ACTIVE: "Đang diễn ra",
  CLOSED: "Đã đóng",
  ARCHIVED: "Đã lưu trữ",
};

const emptyPage: PageResponse<AssignmentListResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
};

const TeacherAssignmentsPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [assignmentsPage, setAssignmentsPage] =
    useState<PageResponse<AssignmentListResponse>>(emptyPage);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<AssessmentType | "">("");
  const [status, setStatus] = useState<AssignmentStatus | "">("");
  const [classId, setClassId] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<AssignmentDetailResponse | null>(null);
  const [previewAssignment, setPreviewAssignment] =
    useState<AssignmentDetailResponse | null>(null);
  const [submissionsAssignment, setSubmissionsAssignment] =
    useState<AssignmentListResponse | null>(null);
  const [reviewsAssignment, setReviewsAssignment] =
    useState<AssignmentListResponse | null>(null);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [pendingPreviewId, setPendingPreviewId] = useState<number | null>(null);

  const loadClasses = useCallback(async () => {
    try {
      setClasses(await classApi.findMyClasses());
    } catch {
      setClasses([]);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setAssignmentsPage(
        await assignmentApi.findAll({
          search: query,
          type,
          status,
          classId,
          page,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách bài tập.");
    } finally {
      setIsLoading(false);
    }
  }, [classId, page, query, status, type]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadAssignments();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadAssignments]);

  useEffect(() => {
    setPage(0);
  }, [classId, query, status, type]);

  const assignments = assignmentsPage.content;
  const pageCount = Math.max(assignmentsPage.totalPages, 1);

  const classOptions = useMemo(
    () => classes.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const goToPreviousPage = () => {
    setPage((current) => Math.max(current - 1, 0));
  };

  const goToNextPage = () => {
    setPage((current) =>
      current + 1 >= assignmentsPage.totalPages ? current : current + 1,
    );
  };

  const openCreate = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const openEdit = async (assignment: AssignmentListResponse) => {
    try {
      setEditingAssignment(await assignmentApi.findById(assignment.id));
      setIsModalOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể tải thông tin bài tập.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
  };

  const openPreview = async (assignment: AssignmentListResponse) => {
    if (pendingPreviewId === assignment.id) return;

    try {
      setPendingPreviewId(assignment.id);
      setPreviewAssignment(await assignmentApi.findById(assignment.id));
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể tải xem trước bài tập.",
      );
    } finally {
      setPendingPreviewId(null);
    }
  };

  const closePreview = () => {
    setPreviewAssignment(null);
  };

  const openSubmissions = (assignment: AssignmentListResponse) => {
    setSubmissionsAssignment(assignment);
  };

  const closeSubmissions = () => {
    setSubmissionsAssignment(null);
  };

  const openReviews = (assignment: AssignmentListResponse) => {
    setReviewsAssignment(assignment);
  };

  const closeReviews = () => {
    setReviewsAssignment(null);
  };

  const handleSave = async (request: AssignmentRequest) => {
    if (editingAssignment) {
      await assignmentApi.update(editingAssignment.id, request);
      toast.success("Cập nhật bài tập thành công.");
    } else {
      await assignmentApi.create(request);
      toast.success("Tạo mới bài tập thành công.");
    }

    closeModal();
    await loadAssignments();
  };

  const closeOpenDialogsForAssignment = (assignmentId: number) => {
    if (editingAssignment?.id === assignmentId) {
      closeModal();
    }
    if (previewAssignment?.id === assignmentId) {
      closePreview();
    }
    if (submissionsAssignment?.id === assignmentId) {
      closeSubmissions();
    }
    if (reviewsAssignment?.id === assignmentId) {
      closeReviews();
    }
  };

  const handlePublish = async (assignment: AssignmentListResponse) => {
    const confirmed = await confirm({
      title: "Công bố bài tập?",
      message: `Công bố bài tập "${assignment.title}"? Thao tác này sẽ lưu bản chụp đề thi và giao cho các đối tượng đã chọn.`,
      confirmText: "Công bố",
    });

    if (!confirmed) return;

    try {
      setPendingActionId(assignment.id);
      await assignmentApi.publish(assignment.id);
      closeOpenDialogsForAssignment(assignment.id);
      toast.success("Công bố bài tập thành công.");
      await loadAssignments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể công bố bài tập.",
      );
    } finally {
      setPendingActionId(null);
    }
  };

  const handleClose = async (assignment: AssignmentListResponse) => {
    const confirmed = await confirm({
      title: "Đóng bài tập?",
      message: `Đóng bài tập "${assignment.title}"? Học viên sẽ không còn thấy bài tập này ở trạng thái đang làm bài.`,
      confirmText: "Đóng",
    });

    if (!confirmed) return;

    try {
      setPendingActionId(assignment.id);
      await assignmentApi.close(assignment.id);
      closeOpenDialogsForAssignment(assignment.id);
      toast.success("Đã đóng bài tập.");
      await loadAssignments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể đóng bài tập.",
      );
    } finally {
      setPendingActionId(null);
    }
  };

  const handleArchive = async (assignment: AssignmentListResponse) => {
    const confirmed = await confirm({
      title: "Lưu trữ bài tập?",
      message: `Lưu trữ bài tập "${assignment.title}"? Bài tập sẽ được lưu dưới dạng nội dung lịch sử.`,
      confirmText: "Lưu trữ",
    });

    if (!confirmed) return;

    try {
      setPendingActionId(assignment.id);
      await assignmentApi.archive(assignment.id);
      closeOpenDialogsForAssignment(assignment.id);
      toast.success("Đã lưu trữ bài tập.");
      await loadAssignments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể lưu trữ bài tập.",
      );
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDelete = async (assignment: AssignmentListResponse) => {
    const confirmed = await confirm({
      title: "Xóa bài tập?",
      message: `Bạn có chắc chắn muốn xóa bài tập "${assignment.title}"? Chỉ bài tập ở trạng thái nháp mới có thể xóa.`,
      confirmText: "Xóa",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      setPendingActionId(assignment.id);
      await assignmentApi.delete(assignment.id);
      closeOpenDialogsForAssignment(assignment.id);
      toast.success("Đã xóa bài tập.");
      await loadAssignments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể xóa bài tập.",
      );
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Bài tập"
        description="Giao bài tập đã phát hành cho các lớp học hoặc học viên."
      >
        <Button type="button" onClick={openCreate}>
          Tạo mới bài tập
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_170px_220px]">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Tìm kiếm bài tập..."
        />

        <select
          value={type}
          onChange={(event) =>
            setType(event.target.value as AssessmentType | "")
          }
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        >
          <option value="">Tất cả loại</option>
          <option value="QUIZ">Trắc nghiệm</option>
          <option value="HOMEWORK">Bài tập về nhà</option>
          <option value="EXAM">Bài kiểm tra</option>
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as AssignmentStatus | "")
          }
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="ACTIVE">Đang diễn ra</option>
          <option value="CLOSED">Đã đóng</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>

        <select
          value={classId}
          onChange={(event) =>
            setClassId(event.target.value ? Number(event.target.value) : "")
          }
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        >
          <option value="">Tất cả lớp học</option>
          {classOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-16" />
      ) : assignments.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Không tìm thấy bài tập nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-3">Bài tập</th>
                  <th className="px-6 py-3">Loại</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Mở từ</th>
                  <th className="px-6 py-3">Hạn nộp</th>
                  <th className="px-6 py-3">Cập nhật</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-surface-hover">
                    <td className="max-w-xl px-6 py-4">
                      <div className="font-medium text-gray-900">
                        <span className="line-clamp-1 break-words">
                          {assignment.title}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-500">
                        <span className="line-clamp-2 break-words">
                          {assignment.description || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge>{typeLabel[assignment.type]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge>{statusLabel[assignment.status]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTime(assignment.openAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTime(assignment.dueAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTime(assignment.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {assignment.status === "DRAFT" && (
                          <button
                            type="button"
                            className="text-xs text-blue-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pendingActionId === assignment.id}
                            onClick={() => openEdit(assignment)}
                          >
                            Chỉnh sửa
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-xs text-gray-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            pendingActionId === assignment.id ||
                            pendingPreviewId === assignment.id
                          }
                          onClick={() => openPreview(assignment)}
                        >
                          {pendingPreviewId === assignment.id
                            ? "Đang tải..."
                            : "Xem trước"}
                        </button>
                        {assignment.status === "DRAFT" && (
                          <button
                            type="button"
                            className="text-xs text-gray-900 underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pendingActionId === assignment.id}
                            onClick={() => handlePublish(assignment)}
                          >
                            {pendingActionId === assignment.id
                              ? "Đang công bố..."
                              : "Công bố"}
                          </button>
                        )}
                        {assignment.status !== "DRAFT" && (
                          <>
                            <button
                              type="button"
                              className="text-xs text-gray-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={pendingActionId === assignment.id}
                              onClick={() => openSubmissions(assignment)}
                            >
                              Bài nộp
                            </button>
                            <button
                              type="button"
                              className="text-xs text-gray-900 underline disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={pendingActionId === assignment.id}
                              onClick={() => openReviews(assignment)}
                            >
                              Chấm bài
                            </button>
                          </>
                        )}
                        {(assignment.status === "ACTIVE" ||
                          assignment.status === "SCHEDULED") && (
                          <button
                            type="button"
                            className="text-xs text-gray-900 underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pendingActionId === assignment.id}
                            onClick={() => handleClose(assignment)}
                          >
                            {pendingActionId === assignment.id
                              ? "Đang đóng..."
                              : "Đóng"}
                          </button>
                        )}
                        {assignment.status === "CLOSED" && (
                          <button
                            type="button"
                            className="text-xs text-gray-900 underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pendingActionId === assignment.id}
                            onClick={() => handleArchive(assignment)}
                          >
                            {pendingActionId === assignment.id
                              ? "Đang lưu trữ..."
                              : "Lưu trữ"}
                          </button>
                        )}
                        {assignment.status === "DRAFT" && (
                          <button
                            type="button"
                            className="text-xs text-red-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pendingActionId === assignment.id}
                            onClick={() => handleDelete(assignment)}
                          >
                            {pendingActionId === assignment.id
                              ? "Đang xóa..."
                              : "Xóa"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && assignmentsPage.totalElements > 0 && (
        <div className="flex flex-col gap-3 rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Trang {assignmentsPage.number + 1} / {pageCount} - Tổng số{" "}
            {assignmentsPage.totalElements} bài tập
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToPreviousPage}
              disabled={assignmentsPage.number <= 0}
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              disabled={assignmentsPage.number + 1 >= pageCount}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAssignment ? "Chỉnh sửa bài tập" : "Tạo mới bài tập"}
        maxWidth="max-w-6xl"
      >
        <AssignmentForm
          initialData={editingAssignment ?? undefined}
          onSubmit={handleSave}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={previewAssignment != null}
        onClose={closePreview}
        title="Xem trước bài tập"
        maxWidth="max-w-5xl"
      >
        {previewAssignment && (
          <AssignmentPreview
            title={previewAssignment.title}
            description={previewAssignment.description}
            type={previewAssignment.type}
            status={previewAssignment.status}
            openAt={previewAssignment.openAt}
            dueAt={previewAssignment.dueAt}
            attemptLimit={previewAssignment.attemptLimit}
            assessmentSnapshotAt={previewAssignment.assessmentSnapshotAt}
            items={previewAssignment.items}
          />
        )}
      </Modal>

      <Modal
        isOpen={submissionsAssignment != null}
        onClose={closeSubmissions}
        title="Danh sách bài nộp"
        maxWidth="max-w-6xl"
      >
        {submissionsAssignment && (
          <TeacherSubmissionList
            assignmentId={submissionsAssignment.id}
            assignmentTitle={submissionsAssignment.title}
          />
        )}
      </Modal>

      <Modal
        isOpen={reviewsAssignment != null}
        onClose={closeReviews}
        title="Hàng chờ chấm bài"
        maxWidth="max-w-7xl"
      >
        {reviewsAssignment && (
          <TeacherReviewQueue
            assignmentId={reviewsAssignment.id}
            assignmentTitle={reviewsAssignment.title}
          />
        )}
      </Modal>
    </div>
  );
};

export default TeacherAssignmentsPage;
