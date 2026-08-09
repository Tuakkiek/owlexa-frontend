import { Badge } from "../../../components/ui/SharedComponents";
import type {
  AssessmentDetailResponse,
  AssessmentStatus,
  PlaybackMode,
} from "../../../types/assessmentBuilder";
import type { QuestionType } from "../../../types/questionBank";
import { stripHtml } from "../../../utils/text";
import {
  RichTextRenderer,
  isEmptyEditorDocument,
  type EditorDocument,
} from "../../../components/editor";
import {
  extractQuestionIdsFromDoc,
  stripQuestionNodes,
} from "../../../utils/editorDoc";

interface AssessmentPreviewProps {
  assessment: AssessmentDetailResponse;
}

const statusLabel: Record<AssessmentStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const playbackModeLabel: Record<PlaybackMode, string> = {
  EXAM: "Exam playback",
  PRACTICE: "Practice playback",
};

const questionTypeLabel: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  ESSAY: "Essay",
};

export const AssessmentPreview = ({ assessment }: AssessmentPreviewProps) => {
  const sortedItems = assessment.items
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const totalPoints = sortedItems.reduce(
    (sum, item) => (item.points != null ? sum + item.points : sum),
    0,
  );

  const getBlockForItem = (item: any, fallbackIndex: number) => {
    if (!assessment.blocks || assessment.blocks.length === 0) return null;
    const targetId = item.questionId ?? item.id;
    for (const block of assessment.blocks) {
      if (!block.content) continue;
      const qIds = extractQuestionIdsFromDoc(block.content);
      if (targetId != null && qIds.includes(targetId)) {
        return block;
      }
    }
    return assessment.blocks[fallbackIndex] ?? null;
  };

  const getQuestionContextDoc = (
    item: any,
    itemIndex: number,
  ): EditorDocument | null => {
    if (!assessment.blocks || assessment.blocks.length === 0) return null;

    const currentBlock = getBlockForItem(item, itemIndex);
    if (!currentBlock || !currentBlock.content) return null;

    const prevItem = itemIndex > 0 ? sortedItems[itemIndex - 1] : null;
    const prevBlock = prevItem ? getBlockForItem(prevItem, itemIndex - 1) : null;

    if (currentBlock !== prevBlock) {
      return stripQuestionNodes(currentBlock.content);
    }

    return null;
  };

  const renderQuestionContent = (item: any, itemIndex: number) => {
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
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {assessment.title}
          </h3>
          <Badge>{statusLabel[assessment.status]}</Badge>
        </div>
        {(!assessment.blocks || assessment.blocks.length === 0) &&
          assessment.content && <RichTextRenderer value={assessment.content} />}
        {assessment.audioFile && (
          <div className="rounded-card border border-surface-border bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                Listening audio
              </span>
              <Badge>{playbackModeLabel[assessment.playbackMode]}</Badge>
            </div>
            <audio
              controls
              preload="metadata"
              src={assessment.audioFile.url}
              className="w-full"
            >
              Browser does not support audio.
            </audio>
          </div>
        )}
        <p className="text-sm text-gray-500">
          {sortedItems.length} questions -{" "}
          {totalPoints > 0 ? `${totalPoints.toFixed(2)} points` : "No points"}
        </p>
      </div>

      {sortedItems.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-10 text-center text-sm text-gray-400">
          No questions in this assessment.
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
                      Question {item.displayOrder}
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
                  Points: {item.points ?? "-"}
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
                        <span className="text-gray-400 font-semibold">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        {stripHtml(option.content).trim() && (
                          <span className="min-w-0 flex-1 text-gray-700">
                            {stripHtml(option.content).trim()}
                          </span>
                        )}
                        {option.isCorrect && (
                          <span className="text-xs font-medium text-gray-900">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {item.questionType === "ESSAY" && (
                <div className="mt-4 rounded-input border border-surface-border bg-surface-page px-3 py-2 text-sm text-gray-600">
                  Grading criteria: {item.gradingCriteriaName ?? "-"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
