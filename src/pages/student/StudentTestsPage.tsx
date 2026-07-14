import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import testApi from "../../api/testApi";
import type { MockTest, TestAttempt } from "../../types/tests";

const LEVEL_NAMES: Record<MockTest["level"], string> = {
  BEGINNER: "Sơ cấp",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

const StudentTestsPage = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [results, setResults] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "results">("available");
  const [error, setError] = useState("");
  const [startingTestId, setStartingTestId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const [testsData, resultsData] = await Promise.all([
        testApi.getAvailableTests(),
        testApi.getMyResults(),
      ]);
      setTests(testsData);
      setResults(resultsData);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách đề thi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartTest = async (testId: number) => {
    try {
      setStartingTestId(testId);
      const attempt = await testApi.startTest(testId);
      navigate(`/student/tests/${attempt.id}/take`, {
        state: { testId: attempt.testId },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể bắt đầu đề thi.");
    } finally {
      setStartingTestId(null);
    }
  };

  const handleViewResult = (attemptId: number) => {
    navigate(`/student/tests/results/${attemptId}`);
  };

  const sortedResults = useMemo(
    () =>
      [...results].sort(
        (left, right) =>
          new Date(right.completedAt || right.startedAt).getTime() -
          new Date(left.completedAt || left.startedAt).getTime(),
      ),
    [results],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Thi thử VSTEP</h1>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("available")}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === "available"
              ? "border-primary text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Đề thi ({tests.length})
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === "results"
              ? "border-primary text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Kết quả ({results.length})
        </button>
      </div>

      {activeTab === "available" && (
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))
          ) : tests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <p className="text-gray-600">Chưa có đề thi nào.</p>
            </div>
          ) : (
            tests.map((test) => {
              const attemptedCount = results.filter((result) => result.testId === test.id).length;
              const isStarting = startingTestId === test.id;

              return (
                <div
                  key={test.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {test.description || "Không có mô tả"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {LEVEL_NAMES[test.level]}
                      </p>
                      {attemptedCount > 0 && (
                        <p className="mt-1 text-xs text-gray-500">Đã làm {attemptedCount} lần</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
                    <span>{test.duration} phút</span>
                    <span>{test.totalQuestions} câu hỏi</span>
                    <span>{test.questionCount ?? 0} câu hỏi đã tạo</span>
                  </div>

                  <button
                    onClick={() => handleStartTest(test.id)}
                    disabled={isStarting}
                    className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
                  >
                    {isStarting ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "results" && (
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
            ))
          ) : sortedResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <p className="text-gray-600">Chưa có kết quả nào.</p>
            </div>
          ) : (
            sortedResults.map((result) => {
              const percentage = result.maxScore
                ? Math.round((result.score / result.maxScore) * 100)
                : 0;
              const scoreColor =
                percentage >= 80
                  ? "text-green-600"
                  : percentage >= 60
                    ? "text-amber-600"
                    : "text-red-600";

              return (
                <button
                  key={result.id}
                  onClick={() => handleViewResult(result.id)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{result.testTitle}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(result.completedAt || result.startedAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${scoreColor}`}>{result.score}</p>
                      <p className="text-xs text-gray-500">
                        {result.correctAnswers}/{result.totalQuestions} đúng
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default StudentTestsPage;
