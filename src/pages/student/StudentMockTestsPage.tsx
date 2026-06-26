import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import mocktestApi from "../../api/mocktestApi";
import type { MockTest, TestAttempt } from "../../types/mocktest";

const LEVEL_NAMES = {
  BEGINNER: "🔰 Sơ cấp",
  INTERMEDIATE: "⭐ Trung cấp",
  ADVANCED: "⭐⭐ Nâng cao",
};

const StudentMockTestsPage = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [results, setResults] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "results">(
    "available",
  );

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [testsData, resultsData] = await Promise.all([
        mocktestApi.getAvailableTests(),
        mocktestApi.getMyResults(),
      ]);
      setTests(testsData);
      setResults(resultsData);
    } catch (error) {
      console.error("Failed to load tests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartTest = async (testId: number) => {
    try {
      const attempt = await mocktestApi.startTest(testId);
      navigate(`/student/mock-tests/${attempt.id}/take`);
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Không thể bắt đầu đề thi");
    }
  };

  const handleViewResult = (attemptId: number) => {
    navigate(`/student/mock-tests/results/${attemptId}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Thi thử VSTEP
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Luyện tập với các đề thi thử đa dạng
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("available")}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === "available"
              ? "border-black text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Đề thi ({tests.length})
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === "results"
              ? "border-black text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Kết quả ({results.length})
        </button>
      </div>

      {/* Available Tests */}
      {activeTab === "available" && (
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))
          ) : tests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-600">Chưa có đề thi nào</p>
            </div>
          ) : (
            tests.map((test) => {
              const attemptedCount = results.filter(
                (r) => r.testId === test.id,
              ).length;
              return (
                <div
                  key={test.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {test.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {test.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {LEVEL_NAMES[test.level]}
                      </p>
                      {attemptedCount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Đã làm {attemptedCount}x
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4 mb-4">
                    <span>⏱️ {test.duration} phút</span>
                    <span>📝 {test.totalQuestions} câu hỏi</span>
                  </div>

                  <button
                    onClick={() => handleStartTest(test.id)}
                    className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 transition"
                  >
                    Bắt đầu làm bài
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Results */}
      {activeTab === "results" && (
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-gray-600">
                Chưa có kết quả nào. Hãy bắt đầu làm bài!
              </p>
            </div>
          ) : (
            results.map((result) => {
              const percentage = Math.round(
                (result.score / result.maxScore) * 100,
              );
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
                  className="w-full text-left rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {result.testTitle}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(
                          result.completedAt || result.startedAt,
                        ).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${scoreColor}`}>
                        {result.score.toFixed(1)}
                      </p>
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

export default StudentMockTestsPage;
