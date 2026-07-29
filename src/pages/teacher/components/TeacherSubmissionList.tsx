import { useCallback, useEffect, useState } from "react";
import { submissionApi } from "../../../api/submissionApi";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
} from "../../../components/ui/SharedComponents";
import type {
  PageResponse,
  SubmissionAttemptStatus,
  TeacherAttemptDetailResponse,
  TeacherSubmissionSummaryResponse,
} from "../../../types/submission";
import { formatDateTime } from "../../../utils/dateTime";
import { TeacherSubmissionAttemptDetail } from "./TeacherSubmissionAttemptDetail";

const PAGE_SIZE = 20;

const emptyPage: PageResponse<TeacherSubmissionSummaryResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
};

const statusLabel: Record<SubmissionAttemptStatus, string> = {
  IN_PROGRESS: "Đang làm bài",
  SUBMITTED: "Đã nộp",
  AUTO_SUBMITTED: "Tự động nộp",
};

const formatSummaryScore = (submission: TeacherSubmissionSummaryResponse) => {
  if (!submission.latestStatus) return "-";
  if (submission.latestStatus === "IN_PROGRESS") return "Chưa nộp";
  return `${submission.latestAutoScore ?? "-"} / ${submission.maxScore ?? "-"}`;
};

interface TeacherSubmissionListProps {
  assignmentId: number;
  assignmentTitle: string;
}

export const TeacherSubmissionList = ({
  assignmentId,
  assignmentTitle,
}: TeacherSubmissionListProps) => {
  const { toast } = useToast();
  const [submissionsPage, setSubmissionsPage] =
    useState<PageResponse<TeacherSubmissionSummaryResponse>>(emptyPage);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAttemptId, setPendingAttemptId] = useState<number | null>(null);
  const [attemptDetail, setAttemptDetail] =
    useState<TeacherAttemptDetailResponse | null>(null);

  const loadSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setSubmissionsPage(
        await submissionApi.findAssignmentSubmissions(assignmentId, {
          page,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách bài nộp.");
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, page]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    setPage(0);
  }, [assignmentId]);

  const submissions = submissionsPage.content;
  const pageCount = Math.max(submissionsPage.totalPages, 1);

  const openAttemptDetail = async (attemptId: number) => {
    if (pendingAttemptId != null) return;

    try {
      setPendingAttemptId(attemptId);
      setAttemptDetail(await submissionApi.findAttemptDetailForTeacher(attemptId));
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Không thể tải chi tiết lượt làm bài.",
      );
    } finally {
      setPendingAttemptId(null);
    }
  };

  const closeAttemptDetail = () => {
    setAttemptDetail(null);
  };

  const goToPreviousPage = () => {
    setPage((current) => Math.max(current - 1, 0));
  };

  const goToNextPage = () => {
    setPage((current) =>
      current + 1 >= submissionsPage.totalPages ? current : current + 1,
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="font-medium text-gray-900">{assignmentTitle}</div>
        <div className="mt-1 text-sm text-gray-500">
          {submissionsPage.totalElements} học viên
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-14" />
      ) : submissions.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-10 text-center text-sm text-gray-400">
          Không tìm thấy học viên nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">Lớp học</th>
                  <th className="px-4 py-3">Lượt làm bài</th>
                  <th className="px-4 py-3">Trạng thái mới nhất</th>
                  <th className="px-4 py-3">Thời gian nộp</th>
                  <th className="px-4 py-3">Điểm số</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {submissions.map((submission) => (
                  <tr key={submission.recipientId}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {submission.studentFullName || "-"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        ID {submission.studentUserId}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {submission.className || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {submission.latestAttemptNumber
                        ? `${submission.attemptsCount} (mới nhất #${submission.latestAttemptNumber})`
                        : "0"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {submission.latestStatus ? (
                        <Badge>{statusLabel[submission.latestStatus]}</Badge>
                      ) : (
                        <span className="text-gray-400">Chưa có lượt nộp</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDateTime(submission.latestSubmittedAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatSummaryScore(submission)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-xs text-gray-900 underline disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                          submission.latestAttemptId == null ||
                          pendingAttemptId != null
                        }
                        onClick={() => {
                          if (submission.latestAttemptId) {
                            openAttemptDetail(submission.latestAttemptId);
                          }
                        }}
                      >
                        {pendingAttemptId === submission.latestAttemptId
                          ? "Đang tải..."
                          : "Xem"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && submissionsPage.totalElements > 0 && (
        <div className="flex flex-col gap-3 rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Trang {submissionsPage.number + 1} / {pageCount} - Tổng số{" "}
            {submissionsPage.totalElements} học viên
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToPreviousPage}
              disabled={submissionsPage.number <= 0}
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              disabled={submissionsPage.number + 1 >= pageCount}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={attemptDetail != null}
        onClose={closeAttemptDetail}
        title="Chi tiết lượt làm bài"
        maxWidth="max-w-5xl"
      >
        {attemptDetail && (
          <TeacherSubmissionAttemptDetail attempt={attemptDetail} />
        )}
      </Modal>
    </div>
  );
};
