import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import testApi from "../../api/testApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import type {
  MockTest,
  MockTestQuestion,
  TestAnswer,
  TestAttempt,
} from "../../types/tests";

type TestFormState = {
  title: string;
  description: string;
  level: MockTest["level"];
  duration: number;
  totalQuestions: number;
  isActive: boolean;
};

type QuestionFormState = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  sortOrder: number;
};

const LEVEL_OPTIONS: Array<{ value: MockTest["level"]; label: string }> = [
  { value: "BEGINNER", label: "Sơ cấp" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
];

const emptyTestForm: TestFormState = {
  title: "",
  description: "",
  level: "INTERMEDIATE",
  duration: 90,
  totalQuestions: 50,
  isActive: true,
};

const emptyQuestionForm: QuestionFormState = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  explanation: "",
  sortOrder: 0,
};

const ANSWER_LABELS: Record<"A" | "B" | "C" | "D", string> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

const LEVEL_LABELS: Record<MockTest["level"], string> = {
  BEGINNER: "Sơ cấp",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

export default function OwnerTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [testForm, setTestForm] = useState<TestFormState>(emptyTestForm);
  const [isSavingTest, setIsSavingTest] = useState(false);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<MockTestQuestion | null>(null);
  const [questionForm, setQuestionForm] =
    useState<QuestionFormState>(emptyQuestionForm);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  const [isAttemptModalOpen, setIsAttemptModalOpen] = useState(false);
  const [attemptDetail, setAttemptDetail] = useState<TestAttempt | null>(null);
  const [isLoadingAttemptDetail, setIsLoadingAttemptDetail] = useState(false);

  const selectedTest = useMemo(
    () => tests.find((test) => test.id === selectedTestId) ?? null,
    [tests, selectedTestId],
  );

  const filteredTests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tests;

    return tests.filter(
      (test) =>
        test.title.toLowerCase().includes(keyword) ||
        (test.description ?? "").toLowerCase().includes(keyword),
    );
  }, [tests, search]);

  const loadTests = useCallback(async () => {
    try {
      setIsLoadingTests(true);
      setError("");
      const data = await testApi.getAllTests();
      setTests(data);
      setSelectedTestId((current) => current ?? data[0]?.id ?? null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách đề thi.",
      );
    } finally {
      setIsLoadingTests(false);
    }
  }, []);

  const loadDetails = useCallback(async (testId: number) => {
    try {
      setIsLoadingDetails(true);
      setError("");
      const [questionData, attemptData] = await Promise.all([
        testApi.getOwnerQuestions(testId),
        testApi.getOwnerAttempts(testId),
      ]);
      setQuestions(questionData);
      setAttempts(attemptData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Không thể tải câu hỏi hoặc lượt làm bài.",
      );
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  useEffect(() => {
    if (selectedTestId) {
      loadDetails(selectedTestId);
    } else {
      setQuestions([]);
      setAttempts([]);
    }
  }, [loadDetails, selectedTestId]);

  const openCreateTest = () => {
    setEditingTest(null);
    setTestForm(emptyTestForm);
    setIsTestModalOpen(true);
  };

  const openEditTest = (test: MockTest) => {
    setEditingTest(test);
    setTestForm({
      title: test.title,
      description: test.description,
      level: test.level,
      duration: test.duration,
      totalQuestions: test.totalQuestions,
      isActive: test.isActive,
    });
    setIsTestModalOpen(true);
  };

  const handleSaveTest = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsSavingTest(true);
      const payload = {
        ...testForm,
        title: testForm.title.trim(),
        description: testForm.description.trim(),
      };

      const saved = editingTest
        ? await testApi.updateTest(editingTest.id, payload)
        : await testApi.createTest(payload);

      setIsTestModalOpen(false);
      setSelectedTestId(saved.id);
      await loadTests();
      await loadDetails(saved.id);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu đề thi.");
    } finally {
      setIsSavingTest(false);
    }
  };

  const handleDeleteTest = async (test: MockTest) => {
    if (!window.confirm(`Xóa đề thi "${test.title}"?`)) return;

    try {
      await testApi.deleteTest(test.id);
      if (selectedTestId === test.id) {
        setSelectedTestId(null);
      }
      await loadTests();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể xóa đề thi.");
    }
  };

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({ ...emptyQuestionForm, sortOrder: questions.length });
    setIsQuestionModalOpen(true);
  };

  const openEditQuestion = (question: MockTestQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: (question.correctAnswer ||
        "A") as QuestionFormState["correctAnswer"],
      explanation: question.explanation || "",
      sortOrder: question.sortOrder,
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTestId) return;

    try {
      setIsSavingQuestion(true);
      const payload = {
        ...questionForm,
        questionText: questionForm.questionText.trim(),
        explanation: questionForm.explanation.trim(),
      };

      if (editingQuestion) {
        await testApi.updateQuestion(
          selectedTestId,
          editingQuestion.id,
          payload,
        );
      } else {
        await testApi.addQuestion(selectedTestId, payload);
      }

      setIsQuestionModalOpen(false);
      await loadDetails(selectedTestId);
      await loadTests();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu câu hỏi.");
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (question: MockTestQuestion) => {
    if (!selectedTestId) return;
    if (!window.confirm("Xóa câu hỏi này?")) return;

    try {
      await testApi.deleteQuestion(selectedTestId, question.id);
      await loadDetails(selectedTestId);
      await loadTests();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể xóa câu hỏi.");
    }
  };

  const openAttemptDetail = async (attempt: TestAttempt) => {
    try {
      setIsLoadingAttemptDetail(true);
      setAttemptDetail(await testApi.getOwnerAttempt(attempt.id));
      setIsAttemptModalOpen(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải chi tiết lượt làm bài.",
      );
    } finally {
      setIsLoadingAttemptDetail(false);
    }
  };

  const activeCount = tests.filter((test) => test.isActive).length;
  const totalQuestions = questions.length;
  const totalAttempts = attempts.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Đề thi thử</h1>
          
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={loadTests}
            isLoading={isLoadingTests}
          >
            Làm mới
          </Button>
          <Button onClick={openCreateTest}>Tạo đề thi</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Tổng đề thi
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {tests.length}
          </p>
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Đang hoạt động
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {activeCount}
          </p>
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Câu hỏi của đề
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {selectedTest ? totalQuestions : "—"}
          </p>
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Lượt làm bài
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {selectedTest ? totalAttempts : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách đề thi
              </h2>
            </div>
            <div className="w-full sm:w-56">
              <Input
                label="Tìm đề"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nhập tên đề..."
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {isLoadingTests ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 bg-gray-100 border border-gray-200"
                />
              ))
            ) : filteredTests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
                Chưa có đề thi nào phù hợp.
              </div>
            ) : (
              filteredTests.map((test) => {
                const active = selectedTestId === test.id;
                return (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => setSelectedTestId(test.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold">
                          {test.title}
                        </h3>
                        <p
                          className={
                            active
                              ? "mt-1 text-sm text-gray-200"
                              : "mt-1 text-sm text-gray-500"
                          }
                        >
                          {test.description || "Không có mô tả"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-current px-2 py-0.5 text-xs">
                        {test.isActive ? "Đang mở" : "Tạm dừng"}
                      </span>
                    </div>

                    <div
                      className={
                        active
                          ? "mt-4 flex flex-wrap gap-3 text-xs text-gray-200"
                          : "mt-4 flex flex-wrap gap-3 text-xs text-gray-500"
                      }
                    >
                      <span>{LEVEL_LABELS[test.level]}</span>
                      <span>{test.duration} phút</span>
                      <span>{test.totalQuestions} câu</span>
                      <span>{test.questionCount ?? 0} câu hỏi</span>
                      <span>{test.attemptCount ?? 0} lượt làm</span>
                    </div>

                    <div className="mt-4 flex gap-3 text-sm">
                      <span
                        className={
                          active
                            ? "font-medium underline"
                            : "font-medium text-blue-600 underline"
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditTest(test);
                        }}
                      >
                        Sửa
                      </span>
                      <span
                        className={
                          active
                            ? "font-medium underline"
                            : "font-medium text-red-600 underline"
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteTest(test);
                        }}
                      >
                        Xóa
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedTest ? selectedTest.title : "Chọn một đề thi"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedTest
                    ? `${selectedTest.duration} phút · ${LEVEL_LABELS[selectedTest.level]} · ${selectedTest.totalQuestions} câu`
                    : "Thông tin chi tiết sẽ xuất hiện ở đây."}
                </p>
              </div>
              {selectedTest && (
                <Button onClick={openCreateQuestion}>Thêm câu hỏi</Button>
              )}
            </div>

            {selectedTest && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Câu hỏi hiện có
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {questions.length}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Lượt làm bài
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {attempts.length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {selectedTest && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Câu hỏi
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {questions.length} câu hỏi trong đề {selectedTest.title}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {isLoadingDetails ? (
                  <div className="py-8 text-sm text-gray-500">
                    Đang tải câu hỏi...
                  </div>
                ) : questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                    Chưa có câu hỏi nào cho đề này.
                  </div>
                ) : (
                  questions.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">
                            Câu {question.sortOrder + 1}
                          </p>
                          <p className="mt-1 font-medium text-gray-900">
                            {question.questionText}
                          </p>
                        </div>
                        <div className="flex gap-3 text-sm">
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => openEditQuestion(question)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteQuestion(question)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        {[
                          ["A", question.optionA],
                          ["B", question.optionB],
                          ["C", question.optionC],
                          ["D", question.optionD],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className={`rounded-lg border px-3 py-2 ${
                              question.correctAnswer === label
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-gray-200 bg-gray-50 text-gray-700"
                            }`}
                          >
                            <span className="font-semibold">{label}.</span>{" "}
                            {value}
                          </div>
                        ))}
                      </div>

                      {question.explanation && (
                        <p className="mt-3 text-sm text-gray-500">
                          Giải thích: {question.explanation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedTest && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Lượt làm bài
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {attempts.length} lượt làm cho đề {selectedTest.title}
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                {isLoadingDetails ? (
                  <div className="p-6 text-sm text-gray-500">
                    Đang tải lượt làm bài...
                  </div>
                ) : attempts.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">
                    Chưa có lượt làm bài nào.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Học sinh</th>
                        <th className="px-4 py-3 font-medium">Điểm</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                        <th className="px-4 py-3 text-right font-medium">
                          Ngày
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attempts.map((attempt) => (
                        <tr
                          key={attempt.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => openAttemptDetail(attempt)}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {attempt.studentFullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              #{attempt.id}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {attempt.score}/{attempt.maxScore}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                attempt.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {attempt.status === "COMPLETED"
                                ? "Hoàn thành"
                                : "Đang làm"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {new Date(attempt.startedAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title={editingTest ? "Chỉnh sửa đề thi" : "Tạo đề thi"}
      >
        <form className="space-y-4" onSubmit={handleSaveTest}>
          <Input
            label="Tên đề thi"
            value={testForm.title}
            onChange={(event) =>
              setTestForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cấp độ
              </label>
              <select
                value={testForm.level}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    level: event.target.value as MockTest["level"],
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Thời lượng (phút)"
              type="number"
              value={testForm.duration}
              onChange={(event) =>
                setTestForm((current) => ({
                  ...current,
                  duration: Number(event.target.value),
                }))
              }
              min={1}
              required
            />
          </div>
          <Input
            label="Số câu hỏi dự kiến"
            type="number"
            value={testForm.totalQuestions}
            onChange={(event) =>
              setTestForm((current) => ({
                ...current,
                totalQuestions: Number(event.target.value),
              }))
            }
            min={1}
            required
          />
          <Input
            label="Mô tả"
            value={testForm.description}
            onChange={(event) =>
              setTestForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={testForm.isActive}
              onChange={(event) =>
                setTestForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Kích hoạt ngay sau khi lưu
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsTestModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={isSavingTest}>
              {editingTest ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}
      >
        <form className="space-y-4" onSubmit={handleSaveQuestion}>
          <Input
            label="Câu hỏi"
            value={questionForm.questionText}
            onChange={(event) =>
              setQuestionForm((current) => ({
                ...current,
                questionText: event.target.value,
              }))
            }
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Đáp án A"
              value={questionForm.optionA}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  optionA: event.target.value,
                }))
              }
              required
            />
            <Input
              label="Đáp án B"
              value={questionForm.optionB}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  optionB: event.target.value,
                }))
              }
              required
            />
            <Input
              label="Đáp án C"
              value={questionForm.optionC}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  optionC: event.target.value,
                }))
              }
              required
            />
            <Input
              label="Đáp án D"
              value={questionForm.optionD}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  optionD: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Đáp án đúng
              </label>
              <select
                value={questionForm.correctAnswer}
                onChange={(event) =>
                  setQuestionForm((current) => ({
                    ...current,
                    correctAnswer: event.target
                      .value as QuestionFormState["correctAnswer"],
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
              >
                {(["A", "B", "C", "D"] as const).map((option) => (
                  <option key={option} value={option}>
                    {ANSWER_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Thứ tự"
              type="number"
              value={questionForm.sortOrder}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value),
                }))
              }
              min={0}
              required
            />
          </div>
          <Input
            label="Giải thích"
            value={questionForm.explanation}
            onChange={(event) =>
              setQuestionForm((current) => ({
                ...current,
                explanation: event.target.value,
              }))
            }
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsQuestionModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={isSavingQuestion}>
              {editingQuestion ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAttemptModalOpen}
        onClose={() => setIsAttemptModalOpen(false)}
        title="Chi tiết lượt làm bài"
      >
        {isLoadingAttemptDetail ? (
          <div className="py-8 text-sm text-gray-500">Đang tải chi tiết...</div>
        ) : attemptDetail ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">
                {attemptDetail.studentFullName}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {attemptDetail.testTitle} · {attemptDetail.score}/
                {attemptDetail.maxScore} điểm
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {attemptDetail.status === "COMPLETED"
                  ? "Hoàn thành"
                  : "Đang làm"}{" "}
                ·{" "}
                {attemptDetail.completedAt
                  ? new Date(attemptDetail.completedAt).toLocaleString("vi-VN")
                  : new Date(attemptDetail.startedAt).toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="space-y-3">
              {(attemptDetail.answers ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                  Chưa có câu trả lời nào trong lượt làm này.
                </div>
              ) : (
                attemptDetail.answers.map(
                  (answer: TestAnswer, index: number) => (
                    <div
                      key={`${answer.questionId}-${index}`}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Câu {index + 1}
                      </p>
                      <p className="mt-1 font-medium text-gray-900">
                        {answer.questionText || `Câu hỏi #${answer.questionId}`}
                      </p>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="font-semibold text-gray-700">
                            Đáp án học sinh:
                          </span>{" "}
                          {answer.studentAnswer || "Chưa trả lời"}
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="font-semibold text-gray-700">
                            Đáp án đúng:
                          </span>{" "}
                          {answer.correctAnswer}
                        </div>
                      </div>
                      <div className="mt-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            answer.isCorrect
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {answer.isCorrect ? "Đúng" : "Sai"}
                        </span>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-sm text-gray-500">Không có dữ liệu.</div>
        )}
      </Modal>
    </div>
  );
}
