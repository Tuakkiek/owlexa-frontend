import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import testApi from "../../api/testApi";
import type { MockTestQuestion, TestAttempt } from "../../types/tests";

const StudentTestTakingPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!attemptId) return;

      try {
        setIsLoading(true);
        setError("");

        const attemptData = await testApi.getAttempt(Number(attemptId));
        setAttempt(attemptData);
        setTimeLeft((attemptData.durationMinutes ?? 0) * 60);
        setAnswers(
          attemptData.answers.reduce<Record<number, "A" | "B" | "C" | "D">>((acc, answer) => {
            if (answer.studentAnswer) {
              acc[answer.questionId] = answer.studentAnswer;
            }
            return acc;
          }, {}),
        );

        const questionsData = await testApi.getStudentQuestions(attemptData.testId);
        setQuestions(questionsData);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Không thể tải đề thi.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [attemptId]);

  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS" || timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          void handleSubmitTest();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attempt, timeLeft]);

  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const progress = questions.length
    ? Math.round((Object.keys(answers).length / questions.length) * 100)
    : 0;

  const handleAnswerChange = (questionId: number, answer: "A" | "B" | "C" | "D") => {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  };

  const handleSubmitTest = async () => {
    if (!attempt) return;

    try {
      setIsSubmitting(true);
      await testApi.submitTest(attempt.testId, {
        testId: attempt.testId,
        answers: questions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id] ?? "A",
        })),
      });
      navigate(`/student/tests/results/${attemptId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Nộp bài thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading || !attempt) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Đang tải...
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Không tìm thấy câu hỏi.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{attempt.testTitle}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Câu {currentQuestionIndex + 1} / {questions.length}
          </p>
        </div>
        <div className="text-right">
          <div className={`font-mono text-2xl font-bold ${timeLeft < 300 ? "text-red-600" : "text-gray-900"}`}>
            {formatTime(timeLeft)}
          </div>
          <p className="mt-1 text-xs text-gray-500">Còn lại</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
              Câu hỏi {currentQuestionIndex + 1}
            </p>
            <p className="mb-8 text-lg leading-relaxed text-gray-900">
              {currentQuestion.questionText}
            </p>

            <div className="space-y-3">
              {[
                ["A", currentQuestion.optionA],
                ["B", currentQuestion.optionB],
                ["C", currentQuestion.optionC],
                ["D", currentQuestion.optionD],
              ].map(([option, label]) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition ${
                    answers[currentQuestion.id] === option
                      ? "border-black bg-gray-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() => handleAnswerChange(currentQuestion.id, option as "A" | "B" | "C" | "D")}
                    className="h-5 w-5"
                  />
                  <span className="text-gray-900">
                    <strong>{option}.</strong> {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Tiến độ</p>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center text-xs text-gray-500">
              {Object.keys(answers).length} / {questions.length}
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-700">
              Danh sách câu hỏi
            </p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`h-8 w-8 rounded text-xs font-medium transition ${
                    currentQuestionIndex === index
                      ? "bg-black text-white"
                      : answers[question.id]
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-2 px-4 pb-6">
        <button
          onClick={() => setCurrentQuestionIndex((current) => Math.max(0, current - 1))}
          disabled={currentQuestionIndex === 0}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          ← Câu trước
        </button>
        <button
          onClick={() => setCurrentQuestionIndex((current) => Math.min(questions.length - 1, current + 1))}
          disabled={currentQuestionIndex === questions.length - 1}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Câu sau →
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 space-y-4 rounded-2xl bg-white p-8 max-w-sm">
            <h2 className="text-xl font-semibold text-gray-900">Xác nhận nộp bài?</h2>
            <p className="text-sm text-gray-600">
              Bạn đã trả lời {Object.keys(answers).length}/{questions.length} câu hỏi.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Tiếp tục làm
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  void handleSubmitTest();
                }}
                className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                Nộp ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestTakingPage;
