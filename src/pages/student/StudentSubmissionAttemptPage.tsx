import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { submissionApi } from "../../api/submissionApi";
import { Button } from "../../components/ui/Button";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
} from "../../components/ui/SharedComponents";
import type { AssessmentType } from "../../types/assessmentBuilder";
import type {
  StudentAttemptDetailResponse,
  SubmissionAnswerRequest,
  SubmissionAttemptStatus,
  SubmissionAttemptItemResponse,
} from "../../types/submission";
import { formatDateTime } from "../../utils/dateTime";
import { htmlToText } from "../../utils/text";

const typeLabel: Record<AssessmentType, string> = {
  QUIZ: "Trắc nghiệm",
  HOMEWORK: "Bài tập về nhà",
  EXAM: "Bài kiểm tra",
};

const statusLabel: Record<SubmissionAttemptStatus, string> = {
  IN_PROGRESS: "Đang làm bài",
  SUBMITTED: "Đã nộp",
  AUTO_SUBMITTED: "Tự động nộp",
};

type EditableSubmissionAnswer = {
  assignmentItemId: number;
  answerText: string;
  selectedOptionIds: number[];
};

const toEditableAnswers = (
  attempt: StudentAttemptDetailResponse,
): EditableSubmissionAnswer[] => {
  return attempt.items.map((item) => {
    const answer = attempt.answers.find(
      (current) => current.assignmentItemId === item.assignmentItemId,
    );
    return {
      assignmentItemId: item.assignmentItemId,
      answerText: answer?.answerText ?? "",
      selectedOptionIds: answer?.selectedOptionIds ?? [],
    };
  });
};

const normalizeAnswers = (answers: SubmissionAnswerRequest[]) => {
  return JSON.stringify(
    answers
      .map((answer) => ({
        assignmentItemId: answer.assignmentItemId,
        answerText: answer.answerText?.trim() || null,
        selectedOptionIds: (answer.selectedOptionIds ?? [])
          .slice()
          .sort((a, b) => a - b),
      }))
      .sort((a, b) => a.assignmentItemId - b.assignmentItemId),
  );
};

const StudentSubmissionAttemptPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<StudentAttemptDetailResponse | null>(
    null,
  );
  const [editableAnswers, setEditableAnswers] = useState<
    EditableSubmissionAnswer[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadAttempt = useCallback(async () => {
    const id = Number(attemptId);
    if (!attemptId || Number.isNaN(id)) {
      setError("Lượt làm bài không hợp lệ.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const loadedAttempt = await submissionApi.getAttemptDetail(id);
      setAttempt(loadedAttempt);
      setEditableAnswers(toEditableAnswers(loadedAttempt));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải lượt làm bài.");
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  const answersByItemId = useMemo(() => {
    return new Map(
      editableAnswers.map((answer) => [answer.assignmentItemId, answer]),
    );
  }, [editableAnswers]);

  const savedAnswersByItemId = useMemo(() => {
    if (!attempt) return new Map();
    return new Map(
      attempt.answers.map((answer) => [answer.assignmentItemId, answer]),
    );
  }, [attempt]);

  const isEditable = attempt?.status === "IN_PROGRESS";

  const updateAnswer = (
    assignmentItemId: number,
    updater: (answer: EditableSubmissionAnswer) => EditableSubmissionAnswer,
  ) => {
    setEditableAnswers((current) =>
      current.map((answer) =>
        answer.assignmentItemId === assignmentItemId ? updater(answer) : answer,
      ),
    );
  };

  const updateEssayAnswer = (assignmentItemId: number, answerText: string) => {
    updateAnswer(assignmentItemId, (answer) => ({
      ...answer,
      answerText,
      selectedOptionIds: [],
    }));
  };

  const toggleOption = (assignmentItemId: number, optionId: number) => {
    updateAnswer(assignmentItemId, (answer) => {
      const isSelected = answer.selectedOptionIds.includes(optionId);
      return {
        ...answer,
        answerText: "",
        selectedOptionIds: isSelected
          ? answer.selectedOptionIds.filter((current) => current !== optionId)
          : [...answer.selectedOptionIds, optionId],
      };
    });
  };

  const currentAnswerRequests = useMemo<SubmissionAnswerRequest[]>(() => {
    if (!attempt) return [];

    const requests: SubmissionAnswerRequest[] = [];
    attempt.items.forEach((item) => {
      const answer = answersByItemId.get(item.assignmentItemId);
      if (!answer) return;

      if (item.questionType === "MULTIPLE_CHOICE") {
        if (answer.selectedOptionIds.length > 0) {
          requests.push({
            assignmentItemId: item.assignmentItemId,
            selectedOptionIds: answer.selectedOptionIds,
          });
        }
        return;
      }

      const answerText = answer.answerText.trim();
      if (answerText) {
        requests.push({
          assignmentItemId: item.assignmentItemId,
          answerText,
        });
      }
    });

    return requests;
  }, [answersByItemId, attempt]);

  const savedAnswerRequests = useMemo<SubmissionAnswerRequest[]>(() => {
    if (!attempt) return [];

    return attempt.answers.map((answer) => ({
      assignmentItemId: answer.assignmentItemId,
      answerText: answer.answerText,
      selectedOptionIds: answer.selectedOptionIds,
    }));
  }, [attempt]);

  const isDirty = useMemo(() => {
    return (
      normalizeAnswers(currentAnswerRequests) !==
      normalizeAnswers(savedAnswerRequests)
    );
  }, [currentAnswerRequests, savedAnswerRequests]);

  const persistAnswers = async () => {
    if (!attempt) return null;
    const updatedAttempt = await submissionApi.saveAnswers(attempt.id, {
      answers: currentAnswerRequests,
    });
    setAttempt(updatedAttempt);
    setEditableAnswers(toEditableAnswers(updatedAttempt));
    return updatedAttempt;
  };

  const saveAnswers = async () => {
    if (!attempt || !isEditable || isSaving || isSubmitting || !isDirty) return;

    try {
      setIsSaving(true);
      setError("");
      await persistAnswers();
      toast.success("Đã lưu câu trả lời.");
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Không thể lưu câu trả lời.";
      setError(message);
      toast.error(message);
      return;
    } finally {
      setIsSaving(false);
    }
  };

  const submitAttempt = async () => {
    if (!attempt || !isEditable || isSaving || isSubmitting) return;

    const confirmed = await confirm({
      title: "Nộp bài?",
      message: "Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn không thể chỉnh sửa câu trả lời nữa.",
      confirmText: "Nộp bài",
    });

    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setError("");
      const savedAttempt = await persistAnswers();
      if (!savedAttempt) return;
      const submittedAttempt = await submissionApi.submitAttempt(
        savedAttempt.id,
      );
      setAttempt(submittedAttempt);
      setEditableAnswers(toEditableAnswers(submittedAttempt));
      toast.success("Đã nộp bài thành công.");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Không thể nộp bài.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAnswerEditor = (item: SubmissionAttemptItemResponse) => {
    const answer = answersByItemId.get(item.assignmentItemId);

    if (item.questionType === "MULTIPLE_CHOICE") {
      return (
        <div className="mt-4 space-y-2">
          {item.options.map((option) => {
            const checked =
              answer?.selectedOptionIds.includes(
                option.assignmentItemOptionId,
              ) ?? false;
            return (
              <label
                key={option.assignmentItemOptionId}
                className="flex gap-3 rounded-input border border-surface-border px-3 py-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={checked}
                  disabled={!isEditable || isSaving || isSubmitting}
                  onChange={() =>
                    toggleOption(
                      item.assignmentItemId,
                      option.assignmentItemOptionId,
                    )
                  }
                />
                <span className="break-words">
                  {htmlToText(option.content) || "-"}
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <textarea
        value={answer?.answerText ?? ""}
        disabled={!isEditable || isSaving || isSubmitting}
        onChange={(event) =>
          updateEssayAnswer(item.assignmentItemId, event.target.value)
        }
        rows={6}
        className="mt-4 w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary disabled:bg-surface-page disabled:text-gray-500"
        placeholder="Nhập câu trả lời của bạn..."
      />
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Lượt làm bài"
        description="Trả lời câu hỏi và nộp bài tập được giao."
      >
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/student/assignments")}
        >
          Quay lại
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-16" />
      ) : attempt ? (
        <div className="rounded-card border border-surface-border bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {attempt.assignmentTitleSnapshot}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Lượt làm bài {attempt.attemptNumber}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{typeLabel[attempt.assignmentTypeSnapshot]}</Badge>
              <Badge>{statusLabel[attempt.status]}</Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-xs font-medium uppercase text-gray-400">
                Thời gian bắt đầu
              </div>
              <div className="mt-1 text-gray-900">
                {formatDateTime(attempt.startedAt)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-gray-400">
                Lưu lần cuối
              </div>
              <div className="mt-1 text-gray-900">
                {formatDateTime(attempt.lastSavedAt)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-gray-400">
                Thời gian nộp
              </div>
              <div className="mt-1 text-gray-900">
                {formatDateTime(attempt.submittedAt)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-gray-400">
                Điểm số
              </div>
              <div className="mt-1 text-gray-900">
                {attempt.status === "IN_PROGRESS"
                  ? "-"
                  : `${attempt.autoScore ?? "-"} / ${attempt.maxScore ?? "-"}`}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-surface-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              {isEditable
                ? isDirty
                  ? "Bạn có thay đổi chưa lưu."
                  : "Tất cả câu trả lời đã được lưu."
                : "Lượt làm bài này ở chế độ chỉ đọc."}
            </div>
            {isEditable && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={saveAnswers}
                  disabled={isSubmitting || !isDirty}
                  isLoading={isSaving}
                >
                  Lưu câu trả lời
                </Button>
                <Button
                  type="button"
                  onClick={submitAttempt}
                  disabled={isSaving}
                  isLoading={isSubmitting}
                >
                  Nộp bài
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {attempt.items.map((item) => {
              const savedAnswer = savedAnswersByItemId.get(
                item.assignmentItemId,
              );
              return (
                <div
                  key={item.assignmentItemId}
                  className="rounded-card border border-surface-border bg-white p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-medium uppercase text-gray-400">
                        Câu hỏi {item.displayOrder}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">
                        {htmlToText(item.content) || "-"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>
                        {item.questionType === "MULTIPLE_CHOICE"
                          ? "Trắc nghiệm"
                          : "Tự luận"}
                      </Badge>
                      <Badge>{item.points ?? 0} điểm</Badge>
                    </div>
                  </div>

                  {renderAnswerEditor(item)}

                  {attempt.status !== "IN_PROGRESS" && savedAnswer && (
                    <div className="mt-3 text-xs text-gray-500">
                      Điểm số: {savedAnswer.autoScore ?? "-"} /{" "}
                      {savedAnswer.maxScore ?? "-"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentSubmissionAttemptPage;
