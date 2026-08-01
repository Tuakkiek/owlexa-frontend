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
import type {
  AssessmentType,
  PlaybackMode,
} from "../../types/assessmentBuilder";
import type { FileMetadata } from "../../types/file";
import type {
  StudentAttemptDetailResponse,
  StudentAttemptItemResponse,
  SubmissionAnswerRequest,
  SubmissionAttemptStatus,
} from "../../types/submission";
import { formatDateTime } from "../../utils/dateTime";
import { htmlToText } from "../../utils/text";
import {
  RichTextRenderer,
  isEmptyEditorDocument,
  type EditorDocument,
} from "../../components/editor";
import {
  extractQuestionIdsFromDoc,
  stripQuestionNodes,
} from "../../utils/editorDoc";
import { StudentAIResultOverview } from "./components/StudentAIResultOverview";

const ITEMS_PER_PAGE = 5;

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

const legacyAiOverviewEnabled = false;

type EditableSubmissionAnswer = {
  assignmentItemId: number;
  answerText: string;
  selectedOptionIds: number[];
};

const hasAnswer = (answer: EditableSubmissionAnswer | undefined) => {
  if (!answer) return false;
  return (
    answer.selectedOptionIds.length > 0 || answer.answerText.trim().length > 0
  );
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

const getNavigableQuestions = (attempt: StudentAttemptDetailResponse) => {
  return attempt.items.map((item) => ({
    item,
    questionNumber: item.displayOrder,
  }));
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
  if (
    stripped.type === "doc" &&
    (!stripped.content || stripped.content.length === 0)
  ) {
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
        <audio
          controls
          preload="metadata"
          src={audioFile.url}
          className="w-full"
        >
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
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveInFlightRef = useRef(false);
  const [attempt, setAttempt] = useState<StudentAttemptDetailResponse | null>(
    null,
  );
  const [editableAnswers, setEditableAnswers] = useState<
    EditableSubmissionAnswer[]
  >([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitConfirming, setIsSubmitConfirming] = useState(false);
  const [showAiCelebration, setShowAiCelebration] = useState(false);
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

      if (
        loadedAttempt.status !== "IN_PROGRESS" &&
        loadedAttempt.allowReview === false
      ) {
        toast.info("Giáo viên không cho phép xem lại bài làm.");
        navigate("/student/assignments");
        return;
      }

      setAttempt(loadedAttempt);
      const loadedAnswers = toEditableAnswers(loadedAttempt);
      setEditableAnswers(loadedAnswers);
      setLastSavedAt(
        loadedAttempt.lastSavedAt ? new Date(loadedAttempt.lastSavedAt) : null,
      );
      const loadedQuestions = getNavigableQuestions(loadedAttempt);
      const firstUnansweredIdx = loadedQuestions.findIndex(({ item }) => {
        const answer = loadedAnswers.find(
          (current) => current.assignmentItemId === item.assignmentItemId,
        );
        return !hasAnswer(answer);
      });
      setCurrentPage(
        firstUnansweredIdx >= 0
          ? Math.floor(firstUnansweredIdx / ITEMS_PER_PAGE)
          : 0,
      );
    } catch (err: any) {
      if (loadSequenceRef.current !== sequence) return;
      setError(err?.response?.data?.message ?? "Không thể tải lượt làm bài.");
    } finally {
      if (loadSequenceRef.current === sequence) {
        setIsLoading(false);
      }
    }
  }, [attemptId, navigate, toast]);

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

  // Overall score shown to the student once submitted: auto-scored (multiple
  // choice) plus the AI-graded essay score when an AI result is available.
  const displayedFinalScore =
    attempt && attempt.status !== "IN_PROGRESS"
      ? attempt.aiResult?.aiScore != null
        ? (attempt.autoScore ?? 0) + attempt.aiResult.aiScore
        : attempt.autoScore
      : null;

  const navigableQuestions = useMemo(
    () => (attempt ? getNavigableQuestions(attempt) : []),
    [attempt],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(navigableQuestions.length / ITEMS_PER_PAGE),
  );
  const currentPageQuestions = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return navigableQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [navigableQuestions, currentPage]);

  const answeredQuestionCount = navigableQuestions.filter(({ item }) =>
    hasAnswer(answersByItemId.get(item.assignmentItemId)),
  ).length;
  const progressPercentage =
    navigableQuestions.length > 0
      ? Math.round((answeredQuestionCount / navigableQuestions.length) * 100)
      : 0;
  const currentPageStart = currentPage * ITEMS_PER_PAGE + 1;
  const currentPageEnd = Math.min(
    navigableQuestions.length,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );
  const unansweredQuestions = navigableQuestions.filter(
    ({ item }) => !hasAnswer(answersByItemId.get(item.assignmentItemId)),
  );

  const selectQuestion = (assignmentItemId: number) => {
    const idx = navigableQuestions.findIndex(
      ({ item }) => item.assignmentItemId === assignmentItemId,
    );
    if (idx >= 0) {
      const page = Math.floor(idx / ITEMS_PER_PAGE);
      setCurrentPage(page);
    }
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

  // Auto-save: debounce 1.5s after any answer change
  useEffect(() => {
    if (
      !attempt ||
      !isEditable ||
      isSubmitting ||
      submitFlowRef.current ||
      autoSaveInFlightRef.current
    ) {
      return;
    }
    // only auto-save when dirty
    const currentNorm = normalizeAnswers(
      editableAnswers.map((a) => ({
        assignmentItemId: a.assignmentItemId,
        answerText: a.answerText.trim() || undefined,
        selectedOptionIds: a.selectedOptionIds,
      })),
    );
    const savedNorm = normalizeAnswers(
      attempt.answers.map((a) => ({
        assignmentItemId: a.assignmentItemId,
        answerText: a.answerText?.trim() || undefined,
        selectedOptionIds: a.selectedOptionIds,
      })),
    );
    if (currentNorm === savedNorm) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (submitFlowRef.current || autoSaveInFlightRef.current) return;
      autoSaveInFlightRef.current = true;
      try {
        const reqs: SubmissionAnswerRequest[] = [];
        attempt.items.forEach((item) => {
          const answer = editableAnswers.find(
            (a) => a.assignmentItemId === item.assignmentItemId,
          );
          if (!answer) return;
          if (item.questionType === "MULTIPLE_CHOICE") {
            if (answer.selectedOptionIds.length > 0) {
              reqs.push({
                assignmentItemId: item.assignmentItemId,
                selectedOptionIds: answer.selectedOptionIds.slice(0, 1),
              });
            }
          } else {
            const text = answer.answerText.trim();
            if (text)
              reqs.push({
                assignmentItemId: item.assignmentItemId,
                answerText: text,
              });
          }
        });
        const updated = await submissionApi.saveAnswers(attempt.id, {
          answers: reqs,
        });
        setAttempt(updated);
        setEditableAnswers(toEditableAnswers(updated));
        setLastSavedAt(new Date());
      } catch {
        // silent fail for auto-save
      } finally {
        autoSaveInFlightRef.current = false;
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editableAnswers, attempt, isEditable, isSubmitting]);

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
        message:
          "Bạn có thay đổi chưa lưu. Rời khỏi trang sẽ làm mất các thay đổi này.",
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
      const message =
        err?.response?.data?.message ?? "Không thể lưu câu trả lời.";
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
          unansweredQuestions.length > 0 ? (
            <>
              <p>Bạn còn {unansweredQuestions.length} câu chưa trả lời.</p>
              <p className="mt-2">
                Câu:{" "}
                {unansweredQuestions
                  .map(({ questionNumber }) => questionNumber)
                  .join(", ")}
                .
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
      if (submittedAttempt.allowReview === false) {
        toast.success("Đã nộp bài thành công.");
        navigate("/student/assignments");
        return;
      }
      setAttempt(submittedAttempt);
      setEditableAnswers(toEditableAnswers(submittedAttempt));
      setShowAiCelebration(
        submittedAttempt.showScore !== false && submittedAttempt.aiResult != null,
      );
      toast.success("Đã nộp bài thành công.");
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Không thể nộp bài.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setIsSubmitConfirming(false);
      submitFlowRef.current = false;
    }
  };

  const goToFirstUnansweredQuestion = () => {
    const firstUnanswered = unansweredQuestions[0];
    if (firstUnanswered) {
      selectQuestion(firstUnanswered.item.assignmentItemId);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderAnswerEditor = (
    item: StudentAttemptItemResponse,
    questionNumber: number,
  ) => {
    const answer = answersByItemId.get(item.assignmentItemId);

    if (item.questionType === "MULTIPLE_CHOICE") {
      return (
        <fieldset
          className="mt-5 space-y-3 border-0 p-0"
          aria-describedby={`question-content-${item.assignmentItemId}`}
        >
          <legend className="sr-only">
            Chọn đáp án cho Câu {questionNumber}
          </legend>
          {item.options.map((option, index) => {
            const label = String.fromCharCode(65 + index);
            const checked =
              answer?.selectedOptionIds[0] === option.assignmentItemOptionId;
            return (
              <label
                key={option.assignmentItemOptionId}
                className={`group flex cursor-pointer items-start gap-4 rounded-input border px-4 py-3 text-sm transition-all ${
                  checked
                    ? "border-primary bg-primary-light text-primary-active shadow-sm ring-1 ring-primary/20"
                    : "border-surface-border bg-white text-gray-700 hover:border-primary/70 hover:bg-primary-light/40"
                } ${!isEditable || isSaving || isSubmitting ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <input
                  type="radio"
                  name={`answer-${item.assignmentItemId}`}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  checked={checked}
                  disabled={!isEditable || isSaving || isSubmitting}
                  onChange={() =>
                    selectOption(
                      item.assignmentItemId,
                      option.assignmentItemOptionId,
                    )
                  }
                />
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    checked
                      ? "border-primary bg-primary text-white"
                      : "border-surface-border bg-surface-page text-gray-500 group-hover:border-primary/60"
                  }`}
                >
                  {label}
                </span>
                <span className="min-w-0 flex-1 break-words pt-1 leading-6">
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
        rows={7}
        className="mt-5 w-full rounded-input border border-surface-border bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:bg-surface-page disabled:text-gray-500"
        placeholder="Nhập câu trả lời của bạn..."
      />
    );
  };

  const getQuestionContextDoc = (
    item: StudentAttemptItemResponse,
    index: number,
  ): EditorDocument | null => {
    if (attempt?.blocks && attempt.blocks.length > 0) {
      for (const block of attempt.blocks) {
        if (!block.content) continue;
        const qIds = extractQuestionIdsFromDoc(block.content);
        if (qIds.includes(item.assignmentItemId)) {
          return stripQuestionNodes(block.content);
        }
      }
      if (attempt.blocks[index]?.content) {
        return stripQuestionNodes(attempt.blocks[index].content);
      }
    }
    return null;
  };

  const renderQuestionContent = (
    item: StudentAttemptItemResponse,
    index: number,
  ) => {
    const contextDoc = getQuestionContextDoc(item, index);
    const hasContext = contextDoc != null && !isEmptyEditorDocument(contextDoc);
    return (
      <div className="space-y-3">
        {hasContext && (
          <div className="rounded-input border border-surface-border bg-surface-page px-3 py-2 text-xs text-gray-500">
            <RichTextRenderer value={contextDoc!} />
          </div>
        )}
        <RichTextRenderer value={stripQuestionAudio(item.content)} />
      </div>
    );
  };

  const renderQuestionCard = (
    item: StudentAttemptItemResponse,
    questionNumber: number,
    isCurrent: boolean,
    highlightCurrent = false,
  ) => {
    const savedAnswer = savedAnswersByItemId.get(item.assignmentItemId);

    return (
      <section
        key={item.assignmentItemId}
        aria-current={highlightCurrent && isCurrent ? "step" : undefined}
        aria-labelledby={`question-heading-${item.assignmentItemId}`}
        className={`min-w-0 scroll-mt-28 rounded-card border bg-white p-5 shadow-sm transition-shadow sm:p-6 ${
          highlightCurrent && isCurrent
            ? "border-primary ring-1 ring-primary/40"
            : "border-surface-border"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2
              ref={isCurrent ? questionHeadingRef : undefined}
              id={`question-heading-${item.assignmentItemId}`}
              tabIndex={-1}
              className="inline-flex rounded-input bg-primary-light px-3 py-1.5 text-sm font-semibold text-primary-active outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Câu hỏi {questionNumber}
            </h2>
            <div
              id={`question-content-${item.assignmentItemId}`}
              className="mt-4 min-w-0 overflow-x-auto break-words text-base leading-8 text-gray-900"
            >
              {renderQuestionContent(item, questionNumber - 1)}
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

        {renderAnswerEditor(item, questionNumber)}

        {attempt?.status !== "IN_PROGRESS" &&
          savedAnswer &&
          attempt?.showScore !== false && (
            <div className="mt-3 text-xs text-gray-500">
              Điểm số: {savedAnswer.autoScore ?? "-"} /{" "}
              {savedAnswer.maxScore ?? "-"}
            </div>
          )}

        {attempt?.status !== "IN_PROGRESS" &&
          attempt?.aiResult &&
          attempt?.showScore !== false &&
          (() => {
            const aiItem = attempt.aiResult?.itemResults?.find(
              (result) => result.assignmentItemId === item.assignmentItemId,
            );
            if (!aiItem) return null;
            return (
              <div className="mt-3 rounded-input border border-primary/20 bg-primary/5 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-medium uppercase text-gray-400">
                    Nhận xét từ AI
                  </div>
                  {aiItem.aiScore != null && (
                    <div className="text-xs font-semibold text-primary">
                      Điểm AI: {aiItem.aiScore} / {aiItem.maxScore ?? "-"}
                    </div>
                  )}
                </div>
                {aiItem.feedback && (
                  <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {aiItem.feedback}
                  </div>
                )}
                {aiItem.rubricAnalysis && (
                  <div className="mt-1 whitespace-pre-wrap text-xs text-gray-500">
                    {aiItem.rubricAnalysis}
                  </div>
                )}
              </div>
            );
          })()}
      </section>
    );
  };

  const renderQuestionNavigator = (variant: "mobile" | "sidebar") => {
    const isSidebar = variant === "sidebar";

    return (
      <section
        className={`rounded-card border border-surface-border bg-white ${
          isSidebar ? "p-5 shadow-sm" : "p-4 lg:hidden"
        }`}
        aria-label="Điều hướng câu hỏi"
      >
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Tiến độ làm bài
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {answeredQuestionCount}/{navigableQuestions.length} câu đã trả lời
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">
                {progressPercentage}%
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-page">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Đang xem câu {currentPageStart}-{currentPageEnd} trên{" "}
              {navigableQuestions.length}
            </div>
          </div>

          {unansweredQuestions.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToFirstUnansweredQuestion}
              className="min-h-10 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Đến câu chưa trả lời
            </Button>
          )}
        </div>

        <div
          className={`mt-4 grid gap-2 ${
            isSidebar ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-8"
          }`}
          aria-label="Danh sách câu hỏi"
        >
          {navigableQuestions.map(({ item, questionNumber }) => {
            const questionIndex = navigableQuestions.findIndex(
              (q) => q.item.assignmentItemId === item.assignmentItemId,
            );
            const pageOfQuestion = Math.floor(questionIndex / ITEMS_PER_PAGE);
            const isOnCurrentPage = pageOfQuestion === currentPage;
            const isAnswered = hasAnswer(
              answersByItemId.get(item.assignmentItemId),
            );

            return (
              <button
                key={item.assignmentItemId}
                type="button"
                onClick={() => selectQuestion(item.assignmentItemId)}
                aria-label={`Câu ${questionNumber}: ${
                  isAnswered ? "đã trả lời" : "chưa trả lời"
                }${isOnCurrentPage ? " (đang xem)" : ""}`}
                className={`relative flex aspect-square min-h-11 items-center justify-center rounded-input border text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isOnCurrentPage
                    ? isAnswered
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-primary bg-primary-light text-primary-active shadow-sm"
                    : isAnswered
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-surface-border bg-white text-gray-500 hover:border-primary/70 hover:bg-primary-light/40"
                }`}
              >
                {questionNumber}
                {isAnswered && !isOnCurrentPage && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
          <div className="rounded-input bg-primary-light px-2 py-2 text-primary-active">
            <div className="text-base font-bold">{answeredQuestionCount}</div>
            Đã làm
          </div>
          <div className="rounded-input bg-surface-page px-2 py-2">
            <div className="text-base font-bold text-gray-700">
              {unansweredQuestions.length}
            </div>
            Chưa làm
          </div>
          <div className="rounded-input bg-amber-50 px-2 py-2 text-amber-700">
            <div className="text-base font-bold">0</div>
            Xem lại
          </div>
        </div>

        {isSidebar && isEditable && (
          <Button
            type="button"
            onClick={submitAttempt}
            disabled={isSaving || isSubmitConfirming}
            isLoading={isSubmitting}
            className="mt-5 min-h-12 w-full text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Nộp bài
          </Button>
        )}
      </section>
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
              <span
                className="text-xs text-gray-500"
                role="status"
                aria-live="polite"
              >
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
                  disabled={
                    isSaving || isSubmitting || isSubmitConfirming || !isDirty
                  }
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

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        {error && (
          <div role="alert">
            <ErrorBanner message={error} />
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton count={3} height="h-16" />
        ) : attempt ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="rounded-card border border-surface-border bg-white p-4 shadow-sm sm:p-6">
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
              {attempt.showScore !== false && (
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">
                    Điểm số
                  </div>
                  <div className="mt-1 text-gray-900">
                    {attempt.status === "IN_PROGRESS" || displayedFinalScore == null
                      ? "-"
                      : `${displayedFinalScore} / ${attempt.maxScore ?? "-"}`}
                  </div>
                </div>
              )}
            </div>

            {legacyAiOverviewEnabled && attempt?.aiResult && attempt?.showScore !== false && (
              <div className="mt-6 rounded-card border border-primary/20 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      Nhận xét từ AI
                    </span>
                    <Badge variant="info">
                      Theo tiêu chí chấm của giáo viên
                    </Badge>
                  </div>
                  {attempt?.aiResult?.aiScore != null && (
                    <div className="text-sm font-semibold text-primary">
                      Điểm AI: {attempt?.aiResult?.aiScore} /{" "}
                      {attempt?.aiResult?.maxScore ?? "-"}
                    </div>
                  )}
                </div>
                {attempt?.aiResult?.summary && (
                  <div className="mt-2 text-xs text-gray-500">
                    {attempt?.aiResult?.summary}
                  </div>
                )}
                <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {attempt?.aiResult?.overallFeedback ||
                    "Chưa có nhận xét tổng quan từ AI."}
                </div>
              </div>
            )}

            {attempt.aiResult && attempt.showScore !== false && (
              <StudentAIResultOverview
                attempt={attempt}
                displayedFinalScore={displayedFinalScore}
                isCelebrationOpen={showAiCelebration}
                onDismissCelebration={() => setShowAiCelebration(false)}
              />
            )}

            <ListeningAudioPlayer
              audioFile={attempt.audioFile}
              playbackMode={attempt.playbackMode ?? "PRACTICE"}
              isActive={isEditable}
            />

            {(!attempt.blocks || attempt.blocks.length === 0) &&
              attempt.assignmentContent && (
                <div className="mt-6 min-w-0 overflow-x-auto rounded-card border border-surface-border bg-white p-4 text-sm text-gray-900">
                  <RichTextRenderer value={attempt.assignmentContent} />
                </div>
              )}
            <div className="mt-6 flex flex-col gap-3 border-t border-surface-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">
                {isEditable
                  ? isDirty
                    ? "Bạn có thay đổi chưa lưu."
                    : "Tất cả câu trả lời đã được lưu."
                  : "Lượt làm bài này ở chế độ chỉ đọc."}
              </div>
            </div>

            {navigableQuestions.length > 0 && (
              <section
                className="mt-6 rounded-card border border-surface-border bg-surface-page p-4 lg:hidden"
                aria-label="Điều hướng câu hỏi"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Tiến độ: {answeredQuestionCount}/
                      {navigableQuestions.length} đã trả lời
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Chọn số câu để chuyển nhanh. Câu đã trả lời được đánh dấu.
                      Trang {currentPage + 1}/{totalPages}.
                    </div>
                  </div>
                  {unansweredQuestions.length > 0 && (
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
                </div>
                <div
                  className="mt-4 flex flex-wrap gap-2"
                  aria-label="Danh sách câu hỏi"
                >
                  {navigableQuestions.map(({ item, questionNumber }) => {
                    const pageOfQuestion = Math.floor(
                      navigableQuestions.findIndex(
                        (q) =>
                          q.item.assignmentItemId === item.assignmentItemId,
                      ) / ITEMS_PER_PAGE,
                    );
                    const isOnCurrentPage = pageOfQuestion === currentPage;
                    const isAnswered = hasAnswer(
                      answersByItemId.get(item.assignmentItemId),
                    );
                    return (
                      <button
                        key={item.assignmentItemId}
                        type="button"
                        onClick={() => selectQuestion(item.assignmentItemId)}
                        aria-label={`Câu ${questionNumber}: ${
                          isAnswered ? "đã trả lời" : "chưa trả lời"
                        }${isOnCurrentPage ? " (đang xem)" : ""}`}
                        className={`min-h-10 min-w-10 rounded-input border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          isOnCurrentPage
                            ? isAnswered
                              ? "border-primary bg-primary text-white"
                              : "border-primary bg-primary-light text-primary-active"
                            : isAnswered
                              ? "border-green-400 bg-green-50 text-green-700"
                              : "border-surface-border bg-white text-gray-600 hover:border-primary"
                        }`}
                      >
                        {questionNumber}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded border border-primary bg-primary-light" />{" "}
                    Trang hiện tại
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded border border-green-400 bg-green-50" />{" "}
                    Đã trả lời
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded border border-surface-border bg-white" />{" "}
                    Chưa trả lời
                  </span>
                </div>
              </section>
            )}

            <div className="mt-6 space-y-4">
              {currentPageQuestions.map(({ item, questionNumber }) =>
                renderQuestionCard(item, questionNumber, true),
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 0}
                >
                  Trang trước
                </Button>
                <span className="text-sm text-gray-600">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Trang tiếp
                </Button>
              </div>
            )}
            </div>

            {navigableQuestions.length > 0 && (
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  {renderQuestionNavigator("sidebar")}
                </div>
              </aside>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default StudentSubmissionAttemptPage;
