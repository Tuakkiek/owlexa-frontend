import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import {
  EMPTY_EDITOR_DOCUMENT,
  isEmptyEditorDocument,
  RichTextEditor,
  type EditorDocument,
} from "../../../components/editor";
import type { GradingCriteriaResponse } from "../../../types/gradingCriteria";
import type {
  QuestionCollectionResponse,
  QuestionDifficulty,
  QuestionOptionRequest,
  QuestionRequest,
  QuestionResponse,
  QuestionType,
} from "../../../types/questionBank";
import { stripHtml } from "../../../utils/text";

interface QuestionFormProps {
  initialData?: QuestionResponse;
  collections: QuestionCollectionResponse[];
  initialCollectionId?: number;
  gradingCriteria: GradingCriteriaResponse[];
  onSubmit: (data: QuestionRequest) => Promise<void>;
  onCancel: () => void;
}

const createEmptyOptions = (): QuestionOptionRequest[] => [
  { content: "", isCorrect: false, displayOrder: 1 },
  { content: "", isCorrect: false, displayOrder: 2 },
];

export const QuestionForm = ({
  initialData,
  collections,
  initialCollectionId,
  gradingCriteria,
  onSubmit,
  onCancel,
}: QuestionFormProps) => {
  const [collectionId, setCollectionId] = useState("");
  const [sectionCode, setSectionCode] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [type, setType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [content, setContent] =
    useState<EditorDocument>(EMPTY_EDITOR_DOCUMENT);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "">("");
  const [points, setPoints] = useState("");
  const [gradingCriteriaId, setGradingCriteriaId] = useState("");
  const [explanation, setExplanation] =
    useState<EditorDocument>(EMPTY_EDITOR_DOCUMENT);
  const [sampleAnswer, setSampleAnswer] =
    useState<EditorDocument>(EMPTY_EDITOR_DOCUMENT);
  const [options, setOptions] =
    useState<QuestionOptionRequest[]>(createEmptyOptions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setCollectionId(String(initialData.collection.id));
      setSectionCode(initialData.sectionCode);
      setDisplayOrder(String(initialData.displayOrder));
      setType(initialData.type);
      setContent(initialData.content);
      setDifficulty(initialData.difficulty ?? "");
      setPoints(initialData.points != null ? String(initialData.points) : "");
      setGradingCriteriaId(
        initialData.gradingCriteria ? String(initialData.gradingCriteria.id) : "",
      );
      setExplanation(initialData.explanation ?? EMPTY_EDITOR_DOCUMENT);
      setSampleAnswer(initialData.sampleAnswer ?? EMPTY_EDITOR_DOCUMENT);
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
      setCollectionId(initialCollectionId ? String(initialCollectionId) : "");
      setSectionCode("");
      setDisplayOrder("");
      setType("MULTIPLE_CHOICE");
      setContent(EMPTY_EDITOR_DOCUMENT);
      setDifficulty("");
      setPoints("");
      setGradingCriteriaId("");
      setExplanation(EMPTY_EDITOR_DOCUMENT);
      setSampleAnswer(EMPTY_EDITOR_DOCUMENT);
      setOptions(createEmptyOptions());
    }
    setError("");
  }, [initialCollectionId, initialData]);

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
    if (!collectionId) {
      return "Vui lòng chọn Collection.";
    }
    if (!sectionCode.trim()) {
      return "Vui lòng nhập Section Code.";
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(sectionCode.trim().toUpperCase())) {
      return "Section Code chỉ gồm chữ in hoa, số và dấu gạch dưới.";
    }
    const parsedDisplayOrder = Number(displayOrder);
    if (!Number.isInteger(parsedDisplayOrder) || parsedDisplayOrder < 1) {
      return "Display Order phải là số nguyên từ 1.";
    }
    if (type === "ESSAY" && isEmptyEditorDocument(content)) {
      return "Vui lòng nhập nội dung câu hỏi.";
    }

    const parsedPoints = points.trim() ? Number(points) : null;
    if (parsedPoints != null && (!Number.isFinite(parsedPoints) || parsedPoints <= 0)) {
      return "Điểm số phải lớn hơn 0.";
    }

    if (type === "MULTIPLE_CHOICE") {
      if (normalizedOptions.length < 2) {
        return "Câu hỏi trắc nghiệm phải có ít nhất 2 phương án.";
      }
      if (normalizedOptions.some((option) => !stripHtml(option.content))) {
        return "Tất cả các phương án phải có nội dung.";
      }
      if (!normalizedOptions.some((option) => option.isCorrect)) {
        return "Vui lòng chọn ít nhất 1 đáp án đúng.";
      }
    }

    return "";
  };

  const buildRequest = (): QuestionRequest => ({
    collectionId: Number(collectionId),
    sectionCode: sectionCode.trim().toUpperCase(),
    displayOrder: Number(displayOrder),
    type,
    content: isEmptyEditorDocument(content) ? null : content,
    difficulty: difficulty || null,
    points: points.trim() ? Number(points) : null,
    gradingCriteriaId:
      type === "ESSAY" && gradingCriteriaId ? Number(gradingCriteriaId) : null,
    explanation: isEmptyEditorDocument(explanation) ? null : explanation,
    sampleAnswer:
      type === "ESSAY" && !isEmptyEditorDocument(sampleAnswer)
        ? sampleAnswer
        : null,
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
      setError(err?.response?.data?.message ?? "Không thể lưu câu hỏi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {initialData && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Mã câu hỏi
          </label>
          <input
            value={initialData.questionCode}
            readOnly
            className="w-full rounded-input border border-surface-border bg-surface-hover px-3 py-2 font-mono text-sm text-gray-600 outline-none"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Collection
          </label>
          <select
            value={collectionId}
            onChange={(event) => setCollectionId(event.target.value)}
            required
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="">Chọn Collection</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Section Code"
          value={sectionCode}
          maxLength={50}
          onChange={(event) =>
            setSectionCode(
              event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
            )
          }
          placeholder="PART_1"
          required
        />

        <Input
          label="Display Order"
          type="number"
          min="1"
          step="1"
          value={displayOrder}
          onChange={(event) => setDisplayOrder(event.target.value)}
          placeholder="1"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Loại câu hỏi</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as QuestionType)}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
            <option value="ESSAY">Tự luận</option>
          </select>
        </div>


        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Độ khó
          </label>
          <select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as QuestionDifficulty | "")
            }
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="">Chưa thiết lập</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>

        <Input
          label="Điểm số"
          type="number"
          min="0.01"
          step="0.01"
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          placeholder="Tùy chọn"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Nội dung câu hỏi
        </label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Nhập nội dung câu hỏi..."
          className="min-h-[180px]"
        />
      </div>

      {type === "MULTIPLE_CHOICE" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-gray-700">
              Phương án trả lời
            </label>
            <Button type="button" variant="secondary" size="sm" onClick={addOption}>
              Thêm phương án
            </Button>
          </div>
          <div className="space-y-3">
            {normalizedOptions.map((option, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-card border border-surface-border bg-white p-3 md:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <Input
                  label={`Phương án ${index + 1}`}
                  value={option.content}
                  onChange={(event) =>
                    updateOption(index, { content: event.target.value })
                  }
                  placeholder="Nội dung phương án"
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
                  Đáp án đúng
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  disabled={normalizedOptions.length <= 2}
                  className="self-end"
                >
                  Xóa
                </Button>
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Giải thích đáp án
            </label>
            <RichTextEditor
              value={explanation}
              onChange={setExplanation}
              placeholder="Giải thích (tùy chọn)..."
              className="min-h-[120px]"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Tiêu chí chấm điểm
            </label>
            <select
              value={gradingCriteriaId}
              onChange={(event) => setGradingCriteriaId(event.target.value)}
              className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            >
              <option value="">Chưa chọn tiêu chí</option>
              {gradingCriteria.map((criteria) => (
                <option key={criteria.id} value={criteria.id}>
                  {criteria.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Bài mẫu / Đáp án tham khảo
            </label>
            <RichTextEditor
              value={sampleAnswer}
              onChange={setSampleAnswer}
              placeholder="Bài mẫu (tùy chọn)..."
              className="min-h-[160px]"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );
};
