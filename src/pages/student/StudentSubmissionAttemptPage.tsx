import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { submissionApi } from "../../api/submissionApi";
import { Button } from "../../components/ui/Button";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
} from "../../components/ui/SharedComponents";
import type { AssessmentType, PlaybackMode } from "../../types/assessmentBuilder";
import type { FileMetadata } from "../../types/file";
import type {
  StudentAttemptDetailResponse,
  StudentAttemptItemResponse,
  SubmissionAnswerRequest,
  SubmissionAttemptStatus,
} from "../../types/submission";
import { formatDateTime } from "../../utils/dateTime";
import { htmlToText } from "../../utils/text";
import { RichTextRenderer, type EditorDocument } from "../../components/editor";

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

const hasAnswer = (answer: EditableSubmissionAnswer | undefined) => {
  if (!answer) return false;
  return answer.selectedOptionIds.length > 0 || answer.answerText.trim().length > 0;
};

const formatSavedTime = (value: Date) => {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
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
      selectedOptionIds:
        item.questionType === "MULTIPLE_CHOICE"
          ? (answer?.selectedOptionIds ?? []).slice(0, 1)
          : (answer?.selectedOptionIds ?? []),
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

const stripQuestionAudio = (document: EditorDocument): EditorDocument => {
  const stripNode = (node: any): any | null => {
    if (node?.type === "audio") return null;
    const content = Array.isArray(node?.content)
      ? node.content.map(stripNode).filter(Boolean)
      : undefined;
    return content ? { ...node, content } : { ...node };
  };

  const stripped = stripNode(document) ?? { type: "doc", content: [] };
  if (stripped.type === "doc" && (!stripped.content || stripped.content.length === 0)) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  return stripped;
};

const ListeningAudioPlayer = ({
  audioFile,
  playbackMode,
  isActive,
}: {
  audioFile: FileMetadata | null;
  playbackMode: PlaybackMode;
  isActive: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isCleaningUpRef = useRef(false);
  const maxTimeRef = useRef(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioId = audioFile?.id;
  const audioUrl = audioFile?.url;

  useEffect(() => {
    const audio = audioRef.current;
    isCleaningUpRef.current = false;
    maxTimeRef.current = 0;
    setAutoplayBlocked(false);
    setHasStarted(false);
    setHasEnded(false);
    setAudioError("");

    if (!audio || !audioUrl || playbackMode !== "EXAM" || !isActive) {
      return;
    }

    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => setHasStarted(true))
        .catch(() => setAutoplayBlocked(true));
    }

    return () => {
      isCleaningUpRef.current = true;
      audio.pause();
    };
  }, [audioId, audioUrl, isActive, playbackMode]);

  if (!audioFile) {
    return null;
  }

  if (playbackMode === "PRACTICE") {
    return (
      <div className="mt-6 rounded-card border border-surface-border bg-surface-page p-4">
        <div className="mb-2 text-sm font-medium text-gray-900">
          Audio nghe chung
        </div>
        <audio controls preload="metadata" src={audioFile.url} className="w-full">
          Trình duyệt không hỗ trợ audio.
        </audio>
      </div>
    );
  }

  const startExamAudio = async () => {
    const audio = audioRef.current;
    if (!audio || hasStarted || hasEnded || !isActive) return;
    try {
      setAutoplayBlocked(false);
      setAudioError("");
      audio.currentTime = 0;
      await audio.play();
      setHasStarted(true);
    } catch {
      setAutoplayBlocked(true);
    }
  };

  return (
    <div className="mt-6 rounded-card border border-surface-border bg-surface-page p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900">
            Audio nghe chung
          </div>
          <div className="truncate text-xs text-gray-500">
            {audioFile.originalName}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {audioError
            ? audioError
            : hasEnded
              ? "Audio đã phát xong."
              : hasStarted
                ? "Audio đang phát."
                : isActive
                  ? "Sẵn sàng phát audio."
                  : "Audio chỉ phát trong lượt làm bài."}
        </div>
      </div>

      {autoplayBlocked && isActive && !hasStarted && !hasEnded && (
        <div className="mt-3">
          <Button type="button" onClick={startExamAudio}>
            Nhấn để bắt đầu phát
          </Button>
        </div>
      )}

      <audio
        ref={audioRef}
        preload="auto"
        src={audioFile.url}
        onTimeUpdate={(event) => {
          maxTimeRef.current = Math.max(
            maxTimeRef.current,
            event.currentTarget.currentTime,
          );
        }}
        onSeeking={(event) => {
          const audio = event.currentTarget;
          if (!hasStarted || hasEnded) return;
          if (Math.abs(audio.currentTime - maxTimeRef.current) > 0.5) {
            audio.currentTime = maxTimeRef.current;
          }
        }}
        onPause={(event) => {
          if (
            isCleaningUpRef.current ||
            !isActive ||
            hasEnded ||
            !hasStarted ||
            audioError
          ) {
            return;
          }
          void event.currentTarget.play().catch(() => setAutoplayBlocked(true));
        }}
        onEnded={() => {
          setHasEnded(true);
          setAutoplayBlocked(false);
        }}
        onError={() => setAudioError("Không thể phát audio.")}
      />
    </div>
  );
};

const StudentSubmissionAttemptPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const loadSequenceRef = useRef(0);
  const historyIndexRef = useRef<number | null>(null);
  const ignoreHistoryRestoreRef = useRef(false);
  const submitFlowRef = useRef(false);
  const questionHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const shouldFocusQuestionRef = useRef(false);
  const [attempt, setAttempt] = useState<StudentAttemptDetailResponse | null>(
    null,
  );
  const [editableAnswers, setEditableAnswers] = useState<
    EditableSubmissionAnswer[]
  >([]);
  const [currentAssignmentItemId, setCurrentAssignmentItemId] = useState<
    number | null
  >(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitConfirming, setIsSubmitConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      loadSequenceRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === "number") {
      historyIndexRef.current = historyIndex;
    }
  }, []);

  const loadAttempt = useCallback(async () => {
    const sequence = loadSequenceRef.current + 1;
    loadSequenceRef.current = sequence;
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
      if (loadSequenceRef.current !== sequence) return;
      setAttempt(loadedAttempt);
      const loadedAnswers = toEditableAnswers(loadedAttempt);
      setEditableAnswers(loadedAnswers);
      setLastSavedAt(
        loadedAttempt.lastSavedAt ? new Date(loadedAttempt.lastSavedAt) : null,
      );
      setCurrentAssignmentItemId(
        loadedAttempt.items.find((item) => {
          const answer = loadedAnswers.find(
            (current) => current.assignmentItemId === item.assignmentItemId,
          );
          return !hasAnswer(answer);
        })?.assignmentItemId ?? loadedAttempt.items[0]?.assignmentItemId ?? null,
      );
    } catch (err: any) {
      if (loadSequenceRef.current !== sequence) return;
      setError(err?.response?.data?.message ?? "Không thể tải lượt làm bài.");
    } finally {
      if (loadSequenceRef.current === sequence) {
        setIsLoading(false);
      }
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

  const currentQuestionIndex = attempt
    ? attempt.items.findIndex(
        (item) => item.assignmentItemId === currentAssignmentItemId,
      )
    : -1;
  const currentQuestion =
    currentQuestionIndex >= 0 ? attempt?.items[currentQuestionIndex] : null;
  const answeredQuestionCount = attempt
    ? attempt.items.filter((item) =>
        hasAnswer(answersByItemId.get(item.assignmentItemId)),
      ).length
    : 0;
  const unansweredItems = attempt
    ? attempt.items.filter(
        (item) => !hasAnswer(answersByItemId.get(item.assignmentItemId)),
      )
    : [];

  useEffect(() => {
    if (!attempt?.items.length || currentQuestionIndex >= 0) return;
    setCurrentAssignmentItemId(attempt.items[0].assignmentItemId);
  }, [attempt, currentQuestionIndex]);

  useEffect(() => {
    if (!currentQuestion || !shouldFocusQuestionRef.current) return;
    questionHeadingRef.current?.focus({ preventScroll: true });
    shouldFocusQuestionRef.current = false;
  }, [currentAssignmentItemId, currentQuestion]);

  const selectQuestion = (assignmentItemId: number) => {
    shouldFocusQuestionRef.current = true;
    setCurrentAssignmentItemId(assignmentItemId);
  };

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

  const selectOption = (assignmentItemId: number, optionId: number) => {
    updateAnswer(assignmentItemId, (answer) => ({
      ...answer,
      answerText: "",
      selectedOptionIds: [optionId],
    }));
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
            selectedOptionIds: answer.selectedOptionIds.slice(0, 1),
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

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const handlePopState = (event: PopStateEvent) => {
      if (ignoreHistoryRestoreRef.current) {
        ignoreHistoryRestoreRef.current = false;
        return;
      }

      const nextHistoryIndex = event.state?.idx;
      const currentHistoryIndex = historyIndexRef.current;
      const shouldLeave = window.confirm(
        "Bạn có thay đổi chưa lưu. Rời khỏi trang sẽ làm mất các thay đổi này.",
      );
      if (shouldLeave) return;

      if (
        typeof currentHistoryIndex === "number" &&
        typeof nextHistoryIndex === "number" &&
        currentHistoryIndex !== nextHistoryIndex
      ) {
        ignoreHistoryRestoreRef.current = true;
        window.history.go(currentHistoryIndex - nextHistoryIndex);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  const persistAnswers = async () => {
    if (!attempt) return null;
    const updatedAttempt = await submissionApi.saveAnswers(attempt.id, {
      answers: currentAnswerRequests,
    });
    setAttempt(updatedAttempt);
    setEditableAnswers(toEditableAnswers(updatedAttempt));
    setLastSavedAt(new Date());
    return updatedAttempt;
  };

  const navigateBackToAssignments = async () => {
    if (isDirty) {
      const confirmed = await confirm({
        title: "Rời khỏi bài làm?",
        message: "Bạn có thay đổi chưa lưu. Rời khỏi trang sẽ làm mất các thay đổi này.",
        confirmText: "Rời khỏi trang",
        cancelText: "Ở lại",
        variant: "warning",
      });
      if (!confirmed) return;
    }

    navigate("/student/assignments");
  };

  const saveAnswers = async () => {
    if (
      !attempt ||
      !isEditable ||
      isSaving ||
      isSubmitting ||
      submitFlowRef.current ||
      !isDirty
    ) {
      return;
    }

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
    if (
      !attempt ||
      !isEditable ||
      isSaving ||
      isSubmitting ||
      submitFlowRef.current
    ) {
      return;
    }

    submitFlowRef.current = true;
    setIsSubmitConfirming(true);
    try {
      const confirmed = await confirm({
        title: "Nộp bài?",
        message:
          unansweredItems.length > 0 ? (
            <>
              <p>Bạn còn {unansweredItems.length} câu chưa trả lời.</p>
              <p className="mt-2">
                Câu: {unansweredItems.map((item) => item.displayOrder).join(", ")}.
              </p>
              <p className="mt-2">
                Bạn vẫn có thể nộp bài, nhưng các câu này sẽ không có đáp án.
              </p>
            </>
          ) : (
            "Bạn đã trả lời tất cả câu hỏi. Sau khi nộp, bạn không thể chỉnh sửa câu trả lời nữa."
          ),
        confirmText: "Nộp bài",
      });

      if (!confirmed) return;

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
      setIsSubmitConfirming(false);
      submitFlowRef.current = false;
    }
  };

  const goToFirstUnansweredQuestion = () => {
    const firstUnansweredItem = unansweredItems[0];
    if (firstUnansweredItem) {
      selectQuestion(firstUnansweredItem.assignmentItemId);
    }
  };

  const renderAnswerEditor = (item: StudentAttemptItemResponse) => {
    const answer = answersByItemId.get(item.assignmentItemId);

    if (item.questionType === "MULTIPLE_CHOICE") {
      return (
        <fieldset
          className="mt-4 space-y-2 border-0 p-0"
          aria-describedby={`question-content-${item.assignmentItemId}`}
        >
          <legend className="sr-only">
            Chọn đáp án cho Câu {item.displayOrder}
          </legend>
          {item.options.map((option, index) => {
            const label = String.fromCharCode(65 + index);
            const checked =
              answer?.selectedOptionIds[0] === option.assignmentItemOptionId;
            return (
              <label
                key={option.assignmentItemOptionId}
                className={`flex cursor-pointer items-start gap-3 rounded-input border px-3 py-2 text-sm transition-colors ${
                  checked
                    ? "border-primary bg-primary-light text-primary-active"
                    : "border-surface-border text-gray-700 hover:border-primary hover:bg-surface-hover"
                } ${!isEditable || isSaving || isSubmitting ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <input
                  type="radio"
                  name={`answer-${item.assignmentItemId}`}
                  className="mt-0.5 h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  checked={checked}
                  disabled={!isEditable || isSaving || isSubmitting}
                  onChange={() =>
                    selectOption(
                      item.assignmentItemId,
                      option.assignmentItemOptionId,
                    )
                  }
                />
                <span className="shrink-0 font-medium">({label})</span>
                <span className="min-w-0 break-words">
                  {htmlToText(option.content) || "-"}
                </span>
              </label>
            );
          })}
        </fieldset>
      );
    }

    return (
      <textarea
        value={answer?.answerText ?? ""}
        aria-labelledby={`question-heading-${item.assignmentItemId}`}
        aria-describedby={`question-content-${item.assignmentItemId}`}
        disabled={!isEditable || isSaving || isSubmitting}
        onChange={(event) =>
          updateEssayAnswer(item.assignmentItemId, event.target.value)
        }
        rows={6}
        className="mt-4 w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:bg-surface-page disabled:text-gray-500"
        placeholder="Nhập câu trả lời của bạn..."
      />
    );
  };

  return (
    <div>
      <header className="border-b border-surface-border bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Owlexa
            </p>
            <h1 className="truncate text-lg font-semibold text-gray-900">
              {attempt?.assignmentTitleSnapshot ?? "Lượt làm bài"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {attempt && (
              <span className="text-xs text-gray-500" role="status" aria-live="polite">
                {isEditable
                  ? isSaving
                    ? "Đang lưu..."
                    : isDirty
                      ? "Có thay đổi chưa lưu"
                      : lastSavedAt
                        ? `Đã lưu lúc ${formatSavedTime(lastSavedAt)}`
                        : "Đã lưu"
                  : "Chỉ đọc"}
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={navigateBackToAssignments}
              className="min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Quay lại
            </Button>
            {isEditable && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={saveAnswers}
                  disabled={isSaving || isSubmitting || isSubmitConfirming || !isDirty}
                  isLoading={isSaving}
                  className="min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Lưu câu trả lời
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={submitAttempt}
                  disabled={isSaving || isSubmitConfirming}
                  isLoading={isSubmitting}
                  className="min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Nộp bài
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">

      {error && (
        <div role="alert">
          <ErrorBanner message={error} />
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-16" />
      ) : attempt ? (
        <div className="rounded-card border border-surface-border bg-white p-4 sm:p-6">
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

          <ListeningAudioPlayer
            audioFile={attempt.audioFile}
            playbackMode={attempt.playbackMode ?? "PRACTICE"}
            isActive={isEditable}
          />

          <div className="mt-6 min-w-0 overflow-x-auto rounded-card border border-surface-border bg-white p-4 text-sm text-gray-900">
            <RichTextRenderer value={attempt.assignmentContent} />
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-surface-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              {isEditable
                ? isDirty
                  ? "Bạn có thay đổi chưa lưu."
                  : "Tất cả câu trả lời đã được lưu."
                : "Lượt làm bài này ở chế độ chỉ đọc."}
            </div>
          </div>

          {attempt.items.length > 0 && (
            <section
              className="mt-6 rounded-card border border-surface-border bg-surface-page p-4"
              aria-label="Điều hướng câu hỏi"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Tiến độ: {answeredQuestionCount}/{attempt.items.length} đã trả lời
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Chọn số câu để chuyển nhanh. Câu đã trả lời được đánh dấu.
                  </div>
                </div>
                {unansweredItems.length > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={goToFirstUnansweredQuestion}
                    className="min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Đến câu chưa trả lời
                  </Button>
                )}
                {currentQuestion && (
                  <div className="text-sm text-gray-600">
                    Câu {currentQuestion.displayOrder} · {currentQuestionIndex + 1}/
                    {attempt.items.length}
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Danh sách câu hỏi">
                {attempt.items.map((item) => {
                  const isCurrent = item.assignmentItemId === currentAssignmentItemId;
                  const isAnswered = hasAnswer(
                    answersByItemId.get(item.assignmentItemId),
                  );
                  return (
                    <button
                      key={item.assignmentItemId}
                      type="button"
                      onClick={() => selectQuestion(item.assignmentItemId)}
                      aria-current={isCurrent ? "step" : undefined}
                      aria-label={`Câu ${item.displayOrder}: ${
                        isCurrent ? "đang xem" : isAnswered ? "đã trả lời" : "chưa trả lời"
                      }`}
                      className={`min-h-10 min-w-10 rounded-input border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        isCurrent
                          ? "border-primary bg-primary text-white"
                          : isAnswered
                            ? "border-primary bg-primary-light text-primary-active"
                            : "border-surface-border bg-white text-gray-600 hover:border-primary"
                      }`}
                    >
                      {item.displayOrder}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>Đang xem</span>
                <span>Đã trả lời</span>
                <span>Chưa trả lời</span>
              </div>
            </section>
          )}

          <div className="mt-6 space-y-4">
            {currentQuestion && (() => {
              const item = currentQuestion;
              const savedAnswer = savedAnswersByItemId.get(
                item.assignmentItemId,
              );
              return (
                <section
                  key={item.assignmentItemId}
                  className="min-w-0 rounded-card border border-surface-border bg-white p-4"
                  aria-labelledby={`question-heading-${item.assignmentItemId}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2
                        ref={questionHeadingRef}
                        id={`question-heading-${item.assignmentItemId}`}
                        tabIndex={-1}
                        className="text-xs font-medium uppercase text-gray-400 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        Câu hỏi {item.displayOrder}
                      </h2>
                      <div
                        id={`question-content-${item.assignmentItemId}`}
                        className="mt-1 min-w-0 overflow-x-auto break-words text-sm text-gray-900"
                      >
                        <RichTextRenderer value={stripQuestionAudio(item.content)} />
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
                </section>
              );
            })()}
          </div>
          {currentQuestion && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                className="min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() =>
                  selectQuestion(
                    attempt.items[currentQuestionIndex - 1].assignmentItemId,
                  )
                }
                disabled={currentQuestionIndex <= 0}
              >
                Câu trước
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() =>
                  selectQuestion(
                    attempt.items[currentQuestionIndex + 1].assignmentItemId,
                  )
                }
                disabled={currentQuestionIndex >= attempt.items.length - 1}
              >
                Câu tiếp
              </Button>
            </div>
          )}
        </div>
      ) : null}
      </main>
    </div>
  );
};

export default StudentSubmissionAttemptPage;
