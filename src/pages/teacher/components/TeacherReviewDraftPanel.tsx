import { useEffect, useMemo, useRef, useState } from "react";
import { teacherReviewApi } from "../../../api/teacherReviewApi";
import { Button } from "../../../components/ui/Button";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
} from "../../../components/ui/SharedComponents";
import { useToast } from "../../../components/ui/Toast";
import type { AIGradingResultResponse } from "../../../types/aiGrading";
import type {
  TeacherReviewDetailResponse,
  TeacherReviewItemRequest,
  TeacherReviewStatus,
} from "../../../types/teacherReview";
import { formatDateTime } from "../../../utils/dateTime";

const statusLabel: Record<TeacherReviewStatus, string> = {
  IN_PROGRESS: "In Progress",
  FINALIZED: "Finalized",
  RELEASED: "Released",
};

const statusVariant: Record<
  TeacherReviewStatus,
  "warning" | "success" | "info"
> = {
  IN_PROGRESS: "warning",
  FINALIZED: "success",
  RELEASED: "info",
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ?? fallback;

interface EditableReviewItem {
  assignmentItemId: number;
  finalScore: string;
  itemComment: string;
}

interface TeacherReviewDraftPanelProps {
  attemptId: number;
  canReview: boolean;
  latestAiResult: AIGradingResultResponse | null;
}

const toEditableItems = (
  review: TeacherReviewDetailResponse,
): EditableReviewItem[] =>
  review.items.map((item) => ({
    assignmentItemId: item.assignmentItemId,
    finalScore: item.finalScore == null ? "" : String(item.finalScore),
    itemComment: item.itemComment ?? "",
  }));

const nullableText = (value: string) => {
  const normalized = value.trim();
  return normalized || null;
};

const nullableScore = (value: string) => {
  if (!value.trim()) return null;
  return Number(value);
};

const formatScore = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);

const hasMoreThanTwoDecimalPlaces = (value: string) => {
  const decimalPart = value.trim().split(".")[1];
  return decimalPart != null && decimalPart.length > 2;
};

export const TeacherReviewDraftPanel = ({
  attemptId,
  canReview,
  latestAiResult,
}: TeacherReviewDraftPanelProps) => {
  const confirm = useConfirm();
  const { toast } = useToast();
  const isMountedRef = useRef(false);
  const [review, setReview] = useState<TeacherReviewDetailResponse | null>(
    null,
  );
  const [overallComment, setOverallComment] = useState("");
  const [selectedAiGradingResultId, setSelectedAiGradingResultId] = useState<
    number | null
  >(null);
  const [editableItems, setEditableItems] = useState<EditableReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(canReview);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingLifecycleAction, setPendingLifecycleAction] = useState<
    "finalize" | "release" | null
  >(null);
  const [reviewNotCreated, setReviewNotCreated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setReview(null);
    setOverallComment("");
    setSelectedAiGradingResultId(null);
    setEditableItems([]);
    setReviewNotCreated(false);
    setError("");
    setPendingLifecycleAction(null);

    if (!canReview) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    const loadReview = async () => {
      try {
        const loadedReview = await teacherReviewApi.getReview(attemptId);
        if (!cancelled) {
          setReview(loadedReview);
          setOverallComment(loadedReview.overallComment ?? "");
          setSelectedAiGradingResultId(
            loadedReview.selectedAiGradingResultId,
          );
          setEditableItems(toEditableItems(loadedReview));
        }
      } catch (requestError: any) {
        if (cancelled) return;
        if (requestError?.response?.status === 404) {
          setReviewNotCreated(true);
        } else {
          setError(
            getErrorMessage(requestError, "Unable to load teacher review."),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadReview();

    return () => {
      cancelled = true;
    };
  }, [attemptId, canReview]);

  const itemsById = useMemo(
    () =>
      new Map(
        (review?.items ?? []).map((item) => [item.assignmentItemId, item]),
      ),
    [review],
  );

  const isDirty = useMemo(() => {
    if (!review || review.status !== "IN_PROGRESS") return false;
    if (
      nullableText(overallComment) !==
      nullableText(review.overallComment ?? "")
    ) {
      return true;
    }
    if (
      selectedAiGradingResultId !== review.selectedAiGradingResultId
    ) {
      return true;
    }

    return editableItems.some((editableItem) => {
      const original = itemsById.get(editableItem.assignmentItemId);
      return (
        nullableScore(editableItem.finalScore) !== original?.finalScore ||
        nullableText(editableItem.itemComment) !==
          nullableText(original?.itemComment ?? "")
      );
    });
  }, [
    editableItems,
    itemsById,
    overallComment,
    review,
    selectedAiGradingResultId,
  ]);

  const draftScore = useMemo(() => {
    if (!review) return 0;
    if (review.status !== "IN_PROGRESS" && review.finalScore != null) {
      return review.finalScore;
    }

    return editableItems.reduce((total, item) => {
      const score = nullableScore(item.finalScore);
      return total + (score != null && Number.isFinite(score) ? score : 0);
    }, review.autoScore ?? 0);
  }, [editableItems, review]);

  const allEssayScoresValid = useMemo(() => {
    if (!review) return false;

    return review.items.every((item) => {
      const editableItem = editableItems.find(
        (candidate) =>
          candidate.assignmentItemId === item.assignmentItemId,
      );
      if (!editableItem) return false;

      const score = nullableScore(editableItem.finalScore);
      return (
        score != null &&
        Number.isFinite(score) &&
        score >= 0 &&
        score <= item.maxScore &&
        !hasMoreThanTwoDecimalPlaces(editableItem.finalScore)
      );
    });
  }, [editableItems, review]);

  const isPending = isSaving || pendingLifecycleAction != null;

  const applyReview = (updatedReview: TeacherReviewDetailResponse) => {
    setReview(updatedReview);
    setOverallComment(updatedReview.overallComment ?? "");
    setSelectedAiGradingResultId(
      updatedReview.selectedAiGradingResultId,
    );
    setEditableItems(toEditableItems(updatedReview));
    setReviewNotCreated(false);
    setError("");
  };

  const handleCreate = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      setError("");
      const createdReview =
        await teacherReviewApi.createOrGetReview(attemptId);
      if (!isMountedRef.current) return;
      applyReview(createdReview);
      toast.success("Teacher review draft is ready.");
    } catch (requestError: any) {
      if (isMountedRef.current) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to create teacher review draft.",
          ),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsCreating(false);
      }
    }
  };

  const updateItem = (
    assignmentItemId: number,
    field: "finalScore" | "itemComment",
    value: string,
  ) => {
    setEditableItems((current) =>
      current.map((item) =>
        item.assignmentItemId === assignmentItemId
          ? { ...item, [field]: value }
          : item,
      ),
    );
  };

  const buildItemRequests = (): TeacherReviewItemRequest[] | null => {
    const requests: TeacherReviewItemRequest[] = [];

    for (const item of editableItems) {
      const original = itemsById.get(item.assignmentItemId);
      const score = nullableScore(item.finalScore);
      if (!original) {
        setError("Review item data is out of date. Reopen the submission.");
        return null;
      }
      if (
        score != null &&
        (!Number.isFinite(score) ||
          score < 0 ||
          score > original.maxScore ||
          hasMoreThanTwoDecimalPlaces(item.finalScore))
      ) {
        setError(
          `Question ${original.displayOrderSnapshot} score must be between 0 and ${original.maxScore} with at most 2 decimal places.`,
        );
        return null;
      }

      requests.push({
        assignmentItemId: item.assignmentItemId,
        finalScore: score,
        itemComment: nullableText(item.itemComment),
      });
    }

    return requests;
  };

  const handleSave = async () => {
    if (!review || review.status !== "IN_PROGRESS" || isPending || !isDirty) {
      return;
    }

    const items = buildItemRequests();
    if (!items) return;

    try {
      setIsSaving(true);
      setError("");
      const updatedReview = await teacherReviewApi.updateReview(review.id, {
        version: review.version,
        selectedAiGradingResultId,
        overallComment: nullableText(overallComment),
        items,
      });
      if (!isMountedRef.current) return;
      applyReview(updatedReview);
      toast.success("Teacher review draft saved.");
    } catch (requestError: any) {
      if (isMountedRef.current) {
        setError(
          getErrorMessage(requestError, "Unable to save teacher review draft."),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleFinalize = async () => {
    if (
      !review ||
      review.status !== "IN_PROGRESS" ||
      isPending ||
      isDirty ||
      !allEssayScoresValid
    ) {
      return;
    }

    const confirmed = await confirm({
      title: "Finalize teacher review?",
      message: `Finalize this review with a score of ${formatScore(draftScore)} / ${review.maxScore}? The review cannot be edited after finalization.`,
      confirmText: "Finalize",
      variant: "warning",
    });
    if (!confirmed || !isMountedRef.current) return;

    try {
      setPendingLifecycleAction("finalize");
      setError("");
      const finalizedReview = await teacherReviewApi.finalizeReview(review.id);
      if (!isMountedRef.current) return;
      applyReview(finalizedReview);
      toast.success("Teacher review finalized.");
    } catch (requestError: any) {
      if (isMountedRef.current) {
        const message = getErrorMessage(
          requestError,
          "Unable to finalize teacher review.",
        );
        setError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setPendingLifecycleAction(null);
      }
    }
  };

  const handleRelease = async () => {
    if (
      !review ||
      review.status !== "FINALIZED" ||
      isPending
    ) {
      return;
    }

    const confirmed = await confirm({
      title: "Release result to student?",
      message: `Release the final score of ${review.finalScore ?? "-"} / ${review.maxScore}? The student will be able to view this result.`,
      confirmText: "Release",
      variant: "emerald",
    });
    if (!confirmed || !isMountedRef.current) return;

    try {
      setPendingLifecycleAction("release");
      setError("");
      const releasedReview = await teacherReviewApi.releaseReview(review.id);
      if (!isMountedRef.current) return;
      applyReview(releasedReview);
      toast.success("Teacher review released to the student.");
    } catch (requestError: any) {
      if (isMountedRef.current) {
        const message = getErrorMessage(
          requestError,
          "Unable to release teacher review.",
        );
        setError(message);
        toast.error(message);
      }
    } finally {
      if (isMountedRef.current) {
        setPendingLifecycleAction(null);
      }
    }
  };

  if (!canReview) {
    return (
      <section className="border-t border-surface-border pt-6">
        <h3 className="text-base font-semibold text-gray-900">
          Teacher Review
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Teacher review becomes available after the student submits this
          attempt.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="border-t border-surface-border pt-6">
        <LoadingSkeleton count={2} height="h-16" />
      </section>
    );
  }

  if (reviewNotCreated) {
    return (
      <section className="border-t border-surface-border pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Teacher Review
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a review draft to score Essay responses and add feedback.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Start Review"}
          </Button>
        </div>
        {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      </section>
    );
  }

  if (!review) {
    return (
      <section className="border-t border-surface-border pt-6">
        <h3 className="text-base font-semibold text-gray-900">
          Teacher Review
        </h3>
        <div className="mt-3">
          <ErrorBanner message={error || "Teacher review is unavailable."} />
        </div>
      </section>
    );
  }

  const isEditable = review.status === "IN_PROGRESS";

  return (
    <section
      className="space-y-5 border-t border-surface-border pt-6"
      aria-busy={isPending}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Teacher Review
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Score Essay responses and prepare student-facing feedback.
          </p>
        </div>
        <Badge variant={statusVariant[review.status]}>
          {statusLabel[review.status]}
        </Badge>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 border-y border-surface-border py-4 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            Auto Score
          </div>
          <div className="mt-1 font-medium text-gray-900">
            {review.autoScore ?? 0}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            {isEditable ? "Draft Score Preview" : "Final Score"}
          </div>
          <div className="mt-1 font-medium text-gray-900">
            {formatScore(draftScore)} / {review.maxScore}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            Essay Items
          </div>
          <div className="mt-1 font-medium text-gray-900">
            {review.items.length}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-b border-surface-border pb-5">
        <div>
          <h4 className="text-sm font-medium text-gray-900">AI Reference</h4>
          <p className="mt-1 text-sm text-gray-500">
            Selecting a result records the recommendation used during review.
            It never copies AI scores into teacher scores.
          </p>
        </div>

        <label
          htmlFor={`teacher-review-ai-result-${review.id}`}
          className="block text-xs font-medium text-gray-500"
        >
          Kết quả chấm AI đã chọn
        </label>
        <select
          id={`teacher-review-ai-result-${review.id}`}
          value={selectedAiGradingResultId ?? ""}
          onChange={(event) =>
            setSelectedAiGradingResultId(
              event.target.value ? Number(event.target.value) : null,
            )
          }
          disabled={!isEditable || isPending}
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary disabled:bg-surface-page disabled:text-gray-500"
        >
          <option value="">Không chọn kết quả AI</option>
          {latestAiResult && (
            <option value={latestAiResult.id}>
              Kết quả AI mới nhất #{latestAiResult.id}
            </option>
          )}
          {review.selectedAiGradingResultId != null &&
            review.selectedAiGradingResultId !== latestAiResult?.id && (
              <option value={review.selectedAiGradingResultId}>
                Kết quả AI đang chọn #
                {review.selectedAiGradingResultId}
              </option>
            )}
          {selectedAiGradingResultId != null &&
            selectedAiGradingResultId !== latestAiResult?.id &&
            selectedAiGradingResultId !==
              review.selectedAiGradingResultId && (
              <option value={selectedAiGradingResultId}>
                Kết quả AI chưa lưu #{selectedAiGradingResultId}
              </option>
            )}
        </select>

        {latestAiResult ? (
          <div className="text-sm text-gray-600">
            Đề xuất mới nhất: {latestAiResult.aiScore ?? "-"} /{" "}
            {latestAiResult.maxScore ?? "-"}
            {latestAiResult.confidence != null &&
              ` - Độ tin cậy ${Math.round(latestAiResult.confidence * 100)}%`}
          </div>
        ) : selectedAiGradingResultId != null ? (
          <div className="text-sm text-gray-600">
            Bài đánh giá tham chiếu kết quả AI #{selectedAiGradingResultId}.
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Hiện chưa có kết quả chấm bằng AI hoàn thành.
          </div>
        )}

        {latestAiResult &&
          selectedAiGradingResultId != null &&
          selectedAiGradingResultId !== latestAiResult.id && (
            <div className="text-sm text-amber-700">
              Bài đánh giá đang giữ kết quả #{selectedAiGradingResultId}; bảng AI
              hiện hiển thị kết quả mới nhất #{latestAiResult.id}.
            </div>
          )}
      </div>

      <div>
        <label
          htmlFor={`teacher-review-overall-comment-${review.id}`}
          className="block text-sm font-medium text-gray-700"
        >
          Nhận xét chung
        </label>
        <textarea
          id={`teacher-review-overall-comment-${review.id}`}
          rows={3}
          value={overallComment}
          onChange={(event) => setOverallComment(event.target.value)}
          disabled={!isEditable || isPending}
          placeholder="Nhận xét gửi cho học viên..."
          className="mt-2 w-full resize-y rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary disabled:bg-surface-page disabled:text-gray-500"
        />
      </div>

      {review.items.length === 0 ? (
        <div className="border-y border-surface-border py-4 text-sm text-gray-500">
          Bài nộp này không có câu hỏi tự luận. Điểm số cuối cùng sẽ sử dụng điểm
          tự động chấm.
        </div>
      ) : (
        <div className="space-y-4">
          {review.items.map((item) => {
            const editableItem = editableItems.find(
              (candidate) =>
                candidate.assignmentItemId === item.assignmentItemId,
            );
            if (!editableItem) return null;

            return (
              <div
                key={item.assignmentItemId}
                className="border-b border-surface-border pb-4 last:border-b-0"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-400">
                      Tự luận {item.displayOrderSnapshot}
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {item.questionTitleSnapshot ||
                        `Câu hỏi ${item.displayOrderSnapshot}`}
                    </div>
                  </div>
                  <div className="w-full sm:w-36">
                    <label
                      htmlFor={`teacher-review-score-${item.assignmentItemId}`}
                      className="block text-xs font-medium text-gray-500"
                    >
                      Điểm / {item.maxScore}
                    </label>
                    <input
                      id={`teacher-review-score-${item.assignmentItemId}`}
                      type="number"
                      min="0"
                      max={item.maxScore}
                      step="0.01"
                      value={editableItem.finalScore}
                      onChange={(event) =>
                        updateItem(
                          item.assignmentItemId,
                          "finalScore",
                          event.target.value,
                        )
                      }
                      disabled={!isEditable || isPending}
                      className="mt-1 w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary disabled:bg-surface-page disabled:text-gray-500"
                    />
                  </div>
                </div>

                <label
                  htmlFor={`teacher-review-comment-${item.assignmentItemId}`}
                  className="mt-3 block text-xs font-medium text-gray-500"
                >
                  Nhận xét của giáo viên
                </label>
                <textarea
                  id={`teacher-review-comment-${item.assignmentItemId}`}
                  rows={2}
                  value={editableItem.itemComment}
                  onChange={(event) =>
                    updateItem(
                      item.assignmentItemId,
                      "itemComment",
                      event.target.value,
                    )
                  }
                  disabled={!isEditable || isPending}
                  placeholder="Nhận xét cho câu hỏi tự luận này..."
                  className="mt-1 w-full resize-y rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary disabled:bg-surface-page disabled:text-gray-500"
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-surface-border pt-4">
        {review.status === "IN_PROGRESS" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500" aria-live="polite">
              {isDirty
                ? "Bạn có thay đổi chưa lưu. Vui lòng lưu bản nháp trước khi hoàn tất."
                : !allEssayScoresValid
                  ? "Cần nhập điểm hợp lệ cho tất cả câu tự luận trước khi hoàn tất."
                  : "Đã lưu tất cả thay đổi. Đánh giá sẵn sàng để hoàn tất."}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSave}
                disabled={!isDirty || isPending}
              >
                {isSaving ? "Đang lưu..." : "Lưu bản nháp"}
              </Button>
              <Button
                type="button"
                onClick={handleFinalize}
                disabled={
                  isPending || isDirty || !allEssayScoresValid
                }
              >
                {pendingLifecycleAction === "finalize"
                  ? "Đang hoàn tất..."
                  : "Hoàn tất"}
              </Button>
            </div>
          </div>
        )}

        {review.status === "FINALIZED" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Đã hoàn tất lúc {formatDateTime(review.finalizedAt)}. Công bố kết
              quả khi sẵn sàng cho học viên.
            </div>
            <Button
              type="button"
              onClick={handleRelease}
              disabled={isPending}
            >
              {pendingLifecycleAction === "release"
                ? "Đang công bố..."
                : "Công bố"}
            </Button>
          </div>
        )}

        {review.status === "RELEASED" && (
          <div className="text-sm text-gray-500">
            Đã công bố cho học viên lúc {formatDateTime(review.releasedAt)}.
            Đánh giá này ở chế độ chỉ đọc.
          </div>
        )}
      </div>
    </section>
  );
};
