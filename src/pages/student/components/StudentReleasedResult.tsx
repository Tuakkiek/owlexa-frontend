import { RichTextRenderer } from "../../../components/editor";
import { Badge } from "../../../components/ui/SharedComponents";

import type { AssessmentType } from "../../../types/assessmentBuilder";
import type { StudentAttemptItemResponse } from "../../../types/submission";
import type { StudentReviewResultResponse } from "../../../types/teacherReview";
import { formatDateTime } from "../../../utils/dateTime";
import { htmlToText } from "../../../utils/text";

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
}: StudentReleasedResultProps) => {
  const answersByItemId = new Map(
    result.answers.map((answer) => [answer.assignmentItemId, answer]),
  );
  const reviewItemsByAssignmentItemId = new Map(
    result.essayItems.map((item) => [item.assignmentItemId, item]),
  );

  const renderQuestionResult = (
    item: StudentAttemptItemResponse,
    questionNumber: number,
  ) => {
    const answer = answersByItemId.get(item.assignmentItemId);
    const reviewItem = reviewItemsByAssignmentItemId.get(
      item.assignmentItemId,
    );
    const selectedOptions = item.options.filter((option) =>
      answer?.selectedOptionIds.includes(option.assignmentItemOptionId),
    );
    const itemScore = reviewItem?.finalScore ?? answer?.autoScore ?? "-";
    const itemMaxScore =
      reviewItem?.maxScore ?? answer?.maxScore ?? item.points ?? "-";

    return (
      <section
        key={item.assignmentItemId}
        data-assignment-item-id={item.assignmentItemId}
        aria-labelledby={`result-question-${item.assignmentItemId}`}
        className="min-w-0 rounded-card border border-surface-border bg-white p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3
              id={`result-question-${item.assignmentItemId}`}
              className="text-xs font-medium uppercase text-gray-400"
            >
              Question {questionNumber}
            </h3>
            <div className="mt-1 min-w-0 overflow-x-auto break-words text-sm text-gray-900">
              <RichTextRenderer value={item.content} />
            </div>
          </div>
          <Badge>
            {itemScore} / {itemMaxScore}
          </Badge>
        </div>

        {item.questionType === "MULTIPLE_CHOICE" ? (
          <div className="mt-4 space-y-2" aria-label="Your answer">
            {selectedOptions.length === 0 ? (
              <div className="text-sm text-gray-400">
                No option selected.
              </div>
            ) : (
              selectedOptions.map((option) => (
                <div
                  key={option.assignmentItemOptionId}
                  className="rounded-input border border-surface-border px-3 py-2 text-sm text-gray-700"
                >
                  {htmlToText(option.content) || "-"}
                </div>
              ))
            )}
          </div>
        ) : (
          <div
            className="mt-4 whitespace-pre-wrap rounded-input border border-surface-border bg-surface-page px-3 py-2 text-sm text-gray-700"
            aria-label="Your answer"
          >
            {answer?.answerText || "No answer provided."}
          </div>
        )}

        {reviewItem && (
          <div className="mt-3 rounded-input bg-surface-page px-3 py-2">
            <div className="text-xs font-medium uppercase text-gray-400">
              Teacher Comment
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
              {reviewItem.teacherComment || "No item comment."}
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
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

      <div className="space-y-4">
        {result.items.length === 0 ? (
          <div className="rounded-card border border-surface-border bg-white py-8 text-center text-sm text-gray-400">
            No questions available.
          </div>
        ) : (
          result.items
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((item) => renderQuestionResult(item, item.displayOrder))
        )}
      </div>
    </div>
  );
};
