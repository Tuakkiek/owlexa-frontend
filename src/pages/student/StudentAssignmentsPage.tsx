import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { assignmentApi } from "../../api/assignmentApi";
import { submissionApi } from "../../api/submissionApi";
import { teacherReviewApi } from "../../api/teacherReviewApi";
import { Modal } from "../../components/ui/Modal";
import { TableActionButton, tableActionIcons } from "../../components/ui/TableActionButton";
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
  StudentAssignmentListResponse,
} from "../../types/assignment";
import type {
  AIGradingJobStatus,
  StudentAttemptSummaryResponse,
  SubmissionAttemptStatus,
} from "../../types/submission";
import type { StudentReviewResultResponse } from "../../types/teacherReview";
import { formatDateTime } from "../../utils/dateTime";
import { StudentReleasedResult } from "./components/StudentReleasedResult";

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

const aiGradingScoreLabel: Partial<Record<AIGradingJobStatus, string>> = {
  PENDING: "Đang chấm",
  RUNNING: "Đang chấm",
  FAILED: "Chưa chấm được",
};

const formatAttemptScore = (
  attempt: StudentAttemptSummaryResponse,
  showScore: boolean,
) => {
  if (!showScore) return "Không hiển thị";
  if (attempt.status === "IN_PROGRESS") return "-";
  if (attempt.displayedScore == null) {
    return attempt.aiGradingStatus
      ? (aiGradingScoreLabel[attempt.aiGradingStatus] ?? "-")
      : "-";
  }
  return `${attempt.displayedScore} / ${attempt.maxScore ?? "-"}`;
};

const StudentAssignmentsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<StudentAssignmentListResponse[]>(
    [],
  );
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
  const [passwordAssignment, setPasswordAssignment] =
    useState<StudentAssignmentListResponse | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
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

  const startOrResume = async (
    assignment: StudentAssignmentListResponse,
    password?: string,
  ) => {
    if (pendingStartId === assignment.id) return;

    try {
      setPendingStartId(assignment.id);
      const attempt = await submissionApi.startOrResumeAttempt(
        assignment.id,
        password ? { password } : undefined,
      );
      setPasswordAssignment(null);
      setPasswordInput("");
      setPasswordError("");
      navigate(`/student/submission-attempts/${attempt.id}`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Không thể bắt đầu làm bài.";
      if (passwordAssignment) {
        setPasswordError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setPendingStartId(null);
    }
  };

  const handleStartClick = (assignment: StudentAssignmentListResponse) => {
    if (assignment.hasPassword) {
      setPasswordAssignment(assignment);
      setPasswordInput("");
      setPasswordError("");
    } else {
      startOrResume(assignment);
    }
  };

  const handlePasswordSubmit = () => {
    if (!passwordAssignment) return;
    if (!passwordInput.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu.");
      return;
    }
    startOrResume(passwordAssignment, passwordInput.trim());
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
        toast.info("Chưa có nhận xét/đánh giá chi tiết từ giáo viên.");
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
                      {assignment.hasPassword && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600">
                          <Lock className="h-3 w-3" /> Yêu cầu mật khẩu
                        </span>
                      )}
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
                      <div className="flex justify-end gap-1.5">
                        <TableActionButton
                          variant="primary"
                          icon={tableActionIcons.start()}
                          disabled={pendingStartId === assignment.id}
                          loading={pendingStartId === assignment.id}
                          loadingLabel="Đang mở..."
                          onClick={() => handleStartClick(assignment)}
                        >
                          Làm bài / Tiếp tục
                        </TableActionButton>
                        <TableActionButton
                          variant="secondary"
                          icon={tableActionIcons.history()}
                          disabled={pendingHistoryId === assignment.id}
                          loading={pendingHistoryId === assignment.id}
                          loadingLabel="Đang tải..."
                          onClick={() => openAttemptHistory(assignment)}
                        >
                          Lịch sử làm bài
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

      {/* Attempt History Modal */}
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
                {attemptsAssignment.attemptLimit != null && (
                  <> · Số lượt cho phép: {attemptsAssignment.attemptLimit}</>
                )}
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
                            {formatAttemptScore(
                              attempt,
                              attemptsAssignment.showScore,
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              {attempt.status === "IN_PROGRESS" ? (
                                <TableActionButton
                                  variant="primary"
                                  icon={tableActionIcons.start()}
                                  onClick={() =>
                                    navigate(
                                      `/student/submission-attempts/${attempt.id}`,
                                    )
                                  }
                                >
                                  Tiếp tục làm bài
                                </TableActionButton>
                              ) : attemptsAssignment.allowReview ? (
                                <>
                                  <TableActionButton
                                    variant="secondary"
                                    icon={tableActionIcons.preview()}
                                    onClick={() =>
                                      navigate(
                                        `/student/submission-attempts/${attempt.id}`,
                                      )
                                    }
                                  >
                                    Xem lại bài làm
                                  </TableActionButton>
                                  <TableActionButton
                                    variant="outline"
                                    icon={tableActionIcons.review()}
                                    disabled={pendingResultAttemptId != null}
                                    loading={pendingResultAttemptId === attempt.id}
                                    loadingLabel="Đang tải..."
                                    onClick={() =>
                                      openReleasedResult(attempt.id)
                                    }
                                  >
                                    Nhận xét GV
                                  </TableActionButton>
                                </>
                              ) : (
                                <TableActionButton
                                  variant="ghost"
                                  disabled
                                  onClick={() =>
                                    toast.info(
                                      "Giáo viên không cho phép xem lại bài làm.",
                                    )
                                  }
                                >
                                  Không được xem lại
                                </TableActionButton>
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

      {/* Password Modal */}
      <Modal
        isOpen={passwordAssignment != null}
        onClose={() => {
          setPasswordAssignment(null);
          setPasswordInput("");
          setPasswordError("");
        }}
        title="Nhập mật khẩu đề thi"
        maxWidth="max-w-md"
      >
        {passwordAssignment && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Bài tập <strong>{passwordAssignment.title}</strong> yêu cầu mật
              khẩu để bắt đầu làm bài.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && handlePasswordSubmit()
                }
                placeholder="Nhập mật khẩu..."
                className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-red-600">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-input border border-surface-border px-4 py-2 text-sm text-gray-700 hover:bg-surface-hover"
                onClick={() => {
                  setPasswordAssignment(null);
                  setPasswordInput("");
                  setPasswordError("");
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="rounded-input bg-primary px-4 py-2 text-sm text-white hover:bg-primary-active disabled:opacity-50"
                disabled={pendingStartId === passwordAssignment.id}
                onClick={handlePasswordSubmit}
              >
                {pendingStartId === passwordAssignment.id
                  ? "Đang mở..."
                  : "Bắt đầu"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Released Result Modal */}
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
