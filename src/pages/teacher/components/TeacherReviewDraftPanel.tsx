import { useEffect, useMemo, useRef, useState } from "react";
import { RichTextRenderer } from "../../../components/editor";
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
  SubmissionAnswerResponse,
  SubmissionAttemptItemResponse,
} from "../../../types/submission";
import type {
  TeacherReviewDetailResponse,
  TeacherReviewItemRequest,
  TeacherReviewStatus,
} from "../../../types/teacherReview";
import { formatDateTime } from "../../../utils/dateTime";

const statusLabel: Record<TeacherReviewStatus, string> = {
  IN_PROGRESS: "Đang chấm",
  FINALIZED: "Đã hoàn tất",
  RELEASED: "Đã công bố",
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
  questionItems: SubmissionAttemptItemResponse[];
  submissionAnswers: SubmissionAnswerResponse[];
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
  questionItems,
  submissionAnswers,
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

    const applyLoadedReview = (loadedReview: TeacherReviewDetailResponse) => {
      setReview(loadedReview);
      setOverallComment(loadedReview.overallComment ?? "");
      setSelectedAiGradingResultId(loadedReview.selectedAiGradingResultId);
      setEditableItems(toEditableItems(loadedReview));
      setReviewNotCreated(false);
      setError("");
    };

    const createDraft = async () => {
      setIsCreating(true);
      try {
        const createdReview = await teacherReviewApi.createOrGetReview(attemptId);
        if (!cancelled) {
          applyLoadedReview(createdReview);
        }
      } catch (createError: any) {
        if (!cancelled) {
          setReviewNotCreated(true);
          setError(
            getErrorMessage(createError, "Không thể tạo phiếu chấm."),
          );
        }
      } finally {
        if (!cancelled) {
          setIsCreating(false);
        }
      }
    };

    const loadReview = async () => {
      try {
        const loadedReview = await teacherReviewApi.getReview(attemptId);
        if (!cancelled) {
          applyLoadedReview(loadedReview);
        }
      } catch (requestError: any) {
        if (cancelled) return;
        if (requestError?.response?.status === 404) {
          await createDraft();
          return;
        }
        setError(getErrorMessage(requestError, "Không thể tải phiếu chấm."));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void loadReview;

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
    void createDraft().finally(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

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

  const questionItemsById = useMemo(
    () => new Map(questionItems.map((item) => [item.assignmentItemId, item])),
    [questionItems],
  );

  const answersByItemId = useMemo(
    () =>
      new Map(
        submissionAnswers.map((answer) => [answer.assignmentItemId, answer]),
      ),
    [submissionAnswers],
  );

  const aiSuggestionByItemId = useMemo(
    () =>
      new Map(
        (latestAiResult?.itemResults ?? []).map((item) => [
          item.assignmentItemId,
          item,
        ]),
      ),
    [latestAiResult],
  );

  const isDirty = useMemo(() => {
    if (!review || review.status !== "IN_PROGRESS") return false;

    if (nullableText(overallComment) !== nullableText(review.overallComment ?? "")) {
      return true;
    }

    if (selectedAiGradingResultId !== review.selectedAiGradingResultId) {
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
        (candidate) => candidate.assignmentItemId === item.assignmentItemId,
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
    setSelectedAiGradingResultId(updatedReview.selectedAiGradingResultId);
    setEditableItems(toEditableItems(updatedReview));
    setReviewNotCreated(false);
    setError("");
  };

  const handleCreate = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      setError("");
      const createdReview = await teacherReviewApi.createOrGetReview(attemptId);
      if (!isMountedRef.current) return;
      applyReview(createdReview);
      toast.success("Đã tạo phiếu chấm.");
    } catch (requestError: any) {
      if (isMountedRef.current) {
        setError(
          getErrorMessage(requestError, "Không thể tạo phiếu chấm."),
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
        setError("Dữ liệu phiếu chấm đã thay đổi. Hãy mở lại bài nộp.");
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
          `Điểm câu ${original.displayOrderSnapshot} phải trong khoảng 0 đến ${original.maxScore} và tối đa 2 chữ số thập phân.`,
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
      toast.success("Đã lưu phiếu chấm.");
    } catch (requestError: any) {
      if (isMountedRef.current) {
        setError(getErrorMessage(requestError, "Không thể lưu phiếu chấm."));
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
      title: "Hoàn tất chấm bài?",
      message: `Hoàn tất phiếu chấm với số điểm ${formatScore(draftScore)} / ${review.maxScore}? Sau khi hoàn tất bạn sẽ không sửa tiếp được.`,
      confirmText: "Hoàn tất",
      variant: "warning",
    });
    if (!confirmed || !isMountedRef.current) return;

    try {
      setPendingLifecycleAction("finalize");
      setError("");
      const finalizedReview = await teacherReviewApi.finalizeReview(review.id);
      if (!isMountedRef.current) return;
      applyReview(finalizedReview);
      toast.success("Đã hoàn tất chấm bài.");
    } catch (requestError: any) {
      if (isMountedRef.current) {
        const message = getErrorMessage(
          requestError,
          "Không thể hoàn tất phiếu chấm.",
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
    if (!review || review.status !== "FINALIZED" || isPending) {
      return;
    }

    const confirmed = await confirm({
      title: "Công bố kết quả cho học sinh?",
      message: `Công bố số điểm ${review.finalScore ?? "-"} / ${review.maxScore}? Học sinh sẽ xem được kết quả này ngay sau đó.`,
      confirmText: "Công bố",
      variant: "emerald",
    });
    if (!confirmed || !isMountedRef.current) return;

    try {
      setPendingLifecycleAction("release");
      setError("");
      const releasedReview = await teacherReviewApi.releaseReview(review.id);
      if (!isMountedRef.current) return;
      applyReview(releasedReview);
      toast.success("Đã công bố kết quả cho học sinh.");
    } catch (requestError: any) {
      if (isMountedRef.current) {
        const message = getErrorMessage(
          requestError,
          "Không thể công bố kết quả.",
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
        <h3 className="text-base font-semibold text-gray-900">Phiếu chấm</h3>
        <p className="mt-2 text-sm text-gray-500">
          Phiếu chấm sẽ xuất hiện sau khi học sinh nộp bài.
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
            <h3 className="text-base font-semibold text-gray-900">Phiếu chấm</h3>
            <p className="mt-1 text-sm text-gray-500">
              Hệ thống chưa tạo được phiếu chấm tự động. Bạn có thể bấm tạo lại.
            </p>
          </div>
          <Button type="button" onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Đang tạo..." : "Tạo phiếu chấm"}
          </Button>
        </div>
        {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      </section>
    );
  }

  if (!review) {
    return (
      <section className="border-t border-surface-border pt-6">
        <h3 className="text-base font-semibold text-gray-900">Phiếu chấm</h3>
        <div className="mt-3">
          <ErrorBanner message={error || "Không thể mở phiếu chấm."} />
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
          <h3 className="text-base font-semibold text-gray-900">Phiếu chấm</h3>
          <p className="mt-1 text-sm text-gray-500">
            Chấm từng câu tự luận ngay bên dưới câu trả lời của học sinh.
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
            Điểm tự động
          </div>
          <div className="mt-1 font-medium text-gray-900">
            {review.autoScore ?? 0}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            {isEditable ? "Điểm tạm tính" : "Điểm cuối cùng"}
          </div>
          <div className="mt-1 font-medium text-gray-900">
            {formatScore(draftScore)} / {review.maxScore}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            Câu tự luận
          </div>
          <div className="mt-1 font-medium text-gray-900">
            {review.items.length}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-card border border-surface-border bg-surface-page p-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Tham khảo từ AI</h4>
          <p className="mt-1 text-sm text-gray-500">
            Bạn có thể chọn một kết quả AI để tham khảo trong lúc chấm. Điểm AI
            không tự động ghi đè điểm giáo viên.
          </p>
        </div>

        <select
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
                Kết quả AI đang chọn #{review.selectedAiGradingResultId}
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
        ) : (
          <div className="text-sm text-gray-500">
            Chưa có kết quả chấm bằng AI hoàn thành.
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
          placeholder="Nhận xét gửi cho học sinh..."
          className="mt-2 w-full resize-y rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary disabled:bg-surface-page disabled:text-gray-500"
        />
      </div>

      {review.items.length === 0 ? (
        <div className="border-y border-surface-border py-4 text-sm text-gray-500">
          Bài nộp này không có câu tự luận. Điểm cuối cùng sẽ dựa trên điểm tự
          động.
        </div>
      ) : (
        <div className="space-y-4">
          {review.items.map((item) => {
            const editableItem = editableItems.find(
              (candidate) => candidate.assignmentItemId === item.assignmentItemId,
            );
            const questionItem = questionItemsById.get(item.assignmentItemId);
            const submissionAnswer = answersByItemId.get(item.assignmentItemId);
            const aiSuggestion = aiSuggestionByItemId.get(item.assignmentItemId);
            if (!editableItem) return null;

            return (
              <div
                key={item.assignmentItemId}
                className="rounded-card border border-surface-border bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-400">
                      Tự luận {item.displayOrderSnapshot}
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {item.questionTitleSnapshot ||
                        `Câu hỏi ${item.displayOrderSnapshot}`}
                    </div>
                  </div>
                  <div className="w-full sm:w-40">
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

                {questionItem && (
                  <div className="mt-3 rounded-input border border-surface-border bg-surface-page px-3 py-3">
                    <div className="text-xs font-medium uppercase text-gray-400">
                      Câu hỏi
                    </div>
                    <div className="mt-2 text-sm text-gray-900">
                      <RichTextRenderer value={questionItem.content} />
                    </div>
                  </div>
                )}

                <div className="mt-3 rounded-input border border-surface-border bg-white px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-400">
                    Câu trả lời của học sinh
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {submissionAnswer?.answerText || "Học sinh chưa nhập câu trả lời."}
                  </div>
                </div>

                {aiSuggestion && (
                  <div className="mt-3 rounded-input border border-blue-100 bg-blue-50/70 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-medium uppercase text-blue-700">
                        Gợi ý từ AI
                      </div>
                      <div className="text-xs font-semibold text-blue-700">
                        {aiSuggestion.aiScore ?? "-"} /{" "}
                        {aiSuggestion.maxScore ?? "-"}
                      </div>
                    </div>
                    {aiSuggestion.feedback && (
                      <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {aiSuggestion.feedback}
                      </div>
                    )}
                  </div>
                )}

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
                  placeholder="Nhận xét cho câu tự luận này..."
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
                ? "Bạn có thay đổi chưa lưu. Hãy lưu trước khi hoàn tất."
                : !allEssayScoresValid
                  ? "Cần nhập điểm hợp lệ cho tất cả câu tự luận trước khi hoàn tất."
                  : "Tất cả thay đổi đã được lưu. Bạn có thể hoàn tất phiếu chấm."}
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
                disabled={isPending || isDirty || !allEssayScoresValid}
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
              quả khi sẵn sàng cho học sinh.
            </div>
            <Button type="button" onClick={handleRelease} disabled={isPending}>
              {pendingLifecycleAction === "release"
                ? "Đang công bố..."
                : "Công bố"}
            </Button>
          </div>
        )}

        {review.status === "RELEASED" && (
          <div className="text-sm text-gray-500">
            Đã công bố cho học sinh lúc {formatDateTime(review.releasedAt)}.
            Phiếu chấm này hiện chỉ đọc.
          </div>
        )}
      </div>
    </section>
  );
};
