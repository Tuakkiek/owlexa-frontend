import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import essayApi from "../../api/essayApi";
import type { EssaySubmission, EssayGradingResult } from "../../types/essay";

const StudentEssayPage = () => {
  const { rubricId } = useParams<{ rubricId?: string }>();
  const [essays, setEssays] = useState<EssaySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEssayId, setSelectedEssayId] = useState<number | null>(null);
  const [gradingResult, setGradingResult] = useState<EssayGradingResult | null>(
    null,
  );
  const [isGrading, setIsGrading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formContent, setFormContent] = useState("");

  const loadEssays = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await essayApi.getMyEssays();
      setEssays(data);
    } catch (error) {
      console.error("Failed to load essays:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEssays();
  }, [loadEssays]);

  // Poll grading status when essay is in progress
  useEffect(() => {
    if (!isGrading || !selectedEssayId) return;

    const interval = setInterval(async () => {
      try {
        const result = await essayApi.checkGradingStatus(selectedEssayId);
        if (result) {
          setGradingResult(result);
          setIsGrading(false);
          loadEssays();
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isGrading, selectedEssayId, loadEssays]);

  const handleSubmitEssay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubricId || !formContent.trim()) {
      alert("Vui lòng nhập nội dung bài essay");
      return;
    }

    try {
      const submission = await essayApi.submitEssay(
        Number(rubricId),
        formContent,
      );
      alert("Nộp bài thành công! AI đang chấm bài...");
      setFormContent("");
      setShowForm(false);
      setSelectedEssayId(submission.id);
      setIsGrading(true);
      loadEssays();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Nộp bài thất bại");
    }
  };

  const handleViewEssay = async (essayId: number) => {
    try {
      const { gradingResult } = await essayApi.getEssayWithResult(essayId);
      setSelectedEssayId(essayId);
      setGradingResult(gradingResult);
    } catch (error) {
      console.error("Failed to load essay:", error);
    }
  };

  const draftEssays = useMemo(
    () => essays.filter((e) => e.status === "DRAFT"),
    [essays],
  );
  const submittedEssays = useMemo(
    () => essays.filter((e) => e.status !== "DRAFT"),
    [essays],
  );

  const selectedEssay = essays.find((e) => e.id === selectedEssayId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Nộp bài Essay
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Viết bài, nộp và nhận điểm từ AI
          </p>
        </div>
        <button
          onClick={loadEssays}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Essays List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-gray-900">Bài của bạn</h2>

          {/* New Essay Button */}
          {rubricId && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center hover:border-gray-400 transition"
            >
              <p className="text-2xl mb-2">+</p>
              <p className="text-sm font-medium text-gray-700">Viết bài mới</p>
            </button>
          )}

          {/* Draft Essays */}
          {draftEssays.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                Bản nháp
              </p>
              {draftEssays.map((essay) => (
                <button
                  key={essay.id}
                  onClick={() => setSelectedEssayId(essay.id)}
                  className={`w-full text-left rounded-2xl border-2 p-3 transition ${
                    selectedEssayId === essay.id
                      ? "border-black bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {essay.className}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Chưa nộp</p>
                </button>
              ))}
            </div>
          )}

          {/* Submitted Essays */}
          {submittedEssays.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                Đã nộp
              </p>
              {submittedEssays.map((essay) => (
                <button
                  key={essay.id}
                  onClick={() => handleViewEssay(essay.id)}
                  className={`w-full text-left rounded-2xl border-2 p-3 transition ${
                    selectedEssayId === essay.id
                      ? "border-black bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {essay.className}
                  </p>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      essay.status === "GRADED"
                        ? "text-green-600"
                        : essay.status === "REVIEWED"
                          ? "text-blue-600"
                          : "text-amber-600"
                    }`}
                  >
                    {essay.status === "GRADED"
                      ? "✓ Đã chấm"
                      : essay.status === "REVIEWED"
                        ? "✓ Đã xem xét"
                        : "Đang chấm"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor / Viewer */}
        <div className="lg:col-span-2">
          {showForm ? (
            <form
              onSubmit={handleSubmitEssay}
              className="rounded-3xl border border-gray-200 bg-white p-6 space-y-4"
            >
              <h3 className="font-semibold text-gray-900">Viết bài mới</h3>

              <textarea
                placeholder="Nhập nội dung bài essay của bạn..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black min-h-[300px] font-mono text-sm"
              />

              <div className="text-xs text-gray-500">
                {formContent.length} ký tự
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-900"
                >
                  Nộp và chấm bài
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Huỷ
                </button>
              </div>
            </form>
          ) : selectedEssay ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                  {selectedEssay.className}
                </p>
                <h3 className="text-xl font-semibold text-gray-900 mt-2">
                  {selectedEssay.rubricTitle}
                </h3>
              </div>

              {/* Essay Content */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedEssay.content}
                </p>
              </div>

              {/* Grading Results */}
              {isGrading ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
                  <div className="inline-block animate-spin text-4xl mb-3">
                    ⏳
                  </div>
                  <p className="font-medium text-blue-900">
                    AI đang chấm bài...
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Điều này có thể mất 5-15 giây
                  </p>
                </div>
              ) : gradingResult ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-green-900">
                      Kết quả chấm bài
                    </h4>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">
                        {gradingResult.totalScore.toFixed(1)}
                      </p>
                      <p className="text-sm text-green-700">
                        / {gradingResult.maxScore}
                      </p>
                    </div>
                  </div>

                  {/* Criteria Scores */}
                  <div className="space-y-3 border-t border-green-100 pt-4">
                    {gradingResult.criteriaScores.map((score) => (
                      <div
                        key={score.criteriaId}
                        className="bg-white rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">
                            {score.criteriaName}
                          </p>
                          <p className="font-bold text-gray-900">
                            {score.score.toFixed(1)} / {score.maxScore}
                          </p>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${(score.score / score.maxScore) * 100}%`,
                            }}
                          />
                        </div>
                        {score.feedback && (
                          <p className="text-xs text-gray-600 mt-2">
                            {score.feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {gradingResult.feedback && (
                    <div className="rounded-lg bg-white p-4 border border-gray-100">
                      <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                        Nhận xét
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {gradingResult.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-500">
                  Chưa có kết quả chấm bài
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-gray-600">
                Chọn bài để xem chi tiết hoặc viết bài mới
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentEssayPage;
