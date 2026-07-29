import { Badge } from "../../../components/ui/SharedComponents";
import type {
  AssessmentDetailResponse,
  AssessmentStatus,
  AssessmentType,
  PlaybackMode,
} from "../../../types/assessmentBuilder";
import type { QuestionType } from "../../../types/questionBank";
import { stripHtml } from "../../../utils/text";
import { RichTextRenderer } from "../../../components/editor";

interface AssessmentPreviewProps {
  assessment: AssessmentDetailResponse;
}

const typeLabel: Record<AssessmentType, string> = {
  QUIZ: "Quiz",
  HOMEWORK: "Homework",
  EXAM: "Exam",
};

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

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {assessment.title}
          </h3>
          <Badge>{typeLabel[assessment.type]}</Badge>
          <Badge>{statusLabel[assessment.status]}</Badge>
        </div>
        <RichTextRenderer value={assessment.content} />
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
          {sortedItems.map((item, index) => (
            <div
              key={item.id}
              className="rounded-card border border-surface-border bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      Question {index + 1}
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

              <div className="mt-3 text-sm text-gray-700">
                <RichTextRenderer value={item.content} />
              </div>

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
