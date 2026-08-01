import { Badge } from "../../../components/ui/SharedComponents";
import type {
  AssignmentItemResponse,
  AssignmentStatus,
} from "../../../types/assignment";
import type {
  AssessmentBlockResponse,
  PlaybackMode,
} from "../../../types/assessmentBuilder";
import type { FileMetadata } from "../../../types/file";
import type { QuestionType } from "../../../types/questionBank";
import {
  RichTextRenderer,
  isEmptyEditorDocument,
  type EditorDocument,
} from "../../../components/editor";
import { formatDateTime } from "../../../utils/dateTime";
import { stripHtml } from "../../../utils/text";
import {
  extractQuestionIdsFromDoc,
  stripQuestionNodes,
} from "../../../utils/editorDoc";

interface AssignmentPreviewProps {
  title: string;
  description: string | null;
  content: EditorDocument;
  status: AssignmentStatus;
  openAt: string | null;
  dueAt: string | null;
  attemptLimit: number | null;
  assessmentSnapshotAt?: string | null;
  audioFile?: FileMetadata | null;
  playbackMode?: PlaybackMode | null;
  items: AssignmentItemResponse[];
  blocks?: AssessmentBlockResponse[] | null;
}

const statusLabel: Record<AssignmentStatus, string> = {
  DRAFT: "Nháp",
  SCHEDULED: "Đã lên lịch",
  ACTIVE: "Đang diễn ra",
  CLOSED: "Đã đóng",
  ARCHIVED: "Đã lưu trữ",
};

const questionTypeLabel: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  ESSAY: "Tự luận",
};

const playbackModeLabel: Record<PlaybackMode, string> = {
  EXAM: "Chế độ thi",
  PRACTICE: "Chế độ luyện tập",
};

export const AssignmentPreview = ({
  title,
  description,
  content,
  status,
  openAt,
  dueAt,
  attemptLimit,
  assessmentSnapshotAt,
  audioFile,
  playbackMode,
  items,
  blocks,
}: AssignmentPreviewProps) => {
  const sortedItems = items
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const totalPoints = sortedItems.reduce(
    (sum, item) => (item.points != null ? sum + item.points : sum),
    0,
  );

  const getQuestionContextDoc = (
    item: AssignmentItemResponse,
    index: number,
  ): EditorDocument | null => {
    if (blocks && blocks.length > 0) {
      for (const block of blocks) {
        if (!block.content) continue;
        const qIds = extractQuestionIdsFromDoc(block.content);
        if (qIds.includes(item.assessmentItemId ?? item.id)) {
          return stripQuestionNodes(block.content);
        }
      }
      if (blocks[index]?.content) {
        return stripQuestionNodes(blocks[index].content);
      }
    }
    return null;
  };

  const renderQuestionContent = (
    item: AssignmentItemResponse,
    itemIndex: number,
  ) => {
    const contextDoc = getQuestionContextDoc(item, itemIndex);
    const hasContext = contextDoc != null && !isEmptyEditorDocument(contextDoc);
    return (
      <div className="mt-3 space-y-3 text-sm text-gray-700">
        {hasContext && (
          <div className="rounded-input border border-surface-border bg-surface-page px-3 py-2 text-xs text-gray-500">
            <RichTextRenderer value={contextDoc!} />
          </div>
        )}
        <RichTextRenderer value={item.content} />
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Badge>{statusLabel[status]}</Badge>
        </div>
        {description && <p className="text-sm text-gray-600">{description}</p>}
        <div className="rounded-card border border-surface-border bg-white p-4 text-sm text-gray-700">
          <RichTextRenderer value={content} />
        </div>
        <div className="grid gap-3 rounded-card border border-surface-border bg-white p-4 text-sm text-gray-600 md:grid-cols-2">
          <div>Mở: {formatDateTime(openAt)}</div>
          <div>Hạn nộp: {formatDateTime(dueAt)}</div>
          <div>Giới hạn lượt làm: {attemptLimit ?? "-"}</div>
          <div>Bản chụp lúc: {formatDateTime(assessmentSnapshotAt)}</div>
          <div>
            {sortedItems.length} câu hỏi -{" "}
            {totalPoints > 0 ? `${totalPoints.toFixed(2)} điểm` : "Không có điểm"}
          </div>
        </div>
        {audioFile && (
          <div className="rounded-card border border-surface-border bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                Audio nghe
              </span>
              <Badge>{playbackModeLabel[playbackMode ?? "PRACTICE"]}</Badge>
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
        )}
      </div>

      {sortedItems.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-10 text-center text-sm text-gray-400">
          Không có câu hỏi bản chụp nào.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item, itemIndex) => (
            <div
              key={item.id}
              className="rounded-card border border-surface-border bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      Câu hỏi {item.displayOrder}
                    </span>
                    <span className="text-xs text-gray-500">
                      {questionTypeLabel[item.questionType]}
                    </span>
                  </div>
                  {item.title && (
                    <h4 className="mt-1 text-sm font-medium text-gray-900">
                      {item.title}
                    </h4>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Điểm: {item.points ?? "-"}
                </div>
              </div>

              {renderQuestionContent(item, itemIndex)}

              {item.questionType === "MULTIPLE_CHOICE" && (
                <div className="mt-4 space-y-2">
                  {item.options
                    .slice()
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className="flex gap-3 rounded-input border border-surface-border px-3 py-2 text-sm"
                      >
                        <span className="text-gray-400">
                          {optionIndex + 1}.
                        </span>
                        <span className="min-w-0 flex-1 text-gray-700">
                          {stripHtml(option.content) || "-"}
                        </span>
                        {option.isCorrect && (
                          <span className="text-xs font-medium text-gray-900">
                            Đúng
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {item.questionType === "ESSAY" && (
                <div className="mt-4 rounded-input border border-surface-border bg-surface-page px-3 py-2 text-sm text-gray-600">
                  Tiêu chí chấm điểm: {item.gradingCriteriaName ?? "-"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
