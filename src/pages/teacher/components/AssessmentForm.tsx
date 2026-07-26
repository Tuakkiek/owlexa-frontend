import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { questionBankApi } from "../../../api/questionBankApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { SearchInput } from "../../../components/ui/SharedComponents";
import type {
  AssessmentDetailResponse,
  AssessmentItemRequest,
  AssessmentItemResponse,
  AssessmentRequest,
  AssessmentType,
} from "../../../types/assessmentBuilder";
import type {
  PageResponse as QuestionPageResponse,
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
  title: string | null;
  content: string;
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

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};

const previewContent = (html: string) => {
  const text = stripHtml(html);
  if (text.length <= 90) return text || "-";
  return `${text.slice(0, 90)}...`;
};

const typeLabel: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  ESSAY: "Essay",
};

const toSelectedQuestion = (
  item: AssessmentItemResponse,
): SelectedQuestion => ({
  questionId: item.questionId,
  questionType: item.questionType,
  title: item.title,
  content: item.content,
  defaultPoints: item.points,
  points: item.points != null ? String(item.points) : "",
});

export const AssessmentForm = ({
  initialData,
  onSubmit,
  onCancel,
}: AssessmentFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AssessmentType>("QUIZ");
  const [selectedQuestions, setSelectedQuestions] = useState<
    SelectedQuestion[]
  >([]);
  const [questionQuery, setQuestionQuery] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType | "">("");
  const [questionPage, setQuestionPage] =
    useState<QuestionPageResponse<QuestionResponse>>(emptyQuestionPage);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setType(initialData.type);
      setSelectedQuestions(
        initialData.items
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(toSelectedQuestion),
      );
    } else {
      setTitle("");
      setDescription("");
      setType("QUIZ");
      setSelectedQuestions([]);
    }
    setError("");
  }, [initialData]);

  const selectedQuestionIds = useMemo(
    () => new Set(selectedQuestions.map((question) => question.questionId)),
    [selectedQuestions],
  );

  const loadQuestions = useCallback(async () => {
    try {
      setIsQuestionLoading(true);
      setQuestionError("");
      setQuestionPage(
        await questionBankApi.findAll({
          search: questionQuery,
          type: questionType,
          page: 0,
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
  }, [questionQuery, questionType]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadQuestions();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadQuestions]);

  const addQuestion = (question: QuestionResponse) => {
    if (selectedQuestionIds.has(question.id)) {
      setError("This question is already selected.");
      return;
    }

    setSelectedQuestions((current) => [
      ...current,
      {
        questionId: question.id,
        questionType: question.type,
        title: question.title,
        content: question.content,
        defaultPoints: question.points,
        points: "",
      },
    ]);
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

  const validate = () => {
    if (!title.trim()) {
      return "Assessment title is required.";
    }
    if (title.trim().length > 255) {
      return "Assessment title must not exceed 255 characters.";
    }
    const invalidPoints = selectedQuestions.some((question) => {
      if (!question.points.trim()) return false;
      const value = Number(question.points);
      return !Number.isFinite(value) || value <= 0;
    });
    if (invalidPoints) {
      return "Item points must be greater than 0.";
    }
    return "";
  };

  const buildRequest = (): AssessmentRequest => ({
    title: title.trim(),
    description: description.trim() || null,
    type,
    items: selectedQuestions.map<AssessmentItemRequest>((question, index) => ({
      questionId: question.questionId,
      points: question.points.trim() ? Number(question.points) : null,
      displayOrder: index + 1,
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

    try {
      setIsSaving(true);
      await onSubmit(buildRequest());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to save assessment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Title"
          value={title}
          maxLength={255}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Assessment title"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Type</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as AssessmentType)}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="QUIZ">Quiz</option>
            <option value="HOMEWORK">Homework</option>
            <option value="EXAM">Exam</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Optional description"
          className="w-full resize-y rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Question Selector
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              Select existing active questions from Question Bank.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <SearchInput
              value={questionQuery}
              onChange={setQuestionQuery}
              placeholder="Search questions..."
            />
            <select
              value={questionType}
              onChange={(event) =>
                setQuestionType(event.target.value as QuestionType | "")
              }
              className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            >
              <option value="">All types</option>
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="ESSAY">Essay</option>
            </select>
          </div>

          {questionError && (
            <p className="text-sm text-red-600">{questionError}</p>
          )}

          <div className="max-h-80 overflow-y-auto rounded-card border border-surface-border bg-white">
            {isQuestionLoading ? (
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            ) : questionPage.content.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">
                No questions found.
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {questionPage.content.map((question) => {
                  const isSelected = selectedQuestionIds.has(question.id);

                  return (
                    <div
                      key={question.id}
                      className="flex gap-3 p-4 hover:bg-surface-hover"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {question.title || "Untitled question"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {typeLabel[question.type]}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {previewContent(question.content)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isSelected}
                        onClick={() => addQuestion(question)}
                      >
                        {isSelected ? "Selected" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Selected Questions
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              Reorder questions and override points when needed.
            </p>
          </div>

          <div className="rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-700">
            Total points:{" "}
            <span className="font-medium text-gray-900">
              {totalPoints > 0 ? totalPoints.toFixed(2) : "-"}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-card border border-surface-border bg-white">
            {selectedQuestions.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">
                No questions selected.
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
                          {question.title || "Untitled question"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {typeLabel[question.questionType]}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {previewContent(question.content)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Default points: {question.defaultPoints ?? "-"}
                      </p>
                    </div>
                    <Input
                      label="Points"
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
                          : "Default"
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
                        Up
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={index === selectedQuestions.length - 1}
                        onClick={() => moveQuestion(index, 1)}
                      >
                        Down
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.questionId)}
                      >
                        Remove
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
          Cancel
        </Button>
        <Button type="submit" isLoading={isSaving}>
          {initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};
