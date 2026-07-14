import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import testApi from "../../api/testApi";
import type { TestAttempt } from "../../types/tests";

const StudentTestResultsPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<TestAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      try {
        setIsLoading(true);
        setError("");
        if (!attemptId) return;
        setResult(await testApi.getTestResult(Number(attemptId)));
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Không thể tải kết quả.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [attemptId]);

  const percentage = useMemo(() => {
    if (!result || !result.maxScore) return 0;
    return Math.round((result.score / result.maxScore) * 100);
  }, [result]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Đang tải kết quả...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        {error || "Không tìm thấy kết quả."}
      </div>
    );
  }

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
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Kết quả thi thử
          </h1>
          <p className="mt-1 text-sm text-gray-500">{result.testTitle}</p>
        </div>
        <button
          onClick={() => navigate("/student/tests")}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Quay lại
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        className={`rounded-xl border-2 ${scoreBorderColor} ${scoreBgColor} p-8 text-center`}
      >
        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-600">
          Điểm của bạn
        </p>
        <div className={`mb-4 text-6xl font-bold ${scoreColor}`}>
          {result.score}
        </div>
        <p className="text-xl text-gray-600">
          {percentage}% -{" "}
          {percentage >= 80
            ? "Xuất sắc"
            : percentage >= 60
              ? "Đạt yêu cầu"
              : "Cần cố gắng thêm"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-3xl font-bold text-green-600">
            {result.correctAnswers}
          </p>
          <p className="mt-2 text-sm text-gray-600">Câu đúng</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-3xl font-bold text-red-600">
            {result.totalQuestions - result.correctAnswers}
          </p>
          <p className="mt-2 text-sm text-gray-600">Câu sai</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {result.totalQuestions}
          </p>
          <p className="mt-2 text-sm text-gray-600">Tổng số câu</p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Chi tiết câu hỏi
        </h2>

        <div className="max-h-96 space-y-3 overflow-y-auto">
          {result.answers.map((answer, index) => (
            <div
              key={answer.questionId}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Câu {index + 1}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {answer.questionText || "Không có nội dung câu hỏi"}
                  </p>
                </div>
                <div
                  className={`text-right text-lg font-bold ${answer.isCorrect ? "text-green-600" : "text-red-600"}`}
                >
                  {answer.isCorrect ? "✓" : "✕"}
                </div>
              </div>

              <div className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-sm">
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

      <div className="flex gap-3">
        <button
          onClick={() => navigate("/student/tests")}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Danh sách đề thi
        </button>
        <button
          onClick={() => navigate("/student/tests")}
          className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-hover transition"
        >
          Làm bài khác
        </button>
      </div>

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
