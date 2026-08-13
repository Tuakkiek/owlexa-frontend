import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { FormEvent } from "react";
import { questionBankApi } from "../../../api/questionBankApi";
import { questionCollectionApi } from "../../../api/questionCollectionApi";
import { Button } from "../../../components/ui/Button";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import { Input } from "../../../components/ui/Input";
import { editorFileUploadService } from "../../../components/editor/services/fileUploadService";
import { SearchInput } from "../../../components/ui/SharedComponents";
import {
  editorDocumentToPlainText,
  EMPTY_EDITOR_DOCUMENT,
  RichTextEditor,
  type EditorDocument,
} from "../../../components/editor";
import type {
  AssessmentBlockRequest,
  AssessmentDetailResponse,
  AssessmentRequest,
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

interface FormBlock {
  id?: number;
  title: string;
  content: EditorDocument;
}

const PAGE_SIZE = 8;

const emptyQuestionPage: QuestionPageResponse<QuestionResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
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

export const AssessmentForm = ({
  initialData,
  onSubmit,
  onCancel,
}: AssessmentFormProps) => {
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const [audioFile, setAudioFile] = useState<FileMetadata | null>(null);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("PRACTICE");
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);

  // Multi-block document state
  const [blocks, setBlocks] = useState<FormBlock[]>([
    { title: "Nội dung chính", content: EMPTY_EDITOR_DOCUMENT },
  ]);

  // Question Picker Modal state
  const [activeBlockIndexForPicker, setActiveBlockIndexForPicker] = useState<number | null>(null);
  const [questionQuery, setQuestionQuery] = useState("");
  const [collections, setCollections] = useState<QuestionCollectionResponse[]>([]);
  const [questionCollectionId, setQuestionCollectionId] = useState<number | "">("");
  const [questionSectionCode, setQuestionSectionCode] = useState("");
  const [questionSectionCodes, setQuestionSectionCodes] = useState<string[]>([]);
  const [questionDifficulty, setQuestionDifficulty] = useState<QuestionDifficulty | "">("");
  const [questionType, setQuestionType] = useState<QuestionType | "">("");
  const [pickerSelectedIds, setPickerSelectedIds] = useState<Set<number>>(new Set());
  const [questionPickerPage, setQuestionPickerPage] = useState(0);
  const [questionPage, setQuestionPage] = useState<QuestionPageResponse<QuestionResponse>>(emptyQuestionPage);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setAudioFile(initialData.audioFile ?? null);
      setPlaybackMode(initialData.playbackMode ?? "PRACTICE");

      if (initialData.blocks && initialData.blocks.length > 0) {
        setBlocks(
          initialData.blocks.map((b) => ({
            id: b.id,
            title: b.title || `Content Block ${b.position + 1}`,
            content: b.content ?? EMPTY_EDITOR_DOCUMENT,
          })),
        );
      } else {
        setBlocks([
          {
            title: "Nội dung chính",
            content: initialData.content ?? EMPTY_EDITOR_DOCUMENT,
          },
        ]);
      }
    } else {
      setTitle("");
      setAudioFile(null);
      setPlaybackMode("PRACTICE");
      setBlocks([{ title: "Content Block 1", content: EMPTY_EDITOR_DOCUMENT }]);
    }
    setError("");
  }, [initialData]);

  // Fetch collections
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
    if (activeBlockIndexForPicker === null) return;
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
        err?.response?.data?.message ?? "Không thể tải câu hỏi.",
      );
    } finally {
      setIsQuestionLoading(false);
    }
  }, [
    activeBlockIndexForPicker,
    questionCollectionId,
    questionDifficulty,
    questionPickerPage,
    questionQuery,
    questionSectionCode,
    questionType,
  ]);

  useEffect(() => {
    if (activeBlockIndexForPicker === null) return;
    const timeout = window.setTimeout(() => {
      void loadQuestions();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [activeBlockIndexForPicker, loadQuestions]);

  // Block handlers
  const handleAddBlock = () => {
    setBlocks((prev) => [
      ...prev,
      {
        title: `Content Block ${prev.length + 1}`,
        content: EMPTY_EDITOR_DOCUMENT,
      },
    ]);
  };

  const handleRemoveBlock = async (index: number) => {
    if (blocks.length <= 1) {
      setError("Đề thi phải có ít nhất 1 Content Block.");
      return;
    }
    const confirmed = await confirm({
      title: "Xóa Content Block?",
      message: `Bạn có chắc muốn xóa Block ${index + 1}? Tất cả nội dung và câu hỏi nhúng trong block này sẽ bị xóa khỏi đề.`,
      confirmText: "Xóa Block",
      variant: "danger",
    });
    if (!confirmed) return;
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleBlockContentChange = (index: number, content: EditorDocument) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, content } : b)),
    );
  };

  const handleBlockTitleChange = (index: number, title: string) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, title } : b)),
    );
  };

  // Insert embedded question into current active block's TipTap document
  const handleInsertSelectedQuestionsToBlock = () => {
    if (activeBlockIndexForPicker === null) return;
    const selectedQuestions = questionPage.content.filter((q) =>
      pickerSelectedIds.has(q.id),
    );
    if (selectedQuestions.length === 0) return;

    setBlocks((prev) =>
      prev.map((block, idx) => {
        if (idx !== activeBlockIndexForPicker) return block;

        const currentContent = block.content ?? EMPTY_EDITOR_DOCUMENT;
        const existingNodes = Array.isArray(currentContent.content)
          ? [...currentContent.content]
          : [];

        const questionNodes = selectedQuestions.map((q) => ({
          type: "assessmentQuestion",
          attrs: {
            questionId: q.id,
            points: q.points ?? 1,
          },
        }));

        return {
          ...block,
          content: {
            ...currentContent,
            type: "doc",
            content: [...existingNodes, ...questionNodes],
          },
        };
      }),
    );

    setActiveBlockIndexForPicker(null);
    setPickerSelectedIds(new Set());
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
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải audio.");
    } finally {
      setIsAudioUploading(false);
    }
  };

  // Count total questions across all TipTap blocks
  const countQuestionsInDoc = (node: any): number => {
    if (!node) return 0;
    let count = 0;
    if (node.type === "assessmentQuestion") count += 1;
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        count += countQuestionsInDoc(child);
      }
    }
    return count;
  };

  const totalQuestionsEmbedded = useMemo(() => {
    return blocks.reduce((sum, b) => sum + countQuestionsInDoc(b.content), 0);
  }, [blocks]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề đề thi.");
      return;
    }

    const blockRequests: AssessmentBlockRequest[] = blocks.map((b, i) => ({
      id: b.id,
      position: i,
      title: b.title.trim() || `Content Block ${i + 1}`,
      content: b.content ?? EMPTY_EDITOR_DOCUMENT,
    }));

    const request: AssessmentRequest = {
      title: title.trim(),
      description: editorDocumentToPlainText(blocks[0]?.content).slice(0, 500) || null,
      audioFileId: audioFile?.id ?? null,
      playbackMode,
      blocks: blockRequests,
    };

    try {
      setIsSaving(true);
      await onSubmit(request);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu đề thi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      {/* Header Panel */}
      <div className="bg-white overflow-visible rounded-card p-6 shadow-sm border border-surface-border space-y-6">
        <div className="border-b border-surface-border pb-3">
          <h3 className="text-lg font-semibold text-gray-900">Thông tin đề thi</h3>
          <p className="text-sm text-gray-500">
            Thiết lập tiêu đề, loại đề thi và tệp audio dùng chung.
          </p>
        </div>

        <div className="grid gap-4">
          <Input
            label="Tiêu đề đề thi"
            value={title}
            maxLength={255}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: TOEIC Mock Test #1"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Audio dùng chung (tùy chọn)</label>
            <div className="rounded-card border border-surface-border bg-white p-3">
              {audioFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-gray-900">
                      {audioFile.originalName} ({formatFileSize(audioFile.size)})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAudioFile(null)}
                    >
                      Xóa
                    </Button>
                  </div>
                  <audio controls src={audioFile.url} className="w-full" />
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center rounded-input border border-surface-border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-surface-hover">
                  {isAudioUploading ? `Đang tải ${audioUploadProgress}%` : "Tải audio đính kèm"}
                  <input
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    disabled={isAudioUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadAssessmentAudio(f);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Chế độ phát</label>
            <select
              value={playbackMode}
              onChange={(event) => setPlaybackMode(event.target.value as PlaybackMode)}
              className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            >
              <option value="PRACTICE">Luyện tập (Practice)</option>
              <option value="EXAM">Thi chính thức (Exam)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Multi-Block Document Workspace */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Cấu trúc các Content Block</h3>
            <p className="text-sm text-gray-500">
              Mỗi Content Block là một TipTap Editor độc lập. Bạn có thể soạn văn bản, chèn audio/ảnh/video và chèn các câu hỏi trực tiếp vào đúng vị trí nội dung.
            </p>
          </div>
          <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            Đã chèn {totalQuestionsEmbedded} câu hỏi
          </span>
        </div>

        {blocks.map((block, index) => (
          <div
            key={index}
            className="rounded-card border border-surface-border bg-white p-5 shadow-sm ring-1 ring-black/5 space-y-4"
          >
            {/* Block Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-3">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={block.title}
                  onChange={(e) => handleBlockTitleChange(index, e.target.value)}
                  className="font-semibold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-primary outline-none px-1 py-0.5 text-base w-full max-w-xs"
                  placeholder={`Content Block ${index + 1}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => handleMoveBlock(index, -1)}
                  title="Di chuyển lên"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === blocks.length - 1}
                  onClick={() => handleMoveBlock(index, 1)}
                  title="Di chuyển xuống"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleRemoveBlock(index)}
                  title="Xóa Block"
                >
                  Xóa Block
                </Button>
              </div>
            </div>

            {/* Block TipTap Editor */}
            <RichTextEditor
              value={block.content}
              onChange={(updatedContent) => handleBlockContentChange(index, updatedContent)}
              placeholder={`Nhập nội dung văn bản, hướng dẫn hoặc chèn câu hỏi cho Block ${index + 1}...`}
              minHeight={260}
              onInsertQuestion={() => {
                setActiveBlockIndexForPicker(index);
                setPickerSelectedIds(new Set());
              }}
            />
          </div>
        ))}

        {/* Add Block Button */}
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddBlock}
            className="border-dashed border-2 px-6 py-3 text-primary border-primary/40 hover:border-primary hover:bg-primary/5"
          >
            + Thêm Content Block
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Submit Actions Footer */}
      <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-white p-4 rounded-card border border-surface-border shadow-sm">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Đang lưu đề thi..." : initialData ? "Cập nhật đề thi" : "Lưu bản nháp đề thi"}
        </Button>
      </div>

      {/* Question Picker Modal */}
      {activeBlockIndexForPicker !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-card bg-white p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Chèn câu hỏi vào Content Block {activeBlockIndexForPicker + 1}
              </h3>
              <button
                type="button"
                onClick={() => setActiveBlockIndexForPicker(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)] flex-1 overflow-hidden">
              {/* Collection list sidebar */}
              <aside className="max-h-full overflow-y-auto rounded-card border border-surface-border bg-white">
                <div className="border-b border-surface-border px-3 py-2 text-xs font-semibold text-gray-900">
                  Bộ sưu tập
                </div>
                {collections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => {
                      setQuestionCollectionId(col.id);
                      setQuestionSectionCode("");
                      setQuestionPickerPage(0);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${
                      questionCollectionId === col.id
                        ? "bg-blue-50 font-medium text-primary"
                        : "hover:bg-surface-hover"
                    }`}
                  >
                    <span className="truncate">{col.name}</span>
                    <span className="text-gray-400">{col.questionCount}</span>
                  </button>
                ))}
              </aside>

              {/* Questions table & filters */}
              <div className="flex flex-col min-w-0 space-y-3 overflow-hidden">
                <div className="grid gap-2 sm:grid-cols-3">
                  <SearchInput
                    value={questionQuery}
                    onChange={(val) => {
                      setQuestionQuery(val);
                      setQuestionPickerPage(0);
                    }}
                    placeholder="Tìm câu hỏi..."
                  />
                  <select
                    value={questionSectionCode}
                    onChange={(e) => {
                      setQuestionSectionCode(e.target.value);
                      setQuestionPickerPage(0);
                    }}
                    className="rounded-input border border-surface-border bg-white px-2 py-1.5 text-xs text-gray-900"
                  >
                    <option value="">Tất cả Section</option>
                    {questionSectionCodes.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  <select
                    value={questionDifficulty}
                    onChange={(e) => {
                      setQuestionDifficulty(e.target.value as QuestionDifficulty | "");
                      setQuestionPickerPage(0);
                    }}
                    className="rounded-input border border-surface-border bg-white px-2 py-1.5 text-xs text-gray-900"
                  >
                    <option value="">Tất cả độ khó</option>
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                  <select
                    value={questionType}
                    onChange={(e) => {
                      setQuestionType(e.target.value as QuestionType | "");
                      setQuestionPickerPage(0);
                    }}
                    className="rounded-input border border-surface-border bg-white px-2 py-1.5 text-xs text-gray-900"
                  >
                    <option value="">Tất cả dạng câu hỏi</option>
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                    <option value="ESSAY">Tự luận</option>
                  </select>
                </div>

                {/* Questions list */}
                <div className="flex-1 overflow-y-auto rounded-card border border-surface-border bg-white p-3 space-y-2">
                  {isQuestionLoading ? (
                    <div className="py-8 text-center text-xs text-gray-400">Đang tải câu hỏi...</div>
                  ) : questionError ? (
                    <div className="py-8 text-center text-xs text-red-500">{questionError}</div>
                  ) : questionPage.content.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">Không tìm thấy câu hỏi nào.</div>
                  ) : (
                    questionPage.content.map((q) => {
                      const isSelected = pickerSelectedIds.has(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => {
                            setPickerSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(q.id)) next.delete(q.id);
                              else next.add(q.id);
                              return next;
                            });
                          }}
                          className={`flex cursor-pointer items-start gap-3 rounded-card border p-3 transition-colors ${
                            isSelected
                              ? "border-primary bg-blue-50/50"
                              : "border-surface-border hover:bg-surface-hover"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">
                                Câu #{q.id}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">
                                [{q.questionCode}]
                              </span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                {q.type}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-700 line-clamp-2">
                              {editorDocumentToPlainText(q.content) || "Không có văn bản"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span>Trang {questionPickerPage + 1} / {Math.max(questionPage.totalPages, 1)}</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={questionPickerPage === 0}
                      onClick={() => setQuestionPickerPage((p) => Math.max(p - 1, 0))}
                    >
                      Trước
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={questionPickerPage + 1 >= questionPage.totalPages}
                      onClick={() => setQuestionPickerPage((p) => p + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-3 border-t border-surface-border pt-4 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveBlockIndexForPicker(null)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                disabled={pickerSelectedIds.size === 0}
                onClick={handleInsertSelectedQuestionsToBlock}
              >
                Chèn đã chọn ({pickerSelectedIds.size})
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
