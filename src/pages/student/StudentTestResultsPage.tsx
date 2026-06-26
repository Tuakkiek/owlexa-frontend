import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import mocktestApi from "../../api/mocktestApi";
import type { TestAttempt } from "../../types/mocktest";

const StudentTestResultsPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<TestAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadResult = useCallback(async () => {
    try {
      setIsLoading(true);
      if (attemptId) {
        const data = await mocktestApi.getTestResult(Number(attemptId));
        setResult(data);
      }
    } catch (error) {
      console.error("Failed to load result:", error);
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Đang tải kết quả...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Không tìm thấy kết quả</p>
      </div>
    );
  }

  const score = result.score;
  const maxScore = result.maxScore;
  const percentage = Math.round((score / maxScore) * 100);
  const scoreColor =
    percentage >= 80
      ? "text-green-600"
      : percentage >= 60
        ? "text-amber-600"
        : "text-red-600";
  const scoreBgColor =
    percentage >= 80
      ? "bg-green-50"
      : percentage >= 60
        ? "bg-amber-50"
        : "bg-red-50";
  const scoreBorderColor =
    percentage >= 80
      ? "border-green-200"
      : percentage >= 60
        ? "border-amber-200"
        : "border-red-200";

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Kết quả thi thử
          </h1>
          <p className="text-sm text-gray-500 mt-1">{result.testTitle}</p>
        </div>
        <button
          onClick={() => navigate("/student/mock-tests")}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Quay lại
        </button>
      </div>

      {/* Score Card */}
      <div
        className={`rounded-3xl border-2 ${scoreBorderColor} ${scoreBgColor} p-8 text-center`}
      >
        <p className="text-sm uppercase tracking-wide text-gray-600 font-medium mb-4">
          Điểm của bạn
        </p>
        <div className={`text-6xl font-bold ${scoreColor} mb-4`}>
          {score.toFixed(1)}
        </div>
        <p className="text-xl text-gray-600">
          {percentage}% —{" "}
          {percentage >= 80
            ? "✓ Xuất sắc"
            : percentage >= 60
              ? "△ Chưa đạt"
              : "✕ Cần cố gắng"}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-3xl font-bold text-green-600">
            {result.correctAnswers}
          </p>
          <p className="text-sm text-gray-600 mt-2">Câu trả lời đúng</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-3xl font-bold text-red-600">
            {result.totalQuestions - result.correctAnswers}
          </p>
          <p className="text-sm text-gray-600 mt-2">Câu trả lời sai</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {result.totalQuestions}
          </p>
          <p className="text-sm text-gray-600 mt-2">Tổng số câu</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Chi tiết các câu hỏi
        </h2>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {result.answers.map((answer, idx) => (
            <div
              key={answer.questionId}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Câu {idx + 1}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                  </p>
                </div>
                <div
                  className={`text-right font-bold text-lg ${answer.isCorrect ? "text-green-600" : "text-red-600"}`}
                >
                  {answer.isCorrect ? "✓" : "✕"}
                </div>
              </div>

              <div className="space-y-1 text-sm mt-3 border-t border-gray-200 pt-3">
                <p className="text-gray-600">
                  Câu trả lời của bạn:{" "}
                  <strong>{answer.studentAnswer || "(Bỏ trống)"}</strong>
                </p>
                {!answer.isCorrect && (
                  <p className="text-green-600">
                    Đáp án đúng: <strong>{answer.correctAnswer}</strong>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/student/mock-tests")}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Danh sách đề thi
        </button>
        <button
          onClick={() => navigate(`/student/mock-tests`)}
          className="flex-1 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-900 transition"
        >
          Làm bài thi khác
        </button>
      </div>

      {/* Completion Date */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Hoàn thành lúc{" "}
          {new Date(result.completedAt || result.startedAt).toLocaleString(
            "vi-VN",
          )}
        </p>
      </div>
    </div>
  );
};

export default StudentTestResultsPage;
