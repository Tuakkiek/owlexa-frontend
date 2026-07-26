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
import { QuestionForm } from "./components/QuestionForm";

const PAGE_SIZE = 20;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};

const previewContent = (html: string) => {
  const text = stripHtml(html);
  if (text.length <= 120) return text || "-";
  return `${text.slice(0, 120)}...`;
};

const typeLabel: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  ESSAY: "Essay",
};

const difficultyLabel: Record<QuestionDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
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
      setError(err?.response?.data?.message ?? "Unable to load questions.");
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
      toast.error(err?.response?.data?.message ?? "Unable to load question.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleSave = async (request: QuestionRequest) => {
    if (editingQuestion) {
      await questionBankApi.update(editingQuestion.id, request);
      toast.success("Question updated.");
    } else {
      await questionBankApi.create(request);
      toast.success("Question created.");
    }

    closeModal();
    await loadQuestions();
  };

  const handleDelete = async (question: QuestionResponse) => {
    const confirmed = await confirm({
      title: "Delete question?",
      message: `Delete "${question.title || previewContent(question.content)}"? This removes it from the active question bank.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await questionBankApi.delete(question.id);
      toast.success("Question deleted.");
      await loadQuestions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Unable to delete question.");
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
        title="Question Bank"
        description="Manage reusable questions for this center."
      >
        <Button onClick={openCreate}>Create Question</Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px]">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search questions..."
        />

        <select
          value={type}
          onChange={(event) => setType(event.target.value as QuestionType | "")}
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        >
          <option value="">All types</option>
          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
          <option value="ESSAY">Essay</option>
        </select>

        <select
          value={difficulty}
          onChange={(event) =>
            setDifficulty(event.target.value as QuestionDifficulty | "")
          }
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        >
          <option value="">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
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
          <option value="">All criteria</option>
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
          No questions found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-3">Question</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Difficulty</th>
                  <th className="px-6 py-3">Points</th>
                  <th className="px-6 py-3">Criteria</th>
                  <th className="px-6 py-3">Updated At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-surface-hover">
                    <td className="max-w-xl px-6 py-4">
                      <div className="font-medium text-gray-900">
                        <span className="line-clamp-1 break-words">
                          {question.title || "Untitled question"}
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
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-600 underline"
                          onClick={() => handleDelete(question)}
                        >
                          Delete
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
            Page {questionsPage.number + 1} of {pageCount} ·{" "}
            {questionsPage.totalElements} questions
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToPreviousPage}
              disabled={questionsPage.number <= 0}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              disabled={questionsPage.number + 1 >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingQuestion ? "Edit Question" : "Create Question"}
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
