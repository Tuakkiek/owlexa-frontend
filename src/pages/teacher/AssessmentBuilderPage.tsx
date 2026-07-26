import { useCallback, useEffect, useState } from "react";
import { assessmentBuilderApi } from "../../api/assessmentBuilderApi";
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
import type {
  AssessmentDetailResponse,
  AssessmentListResponse,
  AssessmentRequest,
  AssessmentStatus,
  AssessmentType,
  PageResponse,
} from "../../types/assessmentBuilder";
import { AssessmentForm } from "./components/AssessmentForm";
import { AssessmentPreview } from "./components/AssessmentPreview";

const PAGE_SIZE = 20;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const typeLabel: Record<AssessmentType, string> = {
  QUIZ: "Quiz",
  HOMEWORK: "Homework",
  EXAM: "Exam",
};

const statusLabel: Record<AssessmentStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const emptyPage: PageResponse<AssessmentListResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
};

const AssessmentBuilderPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [assessmentsPage, setAssessmentsPage] =
    useState<PageResponse<AssessmentListResponse>>(emptyPage);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<AssessmentType | "">("");
  const [status, setStatus] = useState<AssessmentStatus | "">("");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentDetailResponse | null>(null);
  const [previewAssessment, setPreviewAssessment] =
    useState<AssessmentDetailResponse | null>(null);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  const loadAssessments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setAssessmentsPage(
        await assessmentBuilderApi.findAll({
          search: query,
          type,
          status,
          page,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to load assessments.");
    } finally {
      setIsLoading(false);
    }
  }, [page, query, status, type]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadAssessments();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadAssessments]);

  useEffect(() => {
    setPage(0);
  }, [query, status, type]);

  const assessments = assessmentsPage.content;
  const pageCount = Math.max(assessmentsPage.totalPages, 1);

  const goToPreviousPage = () => {
    setPage((current) => Math.max(current - 1, 0));
  };

  const goToNextPage = () => {
    setPage((current) =>
      current + 1 >= assessmentsPage.totalPages ? current : current + 1,
    );
  };

  const openCreate = () => {
    setEditingAssessment(null);
    setIsModalOpen(true);
  };

  const openEdit = async (assessment: AssessmentListResponse) => {
    try {
      setEditingAssessment(await assessmentBuilderApi.findById(assessment.id));
      setIsModalOpen(true);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Unable to load assessment.",
      );
    }
  };

  const openPreview = async (assessment: AssessmentListResponse) => {
    try {
      setPreviewAssessment(await assessmentBuilderApi.findById(assessment.id));
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Unable to load assessment preview.",
      );
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAssessment(null);
  };

  const closePreview = () => {
    setPreviewAssessment(null);
  };

  const handleSave = async (request: AssessmentRequest) => {
    if (editingAssessment) {
      await assessmentBuilderApi.update(editingAssessment.id, request);
      toast.success("Assessment updated.");
    } else {
      await assessmentBuilderApi.create(request);
      toast.success("Assessment created.");
    }

    closeModal();
    await loadAssessments();
  };

  const handlePublish = async (assessment: AssessmentListResponse) => {
    const confirmed = await confirm({
      title: "Publish assessment?",
      message: `Publish "${assessment.title}"? Published assessments can be used by future assignment workflows.`,
      confirmText: "Publish",
    });

    if (!confirmed) return;

    try {
      setPendingActionId(assessment.id);
      await assessmentBuilderApi.publish(assessment.id);
      toast.success("Assessment published.");
      await loadAssessments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Unable to publish assessment.",
      );
    } finally {
      setPendingActionId(null);
    }
  };

  const handleArchive = async (assessment: AssessmentListResponse) => {
    const confirmed = await confirm({
      title: "Archive assessment?",
      message: `Archive "${assessment.title}"? It will remain available as historical content but leave the active workflow.`,
      confirmText: "Archive",
    });

    if (!confirmed) return;

    try {
      setPendingActionId(assessment.id);
      await assessmentBuilderApi.archive(assessment.id);
      toast.success("Assessment archived.");
      await loadAssessments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Unable to archive assessment.",
      );
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDelete = async (assessment: AssessmentListResponse) => {
    const confirmed = await confirm({
      title: "Delete assessment?",
      message: `Delete "${assessment.title}"? This removes it from the active assessment list.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      setPendingActionId(assessment.id);
      await assessmentBuilderApi.delete(assessment.id);
      if (editingAssessment?.id === assessment.id) {
        closeModal();
      }
      if (previewAssessment?.id === assessment.id) {
        closePreview();
      }
      toast.success("Assessment deleted.");
      await loadAssessments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Unable to delete assessment.",
      );
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Assessment Builder"
        description="Build reusable assessments from the question bank."
      >
        <Button type="button" onClick={openCreate}>
          Create Assessment
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search assessments..."
        />

        <select
          value={type}
          onChange={(event) =>
            setType(event.target.value as AssessmentType | "")
          }
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        >
          <option value="">All types</option>
          <option value="QUIZ">Quiz</option>
          <option value="HOMEWORK">Homework</option>
          <option value="EXAM">Exam</option>
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as AssessmentStatus | "")
          }
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-16" />
      ) : assessments.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          No assessments found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-3">Assessment</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Updated At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-surface-hover">
                    <td className="max-w-xl px-6 py-4">
                      <div className="font-medium text-gray-900">
                        <span className="line-clamp-1 break-words">
                          {assessment.title}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-500">
                        <span className="line-clamp-2 break-words">
                          {assessment.description || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge>{typeLabel[assessment.type]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge>{statusLabel[assessment.status]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTime(assessment.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs text-blue-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={pendingActionId === assessment.id}
                          onClick={() => openEdit(assessment)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-gray-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={pendingActionId === assessment.id}
                          onClick={() => openPreview(assessment)}
                        >
                          Preview
                        </button>
                        {assessment.status === "DRAFT" && (
                          <button
                            type="button"
                            className="text-xs text-gray-900 underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pendingActionId === assessment.id}
                            onClick={() => handlePublish(assessment)}
                          >
                            {pendingActionId === assessment.id
                              ? "Publishing..."
                              : "Publish"}
                          </button>
                        )}
                        {assessment.status === "PUBLISHED" && (
                          <button
                            type="button"
                            className="text-xs text-gray-900 underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pendingActionId === assessment.id}
                            onClick={() => handleArchive(assessment)}
                          >
                            {pendingActionId === assessment.id
                              ? "Archiving..."
                              : "Archive"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-xs text-red-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={pendingActionId === assessment.id}
                          onClick={() => handleDelete(assessment)}
                        >
                          {pendingActionId === assessment.id
                            ? "Deleting..."
                            : "Delete"}
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

      {!isLoading && assessmentsPage.totalElements > 0 && (
        <div className="flex flex-col gap-3 rounded-card border border-surface-border bg-white px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Page {assessmentsPage.number + 1} of {pageCount} -{" "}
            {assessmentsPage.totalElements} assessments
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToPreviousPage}
              disabled={assessmentsPage.number <= 0}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              disabled={assessmentsPage.number + 1 >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAssessment ? "Edit Assessment" : "Create Assessment"}
        maxWidth="max-w-6xl"
      >
        <AssessmentForm
          initialData={editingAssessment ?? undefined}
          onSubmit={handleSave}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={previewAssessment != null}
        onClose={closePreview}
        title="Assessment Preview"
        maxWidth="max-w-5xl"
      >
        {previewAssessment && (
          <AssessmentPreview assessment={previewAssessment} />
        )}
      </Modal>
    </div>
  );
};

export default AssessmentBuilderPage;
