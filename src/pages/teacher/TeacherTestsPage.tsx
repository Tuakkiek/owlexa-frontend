import { useCallback, useEffect, useMemo, useState } from "react";
import { classApi } from "../../api/classApi";
import testApi from "../../api/testApi";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import type { TeacherClassStudents } from "../../types/teacherClassStudents";
import type { TestAnswer, TestAttempt } from "../../types/tests";

const statusLabels: Record<TestAttempt["status"], string> = {
  COMPLETED: "Hoàn thành",
  IN_PROGRESS: "Đang làm",
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

export default function TeacherTestsPage() {
  const [classes, setClasses] = useState<TeacherClassStudents[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | "all">("all");
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [attemptDetail, setAttemptDetail] = useState<TestAttempt | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const loadClasses = useCallback(async () => {
    try {
      setIsLoadingClasses(true);
      const data = await classApi.findMyClassesWithStudentsAsTeacher();
      setClasses(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách lớp.");
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  const loadAttempts = useCallback(async () => {
    try {
      setIsLoadingAttempts(true);
      setError("");
      const classId = selectedClassId === "all" ? undefined : selectedClassId;
      setAttempts(await testApi.getTeacherAttempts(classId));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải kết quả thi thử.",
      );
    } finally {
      setIsLoadingAttempts(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const filteredAttempts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return attempts;

    return attempts.filter(
      (attempt) =>
        attempt.studentFullName.toLowerCase().includes(keyword) ||
        attempt.testTitle.toLowerCase().includes(keyword),
    );
  }, [attempts, searchQuery]);

  const completedAttempts = attempts.filter(
    (attempt) => attempt.status === "COMPLETED",
  );
  const averageScore = completedAttempts.length
    ? completedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
      completedAttempts.length
    : 0;
  const averagePercent = completedAttempts.length
    ? completedAttempts.reduce((sum, attempt) => {
        const maxScore = attempt.maxScore || attempt.totalQuestions || 1;
        return sum + (attempt.score / maxScore) * 100;
      }, 0) / completedAttempts.length
    : 0;

  const openAttemptDetail = async (attempt: TestAttempt) => {
    try {
      setIsLoadingDetail(true);
      setAttemptDetail(await testApi.getTeacherAttempt(attempt.id));
      setIsDetailOpen(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải chi tiết bài làm.",
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Kết quả thi thử
          </h1>
        </div>
        <Button
          variant="secondary"
          onClick={loadAttempts}
          isLoading={isLoadingAttempts}
        >
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Lượt đã nộp
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {completedAttempts.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Điểm TB
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {averageScore.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Tỷ lệ đúng TB
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {averagePercent.toFixed(0)}%
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedClassId("all")}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedClassId === "all"
                  ? "bg-primary text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Tất cả lớp
            </button>
            {classes.map((cls) => (
              <button
                type="button"
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedClassId === cls.id
                    ? "bg-primary text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {cls.className} ({cls.studentCount})
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm học sinh hoặc đề thi..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          />
        </div>

        {isLoadingClasses || isLoadingAttempts ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-600">
            Chưa có kết quả thi thử nào phù hợp.
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Học sinh</th>
                  <th className="px-4 py-3 font-medium">Đề thi</th>
                  <th className="px-4 py-3 font-medium">Điểm</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium">Ngày nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttempts.map((attempt) => (
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
                        ID #{attempt.studentId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {attempt.testTitle}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {attempt.score}/{attempt.maxScore}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        {statusLabels[attempt.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {formatDateTime(attempt.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Chi tiết bài làm"
      >
        {isLoadingDetail ? (
          <div className="py-8 text-sm text-gray-500">Đang tải chi tiết...</div>
        ) : attemptDetail ? (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">
                {attemptDetail.studentFullName}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {attemptDetail.testTitle} - {attemptDetail.score}/
                {attemptDetail.maxScore} điểm
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Nộp lúc {formatDateTime(attemptDetail.completedAt)}
              </p>
            </div>

            {(attemptDetail.answers ?? []).map(
              (answer: TestAnswer, index: number) => (
                <div
                  key={`${answer.questionId}-${index}`}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Câu {index + 1}
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {answer.questionText}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      Học sinh chọn:{" "}
                      <span className="font-semibold">
                        {answer.studentAnswer || "-"}
                      </span>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      Đáp án đúng:{" "}
                      <span className="font-semibold">
                        {answer.correctAnswer}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      answer.isCorrect
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {answer.isCorrect ? "Đúng" : "Sai"}
                  </span>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="py-8 text-sm text-gray-500">Không có dữ liệu.</div>
        )}
      </Modal>
    </div>
  );
}
