import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { RichTextEditor } from "../../../components/ui/RichTextEditor";
import type { GradingCriteriaResponse } from "../../../types/gradingCriteria";
import type {
  QuestionDifficulty,
  QuestionOptionRequest,
  QuestionRequest,
  QuestionResponse,
  QuestionType,
} from "../../../types/questionBank";

interface QuestionFormProps {
  initialData?: QuestionResponse;
  gradingCriteria: GradingCriteriaResponse[];
  onSubmit: (data: QuestionRequest) => Promise<void>;
  onCancel: () => void;
}

const getPlainText = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};

const createEmptyOptions = (): QuestionOptionRequest[] => [
  { content: "", isCorrect: false, displayOrder: 1 },
  { content: "", isCorrect: false, displayOrder: 2 },
];

export const QuestionForm = ({
  initialData,
  gradingCriteria,
  onSubmit,
  onCancel,
}: QuestionFormProps) => {
  const [type, setType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "">("");
  const [points, setPoints] = useState("");
  const [gradingCriteriaId, setGradingCriteriaId] = useState("");
  const [explanation, setExplanation] = useState("");
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [options, setOptions] =
    useState<QuestionOptionRequest[]>(createEmptyOptions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title ?? "");
      setContent(initialData.content);
      setDifficulty(initialData.difficulty ?? "");
      setPoints(initialData.points != null ? String(initialData.points) : "");
      setGradingCriteriaId(
        initialData.gradingCriteria ? String(initialData.gradingCriteria.id) : "",
      );
      setExplanation(initialData.explanation ?? "");
      setSampleAnswer(initialData.sampleAnswer ?? "");
      setOptions(
        initialData.type === "MULTIPLE_CHOICE" && initialData.options
          ? initialData.options
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((option, index) => ({
                content: option.content,
                isCorrect: option.isCorrect,
                displayOrder: index + 1,
              }))
          : createEmptyOptions(),
      );
    } else {
      setType("MULTIPLE_CHOICE");
      setTitle("");
      setContent("");
      setDifficulty("");
      setPoints("");
      setGradingCriteriaId("");
      setExplanation("");
      setSampleAnswer("");
      setOptions(createEmptyOptions());
    }
    setError("");
  }, [initialData]);

  useEffect(() => {
    if (type === "MULTIPLE_CHOICE" && options.length === 0) {
      setOptions(createEmptyOptions());
    }
    if (type === "MULTIPLE_CHOICE") {
      setGradingCriteriaId("");
    }
  }, [options.length, type]);

  const normalizedOptions = useMemo(
    () =>
      options.map((option, index) => ({
        ...option,
        displayOrder: index + 1,
      })),
    [options],
  );

  const updateOption = (
    index: number,
    patch: Partial<QuestionOptionRequest>,
  ) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    );
  };

  const addOption = () => {
    setOptions((current) => [
      ...current,
      { content: "", isCorrect: false, displayOrder: current.length + 1 },
    ]);
  };

  const removeOption = (index: number) => {
    setOptions((current) =>
      current.filter((_, optionIndex) => optionIndex !== index),
    );
  };

  const validate = () => {
    if (!getPlainText(content)) {
      return "Question content is required.";
    }

    const parsedPoints = points.trim() ? Number(points) : null;
    if (parsedPoints != null && (!Number.isFinite(parsedPoints) || parsedPoints <= 0)) {
      return "Points must be greater than 0.";
    }

    if (type === "MULTIPLE_CHOICE") {
      if (normalizedOptions.length < 2) {
        return "Multiple choice questions must have at least 2 options.";
      }
      if (normalizedOptions.some((option) => !getPlainText(option.content))) {
        return "All options must have content.";
      }
      if (!normalizedOptions.some((option) => option.isCorrect)) {
        return "Select at least 1 correct option.";
      }
    }

    return "";
  };

  const buildRequest = (): QuestionRequest => ({
    type,
    title: title.trim() || null,
    content: content.trim(),
    difficulty: difficulty || null,
    points: points.trim() ? Number(points) : null,
    gradingCriteriaId:
      type === "ESSAY" && gradingCriteriaId ? Number(gradingCriteriaId) : null,
    explanation: explanation.trim() || null,
    sampleAnswer:
      type === "ESSAY" && sampleAnswer.trim() ? sampleAnswer.trim() : null,
    options: type === "MULTIPLE_CHOICE" ? normalizedOptions : null,
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
      setIsLoading(true);
      await onSubmit(buildRequest());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to save question.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Type</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as QuestionType)}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="ESSAY">Essay</option>
          </select>
        </div>

        <Input
          label="Title"
          value={title}
          maxLength={255}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional short label"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as QuestionDifficulty | "")
            }
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="">Not set</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <Input
          label="Points"
          type="number"
          min="0.01"
          step="0.01"
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Question Content
        </label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Enter question content..."
          className="min-h-[180px]"
        />
      </div>

      {type === "MULTIPLE_CHOICE" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-gray-700">
              Options
            </label>
            <Button type="button" variant="secondary" size="sm" onClick={addOption}>
              Add Option
            </Button>
          </div>
          <div className="space-y-3">
            {normalizedOptions.map((option, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-card border border-surface-border bg-white p-3 md:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <Input
                  label={`Option ${index + 1}`}
                  value={option.content}
                  onChange={(event) =>
                    updateOption(index, { content: event.target.value })
                  }
                  placeholder="Option content"
                />
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={(event) =>
                      updateOption(index, { isCorrect: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-surface-border"
                  />
                  Correct
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  disabled={normalizedOptions.length <= 2}
                  className="self-end"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Explanation
            </label>
            <RichTextEditor
              value={explanation}
              onChange={setExplanation}
              placeholder="Optional explanation..."
              className="min-h-[120px]"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Grading Criteria
            </label>
            <select
              value={gradingCriteriaId}
              onChange={(event) => setGradingCriteriaId(event.target.value)}
              className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            >
              <option value="">No criteria selected</option>
              {gradingCriteria.map((criteria) => (
                <option key={criteria.id} value={criteria.id}>
                  {criteria.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sample Answer
            </label>
            <RichTextEditor
              value={sampleAnswer}
              onChange={setSampleAnswer}
              placeholder="Optional sample answer..."
              className="min-h-[160px]"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};
