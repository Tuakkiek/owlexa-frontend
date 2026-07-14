import { useCallback, useEffect, useMemo, useState } from "react";
import { classApi } from "../../api/classApi";
import testApi from "../../api/testApi";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  PageHeader,
  ErrorBanner,
  StatCard,
  Badge,
  FilterTabs,
  SearchInput,
  LoadingSkeleton,
} from "../../components/ui/SharedComponents";
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
      <PageHeader title="Kết quả thi thử">
        <Button
          variant="secondary"
          onClick={loadAttempts}
          isLoading={isLoadingAttempts}
          size="sm"
        >
          Làm mới
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lượt đã nộp" value={completedAttempts.length} />
        <StatCard label="Điểm TB" value={averageScore.toFixed(1)} />
        <StatCard
          label="Tỷ lệ đúng TB"
          value={`${averagePercent.toFixed(0)}%`}
        />
      </div>

      <section className="rounded-card border border-surface-border bg-white p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <FilterTabs
            tabs={[
              { key: "all", label: "Tất cả lớp", count: attempts.length },
              ...classes.map((c) => ({
                key: String(c.id),
                label: c.className,
                count: c.studentCount,
              })),
            ]}
            activeKey={String(selectedClassId)}
            onChange={(key) =>
              setSelectedClassId(key === "all" ? "all" : Number(key))
            }
          />
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm học sinh hoặc đề thi..."
          />
        </div>

        {isLoadingClasses || isLoadingAttempts ? (
          <div className="mt-4 space-y-3">
            <LoadingSkeleton count={5} height="h-16" />
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="mt-4 rounded-card border border-dashed border-surface-border bg-surface-page py-12 text-center text-sm text-gray-500">
            Chưa có kết quả thi thử nào phù hợp.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-card border border-surface-border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Học sinh</th>
                  <th className="px-6 py-3">Đề thi</th>
                  <th className="px-6 py-3">Điểm</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Ngày nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredAttempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="cursor-pointer transition-colors hover:bg-surface-hover"
                    onClick={() => openAttemptDetail(attempt)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {attempt.studentFullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID #{attempt.studentId}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {attempt.testTitle}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {attempt.score}/{attempt.maxScore}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success">
                        {statusLabels[attempt.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
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
