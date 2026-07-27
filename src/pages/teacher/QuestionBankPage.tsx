import { useCallback, useEffect, useMemo, useState } from "react";
import { gradingCriteriaApi } from "../../api/gradingCriteriaApi";
import { questionBankApi } from "../../api/questionBankApi";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
} from "../../components/ui/SharedComponents";
import type { GradingCriteriaResponse } from "../../types/gradingCriteria";
import type {
  PageResponse,
  QuestionDifficulty,
  QuestionRequest,
  QuestionResponse,
  QuestionType,
} from "../../types/questionBank";
import { formatDateTime } from "../../utils/dateTime";
import { stripHtml } from "../../utils/text";
import { QuestionForm } from "./components/QuestionForm";

const PAGE_SIZE = 20;

const previewContent = (html: string) => {
  const text = stripHtml(html);
  if (text.length <= 120) return text || "-";
  return `${text.slice(0, 120)}...`;
};

const typeLabel: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  ESSAY: "Tự luận",
};

const difficultyLabel: Record<QuestionDifficulty, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const emptyPage: PageResponse<QuestionResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
};

const QuestionBankPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [questionsPage, setQuestionsPage] =
    useState<PageResponse<QuestionResponse>>(emptyPage);
  const [criteria, setCriteria] = useState<GradingCriteriaResponse[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<QuestionType | "">("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "">("");
  const [gradingCriteriaId, setGradingCriteriaId] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCriteriaLoading, setIsCriteriaLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<QuestionResponse | null>(null);

  const loadCriteria = useCallback(async () => {
    try {
      setIsCriteriaLoading(true);
      setCriteria(await gradingCriteriaApi.findAll());
    } catch {
      setCriteria([]);
    } finally {
      setIsCriteriaLoading(false);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setQuestionsPage(
        await questionBankApi.findAll({
          search: query,
          type,
          difficulty,
          gradingCriteriaId,
          page,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách câu hỏi.");
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, gradingCriteriaId, page, query, type]);

  useEffect(() => {
    loadCriteria();
  }, [loadCriteria]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadQuestions();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadQuestions]);

  useEffect(() => {
    setPage(0);
  }, [difficulty, gradingCriteriaId, query, type]);

  const questions = questionsPage.content;
  const pageCount = Math.max(questionsPage.totalPages, 1);

  const criteriaFilterOptions = useMemo(
    () =>
      criteria
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [criteria],
  );

  const openCreate = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const openEdit = async (question: QuestionResponse) => {
    try {
      setEditingQuestion(await questionBankApi.findById(question.id));
      setIsModalOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể tải thông tin câu hỏi.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleSave = async (request: QuestionRequest) => {
    if (editingQuestion) {
      await questionBankApi.update(editingQuestion.id, request);
      toast.success("Cập nhật câu hỏi thành công.");
    } else {
      await questionBankApi.create(request);
      toast.success("Tạo mới câu hỏi thành công.");
    }

    closeModal();
    await loadQuestions();
  };

  const handleDelete = async (question: QuestionResponse) => {
    const confirmed = await confirm({
      title: "Xóa câu hỏi?",
      message: `Bạn có chắc chắn muốn xóa câu hỏi "${question.title || previewContent(question.content)}"? Câu hỏi sẽ bị xóa khỏi ngân hàng câu hỏi.`,
      confirmText: "Xóa",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await questionBankApi.delete(question.id);
      toast.success("Đã xóa câu hỏi.");
      await loadQuestions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa câu hỏi.");
    }
  };

  const goToPreviousPage = () => {
    setPage((current) => Math.max(current - 1, 0));
  };

  const goToNextPage = () => {
    setPage((current) =>
      current + 1 >= questionsPage.totalPages ? current : current + 1,
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Ngân hàng câu hỏi"
        description="Quản lý danh sách câu hỏi tái sử dụng cho trung tâm."
      >
        <Button onClick={openCreate}>Tạo mới câu hỏi</Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px]">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Tìm kiếm câu hỏi..."
        />

        <select
          value={type}
          onChange={(event) => setType(event.target.value as QuestionType | "")}
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        >
          <option value="">Tất cả loại</option>
          <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
          <option value="ESSAY">Tự luận</option>
        </select>

        <select
          value={difficulty}
          onChange={(event) =>
            setDifficulty(event.target.value as QuestionDifficulty | "")
          }
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        >
          <option value="">Tất cả độ khó</option>
          <option value="EASY">Dễ</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HARD">Khó</option>
        </select>

        <select
          value={gradingCriteriaId}
          onChange={(event) =>
            setGradingCriteriaId(
              event.target.value ? Number(event.target.value) : "",
            )
          }
          disabled={isCriteriaLoading}
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary disabled:bg-surface-hover"
        >
          <option value="">Tất cả tiêu chí</option>
          {criteriaFilterOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-16" />
      ) : questions.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Không tìm thấy câu hỏi nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-3">Câu hỏi</th>
                  <th className="px-6 py-3">Loại</th>
                  <th className="px-6 py-3">Độ khó</th>
                  <th className="px-6 py-3">Điểm số</th>
                  <th className="px-6 py-3">Tiêu chí</th>
                  <th className="px-6 py-3">Cập nhật</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-surface-hover">
                    <td className="max-w-xl px-6 py-4">
                      <div className="font-medium text-gray-900">
                        <span className="line-clamp-1 break-words">
                          {question.title || "Câu hỏi chưa có tiêu đề"}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-500">
                        <span className="line-clamp-2 break-words">
                          {previewContent(question.content)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge>{typeLabel[question.type]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                      {question.difficulty
                        ? difficultyLabel[question.difficulty]
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                      {question.points ?? "-"}
                    </td>
                    <td className="max-w-xs px-6 py-4 text-gray-600">
                      <span className="line-clamp-2 break-words">
                        {question.gradingCriteria?.name ?? "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTime(question.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs text-blue-600 underline"
                          onClick={() => openEdit(question)}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-600 underline"
                          onClick={() => handleDelete(question)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && questionsPage.totalElements > 0 && (
        <div className="flex flex-col gap-3 rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Trang {questionsPage.number + 1} / {pageCount} · Tổng số{" "}
            {questionsPage.totalElements} câu hỏi
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToPreviousPage}
              disabled={questionsPage.number <= 0}
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              disabled={questionsPage.number + 1 >= pageCount}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingQuestion ? "Chỉnh sửa câu hỏi" : "Tạo mới câu hỏi"}
        maxWidth="max-w-5xl"
      >
        <QuestionForm
          initialData={editingQuestion ?? undefined}
          gradingCriteria={criteria}
          onSubmit={handleSave}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default QuestionBankPage;
