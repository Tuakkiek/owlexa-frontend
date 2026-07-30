import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { questionBankApi } from "../../../api/questionBankApi";
import { questionCollectionApi } from "../../../api/questionCollectionApi";
import { Button } from "../../../components/ui/Button";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import { Input } from "../../../components/ui/Input";
import { editorFileUploadService } from "../../../components/editor/services/fileUploadService";
import { SearchInput } from "../../../components/ui/SharedComponents";
import {
  createSequentialDisplayOrders,
  deriveStartingQuestionNumber,
  MAX_DISPLAY_ORDER,
  MIN_STARTING_QUESTION_NUMBER,
} from "../../../utils/assessmentNumbering";
import {
  editorDocumentToPlainText,
  EMPTY_EDITOR_DOCUMENT,
  RichTextEditor,
  type EditorDocument,
} from "../../../components/editor";
import type {
  AssessmentDetailResponse,
  AssessmentItemRequest,
  AssessmentItemResponse,
  AssessmentRequest,
  AssessmentType,
  PlaybackMode,
} from "../../../types/assessmentBuilder";
import type { FileMetadata } from "../../../types/file";
import type {
  PageResponse as QuestionPageResponse,
  QuestionCollectionResponse,
  QuestionDifficulty,
  QuestionResponse,
  QuestionType,
} from "../../../types/questionBank";

interface AssessmentFormProps {
  initialData?: AssessmentDetailResponse;
  onSubmit: (data: AssessmentRequest) => Promise<void>;
  onCancel: () => void;
}

type SelectedQuestion = {
  questionId: number;
  questionType: QuestionType;
  label: string | null;
  content: EditorDocument;
  defaultPoints: number | null;
  points: string;
};

const PAGE_SIZE = 8;

const emptyQuestionPage: QuestionPageResponse<QuestionResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
};

const previewContent = (document: EditorDocument) => {
  const text = editorDocumentToPlainText(document);
  if (text.length <= 90) return text || "-";
  return `${text.slice(0, 90)}...`;
};

const questionIdentity = (question: QuestionResponse) =>
  [
    question.questionCode,
    question.sectionCode,
    question.displayOrder ? `#${question.displayOrder}` : null,
  ]
    .filter(Boolean)
    .join(" - ");

const typeLabel: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  ESSAY: "Essay",
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const toSelectedQuestion = (
  item: AssessmentItemResponse,
): SelectedQuestion => ({
  questionId: item.questionId,
  questionType: item.questionType,
  label: item.title,
  content: item.content,
  defaultPoints: item.points,
  points: item.points != null ? String(item.points) : "",
});

export const AssessmentForm = ({
  initialData,
  onSubmit,
  onCancel,
}: AssessmentFormProps) => {
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const [content, setContent] =
    useState<EditorDocument>(EMPTY_EDITOR_DOCUMENT);
  const [type, setType] = useState<AssessmentType>("QUIZ");
  const [startingQuestionNumber, setStartingQuestionNumber] = useState("1");
  const [audioFile, setAudioFile] = useState<FileMetadata | null>(null);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("PRACTICE");
  const [selectedQuestions, setSelectedQuestions] = useState<
    SelectedQuestion[]
  >([]);
  const [questionQuery, setQuestionQuery] = useState("");
  const [collections, setCollections] = useState<QuestionCollectionResponse[]>([]);
  const [questionCollectionId, setQuestionCollectionId] = useState<number | "">("");
  const [questionSectionCode, setQuestionSectionCode] = useState("");
  const [questionSectionCodes, setQuestionSectionCodes] = useState<string[]>([]);
  const [questionDifficulty, setQuestionDifficulty] =
    useState<QuestionDifficulty | "">("");
  const [questionType, setQuestionType] = useState<QuestionType | "">("");
  const [pickerSelectedIds, setPickerSelectedIds] = useState<Set<number>>(
    new Set(),
  );
  const [questionPickerPage, setQuestionPickerPage] = useState(0);
  const [questionPage, setQuestionPage] =
    useState<QuestionPageResponse<QuestionResponse>>(emptyQuestionPage);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [questionError, setQuestionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content ?? EMPTY_EDITOR_DOCUMENT);
      setType(initialData.type);
      setStartingQuestionNumber(String(deriveStartingQuestionNumber(initialData.items)));
      setAudioFile(initialData.audioFile ?? null);
      setPlaybackMode(initialData.playbackMode ?? "PRACTICE");
      setSelectedQuestions(
        initialData.items
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(toSelectedQuestion),
      );
    } else {
      setTitle("");
      setContent(EMPTY_EDITOR_DOCUMENT);
      setType("QUIZ");
      setStartingQuestionNumber(String(MIN_STARTING_QUESTION_NUMBER));
      setAudioFile(null);
      setPlaybackMode("PRACTICE");
      setSelectedQuestions([]);
    }
    setAudioUploadProgress(0);
    setError("");
  }, [initialData]);

  const selectedQuestionIds = useMemo(
    () => new Set(selectedQuestions.map((question) => question.questionId)),
    [selectedQuestions],
  );

  const questionPickerPageCount = Math.max(questionPage.totalPages, 1);
  const groupedQuestions = useMemo(() => {
    const groups = new Map<string, QuestionResponse[]>();
    questionPage.content.forEach((question) => {
      const current = groups.get(question.sectionCode) ?? [];
      current.push(question);
      groups.set(question.sectionCode, current);
    });
    return [...groups.entries()];
  }, [questionPage.content]);

  useEffect(() => {
    questionCollectionApi
      .findAll()
      .then((result) => {
        setCollections(result);
        setQuestionCollectionId((current) => current || result[0]?.id || "");
      })
      .catch(() => setCollections([]));
  }, []);

  useEffect(() => {
    if (!questionCollectionId) {
      setQuestionSectionCodes([]);
      return;
    }
    questionBankApi
      .findSectionCodes(questionCollectionId)
      .then(setQuestionSectionCodes)
      .catch(() => setQuestionSectionCodes([]));
  }, [questionCollectionId]);

  const loadQuestions = useCallback(async () => {
    try {
      setIsQuestionLoading(true);
      setQuestionError("");
      setQuestionPage(
        await questionBankApi.findAll({
          search: questionQuery,
          collectionId: questionCollectionId,
          sectionCode: questionSectionCode,
          difficulty: questionDifficulty,
          type: questionType,
          sort: "displayOrder,asc",
          page: questionPickerPage,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: any) {
      setQuestionError(
        err?.response?.data?.message ?? "Unable to load questions.",
      );
    } finally {
      setIsQuestionLoading(false);
    }
  }, [
    questionCollectionId,
    questionDifficulty,
    questionPickerPage,
    questionQuery,
    questionSectionCode,
    questionType,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadQuestions();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadQuestions]);

  const handleQuestionSearchChange = (value: string) => {
    setQuestionQuery(value);
    setQuestionPickerPage(0);
    setPickerSelectedIds(new Set());
  };

  const handleQuestionTypeChange = (value: QuestionType | "") => {
    setQuestionType(value);
    setQuestionPickerPage(0);
    setPickerSelectedIds(new Set());
  };

  const selectQuestionCollection = (value: number) => {
    setQuestionCollectionId(value);
    setQuestionSectionCode("");
    setQuestionPickerPage(0);
    setPickerSelectedIds(new Set());
  };

  const togglePickerQuestion = (questionId: number) => {
    setPickerSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const toggleAllPickerPage = () => {
    const selectableIds = questionPage.content
      .filter((question) => !selectedQuestionIds.has(question.id))
      .map((question) => question.id);
    setPickerSelectedIds((current) => {
      const next = new Set(current);
      if (selectableIds.every((id) => next.has(id))) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const goToPreviousQuestionPage = () => {
    setQuestionPickerPage((current) => Math.max(current - 1, 0));
    setPickerSelectedIds(new Set());
  };

  const goToNextQuestionPage = () => {
    setQuestionPickerPage((current) =>
      current + 1 >= questionPage.totalPages ? current : current + 1,
    );
    setPickerSelectedIds(new Set());
  };

  const addSelectedQuestions = () => {
    const questions = questionPage.content.filter(
      (question) =>
        pickerSelectedIds.has(question.id) &&
        !selectedQuestionIds.has(question.id),
    );
    if (questions.length === 0) return;
    setSelectedQuestions((current) => [
      ...current,
      ...questions.map((question) => ({
        questionId: question.id,
        questionType: question.type,
        label: questionIdentity(question),
        content: question.content,
        defaultPoints: question.points,
        points: "",
      })),
    ]);
    setPickerSelectedIds(new Set());
    setError("");
  };

  const removeQuestion = (questionId: number) => {
    setSelectedQuestions((current) =>
      current.filter((question) => question.questionId !== questionId),
    );
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setSelectedQuestions((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const currentItem = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = currentItem;
      return next;
    });
  };

  const updateItemPoints = (questionId: number, points: string) => {
    setSelectedQuestions((current) =>
      current.map((question) =>
        question.questionId === questionId ? { ...question, points } : question,
      ),
    );
  };

  const uploadAssessmentAudio = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      setError("Vui lòng chọn một file audio.");
      return;
    }

    try {
      setIsAudioUploading(true);
      setAudioUploadProgress(0);
      setError("");
      const uploaded = await editorFileUploadService.upload(file, (progress) =>
        setAudioUploadProgress(progress),
      );
      if (uploaded.type !== "AUDIO") {
        setError("File đã tải lên không phải audio.");
        return;
      }
      setAudioFile(uploaded);
      setAudioUploadProgress(100);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải audio.");
    } finally {
      setIsAudioUploading(false);
    }
  };

  const totalPoints = useMemo(
    () =>
      selectedQuestions.reduce((sum, question) => {
        const value = question.points.trim()
          ? Number(question.points)
          : question.defaultPoints;
        return Number.isFinite(value) && value != null ? sum + value : sum;
      }, 0),
    [selectedQuestions],
  );

  const questionNumberPreview = useMemo(() => {
    if (!/^\d+$/.test(startingQuestionNumber)) return null;

    const start = Number(startingQuestionNumber);
    if (
      !Number.isSafeInteger(start) ||
      start < MIN_STARTING_QUESTION_NUMBER ||
      start > MAX_DISPLAY_ORDER
    ) {
      return null;
    }

    const displayOrders = createSequentialDisplayOrders(
      start,
      selectedQuestions.length,
    );
    if (displayOrders.some((displayOrder) => displayOrder > MAX_DISPLAY_ORDER)) {
      return null;
    }

    return {
      start,
      end: displayOrders.at(-1) ?? null,
    };
  }, [selectedQuestions.length, startingQuestionNumber]);

  const validate = () => {
    if (!title.trim()) {
      return "Vui lòng nhập tiêu đề đề thi.";
    }
    if (title.trim().length > 255) {
      return "Tiêu đề đề thi không được vượt quá 255 ký tự.";
    }
    if (!/^\d+$/.test(startingQuestionNumber)) {
      return "Số câu bắt đầu phải là số nguyên lớn hơn hoặc bằng 1.";
    }
    const parsedStartingQuestionNumber = Number(startingQuestionNumber);
    if (
      !Number.isSafeInteger(parsedStartingQuestionNumber) ||
      parsedStartingQuestionNumber < MIN_STARTING_QUESTION_NUMBER ||
      parsedStartingQuestionNumber > MAX_DISPLAY_ORDER
    ) {
      return "Số câu bắt đầu phải là số nguyên lớn hơn hoặc bằng 1.";
    }
    if (
      parsedStartingQuestionNumber + selectedQuestions.length - 1 >
      MAX_DISPLAY_ORDER
    ) {
      return "Phạm vi số câu vượt quá giới hạn cho phép.";
    }
    const invalidPoints = selectedQuestions.some((question) => {
      if (!question.points.trim()) return false;
      const value = Number(question.points);
      return !Number.isFinite(value) || value <= 0;
    });
    if (invalidPoints) {
      return "Điểm số của câu hỏi phải lớn hơn 0.";
    }
    return "";
  };

  const buildRequest = (): AssessmentRequest => ({
    title: title.trim(),
    description: editorDocumentToPlainText(content).slice(0, 500) || null,
    content,
    type,
    audioFileId: audioFile?.id ?? null,
    playbackMode,
    items: selectedQuestions.map<AssessmentItemRequest>((question, index) => ({
      questionId: question.questionId,
      points: question.points.trim() ? Number(question.points) : null,
      displayOrder: Number(startingQuestionNumber) + index,
    })),
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const previousStartingQuestionNumber = deriveStartingQuestionNumber(
      initialData?.items,
    );
    const parsedStartingQuestionNumber = Number(startingQuestionNumber);
    const hasRenumberedExistingQuestions =
      (initialData?.items.length ?? 0) > 0 &&
      parsedStartingQuestionNumber !== previousStartingQuestionNumber;

    if (hasRenumberedExistingQuestions) {
      const previousEndingQuestionNumber =
        previousStartingQuestionNumber + initialData!.items.length - 1;
      const nextQuestionRange =
        selectedQuestions.length === 0
          ? "không còn câu hỏi"
          : `Câu ${parsedStartingQuestionNumber}–${
              parsedStartingQuestionNumber + selectedQuestions.length - 1
            }`;
      const confirmed = await confirm({
        title: "Đánh số lại câu hỏi?",
        message:
          `Các câu hỏi hiện tại sẽ được đổi từ Câu ${previousStartingQuestionNumber}–${previousEndingQuestionNumber} ` +
          `thành ${nextQuestionRange}.\n\n` +
          "Thứ tự và nội dung câu hỏi không thay đổi.",
        confirmText: "Đánh số lại",
        variant: "warning",
      });
      if (!confirmed) return;
    }

    try {
      setIsSaving(true);
      await onSubmit(buildRequest());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu đề thi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Tiêu đề"
          value={title}
          maxLength={255}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Tiêu đề đề thi"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Loại đề thi</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as AssessmentType)}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="QUIZ">Trắc nghiệm</option>
            <option value="HOMEWORK">Bài tập về nhà</option>
            <option value="EXAM">Bài kiểm tra</option>
          </select>
        </div>

        <Input
          label="Số câu bắt đầu"
          type="number"
          min={MIN_STARTING_QUESTION_NUMBER}
          max={MAX_DISPLAY_ORDER}
          step="1"
          inputMode="numeric"
          value={startingQuestionNumber}
          onChange={(event) => setStartingQuestionNumber(event.target.value)}
          disabled={isSaving}
        />
      </div>
      <p className="-mt-3 text-xs text-gray-500">
        Câu đầu tiên của đề sẽ được hiển thị với số này. Ví dụ: nhập 32 cho TOEIC Part 3.
      </p>
      <p className="-mt-4 text-sm text-gray-700">
        Phạm vi số câu:{" "}
        {questionNumberPreview
          ? questionNumberPreview.end == null
            ? `${questionNumberPreview.start}–...`
            : `${questionNumberPreview.start}–${questionNumberPreview.end}`
          : "-"}
      </p>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Audio nghe chung
          </label>
          <div className="rounded-card border border-surface-border bg-white p-3">
            {audioFile ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {audioFile.originalName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {audioFile.mimeType}
                      {audioFile.size ? ` · ${formatFileSize(audioFile.size)}` : ""}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioFile(null)}
                    disabled={isAudioUploading || isSaving}
                  >
                    Xóa audio
                  </Button>
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
            ) : (
              <div className="text-sm text-gray-500">Chưa có audio.</div>
            )}
            <label className="mt-3 inline-flex cursor-pointer items-center rounded-input border border-surface-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-surface-hover">
              {isAudioUploading
                ? `Đang tải ${audioUploadProgress}%`
                : audioFile
                  ? "Thay audio"
                  : "Tải audio"}
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,audio/*"
                className="sr-only"
                disabled={isAudioUploading || isSaving}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void uploadAssessmentAudio(file);
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Chế độ phát
          </label>
          <select
            value={playbackMode}
            onChange={(event) =>
              setPlaybackMode(event.target.value as PlaybackMode)
            }
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="PRACTICE">Practice</option>
            <option value="EXAM">Exam</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Nội dung đề thi
        </label>
        <p className="mb-2 text-xs text-gray-500">
          Soạn hướng dẫn, nội dung chung và chèn hình ảnh, audio, video hoặc tài liệu.
        </p>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Nhập nội dung đề thi..."
          minHeight={320}
        />
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Chọn câu hỏi
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              Chọn các câu hỏi đang hoạt động từ Ngân hàng câu hỏi.
            </p>
            <p className="mt-2 text-sm font-medium text-gray-700">
              Đã chọn: {selectedQuestions.length} câu hỏi
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="max-h-[32rem] overflow-y-auto rounded-card border border-surface-border bg-white">
              <div className="border-b border-surface-border px-4 py-3 text-sm font-semibold text-gray-900">
                Collections
              </div>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => selectQuestionCollection(collection.id)}
                  className={`flex w-full items-center justify-between gap-2 border-b border-surface-border px-4 py-3 text-left text-sm ${
                    questionCollectionId === collection.id
                      ? "bg-blue-50 font-medium text-primary"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  <span className="truncate">{collection.name}</span>
                  <span className="text-xs text-gray-400">
                    {collection.questionCount}
                  </span>
                </button>
              ))}
            </aside>

            <div className="min-w-0 space-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_140px_140px_150px]">
            <SearchInput
              value={questionQuery}
              onChange={handleQuestionSearchChange}
              placeholder="Tìm kiếm câu hỏi..."
            />
            <select
              value={questionSectionCode}
              onChange={(event) => {
                setQuestionSectionCode(event.target.value);
                setQuestionPickerPage(0);
                setPickerSelectedIds(new Set());
              }}
              className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            >
              <option value="">Tất cả Section</option>
              {questionSectionCodes.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <select
              value={questionDifficulty}
              onChange={(event) => {
                setQuestionDifficulty(
                  event.target.value as QuestionDifficulty | "",
                );
                setQuestionPickerPage(0);
                setPickerSelectedIds(new Set());
              }}
              className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            >
              <option value="">Tất cả độ khó</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
            <select
              value={questionType}
              onChange={(event) =>
                handleQuestionTypeChange(event.target.value as QuestionType | "")
              }
              className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            >
              <option value="">Tất cả loại</option>
              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
              <option value="ESSAY">Tự luận</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-surface-border bg-white px-4 py-3 text-sm">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={
                  questionPage.content.some(
                    (question) => !selectedQuestionIds.has(question.id),
                  ) &&
                  questionPage.content
                    .filter((question) => !selectedQuestionIds.has(question.id))
                    .every((question) => pickerSelectedIds.has(question.id))
                }
                onChange={toggleAllPickerPage}
              />
              Chọn tất cả trang hiện tại
            </label>
            <Button
              type="button"
              size="sm"
              disabled={pickerSelectedIds.size === 0}
              onClick={addSelectedQuestions}
            >
              Thêm đã chọn ({pickerSelectedIds.size})
            </Button>
          </div>

          {questionError && (
            <p className="text-sm text-red-600">{questionError}</p>
          )}

          <div className="max-h-80 overflow-y-auto rounded-card border border-surface-border bg-white">
            {isQuestionLoading ? (
              <div className="p-4 text-sm text-gray-500">Đang tải...</div>
            ) : questionPage.content.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">
                Không tìm thấy câu hỏi nào.
              </div>
            ) : (
              <div>
                {groupedQuestions.map(([section, questions]) => (
                  <section key={section}>
                    <div className="sticky top-0 border-y border-surface-border bg-surface-page px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {section}
                    </div>
                    <div className="divide-y divide-surface-border">
                      {questions.map((question) => {
                        const isSelected = selectedQuestionIds.has(question.id);
                        return (
                          <label
                            key={question.id}
                            className={`flex gap-3 p-4 ${
                              isSelected
                                ? "bg-surface-page opacity-60"
                                : "cursor-pointer hover:bg-surface-hover"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                isSelected || pickerSelectedIds.has(question.id)
                              }
                              disabled={isSelected}
                              onChange={() => togglePickerQuestion(question.id)}
                              className="mt-1"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-gray-500">
                                  {question.displayOrder}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {questionIdentity(question)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {typeLabel[question.type]}
                                </span>
                              </span>
                              <span className="mt-1 line-clamp-2 block text-xs text-gray-500">
                                {previewContent(question.content)}
                              </span>
                            </span>
                            {isSelected && (
                              <span className="text-xs text-gray-500">
                                Đã thêm
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Trang {questionPage.number + 1} / {questionPickerPageCount}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={goToPreviousQuestionPage}
                disabled={isQuestionLoading || questionPage.number <= 0}
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={goToNextQuestionPage}
                disabled={
                  isQuestionLoading ||
                  questionPage.number + 1 >= questionPickerPageCount
                }
              >
                Sau
              </Button>
            </div>
          </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Câu hỏi đã chọn
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              Sắp xếp lại thứ tự câu hỏi và ghi đè điểm số khi cần.
            </p>
          </div>

          <div className="rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-700">
            Tổng điểm:{" "}
            <span className="font-medium text-gray-900">
              {totalPoints > 0 ? totalPoints.toFixed(2) : "-"}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-card border border-surface-border bg-white">
            {selectedQuestions.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">
                Chưa có câu hỏi nào được chọn.
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {selectedQuestions.map((question, index) => (
                  <div
                    key={question.questionId}
                    className="grid gap-3 p-4 hover:bg-surface-hover md:grid-cols-[auto_minmax(0,1fr)_120px_auto]"
                  >
                    <div className="w-6 shrink-0 text-sm text-gray-400">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {question.label || "Cau hoi chua co danh tinh"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {typeLabel[question.questionType]}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {previewContent(question.content)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Điểm mặc định: {question.defaultPoints ?? "-"}
                      </p>
                    </div>
                    <Input
                      label="Điểm số"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={question.points}
                      onChange={(event) =>
                        updateItemPoints(question.questionId, event.target.value)
                      }
                      placeholder={
                        question.defaultPoints != null
                          ? String(question.defaultPoints)
                          : "Mặc định"
                      }
                    />
                    <div className="flex flex-wrap items-end justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => moveQuestion(index, -1)}
                      >
                        Lên
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={index === selectedQuestions.length - 1}
                        onClick={() => moveQuestion(index, 1)}
                      >
                        Xuống
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.questionId)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isSaving}>
          {initialData ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );
};
