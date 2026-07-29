import { Badge } from "../../../components/ui/SharedComponents";
import type { AssessmentType } from "../../../types/assessmentBuilder";
import type { StudentReviewResultResponse } from "../../../types/teacherReview";
import { formatDateTime } from "../../../utils/dateTime";

const typeLabel: Record<AssessmentType, string> = {
  QUIZ: "Quiz",
  HOMEWORK: "Homework",
  EXAM: "Exam",
};

interface StudentReleasedResultProps {
  result: StudentReviewResultResponse;
}

export const StudentReleasedResult = ({
  result,
}: StudentReleasedResultProps) => (
  <div className="space-y-5">
    <div className="rounded-card border border-surface-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {result.assignmentTitleSnapshot}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {typeLabel[result.assignmentTypeSnapshot]} - Attempt{" "}
            {result.attemptNumber}
          </div>
        </div>
        <Badge variant="success">Official Result</Badge>
      </div>
      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            Final Score
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {result.finalScore} / {result.maxScore}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            Released At
          </div>
          <div className="mt-1 text-gray-900">
            {formatDateTime(result.releasedAt)}
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-card border border-surface-border bg-white p-4">
      <div className="text-xs font-medium uppercase text-gray-400">
        Teacher Comment
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
        {result.overallComment || "No overall comment."}
      </div>
    </div>

    {result.essayItems.length === 0 ? (
      <div className="rounded-card border border-surface-border bg-white py-8 text-center text-sm text-gray-400">
        This assessment has no essay feedback.
      </div>
    ) : (
      <div className="space-y-3">
        {result.essayItems
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((item) => (
            <div
              key={item.assignmentItemId}
              className="rounded-card border border-surface-border bg-white p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">
                    Question {item.displayOrder}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {item.questionTitle || "-"}
                  </div>
                </div>
                <Badge>
                  {item.finalScore} / {item.maxScore}
                </Badge>
              </div>
              <div className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                {item.teacherComment || "No item comment."}
              </div>
            </div>
          ))}
      </div>
    )}
  </div>
);
