import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import mocktestApi from "../../api/mocktestApi";
import type { TestAttempt } from "../../types/mocktest";

const StudentTestTakingPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // Load attempt details (mock - would need API endpoint)
    if (attemptId) {
      setAttempt({
        id: Number(attemptId),
        studentId: 1,
        studentFullName: "Học sinh",
        testId: 1,
        testTitle: "VSTEP Mock Test",
        score: 0,
        maxScore: 100,
        correctAnswers: 0,
        totalQuestions: 50,
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: "IN_PROGRESS",
        answers: Array(50)
          .fill(null)
          .map((_, i) => ({
            questionId: i + 1,
            studentAnswer: null,
            isCorrect: false,
            correctAnswer: "A" as const,
          })),
      });
      setTimeLeft(90 * 60); // 90 minutes
      setIsLoading(false);
    }
  }, [attemptId]);

  // Timer countdown
  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, timeLeft]);

  // Auto-save answer
  useEffect(() => {
    if (!attempt || currentQuestionIndex >= attempt.answers.length) return;

    const questionId = attempt.answers[currentQuestionIndex].questionId;
    const answer = answers[questionId];

    if (answer) {
      mocktestApi
        .saveAnswer(attempt.testId, questionId, answer)
        .catch(console.error);
    }
  }, [answers]);

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitTest = async () => {
    if (!attempt) return;

    try {
      const testAnswers = attempt.answers.map((a) => ({
        questionId: a.questionId,
        answer: (answers[a.questionId] || null) as any,
      }));

      await mocktestApi.submitTest(attempt.testId, {
        testId: attempt.testId,
        answers: testAnswers,
      });

      navigate(`/student/mock-tests/results/${attemptId}`);
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Nộp bài thất bại");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading || !attempt) {
    return (
      <div className="flex items-center justify-center h-screen">
        Đang tải...
      </div>
    );
  }

  const currentQuestion = attempt.answers[currentQuestionIndex];
  const progress = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {attempt.testTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Câu {currentQuestionIndex + 1} / {attempt.totalQuestions}
          </p>
        </div>
        <div className="text-right">
          <div
            className={`text-2xl font-bold font-mono ${timeLeft < 300 ? "text-red-600" : "text-gray-900"}`}
          >
            {formatTime(timeLeft)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Còn lại</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 lg:grid-cols-4">
        {/* Question */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Câu hỏi {currentQuestionIndex + 1}
            </p>
            <p className="text-lg text-gray-900 mb-8 leading-relaxed">
              {`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quid est enim boni? Quisque ut erat.`}
            </p>

            <div className="space-y-3">
              {["A", "B", "C", "D"].map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                    answers[currentQuestion.questionId] === option
                      ? "border-black bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={answers[currentQuestion.questionId] === option}
                    onChange={() =>
                      handleAnswerChange(currentQuestion.questionId, option)
                    }
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900">
                    <strong>{option}.</strong> Tùy chọn {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Tiến độ</p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${(progress / attempt.totalQuestions) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {progress} / {attempt.totalQuestions}
            </p>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 max-h-96 overflow-y-auto">
            <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">
              Danh sách câu hỏi
            </p>
            <div className="grid grid-cols-5 gap-2">
              {attempt.answers.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded text-xs font-medium transition ${
                    currentQuestionIndex === idx
                      ? "bg-black text-white"
                      : answers[attempt.answers[idx].questionId]
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-900 transition"
          >
            Nộp bài
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-2">
        <button
          onClick={() =>
            setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
          }
          disabled={currentQuestionIndex === 0}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          ← Câu trước
        </button>
        <button
          onClick={() =>
            setCurrentQuestionIndex(
              Math.min(attempt.totalQuestions - 1, currentQuestionIndex + 1),
            )
          }
          disabled={currentQuestionIndex === attempt.totalQuestions - 1}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Câu sau →
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Xác nhận nộp bài?
            </h2>
            <p className="text-sm text-gray-600">
              Bạn đã trả lời {progress}/{attempt.totalQuestions} câu hỏi. Không
              thể quay lại sau khi nộp.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Tiếp tục làm
              </button>
              <button
                onClick={handleSubmitTest}
                className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestTakingPage;
