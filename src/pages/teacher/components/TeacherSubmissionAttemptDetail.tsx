import { useMemo, useState } from "react";
import { RichTextRenderer } from "../../../components/editor";
import { Badge } from "../../../components/ui/SharedComponents";

import type { AIGradingResultResponse } from "../../../types/aiGrading";
import type {
  SubmissionAttemptItemResponse,
  SubmissionAttemptStatus,
  TeacherAttemptDetailResponse,
} from "../../../types/submission";
import { formatDateTime } from "../../../utils/dateTime";
import { htmlToText } from "../../../utils/text";
import { AIGradingPanel } from "./AIGradingPanel";
import { TeacherReviewDraftPanel } from "./TeacherReviewDraftPanel";

const statusLabel: Record<SubmissionAttemptStatus, string> = {
  IN_PROGRESS: "Đang làm bài",
  SUBMITTED: "Đã nộp",
  AUTO_SUBMITTED: "Tự động nộp",
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

  const essayCount = attempt.items.filter(
    (item) => item.questionType === "ESSAY",
  ).length;

  const renderQuestionReview = (
    item: SubmissionAttemptItemResponse,
    questionNumber: number,
  ) => {
    const answer = answersByItemId.get(item.assignmentItemId);
    const selectedOptions = item.options.filter((option) =>
      answer?.selectedOptionIds.includes(option.assignmentItemOptionId),
    );

    return (
      <section
        key={item.assignmentItemId}
        data-assignment-item-id={item.assignmentItemId}
        aria-labelledby={`teacher-question-${item.assignmentItemId}`}
        className="min-w-0 rounded-card border border-surface-border bg-white p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3
              id={`teacher-question-${item.assignmentItemId}`}
              className="text-xs font-medium uppercase text-gray-400"
            >
              Câu {questionNumber}
            </h3>
            <div className="mt-1 min-w-0 overflow-x-auto break-words text-sm text-gray-900">
              <RichTextRenderer value={item.content} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>
              {item.questionType === "MULTIPLE_CHOICE"
                ? "Trắc nghiệm"
                : "Tự luận"}
            </Badge>
            <Badge>{item.points ?? 0} điểm</Badge>
          </div>
        </div>

        {item.questionType === "MULTIPLE_CHOICE" ? (
          <div className="mt-4 space-y-2" aria-label="Cau tra loi da nop">
            {selectedOptions.length === 0 ? (
              <div className="text-sm text-gray-400">
                Học sinh chưa chọn đáp án.
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
            aria-label="Bai tu luan da nop"
          >
            {answer?.answerText || "Học sinh chưa nhập câu trả lời."}
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500">
          Điểm tự động: {answer?.autoScore ?? "-"} / {answer?.maxScore ?? "-"}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-surface-border bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {attempt.studentFullName || "-"}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Lượt {attempt.attemptNumber} - {attempt.assignmentTitleSnapshot}
            </div>
          </div>
          <Badge>{statusLabel[attempt.status]}</Badge>
        </div>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">
              Bắt đầu
            </div>
            <div className="mt-1 text-gray-900">
              {formatDateTime(attempt.startedAt)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">
              Lưu lần cuối
            </div>
            <div className="mt-1 text-gray-900">
              {formatDateTime(attempt.lastSavedAt)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">
              Nộp bài
            </div>
            <div className="mt-1 text-gray-900">
              {formatDateTime(attempt.submittedAt)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">
              Điểm hiện có
            </div>
            <div className="mt-1 text-gray-900">
              {formatAttemptScore(attempt)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-surface-border bg-surface-page p-4">
        <div className="text-sm font-medium text-gray-900">
          Luồng chấm dễ dùng
        </div>
        <div className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
          <div className="rounded-input bg-white px-3 py-2">
            1. Xem gợi ý AI nếu cần
          </div>
          <div className="rounded-input bg-white px-3 py-2">
            2. Nhập điểm ngay tại từng câu tự luận
          </div>
          <div className="rounded-input bg-white px-3 py-2">
            3. Lưu, hoàn tất, rồi công bố
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Bài này có {attempt.items.length} câu hỏi, gồm {essayCount} câu tự
          luận cần giáo viên xác nhận điểm.
        </div>
      </div>

      <AIGradingPanel
        attemptId={attempt.id}
        canGrade={attempt.status !== "IN_PROGRESS"}
        hasEssay={essayCount > 0}
        items={attempt.items}
        onResultChange={setLatestAiResult}
      />

      <TeacherReviewDraftPanel
        attemptId={attempt.id}
        canReview={attempt.status !== "IN_PROGRESS"}
        latestAiResult={latestAiResult}
        questionItems={attempt.items}
        submissionAnswers={attempt.answers}
      />

      <details className="rounded-card border border-surface-border bg-white">
        <summary className="cursor-pointer list-none px-4 py-4 text-sm font-medium text-gray-900">
          Xem toàn bộ đề bài và bài làm
        </summary>
        <div className="border-t border-surface-border px-4 py-4">
          <div className="rounded-input border border-surface-border bg-surface-page p-4">
            <div className="mb-3 text-sm font-medium text-gray-900">Đề bài</div>
            <div className="text-sm text-gray-900">
              <RichTextRenderer value={attempt.assignmentContent} />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {attempt.items.map((item) =>
              renderQuestionReview(item, item.displayOrder),
            )}
          </div>
        </div>
      </details>
    </div>
  );
};
