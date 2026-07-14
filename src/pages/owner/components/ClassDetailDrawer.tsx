import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { ScheduleForm } from "./ScheduleForm";
import { EnrollStudentModal } from "./EnrollStudentModal";
import { GenerateFeeModal } from "./GenerateFeeModal";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { scheduleApi } from "../../../api/scheduleApi";
import { enrollmentApi } from "../../../api/enrollmentApi";
import { feeApi } from "../../../api/feeApi";
import { studentApi } from "../../../api/studentApi";
import { teacherApi } from "../../../api/teacherApi";
import { documentApi } from "../../../api/documentApi";
import type {
  ScheduleResponse,
  ScheduleRequest,
} from "../../../types/schedule";
import type { EnrollmentResponse } from "../../../types/enrollment";
import type { TeacherResponse } from "../../../types/teacher";
import type { StudentResponse } from "../../../types/student";
import type { StudentDocumentResponse } from "../../../types/document";
import type { ClassResponse } from "../../../types/class";
import { DAY_LABELS } from "../../../types/schedule";
import { formatCurrency } from "../../../utils/money";

type Tab = "schedule" | "students" | "fees" | "documents";

interface ClassDetailDrawerProps {
  cls: ClassResponse;
  onClose: () => void;
  onRefresh: () => void;
}

export const ClassDetailDrawer = ({
  cls,
  onClose,
  onRefresh,
}: ClassDetailDrawerProps) => {
  const [tab, setTab] = useState<Tab>("schedule");

  // Schedules
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduleResponse | null>(null);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);

  // Enrollments
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentResponse[]>([]);

  // Fees
  const [isGenerateFeeModalOpen, setIsGenerateFeeModalOpen] = useState(false);
  const [existingFeeMonths, setExistingFeeMonths] = useState<string[]>([]);

  // Documents
  const [documents, setDocuments] = useState<StudentDocumentResponse[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] =
    useState(false);

  const loadExistingFeeMonths = useCallback(async () => {
    try {
      const now = new Date();
      const months: string[] = [];
      // Scan recent months (last 6 + next 6) to find which already have fee records
      const monthPromises: Promise<void>[] = [];
      for (let offset = -6; offset <= 6; offset++) {
        const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthPromises.push(
          feeApi
            .findAllByClass(cls.id, monthStr)
            .then((records) => {
              if (records.length > 0) {
                months.push(monthStr);
              }
            })
            .catch(() => {
              /* skip months that fail */
            }),
        );
      }
      await Promise.allSettled(monthPromises);
      setExistingFeeMonths(months);
    } catch {
      /* silent */
    }
  }, [cls.id]);

  const loadSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    try {
      const [s, t] = await Promise.all([
        scheduleApi.findAllByClass(cls.id),
        teacherApi.findAll(),
      ]);
      setSchedules(s);
      setTeachers(t);
    } catch {
      // silent
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [cls.id]);

  const loadEnrollments = useCallback(async () => {
    setIsLoadingEnrollments(true);
    try {
      const [e, s] = await Promise.all([
        enrollmentApi.findAllByClass(cls.id),
        studentApi.findAll(),
      ]);
      setEnrollments(e);
      setAllStudents(s);
    } catch {
      // silent
    } finally {
      setIsLoadingEnrollments(false);
    }
  }, [cls.id]);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      const docs = await documentApi.findClassDocuments(cls.id);
      setDocuments(docs);
    } catch {
      // silent
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [cls.id]);

  const handleDocumentUploaded = useCallback((doc: StudentDocumentResponse) => {
    setDocuments((prev) => [doc, ...prev]);
  }, []);

  useEffect(() => {
    if (tab === "fees") {
      loadExistingFeeMonths();
    }
    if (tab === "documents") {
      loadDocuments();
    }
  }, [tab, loadExistingFeeMonths, loadDocuments]);

  useEffect(() => {
    loadSchedules();
    loadEnrollments();
  }, [loadSchedules, loadEnrollments]);

  const handleSaveSchedule = async (data: ScheduleRequest) => {
    if (editingSchedule) {
      await scheduleApi.update(cls.id, editingSchedule.id, data);
    } else {
      await scheduleApi.create(cls.id, data);
    }
    setIsScheduleModalOpen(false);
    setEditingSchedule(null);
    loadSchedules();
  };

  const handleDeleteSchedule = async (schedule: ScheduleResponse) => {
    if (
      !window.confirm(
        `Xóa buổi học ${DAY_LABELS[schedule.dayOfWeek]} ${schedule.startTime}–${schedule.endTime}?`,
      )
    )
      return;
    await scheduleApi.delete(cls.id, schedule.id);
    loadSchedules();
  };

  const handleToggleSchedule = async (schedule: ScheduleResponse) => {
    await scheduleApi.toggleActive(cls.id, schedule.id);
    loadSchedules();
  };

  const handleEnroll = async (studentId: number) => {
    await enrollmentApi.enroll(cls.id, { studentId });
    loadEnrollments();
    onRefresh();
  };

  const handleDrop = async (enrollment: EnrollmentResponse) => {
    if (
      !window.confirm(`Xóa học sinh "${enrollment.studentFullName}" khỏi lớp?`)
    )
      return;
    await enrollmentApi.drop(cls.id, enrollment.studentUserId);
    loadEnrollments();
    onRefresh();
  };

  const handleGenerateFee = async (month: string, dueDate: string) => {
    await feeApi.generateFeeForClass(cls.id, { month, dueDate });
    setIsGenerateFeeModalOpen(false);
    onRefresh();
  };

  const enrolledIds = enrollments.map((e) => e.studentUserId);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{cls.name}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {cls.vstepLevel} · {formatCurrency(cls.monthFee)}/tháng · Tối đa{" "}
              {cls.maxStudents} học sinh
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b text-sm">
          {(["schedule", "students", "fees", "documents"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {t === "schedule"
                ? "Lịch học"
                : t === "students"
                  ? "Học sinh"
                  : t === "fees"
                    ? "Học phí"
                    : "Tài liệu"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Schedule Tab ── */}
          {tab === "schedule" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  className="border border-primary bg-primary text-white hover:bg-primary-hover px-3 py-1 text-xs font-medium rounded-lg"
                  onClick={() => {
                    setEditingSchedule(null);
                    setIsScheduleModalOpen(true);
                  }}
                >
                  + Thêm buổi học
                </Button>
              </div>

              {isLoadingSchedules ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Đang tải...
                </div>
              ) : schedules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
                  Chưa có lịch học nào cho lớp này.
                </div>
              ) : (
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        s.isActive ? "bg-white" : "bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium">
                          {DAY_LABELS[s.dayOfWeek] ?? `Day ${s.dayOfWeek}`}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {s.startTime?.slice(0, 5)} – {s.endTime?.slice(0, 5)}
                        </span>
                        <span className="text-sm text-gray-600">
                          Phòng {s.room}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {s.teacherUserFullName}
                        </span>
                        <button
                          onClick={() => handleToggleSchedule(s)}
                          className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                            s.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {s.isActive ? "Đang mở" : "Tạm dừng"}
                        </button>
                        <button
                          className="text-xs text-blue-600 underline"
                          onClick={() => {
                            setEditingSchedule(s);
                            setIsScheduleModalOpen(true);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="text-xs text-red-600 underline"
                          onClick={() => handleDeleteSchedule(s)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Students Tab ── */}
          {tab === "students" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  className="border border-primary bg-primary text-white hover:bg-primary-hover px-3 py-1 text-xs font-medium rounded-lg"
                  onClick={() => setIsEnrollModalOpen(true)}
                >
                  + Ghi danh học sinh
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {enrollments.length}
                </span>
                /{cls.maxStudents} học sinh đang ghi danh
              </div>

              {isLoadingEnrollments ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Đang tải...
                </div>
              ) : enrollments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
                  Chưa có học sinh nào trong lớp này.
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500 uppercase">
                      <th className="pb-2">Họ tên</th>
                      <th className="pb-2">SĐT</th>
                      <th className="pb-2">Ngày ghi danh</th>
                      <th className="pb-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {enrollments.map((e) => (
                      <tr key={e.id}>
                        <td className="py-3 font-medium text-gray-900">
                          {e.studentFullName}
                        </td>
                        <td className="py-3 text-gray-600">
                          {e.studentPhoneNumber}
                        </td>
                        <td className="py-3 text-gray-500">
                          {e.enrolledAt
                            ? new Date(e.enrolledAt).toLocaleDateString("vi-VN")
                            : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            className="text-xs text-red-600 underline"
                            onClick={() => handleDrop(e)}
                          >
                            Xóa khỏi lớp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Fees Tab ── */}
          {tab === "fees" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-medium text-gray-900">
                  Tạo học phí hàng tháng
                </p>
                <p className="mt-1 text-gray-500">
                  Hệ thống sẽ tự động tạo bản ghi học phí cho tất cả học sinh
                  đang theo học của lớp với số tiền{" "}
                  <strong>{formatCurrency(cls.monthFee)}</strong> mỗi tháng.
                </p>
              </div>

              <Button onClick={() => setIsGenerateFeeModalOpen(true)}>
                Tạo học phí tháng mới
              </Button>
            </div>
          )}

          {/* ── Documents Tab ── */}
          {tab === "documents" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  className="border border-primary bg-primary text-white hover:bg-primary-hover px-3 py-1 text-xs font-medium rounded-lg"
                  onClick={() => setIsDocumentUploadModalOpen(true)}
                >
                  + Tải tài liệu
                </button>
              </div>

              {isLoadingDocuments ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Đang tải...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
                  Chưa có tài liệu nào cho lớp này.
                </div>
              ) : (
                <div className="grid gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{doc.title}</p>
                        <p className="text-xs text-gray-500">
                          [{doc.type}] ·{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Mở
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        title={editingSchedule ? "Chỉnh sửa buổi học" : "Thêm buổi học"}
      >
        <ScheduleForm
          initialData={editingSchedule ?? undefined}
          teachers={teachers}
          onSubmit={handleSaveSchedule}
          onCancel={() => {
            setIsScheduleModalOpen(false);
            setEditingSchedule(null);
          }}
        />
      </Modal>

      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnroll={handleEnroll}
        className={cls.name}
        students={allStudents}
        enrolledStudentIds={enrolledIds}
      />

      <GenerateFeeModal
        isOpen={isGenerateFeeModalOpen}
        onClose={() => setIsGenerateFeeModalOpen(false)}
        onSubmit={handleGenerateFee}
        className={cls.name}
        existingMonths={existingFeeMonths}
      />

      <DocumentUploadModal
        isOpen={isDocumentUploadModalOpen}
        onClose={() => setIsDocumentUploadModalOpen(false)}
        classId={cls.id}
        className={cls.name}
        onUploaded={handleDocumentUploaded}
      />
    </div>
  );
};
