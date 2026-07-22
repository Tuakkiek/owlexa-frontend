import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Badge } from "../../../components/ui/SharedComponents";
import { ScheduleForm } from "./ScheduleForm";
import { EnrollStudentModal } from "./EnrollStudentModal";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { scheduleApi } from "../../../api/scheduleApi";
import { enrollmentApi } from "../../../api/enrollmentApi";
import { classApi } from "../../../api/classApi";
import { studentApi } from "../../../api/studentApi";
import { teacherApi } from "../../../api/teacherApi";
import { documentApi } from "../../../api/documentApi";
import type { ScheduleResponse, ScheduleRequest, ScheduleType } from "../../../types/schedule";
import type { EnrollmentResponse } from "../../../types/enrollment";
import { ENROLLMENT_STATUS_LABELS } from "../../../types/enrollment";
import type { TeacherResponse } from "../../../types/teacher";
import type { StudentResponse } from "../../../types/student";
import type { StudentDocumentResponse } from "../../../types/document";
import type { ClassResponse, ClassStatus } from "../../../types/class";
import { CLASS_STATUS_LABELS } from "../../../types/class";
import { DAY_LABELS } from "../../../types/schedule";
import { formatCurrency } from "../../../utils/money";

const SCHEDULE_TYPE_COLORS: Record<ScheduleType, string> = {
  THEORY_CLASS: "bg-emerald-50 border-emerald-200",
  ONLINE_CLASS: "bg-blue-50 border-blue-200",
  EXAM: "bg-amber-50 border-amber-200",
  CANCELLED: "bg-rose-50 border-rose-200 opacity-60",
};

type Tab = "schedule" | "students" | "fees" | "documents";
const CLASS_STATUS_OPTIONS: ClassStatus[] = ["PLANNED", "ACTIVE", "FINISHED"];

interface ClassDetailDrawerProps {
  cls: ClassResponse;
  onClose: () => void;
  onRefresh: () => void;
}

export const ClassDetailDrawer = ({ cls, onClose, onRefresh }: ClassDetailDrawerProps) => {
  const [tab, setTab] = useState<Tab>("schedule");
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleResponse | null>(null);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentResponse[]>([]);
  const [documents, setDocuments] = useState<StudentDocumentResponse[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ClassStatus>(cls.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    try {
      const [s, t] = await Promise.all([scheduleApi.findAllByClass(cls.id), teacherApi.findAll()]);
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
      const [e, s] = await Promise.all([enrollmentApi.findAllByClass(cls.id), studentApi.findAll()]);
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
    if (tab === "documents") loadDocuments();
  }, [tab, loadDocuments]);

  useEffect(() => {
    loadSchedules();
    loadEnrollments();
  }, [loadSchedules, loadEnrollments]);

  useEffect(() => {
    setSelectedStatus(cls.status);
  }, [cls.status]);

  const handleStatusChange = async (newStatus: ClassStatus) => {
    if (newStatus === cls.status) return;
    const label = CLASS_STATUS_LABELS[newStatus] ?? newStatus;
    if (!window.confirm(`Xác nhận chuyển trạng thái lớp sang "${label}"?`)) return;
    try {
      setIsUpdatingStatus(true);
      await classApi.updateStatus(cls.id, newStatus);
      setSelectedStatus(newStatus);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Không thể cập nhật trạng thái lớp.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
    if (!window.confirm(`Xóa buổi học ${DAY_LABELS[schedule.dayOfWeek]} ${schedule.startTime}-${schedule.endTime}?`)) return;
    await scheduleApi.delete(cls.id, schedule.id);
    loadSchedules();
  };

  const handleTypeChange = async (schedule: ScheduleResponse, newType: ScheduleType) => {
    await scheduleApi.updateType(cls.id, schedule.id, newType);
    loadSchedules();
  };

  const handleEnroll = async (studentId: number) => {
    await enrollmentApi.enroll(cls.id, { studentId });
    loadEnrollments();
    onRefresh();
  };

  const handleDrop = async (enrollment: EnrollmentResponse) => {
    if (!window.confirm(`Xóa học sinh "${enrollment.studentFullName}" khỏi lớp?`)) return;
    await enrollmentApi.drop(cls.id, enrollment.studentUserId);
    loadEnrollments();
    onRefresh();
  };

  const handleApprove = async (enrollment: EnrollmentResponse) => {
    if (!window.confirm(`Duyệt học sinh "${enrollment.studentFullName}" vào lớp?`)) return;
    await enrollmentApi.approve(cls.id, enrollment.studentUserId);
    loadEnrollments();
    onRefresh();
  };

  const handleReject = async (enrollment: EnrollmentResponse) => {
    if (!window.confirm(`Từ chối học sinh "${enrollment.studentFullName}"?`)) return;
    await enrollmentApi.reject(cls.id, enrollment.studentUserId);
    loadEnrollments();
    onRefresh();
  };

  const handleSuspend = async (enrollment: EnrollmentResponse) => {
    if (!window.confirm(`Tạm dừng học sinh "${enrollment.studentFullName}"?`)) return;
    await enrollmentApi.suspend(cls.id, enrollment.studentUserId);
    loadEnrollments();
    onRefresh();
  };

  const handleReactivate = async (enrollment: EnrollmentResponse) => {
    if (!window.confirm(`Kích hoạt lại học sinh "${enrollment.studentFullName}"?`)) return;
    await enrollmentApi.reactivate(cls.id, enrollment.studentUserId);
    loadEnrollments();
    onRefresh();
  };

  const enrolledIds = enrollments.map((e) => e.studentUserId);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{cls.name}</h2>
              <Badge
                variant={cls.status === "ACTIVE" ? "success" : cls.status === "PLANNED" ? "warning" : "default"}
              >
                {CLASS_STATUS_LABELS[cls.status] ?? cls.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {cls.courseName ? `${cls.courseName} · ` : ""}
              {formatCurrency(cls.monthFee)}/tháng · Tối đa {cls.maxStudents} học sinh
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>

        {/* Status Selector - replaces lifecycle buttons */}
        <div className="flex items-center gap-3 border-b px-6 py-3">
          <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value as ClassStatus)}
            disabled={isUpdatingStatus}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none disabled:opacity-50"
          >
            {CLASS_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {CLASS_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {isUpdatingStatus && <span className="text-xs text-gray-500">Đang cập nhật...</span>}
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
                <div className="py-8 text-center text-sm text-gray-500">Đang tải...</div>
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
                        SCHEDULE_TYPE_COLORS[s.type] || "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="rounded-lg bg-white/80 border px-2 py-0.5 text-xs font-medium shadow-sm">
                          {DAY_LABELS[s.dayOfWeek] ?? `Day ${s.dayOfWeek}`}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {s.startTime?.slice(0, 5)} – {s.endTime?.slice(0, 5)}
                        </span>
                        <span className="text-sm text-gray-600">Phòng {s.roomName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-medium">{s.teacherUserFullName}</span>
                        <select
                          value={s.type}
                          onChange={(e) => handleTypeChange(s, e.target.value as ScheduleType)}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-900 focus:border-primary focus:outline-none"
                        >
                          <option value="THEORY_CLASS">Lý thuyết</option>
                          <option value="ONLINE_CLASS">Trực tuyến</option>
                          <option value="EXAM">Thi</option>
                          <option value="CANCELLED">Tạm ngưng</option>
                        </select>
                        <button
                          className="text-xs text-blue-600 underline font-medium"
                          onClick={() => {
                            setEditingSchedule(s);
                            setIsScheduleModalOpen(true);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="text-xs text-red-600 underline font-medium"
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
                <span className="font-medium text-gray-900">{enrollments.length}</span>
                /{cls.maxStudents} học sinh đang ghi danh
              </div>
              {isLoadingEnrollments ? (
                <div className="py-8 text-center text-sm text-gray-500">Đang tải...</div>
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
                      <th className="pb-2">Trạng thái</th>
                      <th className="pb-2">Ngày ghi danh</th>
                      <th className="pb-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {enrollments.map((e) => (
                      <tr key={e.id}>
                        <td className="py-3 font-medium text-gray-900">{e.studentFullName}</td>
                        <td className="py-3 text-gray-600">{e.studentPhoneNumber}</td>
                        <td className="py-3">
                          <Badge
                            variant={
                              e.status === "ACTIVE"
                                ? "success"
                                : e.status === "PENDING"
                                  ? "warning"
                                  : e.status === "SUSPENDED"
                                    ? "error"
                                    : "default"
                            }
                          >
                            {ENROLLMENT_STATUS_LABELS[e.status] ?? e.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-gray-500">
                          {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString("vi-VN") : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {e.status === "PENDING" && (
                              <>
                                <button className="text-xs text-emerald-600 underline" onClick={() => handleApprove(e)}>Duyệt</button>
                                <button className="text-xs text-red-600 underline" onClick={() => handleReject(e)}>Từ chối</button>
                              </>
                            )}
                            {e.status === "ACTIVE" && (
                              <>
                                <button className="text-xs text-amber-600 underline" onClick={() => handleSuspend(e)}>Tạm dừng</button>
                                <button className="text-xs text-red-600 underline" onClick={() => handleDrop(e)}>Xóa khỏi lớp</button>
                              </>
                            )}
                            {e.status === "SUSPENDED" && (
                              <>
                                <button className="text-xs text-emerald-600 underline" onClick={() => handleReactivate(e)}>Kích hoạt lại</button>
                                <button className="text-xs text-red-600 underline" onClick={() => handleDrop(e)}>Xóa khỏi lớp</button>
                              </>
                            )}
                            {e.status === "DROPPED" && <span className="text-xs text-gray-400">—</span>}
                          </div>
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
            <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
              Học phí được tạo tự động khi học sinh ghi danh vào lớp.
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
                <div className="py-8 text-center text-sm text-gray-500">Đang tải...</div>
              ) : documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
                  Chưa có tài liệu nào cho lớp này.
                </div>
              ) : (
                <div className="grid gap-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-gray-900">{doc.title}</p>
                        <p className="text-xs text-gray-500">
                          [{doc.type}] - {new Date(doc.uploadedAt).toLocaleDateString("vi-VN")}
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
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        title={editingSchedule ? "Chinh sua buoi hoc" : "Them buoi hoc"}
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
