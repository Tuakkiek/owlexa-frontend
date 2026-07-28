import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import {
  EMPTY_EDITOR_DOCUMENT,
  isEmptyEditorDocument,
  RichTextEditor,
  type EditorDocument,
} from "../../../components/editor";
import type {
  GradingCriteriaRequest,
  GradingCriteriaResponse,
} from "../../../types/gradingCriteria";

interface GradingCriteriaFormProps {
  initialData?: GradingCriteriaResponse;
  onSubmit: (data: GradingCriteriaRequest) => Promise<void>;
  onCancel: () => void;
}

export const GradingCriteriaForm = ({
  initialData,
  onSubmit,
  onCancel,
}: GradingCriteriaFormProps) => {
  const [name, setName] = useState("");
  const [content, setContent] =
    useState<EditorDocument>(EMPTY_EDITOR_DOCUMENT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setContent(initialData.content);
    } else {
      setName("");
      setContent(EMPTY_EDITOR_DOCUMENT);
    }
    setError("");
  }, [initialData]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Vui lòng nhập tên tiêu chí.");
      return;
    }

    if (isEmptyEditorDocument(content)) {
      setError("Vui lòng nhập nội dung tiêu chí.");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        name: name.trim(),
        content,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu tiêu chí chấm điểm.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Tên tiêu chí"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ví dụ: IELTS Writing Task 2"
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Nội dung tiêu chí
        </label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Nhập nội dung tiêu chí chấm điểm..."
          className="min-h-[260px]"
        />
      </div>

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
