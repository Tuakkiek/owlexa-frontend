import { useMemo } from "react";
import type { AIGradingResultResponse } from "../../../types/aiGrading";
import type { SubmissionAttemptItemResponse } from "../../../types/submission";
import { formatDateTime } from "../../../utils/dateTime";
import { htmlToText } from "../../../utils/text";

const formatScore = (value: number | null) => {
  if (value == null) return "-";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

const formatConfidence = (value: number | null) => {
  if (value == null) return "-";
  return value.toLocaleString("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  });
};

interface AIGradingResultViewerProps {
  result: AIGradingResultResponse;
  items: SubmissionAttemptItemResponse[];
}

export const AIGradingResultViewer = ({
  result,
  items,
}: AIGradingResultViewerProps) => {
  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.assignmentItemId, item])),
    [items],
  );

  const itemResults = useMemo(
    () =>
      result.itemResults.slice().sort((left, right) => {
        const leftOrder =
          itemsById.get(left.assignmentItemId)?.displayOrder ??
          Number.MAX_SAFE_INTEGER;
        const rightOrder =
          itemsById.get(right.assignmentItemId)?.displayOrder ??
          Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder;
      }),
    [itemsById, result.itemResults],
  );

  return (
    <div className="mt-5 border-t border-surface-border pt-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Latest AI Recommendation
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Generated {formatDateTime(result.createdAt)}
          </div>
        </div>
        <div className="text-sm font-semibold text-gray-900">
          {formatScore(result.aiScore)} / {formatScore(result.maxScore)}
        </div>
      </div>

      <div className="mt-4 grid gap-4 border-y border-surface-border py-4 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            AI Score
          </div>
          <div className="mt-1 text-gray-900">
            {formatScore(result.aiScore)} / {formatScore(result.maxScore)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            Confidence
          </div>
          <div className="mt-1 text-gray-900">
            {formatConfidence(result.confidence)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            Graded Items
          </div>
          <div className="mt-1 text-gray-900">{itemResults.length}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            Summary
          </div>
          <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
            {result.summary || "-"}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase text-gray-400">
            Overall Feedback
          </div>
          <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
            {result.overallFeedback || "-"}
          </div>
        </div>
      </div>

      {itemResults.length > 0 && (
        <div className="mt-5 border-t border-surface-border">
          {itemResults.map((itemResult) => {
            const item = itemsById.get(itemResult.assignmentItemId);
            return (
              <div
                key={itemResult.id}
                className="border-b border-surface-border py-5 last:border-b-0"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-400">
                      Question {item?.displayOrder ?? "-"}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">
                      {htmlToText(item?.content ?? null) || "-"}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatScore(itemResult.aiScore)} /{" "}
                    {formatScore(itemResult.maxScore)}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-400">
                      Feedback
                    </div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                      {itemResult.feedback || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-400">
                      Rubric Analysis
                    </div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                      {itemResult.rubricAnalysis || "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Confidence: {formatConfidence(itemResult.confidence)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {itemResults.length === 0 && (
        <div className="mt-5 border-t border-surface-border pt-5 text-sm text-gray-500">
          No essay item results are available.
        </div>
      )}
    </div>
  );
};
