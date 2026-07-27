import { useCallback, useEffect, useRef, useState } from "react";
import { submissionApi } from "../../../api/submissionApi";
import { teacherReviewApi } from "../../../api/teacherReviewApi";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
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

const submissionStatusLabel = {
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  AUTO_SUBMITTED: "Auto Submitted",
} as const;

const submissionStatusVariant: Record<
  SubmissionAttemptStatus,
  "warning" | "success" | "info"
> = {
  IN_PROGRESS: "warning",
  SUBMITTED: "success",
  AUTO_SUBMITTED: "info",
};

const reviewStatusLabel = {
  UNREVIEWED: "No review yet",
  IN_PROGRESS: "In Progress",
  FINALIZED: "Finalized",
  RELEASED: "Released",
} as const;

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
    useState<TeacherReviewQueueStatus | "">("");
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
        setError(err?.response?.data?.message ?? "Unable to load review queue.");
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
      setAttemptDetail(await submissionApi.findAttemptDetailForTeacher(attemptId));
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Unable to load submission attempt.",
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-medium text-gray-900">{assignmentTitle}</div>
          <div className="mt-1 text-sm text-gray-500">
            {reviewsPage.totalElements} attempts
          </div>
        </div>
        <label className="block w-full sm:w-52">
          <span className="mb-1 block text-xs font-medium uppercase text-gray-500">
            Review Status
          </span>
          <select
            value={reviewStatus}
            onChange={(event) => {
              setPage(0);
              setReviewStatus(
                event.target.value as TeacherReviewQueueStatus | "",
              );
            }}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="">All statuses</option>
            <option value="UNREVIEWED">Unreviewed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FINALIZED">Finalized</option>
            <option value="RELEASED">Released</option>
          </select>
        </label>
      </div>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-14" />
      ) : reviews.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-10 text-center text-sm text-gray-400">
          No reviews found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Attempt</th>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Review</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Final Score</th>
                  <th className="px-4 py-3">Released</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {reviews.map((review) => {
                  const effectiveReviewStatus =
                    review.reviewStatus ?? "UNREVIEWED";
                  return (
                    <tr key={review.submissionAttemptId}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {review.studentFullName || "-"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {review.className || `Student ID ${review.studentUserId}`}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        Attempt {review.attemptNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant={
                            submissionStatusVariant[review.submissionStatus]
                          }
                        >
                          {submissionStatusLabel[review.submissionStatus]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant={reviewStatusVariant[effectiveReviewStatus]}
                        >
                          {reviewStatusLabel[effectiveReviewStatus]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {formatDateTime(review.submittedAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {formatScore(review)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {review.reviewStatus === "RELEASED" ? (
                          <Badge variant="success">Released</Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs text-gray-900 underline disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            pendingAttemptId != null
                          }
                          onClick={() =>
                            openAttemptDetail(review.submissionAttemptId)
                          }
                        >
                          {pendingAttemptId === review.submissionAttemptId
                            ? "Loading..."
                            : review.reviewStatus
                              ? "Open Review"
                              : "Start Review"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && reviewsPage.totalElements > 0 && (
        <div className="flex flex-col gap-3 rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Page {reviewsPage.number + 1} of {pageCount} -{" "}
            {reviewsPage.totalElements} attempts
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={reviewsPage.number <= 0}
            >
              Previous
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
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={attemptDetail != null}
        onClose={closeAttemptDetail}
        title="Submission Review"
        maxWidth="max-w-5xl"
      >
        {attemptDetail && (
          <TeacherSubmissionAttemptDetail attempt={attemptDetail} />
        )}
      </Modal>
    </div>
  );
};
