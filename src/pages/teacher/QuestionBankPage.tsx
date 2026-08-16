import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { questionBankApi } from "../../api/questionBankApi";
import { questionCollectionApi } from "../../api/questionCollectionApi";
import { Button } from "../../components/ui/Button";
import { TableActionButton, tableActionIcons } from "../../components/ui/TableActionButton";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
} from "../../components/ui/SharedComponents";
import {
  editorDocumentToPlainText,
} from "../../components/editor";
import type {
  PageResponse,
  QuestionCollectionResponse,
  QuestionDifficulty,
  QuestionResponse,
  QuestionSort,
  QuestionType,
} from "../../types/questionBank";
import { formatDateTime } from "../../utils/dateTime";
import { QuestionJsonImportForm } from "./components/QuestionJsonImportForm";

const PAGE_SIZE = 20;

const emptyPage: PageResponse<QuestionResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
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

const previewContent = (question: QuestionResponse) => {
  const text = editorDocumentToPlainText(question.content);
  return text ? (text.length > 100 ? `${text.slice(0, 100)}…` : text) : "—";
};

type CollectionDialogState =
  | { mode: "create"; collection: null }
  | { mode: "edit"; collection: QuestionCollectionResponse }
  | null;

const QuestionBankPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [collections, setCollections] = useState<QuestionCollectionResponse[]>([]);
  const [questionsPage, setQuestionsPage] =
    useState<PageResponse<QuestionResponse>>(emptyPage);
  const [sectionCodes, setSectionCodes] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [collectionDialog, setCollectionDialog] =
    useState<CollectionDialogState>(null);
  const [collectionCode, setCollectionCode] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collectionError, setCollectionError] = useState("");
  const [isCollectionSaving, setIsCollectionSaving] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const search = searchParams.get("search") ?? "";
  const collectionId = Number(searchParams.get("collection") ?? "") || "";
  const sectionCode = searchParams.get("section") ?? "";
  const difficulty =
    (searchParams.get("difficulty") as QuestionDifficulty | null) ?? "";
  const type = (searchParams.get("type") as QuestionType | null) ?? "";
  const sort =
    (searchParams.get("sort") as QuestionSort | null) ?? "updatedAt,desc";
  const page = Math.max(Number(searchParams.get("page") ?? "1") - 1, 0);

  const updateParams = useCallback(
    (patch: Record<string, string | number | null>, resetPage = true) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === null || value === "") next.delete(key);
          else next.set(key, String(value));
        });
        if (resetPage) next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  const loadCollections = useCallback(async () => {
    try {
      setCollections(await questionCollectionApi.findAll());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải Collections.");
    }
  }, []);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    if (!collectionId) {
      setSectionCodes([]);
      return;
    }
    questionBankApi
      .findSectionCodes(collectionId)
      .then(setSectionCodes)
      .catch(() => setSectionCodes([]));
  }, [collectionId]);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const result = await questionBankApi.findAll({
        search,
        collectionId,
        sectionCode,
        difficulty,
        type,
        sort,
        page,
        size: PAGE_SIZE,
      });
      setQuestionsPage(result);
      setSelectedIds((current) => {
        const visible = new Set(result.content.map((question) => question.id));
        return new Set([...current].filter((id) => visible.has(id)));
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải câu hỏi.");
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, difficulty, page, search, sectionCode, sort, type]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadQuestions(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadQuestions]);

  const allCurrentPageSelected =
    questionsPage.content.length > 0 &&
    questionsPage.content.every((question) => selectedIds.has(question.id));

  const toggleAllCurrentPage = () => {
    const pageIds = questionsPage.content.map((question) => question.id);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (pageIds.every((id) => next.has(id))) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleQuestion = (questionId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const openCollectionDialog = (
    mode: "create" | "edit",
    collection?: QuestionCollectionResponse,
  ) => {
    setCollectionDialog(
      mode === "create"
        ? { mode, collection: null }
        : { mode, collection: collection! },
    );
    setCollectionCode(collection?.code ?? "");
    setCollectionName(collection?.name ?? "");
    setCollectionDescription(collection?.description ?? "");
    setCollectionError("");
  };

  const saveCollection = async () => {
    if (!collectionName.trim()) {
      setCollectionError("Tên Collection là bắt buộc.");
      return;
    }
    if (collectionDialog?.mode === "create" && !/^[A-Z][A-Z0-9_]*$/.test(collectionCode)) {
      setCollectionError("Code chỉ gồm chữ in hoa, số và dấu gạch dưới.");
      return;
    }
    try {
      setIsCollectionSaving(true);
      if (collectionDialog?.mode === "create") {
        await questionCollectionApi.create({
          code: collectionCode,
          name: collectionName.trim(),
          description: collectionDescription.trim() || null,
        });
        toast.success("Đã tạo Collection.");
      } else if (collectionDialog?.mode === "edit") {
        await questionCollectionApi.update(collectionDialog.collection.id, {
          name: collectionName.trim(),
          description: collectionDescription.trim() || null,
        });
        toast.success("Đã cập nhật Collection.");
      }
      setCollectionDialog(null);
      await loadCollections();
    } catch (err: any) {
      setCollectionError(err?.response?.data?.message ?? "Không thể lưu Collection.");
    } finally {
      setIsCollectionSaving(false);
    }
  };

  const deleteCollection = async (collection: QuestionCollectionResponse) => {
    const accepted = await confirm({
      title: "Xóa Collection?",
      message: `Xóa Collection "${collection.name}"? Chỉ Collection rỗng mới có thể xóa.`,
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!accepted) return;
    try {
      await questionCollectionApi.delete(collection.id);
      if (collectionId === collection.id) updateParams({ collection: null, section: null });
      toast.success("Đã xóa Collection.");
      await loadCollections();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa Collection.");
    }
  };

  const exportCollection = async (collection: QuestionCollectionResponse) => {
    try {
      const data = await questionBankApi.exportCollection(collection.id);
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${collection.code}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất bộ câu hỏi.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xuất bộ câu hỏi.");
    }
  };

  const deleteQuestion = async (question: QuestionResponse) => {
    const accepted = await confirm({
      title: "Xóa câu hỏi?",
      message: `Xóa "${question.questionCode}" khỏi Question Bank?`,
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!accepted) return;
    try {
      await questionBankApi.delete(question.id);
      toast.success("Đã xóa câu hỏi.");
      await Promise.all([loadQuestions(), loadCollections()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa câu hỏi.");
    }
  };

  const deleteSelectedQuestions = async () => {
    const questionIds = [...selectedIds];
    if (questionIds.length === 0 || isBulkDeleting) return;

    const accepted = await confirm({
      title: "Xóa câu hỏi đã chọn?",
      message: `Xóa ${questionIds.length} câu hỏi khỏi Question Bank?`,
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!accepted) return;

    try {
      setIsBulkDeleting(true);
      await questionBankApi.bulkDelete(questionIds);
      setSelectedIds(new Set());
      toast.success(`Đã xóa ${questionIds.length} câu hỏi.`);
      await Promise.all([loadQuestions(), loadCollections()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa câu hỏi đã chọn.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === collectionId),
    [collectionId, collections],
  );
  const pageCount = Math.max(questionsPage.totalPages, 1);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeader
        title="Ngân hàng câu hỏi"
      >
        <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
          Import JSON
        </Button>
        <Button
          onClick={() =>
            navigate(
              `/teacher/questions/new${collectionId ? `?collection=${collectionId}` : ""}`,
            )
          }
        >
          Tạo câu hỏi
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="self-start rounded-card border border-surface-border bg-white">
          <div className="flex items-center justify-between border-b border-surface-border p-4">
            <h2 className="font-semibold text-gray-900">Collections</h2>
            <Button size="sm" variant="secondary" onClick={() => openCollectionDialog("create")}>
              Thêm
            </Button>
          </div>
          <button
            type="button"
            onClick={() => updateParams({ collection: null, section: null })}
            className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${
              !collectionId ? "bg-blue-50 font-medium text-primary" : "hover:bg-surface-hover"
            }`}
          >
            <span>Tất cả Collections</span>
          </button>
          <div className="divide-y divide-surface-border">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className={collectionId === collection.id ? "bg-blue-50" : ""}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateParams({ collection: collection.id, section: null })
                  }
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-hover"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {collection.name}
                    </span>
                    <span className="block truncate font-mono text-xs text-gray-400">
                      {collection.code}
                    </span>
                  </span>
                  <Badge>{collection.questionCount}</Badge>
                </button>
                {collectionId === collection.id && (
                  <div className="flex flex-wrap gap-1.5 px-4 pb-3 text-xs">
                    <TableActionButton
                      variant="secondary"
                      icon={tableActionIcons.download()}
                      onClick={() => void exportCollection(collection)}
                    >
                      Export JSON
                    </TableActionButton>
                    <TableActionButton
                      variant="secondary"
                      icon={tableActionIcons.edit()}
                      onClick={() => openCollectionDialog("edit", collection)}
                    >
                      Chỉnh sửa
                    </TableActionButton>
                    <TableActionButton
                      variant="danger"
                      icon={tableActionIcons.delete()}
                      onClick={() => void deleteCollection(collection)}
                    >
                      Xóa
                    </TableActionButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedCollection?.name ?? "Tất cả câu hỏi"}
            </h2>
            {selectedCollection?.description && (
              <p className="mt-1 text-sm text-gray-500">
                {selectedCollection.description}
              </p>
            )}
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_150px_150px_150px_180px]">
            <SearchInput
              value={search}
              onChange={(value) => updateParams({ search: value })}
              placeholder="Tim Collection, Question Code hoac Section..."
            />
            <input
              list="question-section-codes"
              value={sectionCode}
              onChange={(event) =>
                updateParams({ section: event.target.value.toUpperCase() })
              }
              placeholder="Section"
              className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <datalist id="question-section-codes">
              {sectionCodes.map((code) => <option key={code} value={code} />)}
            </datalist>
            <select
              value={difficulty}
              onChange={(event) => updateParams({ difficulty: event.target.value })}
              className="rounded-input border border-surface-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Mọi độ khó</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
            <select
              value={type}
              onChange={(event) => updateParams({ type: event.target.value })}
              className="rounded-input border border-surface-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Mọi loại</option>
              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
              <option value="ESSAY">Tự luận</option>
            </select>
            <select
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="rounded-input border border-surface-border bg-white px-3 py-2 text-sm"
            >
              <option value="displayOrder,asc">Display Order</option>
              <option value="createdAt,desc">Mới tạo</option>
              <option value="updatedAt,desc">Mới cập nhật</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-card border border-surface-border bg-white px-4 py-3 text-sm">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={allCurrentPageSelected}
                onChange={toggleAllCurrentPage}
              />
              Chọn tất cả trang hiện tại
            </label>
            <span className="text-gray-500">Đã chọn: {selectedIds.size}</span>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => void deleteSelectedQuestions()}
              isLoading={isBulkDeleting}
              disabled={selectedIds.size === 0}
            >
              Xóa đã chọn
            </Button>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={5} height="h-20" />
          ) : questionsPage.content.length === 0 ? (
            <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
              Không tìm thấy câu hỏi.
            </div>
          ) : (
            <div className="overflow-hidden rounded-card border border-surface-border bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-surface-border bg-surface-page text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="w-12 px-4 py-3" />
                      <th className="px-4 py-3">Thứ tự</th>
                      <th className="px-4 py-3">Câu hỏi</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Loại</th>
                      <th className="px-4 py-3">Độ khó</th>
                      <th className="px-4 py-3">Cập nhật</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {questionsPage.content.map((question) => (
                      <tr key={question.id} className="hover:bg-surface-hover">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(question.id)}
                            onChange={() => toggleQuestion(question.id)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900">
                          {question.displayOrder}
                        </td>
                        <td className="max-w-xl px-4 py-4">
                          <div className="font-medium text-gray-900">
                            {question.questionCode}
                          </div>
                          <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                            {previewContent(question)}
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-gray-400">
                            {question.collection.name} - {question.sectionCode} - #{question.displayOrder}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <Badge>{question.sectionCode}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                          {typeLabel[question.type]}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                          {question.difficulty ? difficultyLabel[question.difficulty] : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-500">
                          {formatDateTime(question.updatedAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1.5 text-xs">
                            <TableActionButton
                              variant="secondary"
                              icon={tableActionIcons.edit()}
                              onClick={() => navigate(`/teacher/questions/${question.id}/edit`)}
                            >
                              Chỉnh sửa
                            </TableActionButton>
                            <TableActionButton
                              variant="danger"
                              icon={tableActionIcons.delete()}
                              onClick={() => void deleteQuestion(question)}
                            >
                              Xóa
                            </TableActionButton>
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
            <div className="flex items-center justify-between rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-600">
              <span>
                Trang {questionsPage.number + 1}/{pageCount} · {questionsPage.totalElements} câu
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={questionsPage.number <= 0}
                  onClick={() => updateParams({ page: questionsPage.number }, false)}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={questionsPage.number + 1 >= pageCount}
                  onClick={() => updateParams({ page: questionsPage.number + 2 }, false)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={collectionDialog !== null}
        onClose={() => setCollectionDialog(null)}
        title={collectionDialog?.mode === "create" ? "Tạo Collection" : "Chỉnh sửa Collection"}
      >
        <div className="space-y-4">
          {collectionDialog?.mode === "create" && (
            <Input
              label="Code"
              value={collectionCode}
              maxLength={64}
              onChange={(event) =>
                setCollectionCode(
                  event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
                )
              }
              placeholder="TOEIC_TEST_1"
            />
          )}
          <Input
            label="Tên"
            value={collectionName}
            maxLength={255}
            onChange={(event) => setCollectionName(event.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mô tả
            </label>
            <textarea
              value={collectionDescription}
              maxLength={1000}
              onChange={(event) => setCollectionDescription(event.target.value)}
              className="min-h-28 w-full rounded-input border border-surface-border p-3 text-sm outline-none focus:border-primary"
            />
          </div>
          {collectionError && <p className="text-sm text-red-600">{collectionError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCollectionDialog(null)}>
              Hủy
            </Button>
            <Button isLoading={isCollectionSaving} onClick={() => void saveCollection()}>
              Lưu
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Question Bank JSON 2.0"
        maxWidth="max-w-5xl"
      >
        <QuestionJsonImportForm
          collections={collections}
          initialCollectionId={collectionId}
          onImported={async (count) => {
            toast.success(`Đã import ${count} câu hỏi.`);
            setIsImportOpen(false);
            await Promise.all([loadQuestions(), loadCollections()]);
          }}
          onCancel={() => setIsImportOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default QuestionBankPage;
