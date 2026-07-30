import { Badge } from "../../../components/ui/SharedComponents";
import type {
  AssignmentItemResponse,
  AssignmentStatus,
} from "../../../types/assignment";
import type { AssessmentType, PlaybackMode } from "../../../types/assessmentBuilder";
import type { FileMetadata } from "../../../types/file";
import type { QuestionType } from "../../../types/questionBank";
import type { EditorDocument } from "../../../components/editor";
import { formatDateTime } from "../../../utils/dateTime";
import { stripHtml } from "../../../utils/text";
import { RichTextRenderer } from "../../../components/editor";

interface AssignmentPreviewProps {
  title: string;
  description: string | null;
  content: EditorDocument;
  type: AssessmentType;
  status: AssignmentStatus;
  openAt: string | null;
  dueAt: string | null;
  attemptLimit: number | null;
  assessmentSnapshotAt?: string | null;
  audioFile?: FileMetadata | null;
  playbackMode?: PlaybackMode | null;
  items: AssignmentItemResponse[];
}

const typeLabel: Record<AssessmentType, string> = {
  QUIZ: "Quiz",
  HOMEWORK: "Homework",
  EXAM: "Exam",
};

const statusLabel: Record<AssignmentStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

const questionTypeLabel: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  ESSAY: "Essay",
};

const playbackModeLabel: Record<PlaybackMode, string> = {
  EXAM: "Exam playback",
  PRACTICE: "Practice playback",
};

export const AssignmentPreview = ({
  title,
  description,
  content,
  type,
  status,
  openAt,
  dueAt,
  attemptLimit,
  assessmentSnapshotAt,
  audioFile,
  playbackMode,
  items,
}: AssignmentPreviewProps) => {
  const sortedItems = items.slice().sort((a, b) => a.displayOrder - b.displayOrder);
  const totalPoints = sortedItems.reduce(
    (sum, item) => (item.points != null ? sum + item.points : sum),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Badge>{typeLabel[type]}</Badge>
          <Badge>{statusLabel[status]}</Badge>
        </div>
        {description && <p className="text-sm text-gray-600">{description}</p>}
        <div className="rounded-card border border-surface-border bg-white p-4 text-sm text-gray-700">
          <RichTextRenderer value={content} />
        </div>
        <div className="grid gap-3 rounded-card border border-surface-border bg-white p-4 text-sm text-gray-600 md:grid-cols-2">
          <div>Open: {formatDateTime(openAt)}</div>
          <div>Due: {formatDateTime(dueAt)}</div>
          <div>Attempt limit: {attemptLimit ?? "-"}</div>
          <div>Snapshot at: {formatDateTime(assessmentSnapshotAt)}</div>
          <div>
            {sortedItems.length} questions -{" "}
            {totalPoints > 0 ? `${totalPoints.toFixed(2)} points` : "No points"}
          </div>
        </div>
        {audioFile && (
          <div className="rounded-card border border-surface-border bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                Listening audio
              </span>
              <Badge>{playbackModeLabel[playbackMode ?? "PRACTICE"]}</Badge>
            </div>
            <audio controls preload="metadata" src={audioFile.url} className="w-full">
              Browser does not support audio.
            </audio>
          </div>
        )}
      </div>

      {sortedItems.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-10 text-center text-sm text-gray-400">
          No snapshot questions available.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item) => (
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
