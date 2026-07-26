import { useCallback, useEffect, useState } from "react";
import { assignmentApi } from "../../api/assignmentApi";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
} from "../../components/ui/SharedComponents";
import type { AssessmentType } from "../../types/assessmentBuilder";
import type {
  AssignmentStatus,
  StudentAssignmentDetailResponse,
  StudentAssignmentListResponse,
} from "../../types/assignment";
import { AssignmentPreview } from "../teacher/components/AssignmentPreview";

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const typeLabel: Record<AssessmentType, string> = {
  QUIZ: "Quiz",
  HOMEWORK: "Homework",
  EXAM: "Exam",
};

const statusLabel: Record<AssignmentStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

const StudentAssignmentsPage = () => {
  const [assignments, setAssignments] = useState<StudentAssignmentListResponse[]>(
    [],
  );
  const [selectedAssignment, setSelectedAssignment] =
    useState<StudentAssignmentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setAssignments(await assignmentApi.findStudentAssignments());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to load assignments.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const openDetail = async (assignment: StudentAssignmentListResponse) => {
    try {
      setSelectedAssignment(
        await assignmentApi.findStudentAssignmentDetail(assignment.id),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to load assignment.");
    }
  };

  const closeDetail = () => {
    setSelectedAssignment(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="My Assignments"
        description="View assigned homework, quizzes, and exams."
      />

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-16" />
      ) : assignments.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          No assignments found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-3">Assignment</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Open</th>
                  <th className="px-6 py-3">Due</th>
                  <th className="px-6 py-3">Assigned At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {assignments.map((assignment) => (
                  <tr key={assignment.recipientId} className="hover:bg-surface-hover">
                    <td className="max-w-xl px-6 py-4">
                      <div className="font-medium text-gray-900">
                        <span className="line-clamp-1 break-words">
                          {assignment.title}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-500">
                        <span className="line-clamp-2 break-words">
                          {assignment.description || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge>{typeLabel[assignment.type]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge>{statusLabel[assignment.status]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTime(assignment.openAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTime(assignment.dueAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDateTime(assignment.assignedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openDetail(assignment)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={selectedAssignment != null}
        onClose={closeDetail}
        title="Assignment Detail"
        maxWidth="max-w-5xl"
      >
        {selectedAssignment && (
          <AssignmentPreview
            title={selectedAssignment.title}
            description={selectedAssignment.description}
            type={selectedAssignment.type}
            status={selectedAssignment.status}
            openAt={selectedAssignment.openAt}
            dueAt={selectedAssignment.dueAt}
            attemptLimit={selectedAssignment.attemptLimit}
            items={selectedAssignment.items}
          />
        )}
      </Modal>
    </div>
  );
};

export default StudentAssignmentsPage;
