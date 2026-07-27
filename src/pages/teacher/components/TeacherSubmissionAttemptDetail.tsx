import { useMemo, useState } from "react";
import { Badge } from "../../../components/ui/SharedComponents";
import type { AIGradingResultResponse } from "../../../types/aiGrading";
import type {
  SubmissionAttemptStatus,
  TeacherAttemptDetailResponse,
} from "../../../types/submission";
import { formatDateTime } from "../../../utils/dateTime";
import { htmlToText } from "../../../utils/text";
import { AIGradingPanel } from "./AIGradingPanel";
import { TeacherReviewDraftPanel } from "./TeacherReviewDraftPanel";

const statusLabel: Record<SubmissionAttemptStatus, string> = {
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  AUTO_SUBMITTED: "Auto Submitted",
};

const formatAttemptScore = (attempt: TeacherAttemptDetailResponse) => {
  if (attempt.status === "IN_PROGRESS") return "-";
  return `${attempt.autoScore ?? "-"} / ${attempt.maxScore ?? "-"}`;
};

interface TeacherSubmissionAttemptDetailProps {
  attempt: TeacherAttemptDetailResponse;
}

export const TeacherSubmissionAttemptDetail = ({
  attempt,
}: TeacherSubmissionAttemptDetailProps) => {
  const [latestAiResult, setLatestAiResult] =
    useState<AIGradingResultResponse | null>(null);

  const answersByItemId = useMemo(
    () =>
      new Map(
        attempt.answers.map((answer) => [answer.assignmentItemId, answer]),
      ),
    [attempt.answers],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-surface-border bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {attempt.studentFullName || "-"}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Attempt {attempt.attemptNumber} - {attempt.assignmentTitleSnapshot}
            </div>
          </div>
          <Badge>{statusLabel[attempt.status]}</Badge>
        </div>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">
              Started
            </div>
            <div className="mt-1 text-gray-900">
              {formatDateTime(attempt.startedAt)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">
              Last Saved
            </div>
            <div className="mt-1 text-gray-900">
              {formatDateTime(attempt.lastSavedAt)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">
              Submitted
            </div>
            <div className="mt-1 text-gray-900">
              {formatDateTime(attempt.submittedAt)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">
              Score
            </div>
            <div className="mt-1 text-gray-900">
              {formatAttemptScore(attempt)}
            </div>
          </div>
        </div>
      </div>

      <AIGradingPanel
        attemptId={attempt.id}
        canGrade={attempt.status !== "IN_PROGRESS"}
        hasEssay={attempt.items.some((item) => item.questionType === "ESSAY")}
        items={attempt.items}
        onResultChange={setLatestAiResult}
      />

      <TeacherReviewDraftPanel
        attemptId={attempt.id}
        canReview={attempt.status !== "IN_PROGRESS"}
        latestAiResult={latestAiResult}
      />

      <div className="space-y-4">
        {attempt.items.map((item) => {
          const answer = answersByItemId.get(item.assignmentItemId);
          const selectedOptions = item.options.filter((option) =>
            answer?.selectedOptionIds.includes(option.assignmentItemOptionId),
          );

          return (
            <div
              key={item.assignmentItemId}
              className="rounded-card border border-surface-border bg-white p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">
                    Question {item.displayOrder}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">
                    {htmlToText(item.content) || "-"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>
                    {item.questionType === "MULTIPLE_CHOICE"
                      ? "Multiple Choice"
                      : "Essay"}
                  </Badge>
                  <Badge>{item.points ?? 0} pts</Badge>
                </div>
              </div>

              {item.questionType === "MULTIPLE_CHOICE" ? (
                <div className="mt-4 space-y-2">
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
                <div className="mt-4 whitespace-pre-wrap rounded-input border border-surface-border bg-surface-page px-3 py-2 text-sm text-gray-700">
                  {answer?.answerText || "No answer provided."}
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                Score: {answer?.autoScore ?? "-"} / {answer?.maxScore ?? "-"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
