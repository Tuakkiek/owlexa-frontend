import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { assessmentBuilderApi } from "../../../api/assessmentBuilderApi";
import { classApi } from "../../../api/classApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { SearchInput } from "../../../components/ui/SharedComponents";
import type {
  AssessmentListResponse,
  AssessmentType,
  PageResponse as AssessmentPageResponse,
} from "../../../types/assessmentBuilder";
import type {
  AssignmentDetailResponse,
  AssignmentRequest,
  AssignmentTargetRequest,
  AssignmentTargetType,
} from "../../../types/assignment";
import type {
  TeacherClassStudents,
  TeacherStudentInfo,
} from "../../../types/teacherClassStudents";

interface AssignmentFormProps {
  initialData?: AssignmentDetailResponse;
  onSubmit: (data: AssignmentRequest) => Promise<void>;
  onCancel: () => void;
}

type SelectedTarget = {
  targetType: AssignmentTargetType;
  classId?: number;
  className?: string;
  studentUserId?: number;
  studentFullName?: string;
};

const PAGE_SIZE = 10;

const emptyAssessmentPage: AssessmentPageResponse<AssessmentListResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
};

const toDateTimeLocalValue = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoOrNull = (value: string) => {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const typeLabel: Record<AssessmentType, string> = {
  QUIZ: "Quiz",
  HOMEWORK: "Homework",
  EXAM: "Exam",
};

const targetKey = (target: SelectedTarget) =>
  target.targetType === "CLASS"
    ? `CLASS:${target.classId}`
    : `STUDENT:${target.studentUserId}`;

export const AssignmentForm = ({
  initialData,
  onSubmit,
  onCancel,
}: AssignmentFormProps) => {
  const [assessmentId, setAssessmentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [attemptLimit, setAttemptLimit] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<SelectedTarget[]>([]);
  const [assessmentQuery, setAssessmentQuery] = useState("");
  const [assessmentsPage, setAssessmentsPage] =
    useState<AssessmentPageResponse<AssessmentListResponse>>(
      emptyAssessmentPage,
    );
  const [classes, setClasses] = useState<TeacherClassStudents[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [isAssessmentLoading, setIsAssessmentLoading] = useState(false);
  const [isTargetLoading, setIsTargetLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setAssessmentId(String(initialData.assessmentId));
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setOpenAt(toDateTimeLocalValue(initialData.openAt));
      setDueAt(toDateTimeLocalValue(initialData.dueAt));
      setAttemptLimit(
        initialData.attemptLimit != null ? String(initialData.attemptLimit) : "",
      );
      setSelectedTargets(
        initialData.targets.map((target) => ({
          targetType: target.targetType,
          classId: target.classId ?? undefined,
          className: target.className ?? undefined,
          studentUserId: target.studentUserId ?? undefined,
          studentFullName: target.studentFullName ?? undefined,
        })),
      );
    } else {
      setAssessmentId("");
      setTitle("");
      setDescription("");
      setOpenAt("");
      setDueAt("");
      setAttemptLimit("");
      setSelectedTargets([]);
    }
    setError("");
  }, [initialData]);

  const loadAssessments = useCallback(async () => {
    try {
      setIsAssessmentLoading(true);
      setLookupError("");
      setAssessmentsPage(
        await assessmentBuilderApi.findAll({
          search: assessmentQuery,
          status: "PUBLISHED",
          page: 0,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: any) {
      setLookupError(
        err?.response?.data?.message ?? "Không thể tải danh sách đề thi.",
      );
    } finally {
      setIsAssessmentLoading(false);
    }
  }, [assessmentQuery]);

  const loadTargets = useCallback(async () => {
    try {
      setIsTargetLoading(true);
      setClasses(await classApi.findMyClassesWithStudentsAsTeacher());
    } catch (err: any) {
      setLookupError(err?.response?.data?.message ?? "Không thể tải danh sách đối tượng.");
    } finally {
      setIsTargetLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadAssessments();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadAssessments]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const selectedTargetKeys = useMemo(
    () => new Set(selectedTargets.map(targetKey)),
    [selectedTargets],
  );

  const students = useMemo(() => {
    const byId = new Map<number, TeacherStudentInfo>();
    classes.forEach((item) => {
      item.students.forEach((student) => {
        byId.set(student.userId, student);
      });
    });

    const keyword = studentQuery.trim().toLowerCase();
    return [...byId.values()]
      .filter(
        (student) =>
          !keyword ||
          student.fullName.toLowerCase().includes(keyword) ||
          student.phoneNumber.includes(keyword),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [classes, studentQuery]);

  const addClassTarget = (item: TeacherClassStudents) => {
    const target: SelectedTarget = {
      targetType: "CLASS",
      classId: item.id,
      className: item.className,
    };
    if (selectedTargetKeys.has(targetKey(target))) {
      setError("This class is already selected.");
      return;
    }
    setSelectedTargets((current) => [...current, target]);
    setError("");
  };

  const addStudentTarget = (student: TeacherStudentInfo) => {
    const target: SelectedTarget = {
      targetType: "STUDENT",
      studentUserId: student.userId,
      studentFullName: student.fullName,
    };
    if (selectedTargetKeys.has(targetKey(target))) {
      setError("This student is already selected.");
      return;
    }
    setSelectedTargets((current) => [...current, target]);
    setError("");
  };

  const removeTarget = (target: SelectedTarget) => {
    const key = targetKey(target);
    setSelectedTargets((current) =>
      current.filter((item) => targetKey(item) !== key),
    );
  };

  const validate = () => {
    if (!assessmentId) {
      return "Vui lòng chọn đề thi đã phát hành.";
    }
    if (!title.trim()) {
      return "Vui lòng nhập tiêu đề bài tập.";
    }
    if (title.trim().length > 255) {
      return "Tiêu đề bài tập không được vượt quá 255 ký tự.";
    }
    if (attemptLimit.trim()) {
      const value = Number(attemptLimit);
      if (!Number.isInteger(value) || value < 1) {
        return "Giới hạn lượt làm bài phải lớn hơn hoặc bằng 1.";
      }
    }
    if (openAt && dueAt && new Date(openAt).getTime() >= new Date(dueAt).getTime()) {
      return "Thời gian mở bài phải trước thời hạn nộp.";
    }
    if (selectedTargets.length === 0) {
      return "Vui lòng chọn ít nhất 1 đối tượng được giao.";
    }
    return "";
  };

  const buildRequest = (): AssignmentRequest => ({
    assessmentId: Number(assessmentId),
    title: title.trim(),
    description: description.trim() || null,
    openAt: toIsoOrNull(openAt),
    dueAt: toIsoOrNull(dueAt),
    attemptLimit: attemptLimit.trim() ? Number(attemptLimit) : null,
    targets: selectedTargets.map<AssignmentTargetRequest>((target) => ({
      targetType: target.targetType,
      classId: target.targetType === "CLASS" ? target.classId : null,
      studentUserId:
        target.targetType === "STUDENT" ? target.studentUserId : null,
    })),
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit(buildRequest());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu bài tập.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Đề thi đã phát hành
          </label>
          <select
            value={assessmentId}
            onChange={(event) => setAssessmentId(event.target.value)}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="">Chọn đề thi</option>
            {assessmentsPage.content.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title} ({typeLabel[assessment.type]})
              </option>
            ))}
          </select>
          <SearchInput
            value={assessmentQuery}
            onChange={setAssessmentQuery}
            placeholder="Tìm kiếm đề thi đã phát hành..."
          />
          {isAssessmentLoading && (
            <p className="text-xs text-gray-500">Đang tải đề thi...</p>
          )}
        </div>

        <Input
          label="Tiêu đề"
          value={title}
          maxLength={255}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Tiêu đề bài tập"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Mô tả
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Mô tả (tùy chọn)"
          className="w-full resize-y rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Thời gian mở"
          type="datetime-local"
          value={openAt}
          onChange={(event) => setOpenAt(event.target.value)}
        />
        <Input
          label="Hạn nộp"
          type="datetime-local"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
        />
        <Input
          label="Số lượt làm bài"
          type="number"
          min="1"
          step="1"
          value={attemptLimit}
          onChange={(event) => setAttemptLimit(event.target.value)}
          placeholder="Tùy chọn"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Chọn đối tượng giao
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              Chọn lớp học hoặc học viên cá nhân.
            </p>
          </div>

          {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}

          <div className="rounded-card border border-surface-border bg-white">
            <div className="border-b border-surface-border px-4 py-3 text-sm font-medium text-gray-900">
              Lớp học
            </div>
            {isTargetLoading ? (
              <div className="p-4 text-sm text-gray-500">Đang tải...</div>
            ) : classes.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">
                Không tìm thấy lớp học nào.
              </div>
            ) : (
              <div className="max-h-48 divide-y divide-surface-border overflow-y-auto">
                {classes.map((item) => {
                  const target: SelectedTarget = {
                    targetType: "CLASS",
                    classId: item.id,
                  };
                  const isSelected = selectedTargetKeys.has(targetKey(target));

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-4 hover:bg-surface-hover"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {item.className}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.studentCount} học viên
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isSelected}
                        onClick={() => addClassTarget(item)}
                      >
                        {isSelected ? "Đã chọn" : "Thêm"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-card border border-surface-border bg-white p-4">
            <div className="text-sm font-medium text-gray-900">Học viên</div>
            <SearchInput
              value={studentQuery}
              onChange={setStudentQuery}
              placeholder="Tìm kiếm học viên..."
            />
            <div className="max-h-48 divide-y divide-surface-border overflow-y-auto rounded-input border border-surface-border">
              {students.length === 0 ? (
                <div className="p-4 text-sm text-gray-400">
                  Không tìm thấy học viên nào.
                </div>
              ) : (
                students.map((student) => {
                  const target: SelectedTarget = {
                    targetType: "STUDENT",
                    studentUserId: student.userId,
                  };
                  const isSelected = selectedTargetKeys.has(targetKey(target));

                  return (
                    <div
                      key={student.userId}
                      className="flex items-center gap-3 p-3 hover:bg-surface-hover"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {student.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.phoneNumber}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isSelected}
                        onClick={() => addStudentTarget(student)}
                      >
                        {isSelected ? "Đã chọn" : "Thêm"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Đối tượng đã chọn
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              Học viên trùng lặp sẽ được hợp nhất khi công bố bài tập.
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-card border border-surface-border bg-white">
            {selectedTargets.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">
                Chưa có đối tượng nào được chọn.
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {selectedTargets.map((target) => (
                  <div
                    key={targetKey(target)}
                    className="flex items-center gap-3 p-4 hover:bg-surface-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {target.targetType === "CLASS"
                          ? target.className
                          : target.studentFullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {target.targetType === "CLASS" ? "Lớp học" : "Học viên"}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTarget(target)}
                    >
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isSaving}>
          {initialData ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );
};
