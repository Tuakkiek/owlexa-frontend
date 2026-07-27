import { Badge } from "../../../components/ui/SharedComponents";
import type {
  AssignmentItemResponse,
  AssignmentStatus,
} from "../../../types/assignment";
import type { AssessmentType } from "../../../types/assessmentBuilder";
import type { QuestionType } from "../../../types/questionBank";
import { formatDateTime } from "../../../utils/dateTime";
import { stripHtml } from "../../../utils/text";

interface AssignmentPreviewProps {
  title: string;
  description: string | null;
  type: AssessmentType;
  status: AssignmentStatus;
  openAt: string | null;
  dueAt: string | null;
  attemptLimit: number | null;
  assessmentSnapshotAt?: string | null;
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

export const AssignmentPreview = ({
  title,
  description,
  type,
  status,
  openAt,
  dueAt,
  attemptLimit,
  assessmentSnapshotAt,
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
      </div>

      {sortedItems.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-10 text-center text-sm text-gray-400">
          No snapshot questions available.
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

              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                {stripHtml(item.content) || "-"}
              </p>

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
