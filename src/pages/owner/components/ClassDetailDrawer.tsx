import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Badge } from "../../../components/ui/SharedComponents";
import { ScheduleForm } from "./ScheduleForm";
import { EnrollStudentModal } from "./EnrollStudentModal";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";
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
import { courseApi } from "../../../api/courseApi";
import type { CourseResponse } from "../../../types/course";


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
  const confirm = useConfirm();
  const { toast } = useToast();

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
  // Dropped (withdrawn) enrollment section
  const [showDropped, setShowDropped] = useState(false);
  const [droppedEnrollments, setDroppedEnrollments] = useState<EnrollmentResponse[]>([]);
  const [isLoadingDropped, setIsLoadingDropped] = useState(false);
  const [isRestoringId, setIsRestoringId] = useState<number | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(cls.name);
  const [editMaxStudents, setEditMaxStudents] = useState(cls.maxStudents ?? 30);
  const [editMonthlyFee, setEditMonthlyFee] = useState(cls.monthFee ?? 0);
  const [editCourseId, setEditCourseId] = useState<number | undefined>(cls.courseId || undefined);
  const [editStatus, setEditStatus] = useState<ClassStatus>(cls.status);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    courseApi.findAll().then(setCourses).catch(() => {});
  }, []);

  const resetEditState = useCallback(() => {
    setEditName(cls.name);
    setEditMaxStudents(cls.maxStudents ?? 30);
    setEditMonthlyFee(cls.monthFee ?? 0);
    setEditCourseId(cls.courseId || undefined);
    setEditStatus(cls.status);
  }, [cls]);

  useEffect(() => {
    resetEditState();
  }, [resetEditState]);

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Tên lớp không được để trống.");
      return;
    }
    const confirmed = await confirm({
      title: "Cập nhật lớp học?",
      message: `Bạn có chắc chắn muốn cập nhật thông tin lớp "${editName.trim()}"?`,
      confirmText: "Lưu thay đổi",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      setIsSaving(true);
      await classApi.update(cls.id, {
        name: editName.trim(),
        courseId: editCourseId || (null as any),
        maxStudent: editMaxStudents,
        monthlyFee: editMonthlyFee,
      });
      setIsEditing(false);
      toast.success("Cập nhật thông tin lớp học thành công.");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể lưu thông tin lớp.");
    } finally {
      setIsSaving(false);
    }
  };

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

  const loadDroppedEnrollments = useCallback(async () => {
    setIsLoadingDropped(true);
    try {
      const dropped = await enrollmentApi.findDroppedByClass(cls.id);
      setDroppedEnrollments(dropped);
    } catch {
      // silent
    } finally {
      setIsLoadingDropped(false);
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
    toast.success("Tải tài liệu lên thành công.");
  }, [toast]);

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
    const confirmed = await confirm({
      title: "Chuyển trạng thái lớp?",
      message: `Xác nhận chuyển trạng thái lớp sang "${label}"?`,
      confirmText: "Xác nhận",
      variant: "warning",
    });
    if (!confirmed) return;

    try {
      setIsUpdatingStatus(true);
      await classApi.updateStatus(cls.id, newStatus);
      setSelectedStatus(newStatus);
      toast.success("Cập nhật thông tin lớp học thành công.");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái lớp.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveSchedule = async (data: ScheduleRequest) => {
    try {
      if (editingSchedule) {
        await scheduleApi.update(cls.id, editingSchedule.id, data);
        toast.success("Cập nhật lịch học thành công.");
      } else {
        await scheduleApi.create(cls.id, data);
        toast.success("Thêm lịch học thành công.");
      }
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      loadSchedules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể lưu lịch học.");
    }
  };

  const handleDeleteSchedule = async (schedule: ScheduleResponse) => {
    const confirmed = await confirm({
      title: "Xóa lịch học?",
      message: `Bạn có chắc chắn muốn xóa buổi học ${DAY_LABELS[schedule.dayOfWeek]} ${schedule.startTime}-${schedule.endTime}?`,
      confirmText: "Xóa buổi học",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await scheduleApi.delete(cls.id, schedule.id);
      toast.success("Xóa lịch học thành công.");
      loadSchedules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa lịch học.");
    }
  };

  const handleTypeChange = async (schedule: ScheduleResponse, newType: ScheduleType) => {
    try {
      await scheduleApi.updateType(cls.id, schedule.id, newType);
      toast.success("Cập nhật hình thức học thành công.");
      loadSchedules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật hình thức học.");
    }
  };

  const handleEnroll = async (studentId: number) => {
    const student = allStudents.find((s) => s.userId === studentId);
    const studentName = student ? student.fullName : "học sinh";
    const confirmed = await confirm({
      title: "Thêm học sinh vào lớp?",
      message: `Bạn có chắc chắn muốn thêm học sinh "${studentName}" vào lớp "${cls.name}" không?`,
      confirmText: "Thêm",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      await enrollmentApi.enroll(cls.id, { studentId });
      toast.success("Đã thêm học sinh vào lớp.");
      loadEnrollments();
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể thêm học sinh vào lớp.");
    }
  };

  const handleDrop = async (enrollment: EnrollmentResponse) => {
    const confirmed = await confirm({
      title: "Xóa học sinh khỏi lớp?",
      message: `Bạn có chắc chắn muốn xóa học sinh "${enrollment.studentFullName}" khỏi lớp "${cls.name}" không?\n\nHành động này sẽ rút học sinh khỏi lớp học hiện tại, nhưng toàn bộ lịch sử học tập (học phí, điểm danh, điểm số...) sẽ được giữ lại để khôi phục khi cần.`,
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await enrollmentApi.drop(cls.id, enrollment.studentUserId);
      toast.success("Đã xóa học sinh khỏi lớp.");
      loadEnrollments();
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa học sinh khỏi lớp.");
    }
  };

  const handleRestore = async (enrollment: EnrollmentResponse) => {
    const confirmed = await confirm({
      title: "Khôi phục học sinh vào lớp?",
      message: `Bạn có chắc chắn muốn khôi phục "${enrollment.studentFullName}" vào lớp "${cls.name}"?\n\nLịch sử học phí và điểm danh sẽ được giữ nguyên.`,
      confirmText: "Khôi phục",
      cancelText: "Hủy",
      variant: "emerald",
    });
    if (!confirmed) return;

    try {
      setIsRestoringId(enrollment.id);
      await enrollmentApi.enroll(cls.id, { studentId: enrollment.studentUserId });
      await Promise.all([loadEnrollments(), loadDroppedEnrollments()]);
      toast.success("Đã khôi phục học sinh vào lớp.");
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể khôi phục học sinh.");
    } finally {
      setIsRestoringId(null);
    }
  };

  const handleApprove = async (enrollment: EnrollmentResponse) => {
    const confirmed = await confirm({
      title: "Duyệt học sinh vào lớp?",
      message: `Bạn có chắc chắn muốn duyệt "${enrollment.studentFullName}" vào lớp?`,
      confirmText: "Duyệt",
      variant: "emerald",
    });
    if (!confirmed) return;

    try {
      await enrollmentApi.approve(cls.id, enrollment.studentUserId);
      toast.success("Duyệt học sinh vào lớp thành công.");
      loadEnrollments();
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Duyệt học sinh thất bại.");
    }
  };

  const handleReject = async (enrollment: EnrollmentResponse) => {
    const confirmed = await confirm({
      title: "Từ chối học sinh?",
      message: `Bạn có chắc chắn muốn từ chối ghi danh học sinh "${enrollment.studentFullName}"?`,
      confirmText: "Từ chối",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await enrollmentApi.reject(cls.id, enrollment.studentUserId);
      toast.success("Đã từ chối học sinh.");
      loadEnrollments();
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Xử lý từ chối thất bại.");
    }
  };

  const handleSuspend = async (enrollment: EnrollmentResponse) => {
    const confirmed = await confirm({
      title: "Đình chỉ học tập?",
      message: `Bạn có chắc chắn muốn đình chỉ học tập của "${enrollment.studentFullName}" tại lớp "${cls.name}" không?`,
      confirmText: "Đình chỉ",
      variant: "warning",
    });
    if (!confirmed) return;

    try {
      await enrollmentApi.suspend(cls.id, enrollment.studentUserId);
      toast.success("Đã đình chỉ học sinh.");
      loadEnrollments();
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể đình chỉ học sinh.");
    }
  };

  const handleReactivate = async (enrollment: EnrollmentResponse) => {
    const confirmed = await confirm({
      title: "Khôi phục trạng thái học tập?",
      message: `Bạn có chắc chắn muốn khôi phục trạng thái học tập cho học sinh "${enrollment.studentFullName}" tại lớp "${cls.name}" không?`,
      confirmText: "Khôi phục",
      variant: "emerald",
    });
    if (!confirmed) return;

    try {
      await enrollmentApi.reactivate(cls.id, enrollment.studentUserId);
      toast.success("Khôi phục trạng thái học tập thành công.");
      loadEnrollments();
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể khôi phục trạng thái học tập.");
    }
  };

  const enrolledIds = enrollments.map((e) => e.studentUserId);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết lớp học</h2>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-primary text-white hover:bg-primary-hover px-4 py-1.5 text-sm font-medium transition-colors"
              >
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium bg-white hover:bg-gray-100 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Edit or Details Summary Form */}
        {isEditing ? (
          <form onSubmit={handleSaveBasicInfo} className="border-b bg-gray-50/50 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-950 uppercase tracking-wider">Sửa thông tin cơ bản</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Tên lớp *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Khóa học</label>
                <select
                  value={editCourseId || ""}
                  onChange={(e) => setEditCourseId(e.target.value ? Number(e.target.value) : undefined)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                >
                  <option value="">-- Không chọn --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Sĩ số tối đa</label>
                <input
                  type="number"
                  value={editMaxStudents}
                  onChange={(e) => setEditMaxStudents(Number(e.target.value))}
                  min={1}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Học phí hàng tháng (VNĐ)</label>
                <input
                  type="number"
                  value={editMonthlyFee}
                  onChange={(e) => setEditMonthlyFee(Number(e.target.value))}
                  min={0}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Trạng thái</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ClassStatus)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                >
                  {CLASS_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {CLASS_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  resetEditState();
                }}
                className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-primary text-white hover:bg-primary-hover px-4 py-1.5 text-sm font-medium"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        ) : (
          <div className="border-b bg-gray-50/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-955">{cls.name}</h3>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value as ClassStatus)}
                disabled={isUpdatingStatus}
                className="text-xs font-semibold rounded-full border border-gray-300 px-2.5 py-1 bg-white text-gray-700 focus:outline-hidden cursor-pointer"
              >
                {CLASS_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {CLASS_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Khóa học:</span>
                <span className="font-medium text-gray-950">{cls.courseName || "Chưa gán"}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Học phí:</span>
                <span className="font-medium text-gray-955">{formatCurrency(cls.monthFee)}/tháng</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Sĩ số tối đa:</span>
                <span className="font-medium text-gray-950">{cls.maxStudents} học sinh</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Học sinh đăng ký:</span>
                <span className="font-medium text-gray-950">{enrollments.length} học sinh</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Số lịch học trong tuần:</span>
                <span className="font-medium text-gray-955">{schedules.length} buổi</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Giáo viên gán:</span>
                <span className="font-medium text-gray-950 text-right truncate max-w-[180px]" title={schedules.map(s => s.teacherUserFullName).filter((name, idx, self) => name && self.indexOf(name) === idx).join(", ")}>
                  {schedules.map(s => s.teacherUserFullName).filter((name, idx, self) => name && self.indexOf(name) === idx).join(", ") || "Chưa có"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1.5 col-span-2">
                <span className="text-gray-500">Ngày tạo lớp:</span>
                <span className="font-medium text-gray-955">
                  {(cls as any).createdAt ? new Date((cls as any).createdAt).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>
          </div>
        )}


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

              {/* ── Withdrawn Students Section ── */}
              <div className="mt-4 border-t pt-4">
                <button
                  onClick={() => {
                    const next = !showDropped;
                    setShowDropped(next);
                    if (next && droppedEnrollments.length === 0) {
                      loadDroppedEnrollments();
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <span className={`inline-block transition-transform ${showDropped ? "rotate-90" : ""}`}></span>
                  Học sinh đã rời lớp
                  {droppedEnrollments.length > 0 && (
                    <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                      {droppedEnrollments.length}
                    </span>
                  )}
                </button>

                {showDropped && (
                  <div className="mt-3">
                    {isLoadingDropped ? (
                      <div className="py-4 text-center text-xs text-gray-400">Đang tải...</div>
                    ) : droppedEnrollments.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-xs text-gray-400">
                        Không có học sinh nào đã rời lớp.
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-100 bg-amber-50/40">
                        <div className="px-3 py-2 text-xs text-amber-700 font-medium border-b border-amber-100">
                          Dữ liệu lịch sử (học phí, điểm danh) được giữ nguyên. Nhấn "Khôi phục" để ghi danh lại.
                        </div>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase">
                              <th className="px-3 py-2">Họ tên</th>
                              <th className="px-3 py-2">SĐT</th>
                              <th className="px-3 py-2">Ngày ghi danh</th>
                              <th className="px-3 py-2 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100">
                            {droppedEnrollments.map((e) => (
                              <tr key={e.id} className="text-gray-500">
                                <td className="px-3 py-2.5 font-medium text-gray-700">{e.studentFullName}</td>
                                <td className="px-3 py-2.5">{e.studentPhoneNumber}</td>
                                <td className="px-3 py-2.5 text-xs">
                                  {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString("vi-VN") : "—"}
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <button
                                    onClick={() => handleRestore(e)}
                                    disabled={isRestoringId === e.id}
                                    className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                                  >
                                    {isRestoringId === e.id ? "Đang khôi phục..." : "Khôi phục"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
