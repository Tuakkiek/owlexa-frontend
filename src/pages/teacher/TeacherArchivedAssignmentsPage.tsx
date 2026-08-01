import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assessmentBuilderApi } from "../../api/assessmentBuilderApi";
import { assignmentApi } from "../../api/assignmentApi";
import { classApi } from "../../api/classApi";
import { Button } from "../../components/ui/Button";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { Modal } from "../../components/ui/Modal";
import {
  TableActionButton,
  tableActionIcons,
} from "../../components/ui/TableActionButton";
import { useToast } from "../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
} from "../../components/ui/SharedComponents";
import type {
  AssignmentDetailResponse,
  AssignmentItemResponse,
  AssignmentListResponse,
  PageResponse,
} from "../../types/assignment";
import type { AssessmentItemResponse } from "../../types/assessmentBuilder";
import type { ClassResponse } from "../../types/class";
import { formatDateTime } from "../../utils/dateTime";
import { AssignmentPreview } from "./components/AssignmentPreview";

const PAGE_SIZE = 20;

const emptyPage: PageResponse<AssignmentListResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
};

const toAssignmentPreviewItem = (
  item: AssessmentItemResponse,
): AssignmentItemResponse => ({
  id: item.id,
  assessmentItemId: item.id,
  questionType: item.questionType,
  title: item.title,
  content: item.content,
  difficulty: item.difficulty,
  points: item.points,
  explanation: item.explanation,
  sampleAnswer: item.sampleAnswer,
  gradingCriteriaName: item.gradingCriteriaName,
  gradingCriteriaContent: item.gradingCriteriaContent,
  displayOrder: item.displayOrder,
  options: (item.options ?? []).map((option) => ({
    id: option.id,
    content: option.content,
    isCorrect: option.isCorrect,
    displayOrder: option.displayOrder,
  })),
});

const TeacherArchivedAssignmentsPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { toast } = useToast();

  const [assignmentsPage, setAssignmentsPage] =
    useState<PageResponse<AssignmentListResponse>>(emptyPage);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewAssignment, setPreviewAssignment] =
    useState<AssignmentDetailResponse | null>(null);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [pendingActionType, setPendingActionType] = useState<
    "restore" | "delete" | null
  >(null);
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
          status: "ARCHIVED",
          classId,
          page,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Không thể tải danh sách bài tập đã lưu trữ.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [classId, page, query]);

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
  }, [classId, query]);

  const assignments = assignmentsPage.content;
  const pageCount = Math.max(assignmentsPage.totalPages, 1);

  const classOptions = useMemo(
    () => classes.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const openPreview = async (assignment: AssignmentListResponse) => {
    if (pendingPreviewId === assignment.id) return;

    try {
      setPendingPreviewId(assignment.id);
      const detail = await assignmentApi.findById(assignment.id);

      if ((!detail.items || detail.items.length === 0) && detail.assessmentId) {
        const assessment = await assessmentBuilderApi.findById(
          detail.assessmentId,
        );
        setPreviewAssignment({
          ...detail,
          content: assessment.content,
          audioFile: assessment.audioFile,
          playbackMode: assessment.playbackMode,
          items: (assessment.items ?? []).map(toAssignmentPreviewItem),
          blocks: assessment.blocks ?? undefined,
        });
      } else {
        setPreviewAssignment(detail);
      }
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

  const handleDelete = async (assignment: AssignmentListResponse) => {
    const confirmed = await confirm({
      title: "Xóa bài tập lưu trữ?",
      message: `Bạn có chắc chắn muốn xóa bài tập "${assignment.title}" khỏi kho lưu trữ? Thao tác này sẽ ẩn bài tập khỏi danh sách.`,
      confirmText: "Xóa",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      setPendingActionId(assignment.id);
      setPendingActionType("delete");
      await assignmentApi.delete(assignment.id);
      if (previewAssignment?.id === assignment.id) {
        closePreview();
      }
      toast.success("Đã xóa bài tập lưu trữ.");
      await loadAssignments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể xóa bài tập lưu trữ.",
      );
    } finally {
      setPendingActionId(null);
      setPendingActionType(null);
    }
  };

  const handleRestore = async (assignment: AssignmentListResponse) => {
    const confirmed = await confirm({
      title: "Khôi phục bài tập?",
      message: `Khôi phục bài tập "${assignment.title}" về trạng thái đã đóng để tiếp tục quản lý?`,
      confirmText: "Khôi phục",
    });

    if (!confirmed) return;

    try {
      setPendingActionId(assignment.id);
      setPendingActionType("restore");
      await assignmentApi.restore(assignment.id);
      if (previewAssignment?.id === assignment.id) {
        closePreview();
      }
      toast.success("Đã khôi phục bài tập.");
      await loadAssignments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể khôi phục bài tập.",
      );
    } finally {
      setPendingActionId(null);
      setPendingActionType(null);
    }
  };

  const goToPreviousPage = () => {
    setPage((current) => Math.max(current - 1, 0));
  };

  const goToNextPage = () => {
    setPage((current) =>
      current + 1 >= assignmentsPage.totalPages ? current : current + 1,
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Kho bài tập lưu trữ"
        description="Xem lại các bài tập đã lưu trữ, khôi phục về trạng thái đã đóng, hoặc xóa những bài không còn cần giữ."
      >
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/teacher/assignments")}
        >
          Về danh sách bài tập
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Tìm kiếm bài tập lưu trữ..."
        />

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
          Chưa có bài tập lưu trữ nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-3">Bài tập</th>
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
                      <Badge>Đã lưu trữ</Badge>
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
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <TableActionButton
                          variant="secondary"
                          icon={tableActionIcons.preview()}
                          title="Xem trước bài tập"
                          disabled={pendingActionId === assignment.id}
                          loading={pendingPreviewId === assignment.id}
                          loadingLabel="Đang tải..."
                          onClick={() => openPreview(assignment)}
                        >
                          Xem trước
                        </TableActionButton>

                        <TableActionButton
                          variant="secondary"
                          icon={tableActionIcons.restore()}
                          title="Khôi phục bài tập"
                          disabled={pendingPreviewId === assignment.id}
                          loading={
                            pendingActionId === assignment.id &&
                            pendingActionType === "restore"
                          }
                          loadingLabel="Đang khôi phục..."
                          onClick={() => handleRestore(assignment)}
                        >
                          Khôi phục
                        </TableActionButton>

                        <TableActionButton
                          variant="danger"
                          icon={tableActionIcons.delete()}
                          title="Xóa bài tập lưu trữ"
                          disabled={pendingPreviewId === assignment.id}
                          loading={
                            pendingActionId === assignment.id &&
                            pendingActionType === "delete"
                          }
                          loadingLabel="Đang xóa..."
                          onClick={() => handleDelete(assignment)}
                        >
                          Xóa
                        </TableActionButton>
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
            {assignmentsPage.totalElements} bài tập lưu trữ
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
        isOpen={previewAssignment != null}
        onClose={closePreview}
        title="Xem trước bài tập lưu trữ"
        maxWidth="max-w-5xl"
      >
        {previewAssignment && (
          <AssignmentPreview
            title={previewAssignment.title}
            description={previewAssignment.description}
            content={previewAssignment.content}
            status={previewAssignment.status}
            openAt={previewAssignment.openAt}
            dueAt={previewAssignment.dueAt}
            attemptLimit={previewAssignment.attemptLimit}
            assessmentSnapshotAt={previewAssignment.assessmentSnapshotAt}
            audioFile={previewAssignment.audioFile}
            playbackMode={previewAssignment.playbackMode}
            items={previewAssignment.items}
          />
        )}
      </Modal>
    </div>
  );
};

export default TeacherArchivedAssignmentsPage;
