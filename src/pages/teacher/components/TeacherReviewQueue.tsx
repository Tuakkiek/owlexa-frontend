import { useCallback, useEffect, useRef, useState } from "react";
import { submissionApi } from "../../../api/submissionApi";
import { teacherReviewApi } from "../../../api/teacherReviewApi";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  FilterTabs,
  LoadingSkeleton,
} from "../../../components/ui/SharedComponents";
import type {
  SubmissionAttemptStatus,
  TeacherAttemptDetailResponse,
} from "../../../types/submission";
import type {
  PageResponse,
  TeacherReviewQueueStatus,
  TeacherReviewSummaryResponse,
} from "../../../types/teacherReview";
import { formatDateTime } from "../../../utils/dateTime";
import { TeacherSubmissionAttemptDetail } from "./TeacherSubmissionAttemptDetail";

const PAGE_SIZE = 20;

const emptyPage: PageResponse<TeacherReviewSummaryResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
};

const submissionStatusLabel: Record<SubmissionAttemptStatus, string> = {
  IN_PROGRESS: "Đang làm bài",
  SUBMITTED: "Đã nộp",
  AUTO_SUBMITTED: "Tự động nộp",
};

const submissionStatusVariant: Record<
  SubmissionAttemptStatus,
  "warning" | "success" | "info"
> = {
  IN_PROGRESS: "warning",
  SUBMITTED: "success",
  AUTO_SUBMITTED: "info",
};

const reviewStatusLabel: Record<TeacherReviewQueueStatus, string> = {
  UNREVIEWED: "Chưa chấm",
  IN_PROGRESS: "Đang chấm",
  FINALIZED: "Đã hoàn tất",
  RELEASED: "Đã công bố",
};

const reviewStatusVariant: Record<
  TeacherReviewQueueStatus,
  "default" | "warning" | "success" | "info"
> = {
  UNREVIEWED: "default",
  IN_PROGRESS: "warning",
  FINALIZED: "success",
  RELEASED: "info",
};

const formatScore = (review: TeacherReviewSummaryResponse) => {
  if (review.finalScore == null) return "-";
  return `${review.finalScore} / ${review.maxScore ?? "-"}`;
};

const getActionLabel = (status: TeacherReviewQueueStatus) => {
  if (status === "UNREVIEWED") return "Bắt đầu chấm";
  if (status === "IN_PROGRESS") return "Tiếp tục chấm";
  if (status === "FINALIZED") return "Xem và công bố";
  return "Xem kết quả";
};

const getActionHint = (review: TeacherReviewSummaryResponse) => {
  const effectiveStatus = review.reviewStatus ?? "UNREVIEWED";

  if (effectiveStatus === "UNREVIEWED") {
    return review.hasAiResult
      ? "Đã có gợi ý AI. Có thể vào chấm ngay."
      : "Chưa có điểm giáo viên. Nên xử lý sớm.";
  }

  if (effectiveStatus === "IN_PROGRESS") {
    return "Phiếu chấm đang mở. Vào tiếp để hoàn tất.";
  }

  if (effectiveStatus === "FINALIZED") {
    return "Đã chốt điểm. Công bố khi sẵn sàng cho học sinh.";
  }

  return "Học sinh đã xem được kết quả này.";
};

interface TeacherReviewQueueProps {
  assignmentId: number;
  assignmentTitle: string;
}

export const TeacherReviewQueue = ({
  assignmentId,
  assignmentTitle,
}: TeacherReviewQueueProps) => {
  const { toast } = useToast();
  const loadRequestIdRef = useRef(0);
  const [reviewsPage, setReviewsPage] =
    useState<PageResponse<TeacherReviewSummaryResponse>>(emptyPage);
  const [reviewStatus, setReviewStatus] =
    useState<TeacherReviewQueueStatus | "">("UNREVIEWED");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAttemptId, setPendingAttemptId] = useState<number | null>(null);
  const [attemptDetail, setAttemptDetail] =
    useState<TeacherAttemptDetailResponse | null>(null);

  const loadReviews = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    try {
      setIsLoading(true);
      setError("");
      const loadedPage = await teacherReviewApi.findReviewQueue(assignmentId, {
        reviewStatus,
        page,
        size: PAGE_SIZE,
      });
      if (requestId === loadRequestIdRef.current) {
        setReviewsPage(loadedPage);
      }
    } catch (err: any) {
      if (requestId === loadRequestIdRef.current) {
        setError(
          err?.response?.data?.message ?? "Không thể tải danh sách bài cần chấm.",
        );
      }
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [assignmentId, page, reviewStatus]);

  useEffect(() => {
    loadReviews();
    return () => {
      loadRequestIdRef.current += 1;
    };
  }, [loadReviews]);

  useEffect(() => {
    setPage(0);
  }, [assignmentId, reviewStatus]);

  const openAttemptDetail = async (attemptId: number) => {
    if (pendingAttemptId != null) return;

    try {
      setPendingAttemptId(attemptId);
      setAttemptDetail(
        await submissionApi.findAttemptDetailForTeacher(attemptId),
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          "Không thể tải chi tiết bài học sinh đã làm.",
      );
    } finally {
      setPendingAttemptId(null);
    }
  };

  const closeAttemptDetail = () => {
    setAttemptDetail(null);
    void loadReviews();
  };

  const reviews = reviewsPage.content;
  const pageCount = Math.max(reviewsPage.totalPages, 1);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="font-medium text-gray-900">{assignmentTitle}</div>
          <div className="mt-1 text-sm text-gray-500">
            {reviewsPage.totalElements} lượt làm bài trong nhóm này
          </div>
        </div>

        <div className="rounded-card border border-surface-border bg-surface-page p-4">
          <div className="text-sm text-gray-600">
            Bắt đầu từ <strong>Chưa chấm</strong> để xử lý bài mới nộp trước.
            Sau khi chấm xong, chuyển sang <strong>Đã hoàn tất</strong> để công
            bố kết quả cho học sinh khi cần.
          </div>
          <div className="mt-3">
            <FilterTabs
              tabs={[
                { key: "UNREVIEWED", label: "Chưa chấm" },
                { key: "IN_PROGRESS", label: "Đang chấm" },
                { key: "FINALIZED", label: "Đã hoàn tất" },
                { key: "RELEASED", label: "Đã công bố" },
                { key: "", label: "Tất cả" },
              ]}
              activeKey={reviewStatus}
              onChange={(key) => {
                setPage(0);
                setReviewStatus(key as TeacherReviewQueueStatus | "");
              }}
            />
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : reviews.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-10 text-center text-sm text-gray-400">
          Không tìm thấy bài nào trong nhóm này.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const effectiveReviewStatus = review.reviewStatus ?? "UNREVIEWED";
            const isPending = pendingAttemptId === review.submissionAttemptId;

            return (
              <section
                key={review.submissionAttemptId}
                className="rounded-card border border-surface-border bg-white p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold text-gray-900">
                        {review.studentFullName || "-"}
                      </div>
                      <Badge variant={reviewStatusVariant[effectiveReviewStatus]}>
                        {reviewStatusLabel[effectiveReviewStatus]}
                      </Badge>
                      <Badge
                        variant={
                          submissionStatusVariant[review.submissionStatus]
                        }
                      >
                        {submissionStatusLabel[review.submissionStatus]}
                      </Badge>
                      {review.hasAiResult && <Badge variant="info">Có AI</Badge>}
                    </div>

                    <div className="mt-2 text-sm text-gray-500">
                      {review.className || `Học viên #${review.studentUserId}`} ·
                      {" "}Lượt {review.attemptNumber}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-input bg-surface-page px-3 py-2">
                        <div className="text-xs font-medium uppercase text-gray-400">
                          Nộp bài
                        </div>
                        <div className="mt-1 text-sm text-gray-700">
                          {formatDateTime(review.submittedAt)}
                        </div>
                      </div>

                      <div className="rounded-input bg-surface-page px-3 py-2">
                        <div className="text-xs font-medium uppercase text-gray-400">
                          Điểm hiện có
                        </div>
                        <div className="mt-1 text-sm text-gray-700">
                          {formatScore(review)}
                        </div>
                      </div>

                      <div className="rounded-input bg-surface-page px-3 py-2">
                        <div className="text-xs font-medium uppercase text-gray-400">
                          Tình trạng
                        </div>
                        <div className="mt-1 text-sm text-gray-700">
                          {getActionHint(review)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 lg:w-48">
                    <Button
                      type="button"
                      onClick={() =>
                        openAttemptDetail(review.submissionAttemptId)
                      }
                      disabled={pendingAttemptId != null}
                      isLoading={isPending}
                    >
                      {isPending
                        ? "Đang tải"
                        : getActionLabel(effectiveReviewStatus)}
                    </Button>
                    <div className="text-xs text-gray-500">
                      {review.hasEssay
                        ? "Có câu tự luận cần giáo viên xác nhận điểm."
                        : "Không có tự luận. Chủ yếu để xem kết quả và công bố."}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!isLoading && reviewsPage.totalElements > 0 && (
        <div className="flex flex-col gap-3 rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Trang {reviewsPage.number + 1} / {pageCount} - Tổng số{" "}
            {reviewsPage.totalElements} lượt làm bài
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={reviewsPage.number <= 0}
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setPage((current) =>
                  current + 1 >= reviewsPage.totalPages ? current : current + 1,
                )
              }
              disabled={reviewsPage.number + 1 >= pageCount}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={attemptDetail != null}
        onClose={closeAttemptDetail}
        title="Xem bài làm và chấm bài"
        maxWidth="max-w-5xl"
      >
        {attemptDetail && (
          <TeacherSubmissionAttemptDetail attempt={attemptDetail} />
        )}
      </Modal>
    </div>
  );
};
