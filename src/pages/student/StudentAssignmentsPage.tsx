import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentApi } from "../../api/assignmentApi";
import { submissionApi } from "../../api/submissionApi";
import { teacherReviewApi } from "../../api/teacherReviewApi";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
} from "../../components/ui/SharedComponents";
import type { AssessmentType } from "../../types/assessmentBuilder";
import type {
  AssignmentStatus,
  StudentAssignmentDetailResponse,
  StudentAssignmentListResponse,
} from "../../types/assignment";
import type {
  StudentAttemptSummaryResponse,
  SubmissionAttemptStatus,
} from "../../types/submission";
import type { StudentReviewResultResponse } from "../../types/teacherReview";
import { formatDateTime } from "../../utils/dateTime";
import { StudentReleasedResult } from "./components/StudentReleasedResult";
import { AssignmentPreview } from "../teacher/components/AssignmentPreview";

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

const attemptStatusLabel: Record<SubmissionAttemptStatus, string> = {
  IN_PROGRESS: "Đang làm bài",
  SUBMITTED: "Đã nộp",
  AUTO_SUBMITTED: "Tự động nộp",
};

const StudentAssignmentsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<StudentAssignmentListResponse[]>(
    [],
  );
  const [selectedAssignment, setSelectedAssignment] =
    useState<StudentAssignmentDetailResponse | null>(null);
  const [attemptsAssignment, setAttemptsAssignment] =
    useState<StudentAssignmentListResponse | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<
    StudentAttemptSummaryResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttemptHistoryLoading, setIsAttemptHistoryLoading] = useState(false);
  const [pendingStartId, setPendingStartId] = useState<number | null>(null);
  const [pendingHistoryId, setPendingHistoryId] = useState<number | null>(null);
  const [pendingResultAttemptId, setPendingResultAttemptId] = useState<
    number | null
  >(null);
  const [releasedResult, setReleasedResult] =
    useState<StudentReviewResultResponse | null>(null);
  const [error, setError] = useState("");

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setAssignments(await assignmentApi.findStudentAssignments());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách bài tập.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const openDetail = async (assignment: StudentAssignmentListResponse) => {
    try {
      setSelectedAssignment(
        await assignmentApi.findStudentAssignmentDetail(assignment.id),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải thông tin bài tập.");
    }
  };

  const closeDetail = () => {
    setSelectedAssignment(null);
  };

  const startOrResume = async (assignment: StudentAssignmentListResponse) => {
    if (pendingStartId === assignment.id) return;

    try {
      setPendingStartId(assignment.id);
      const attempt = await submissionApi.startOrResumeAttempt(assignment.id);
      navigate(`/student/submission-attempts/${attempt.id}`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể bắt đầu làm bài.",
      );
    } finally {
      setPendingStartId(null);
    }
  };

  const openAttemptHistory = async (
    assignment: StudentAssignmentListResponse,
  ) => {
    if (pendingHistoryId === assignment.id) return;

    try {
      setPendingHistoryId(assignment.id);
      setIsAttemptHistoryLoading(true);
      setAttemptsAssignment(assignment);
      setAttemptHistory(await submissionApi.getAttemptHistory(assignment.id));
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể tải lịch sử làm bài.",
      );
      setAttemptsAssignment(null);
      setAttemptHistory([]);
    } finally {
      setPendingHistoryId(null);
      setIsAttemptHistoryLoading(false);
    }
  };

  const closeAttemptHistory = () => {
    setAttemptsAssignment(null);
    setAttemptHistory([]);
  };

  const openReleasedResult = async (attemptId: number) => {
    if (pendingResultAttemptId != null) return;

    try {
      setPendingResultAttemptId(attemptId);
      setReleasedResult(
        await teacherReviewApi.getStudentReleasedResult(attemptId),
      );
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.info("Giáo viên chưa công bố kết quả cho lượt làm bài này.");
      } else {
        toast.error(
          err?.response?.data?.message ?? "Không thể tải kết quả đã công bố.",
        );
      }
    } finally {
      setPendingResultAttemptId(null);
    }
  };

  const closeReleasedResult = () => {
    setReleasedResult(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Bài tập của tôi"
        description="Xem danh sách bài tập về nhà, trắc nghiệm và bài kiểm tra được giao."
      />

      {error && <ErrorBanner message={error} />}

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
                  <th className="px-6 py-3">Thời gian giao</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {assignments.map((assignment) => (
                  <tr key={assignment.recipientId} className="hover:bg-surface-hover">
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
                      {formatDateTime(assignment.assignedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs text-gray-900 underline disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={pendingStartId === assignment.id}
                          onClick={() => startOrResume(assignment)}
                        >
                          {pendingStartId === assignment.id
                            ? "Đang mở..."
                            : "Làm bài / Tiếp tục"}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-gray-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={pendingHistoryId === assignment.id}
                          onClick={() => openAttemptHistory(assignment)}
                        >
                          {pendingHistoryId === assignment.id
                            ? "Đang tải..."
                            : "Lịch sử làm bài"}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-gray-600 underline"
                          onClick={() => openDetail(assignment)}
                        >
                          Xem trước
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={selectedAssignment != null}
        onClose={closeDetail}
        title="Chi tiết bài tập"
        maxWidth="max-w-5xl"
      >
        {selectedAssignment && (
          <AssignmentPreview
            title={selectedAssignment.title}
            description={selectedAssignment.description}
            type={selectedAssignment.type}
            status={selectedAssignment.status}
            openAt={selectedAssignment.openAt}
            dueAt={selectedAssignment.dueAt}
            attemptLimit={selectedAssignment.attemptLimit}
            items={selectedAssignment.items}
          />
        )}
      </Modal>

      <Modal
        isOpen={attemptsAssignment != null}
        onClose={closeAttemptHistory}
        title="Lịch sử làm bài"
        maxWidth="max-w-4xl"
      >
        {attemptsAssignment && (
          <div className="space-y-4">
            <div>
              <div className="font-medium text-gray-900">
                {attemptsAssignment.title}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {typeLabel[attemptsAssignment.type]}
              </div>
            </div>

            {isAttemptHistoryLoading ? (
              <LoadingSkeleton count={3} height="h-14" />
            ) : attemptHistory.length === 0 ? (
              <div className="rounded-card border border-surface-border bg-white py-10 text-center text-sm text-gray-400">
                Chưa có lượt làm bài nào.
              </div>
            ) : (
              <div className="overflow-hidden rounded-card border border-surface-border bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                        <th className="px-4 py-3">Lượt bài</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3">Bắt đầu</th>
                        <th className="px-4 py-3">Đã nộp</th>
                        <th className="px-4 py-3">Điểm số</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {attemptHistory.map((attempt) => (
                        <tr key={attempt.id}>
                          <td className="whitespace-nowrap px-4 py-3">
                            Lượt {attempt.attemptNumber}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Badge>{attemptStatusLabel[attempt.status]}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                            {formatDateTime(attempt.startedAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                            {formatDateTime(attempt.submittedAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                            {attempt.autoScore ?? "-"} /{" "}
                            {attempt.maxScore ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                className="text-xs text-gray-900 underline"
                                onClick={() =>
                                  navigate(
                                    `/student/submission-attempts/${attempt.id}`,
                                  )
                                }
                              >
                                Mở
                              </button>
                              {attempt.status !== "IN_PROGRESS" && (
                                <button
                                  type="button"
                                  className="text-xs text-gray-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={
                                    pendingResultAttemptId != null
                                  }
                                  onClick={() => openReleasedResult(attempt.id)}
                                >
                                  {pendingResultAttemptId === attempt.id
                                    ? "Đang tải..."
                                    : "Xem kết quả"}
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
          </div>
        )}
      </Modal>

      <Modal
        isOpen={releasedResult != null}
        onClose={closeReleasedResult}
        title="Kết quả đã công bố"
        maxWidth="max-w-4xl"
      >
        {releasedResult && (
          <StudentReleasedResult result={releasedResult} />
        )}
      </Modal>
    </div>
  );
};

export default StudentAssignmentsPage;
