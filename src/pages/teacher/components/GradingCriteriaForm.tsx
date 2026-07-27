import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { RichTextEditor } from "../../../components/ui/RichTextEditor";
import type {
  GradingCriteriaRequest,
  GradingCriteriaResponse,
} from "../../../types/gradingCriteria";
import { stripHtml } from "../../../utils/text";

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
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setContent(initialData.content);
    } else {
      setName("");
      setContent("");
    }
    setError("");
  }, [initialData]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!stripHtml(content)) {
      setError("Content is required.");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        name: name.trim(),
        content: content.trim(),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to save criteria.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="IELTS Writing Task 2"
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Content
        </label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Enter grading criteria..."
          className="min-h-[260px]"
        />
      </div>

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
