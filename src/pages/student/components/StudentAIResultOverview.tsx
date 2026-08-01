import { useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/SharedComponents";
import type {
  StudentAIGradingCriterionResultResponse,
  StudentAIGradingImprovementResponse,
  StudentAttemptDetailResponse,
} from "../../../types/submission";

interface StudentAIResultOverviewProps {
  attempt: StudentAttemptDetailResponse;
  displayedFinalScore: number | null;
  isCelebrationOpen: boolean;
  onDismissCelebration: () => void;
}

const criterionTrackColors = [
  "from-indigo-500 to-violet-500",
  "from-fuchsia-500 to-pink-500",
  "from-sky-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-lime-500",
  "from-rose-500 to-orange-400",
];

const formatScore = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "-";
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const getCriterionRatio = (
  criterion: StudentAIGradingCriterionResultResponse,
) => {
  if (
    criterion.score == null ||
    criterion.maxScore == null ||
    criterion.maxScore <= 0
  ) {
    return 0;
  }
  return criterion.score / criterion.maxScore;
};

const getResultTone = (ratio: number) => {
  if (ratio >= 0.85) {
    return {
      headline: "Xuất sắc!",
      note: "Rất tốt! Bài viết của bạn đang ở mức rất vững.",
      heroClass: "from-sky-50 via-blue-50 to-indigo-50",
      pillClass: "border-blue-200 bg-blue-100 text-blue-700",
    };
  }
  if (ratio >= 0.7) {
    return {
      headline: "Làm tốt!",
      note: "Bạn đang ở mức khá tốt và chỉ cần tinh chỉnh thêm.",
      heroClass: "from-emerald-50 via-cyan-50 to-sky-50",
      pillClass: "border-emerald-200 bg-emerald-100 text-emerald-700",
    };
  }
  if (ratio >= 0.55) {
    return {
      headline: "Đang tiến bộ",
      note: "Nền tảng đã có, giờ là lúc tập trung vào các lỗi lặp lại.",
      heroClass: "from-amber-50 via-yellow-50 to-orange-50",
      pillClass: "border-amber-200 bg-amber-100 text-amber-700",
    };
  }
  return {
    headline: "Cần cải thiện",
    note: "Bạn vẫn có thể tăng điểm nhanh nếu sửa đúng trọng tâm.",
    heroClass: "from-rose-50 via-orange-50 to-amber-50",
    pillClass: "border-rose-200 bg-rose-100 text-rose-700",
  };
};

const findFocusImprovement = (
  focusArea: string | null | undefined,
  improvements: StudentAIGradingImprovementResponse[],
) => {
  if (!focusArea) return improvements[0] ?? null;
  const normalizedFocus = focusArea.trim().toLowerCase();
  return (
    improvements.find((item) =>
      `${item.category ?? ""} ${item.issue ?? ""}`.toLowerCase().includes(normalizedFocus),
    ) ??
    improvements[0] ??
    null
  );
};

export const StudentAIResultOverview = ({
  attempt,
  displayedFinalScore,
  isCelebrationOpen,
  onDismissCelebration,
}: StudentAIResultOverviewProps) => {
  const [expandedImprovementIndex, setExpandedImprovementIndex] = useState<
    number | null
  >(0);

  const aiResult = attempt.aiResult;
  const criteria = aiResult?.criteria ?? [];
  const improvements = aiResult?.improvements ?? [];

  const normalizedRatio = useMemo(() => {
    const baseScore =
      displayedFinalScore ?? aiResult?.aiScore ?? attempt.autoScore ?? null;
    const baseMax = attempt.maxScore ?? aiResult?.maxScore ?? null;
    if (baseScore == null || baseMax == null || baseMax <= 0) return 0;
    return baseScore / baseMax;
  }, [aiResult?.aiScore, aiResult?.maxScore, attempt.autoScore, attempt.maxScore, displayedFinalScore]);

  const tone = getResultTone(normalizedRatio);
  const weakestCriterion = useMemo(() => {
    if (criteria.length === 0) return null;
    return criteria.reduce((lowest, current) =>
      getCriterionRatio(current) < getCriterionRatio(lowest) ? current : lowest,
    );
  }, [criteria]);
  const focusArea = aiResult?.focusArea || weakestCriterion?.name || null;
  const focusImprovement = findFocusImprovement(focusArea, improvements);

  if (!aiResult || attempt.showScore === false) {
    return null;
  }

  return (
    <>
      {isCelebrationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-100/60" />
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-sky-100/70" />
            <div className="relative text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-sky-200 bg-sky-100 text-4xl text-sky-600">
                ✓
              </div>
              <h3 className="mt-5 text-4xl font-extrabold text-slate-900">
                Đã chấm xong
              </h3>
              <p className="mt-3 text-lg text-slate-600">
                Bài viết của bạn đã được AI chấm theo tiêu chí của giáo viên.
              </p>
              <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-indigo-200 bg-indigo-50 px-6 py-3">
                <span className="text-lg font-medium uppercase tracking-[0.2em] text-slate-500">
                  Điểm
                </span>
                <span className="text-4xl font-extrabold text-indigo-600">
                  {formatScore(displayedFinalScore ?? aiResult.aiScore)}
                </span>
              </div>
              <div className="mt-8">
                <Button type="button" className="w-full" onClick={onDismissCelebration}>
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section
        className={`mt-6 overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br ${tone.heroClass} p-6 shadow-[0_18px_50px_-30px_rgba(37,99,235,0.45)]`}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-4xl shadow-sm">
              ⭐
            </div>
            <div className="mt-4 text-3xl font-extrabold text-blue-600">
              {tone.headline}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {tone.note}
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-white/80 px-8 py-6 text-center shadow-sm backdrop-blur">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
              Điểm hiển thị
            </div>
            <div className="mt-3 text-6xl font-extrabold tracking-tight text-blue-600">
              {formatScore(displayedFinalScore ?? aiResult.aiScore)}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              / {formatScore(attempt.maxScore ?? aiResult.maxScore)}
            </div>
          </div>
        </div>

        {aiResult.summary && (
          <div
            className={`mt-6 inline-flex rounded-full border px-5 py-2 text-sm font-semibold ${tone.pillClass}`}
          >
            {aiResult.summary}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-lime-50 to-emerald-50 p-6">
        <div className="text-sm font-extrabold uppercase tracking-[0.18em] text-lime-700">
          Trọng tâm cải thiện
        </div>
        <div className="mt-3 text-3xl font-bold text-emerald-700">
          {focusArea || "Tiếp tục hoàn thiện"}
        </div>
        <div className="mt-3 text-base leading-7 text-emerald-900/80">
          {focusImprovement?.suggestion ||
            weakestCriterion?.feedback ||
            aiResult.overallFeedback}
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-3xl font-bold text-slate-900">Nhận xét từ AI</h3>
          <Badge variant="info">Theo tiêu chí của giáo viên</Badge>
        </div>
        <div className="mt-4 whitespace-pre-wrap text-lg leading-9 text-slate-600">
          {aiResult.overallFeedback || "Chưa có nhận xét tổng quan từ AI."}
        </div>
      </section>

      {criteria.length > 0 && (
        <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-3xl font-bold text-slate-900">Phân tích điểm số</h3>
          <div className="mt-8 space-y-6">
            {criteria.map((criterion, index) => {
              const ratio = getCriterionRatio(criterion);
              return (
                <div
                  key={`${criterion.name}-${index}`}
                  className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-center"
                >
                  <div>
                    <div className="text-xl font-semibold text-slate-700">
                      {criterion.name}
                    </div>
                    {criterion.feedback && (
                      <div className="mt-1 text-sm leading-6 text-slate-500">
                        {criterion.feedback}
                      </div>
                    )}
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        criterionTrackColors[index % criterionTrackColors.length]
                      }`}
                      style={{ width: `${clampPercent(ratio * 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-3xl font-extrabold text-slate-700">
                    {formatScore(criterion.score)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {improvements.length > 0 && (
        <section className="mt-6">
          <div className="text-4xl font-extrabold tracking-tight text-slate-900">
            Cải thiện ({improvements.length})
          </div>
          <div className="mt-5 space-y-4">
            {improvements.map((improvement, index) => {
              const expanded = expandedImprovementIndex === index;
              return (
                <article
                  key={`${improvement.category}-${index}`}
                  className="rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-500">
                      !
                    </div>
                    <div className="text-2xl font-extrabold uppercase tracking-wide text-rose-400">
                      {improvement.category || "Cải thiện"}
                    </div>
                  </div>

                  <div className="mt-4 text-base italic leading-7 text-slate-500">
                    {improvement.issue}
                  </div>

                  <div className="mt-4 text-xl leading-9 text-slate-700">
                    {improvement.suggestion}
                  </div>

                  {expanded && improvement.example && (
                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-lg leading-8 text-slate-700">
                      <span className="font-semibold text-blue-600">Try:</span>{" "}
                      {improvement.example}
                    </div>
                  )}

                  {improvement.example && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedImprovementIndex(expanded ? null : index)
                      }
                      className="mt-4 text-base font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      {expanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
};
