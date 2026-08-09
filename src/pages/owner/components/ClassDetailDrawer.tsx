import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Badge } from "../../../components/ui/SharedComponents";
import { ScheduleRuleForm } from "./ScheduleRuleForm";
import { ScheduleEventForm } from "./ScheduleEventForm";
import { EnrollStudentModal } from "./EnrollStudentModal";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";
import { scheduleApi } from "../../../api/scheduleApi";
import { enrollmentApi } from "../../../api/enrollmentApi";
import { classApi } from "../../../api/classApi";
import { studentApi } from "../../../api/studentApi";
import { teacherApi } from "../../../api/teacherApi";
import type {
  ScheduleEventRequest,
  ScheduleEventResponse,
  ScheduleRuleRequest,
  ScheduleRuleResponse,
} from "../../../types/schedule";
import type { EnrollmentResponse } from "../../../types/enrollment";
import { ENROLLMENT_STATUS_LABELS } from "../../../types/enrollment";
import type { TeacherResponse } from "../../../types/teacher";
import type { StudentResponse } from "../../../types/student";
import type { ClassResponse, ClassStatus } from "../../../types/class";
import { CLASS_STATUS_LABELS } from "../../../types/class";
import { DAY_LABELS } from "../../../types/schedule";
import { formatCurrency, formatMoney } from "../../../utils/money";
import { courseApi } from "../../../api/courseApi";
import type { CourseResponse } from "../../../types/course";
import { feeApi } from "../../../api/feeApi";
import type { FeeRecordResponse, CashPaymentRequest } from "../../../types/fee";
import { FEE_STATUS_LABELS } from "../../../types/fee";
import { CollectFeeModal } from "./CollectFeeModal";


type Tab = "schedule" | "students" | "fees";
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
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRuleResponse[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEventResponse[]>([]);
  const [editingEvent, setEditingEvent] = useState<ScheduleEventResponse | null>(null);
  const [generatingRuleId, setGeneratingRuleId] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentResponse[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ClassStatus>(cls.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // Dropped (withdrawn) enrollment section
  const [showDropped, setShowDropped] = useState(false);
  const [droppedEnrollments, setDroppedEnrollments] = useState<EnrollmentResponse[]>([]);
  const [isLoadingDropped, setIsLoadingDropped] = useState(false);
  const [isRestoringId, setIsRestoringId] = useState<number | null>(null);

  // Fees state
  const [classFees, setClassFees] = useState<FeeRecordResponse[]>([]);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [dueDateInput, setDueDateInput] = useState("");
  const [isSavingDueDate, setIsSavingDueDate] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [selectedFeeRecord, setSelectedFeeRecord] = useState<FeeRecordResponse | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(cls.name);
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
        startDate: cls.startDate || undefined,
        teacherUserId: cls.teacherUserId || undefined,
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
      const [t, rules, events] = await Promise.all([
        teacherApi.findAll(),
        scheduleApi.findRulesByClass(cls.id),
        scheduleApi.findEventsByClass(cls.id),
      ]);
      setTeachers(t);
      setScheduleRules(rules);
      setScheduleEvents(events);
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

  const loadClassFees = useCallback(async () => {
    setIsLoadingFees(true);
    try {
      const fees = await feeApi.getClassFees(cls.id);
      setClassFees(fees);
      const existingDueDate = fees.find((f) => f.dueDate)?.dueDate;
      if (existingDueDate) {
        setDueDateInput(existingDueDate);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingFees(false);
    }
  }, [cls.id]);

  useEffect(() => {
    if (tab === "fees") loadClassFees();
  }, [tab, loadClassFees]);

  const handleUpdateDueDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDateInput) {
      toast.error("Vui lòng chọn ngày hạn chót đóng học phí.");
      return;
    }

    const formattedDate = new Date(dueDateInput).toLocaleDateString("vi-VN");
    const confirmed = await confirm({
      title: "Cấu hình hạn chót đóng học phí?",
      message: `Bạn có chắc chắn muốn đặt hạn chót đóng học phí cho lớp "${cls.name}" là ngày ${formattedDate}? Các khoản chưa thanh toán sau ngày này sẽ tự động chuyển sang "Quá hạn".`,
      confirmText: "Lưu thay đổi",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      setIsSavingDueDate(true);
      const updatedFees = await feeApi.updateClassFeeDueDate(cls.id, dueDateInput);
      setClassFees(updatedFees);
      setIsEditingDueDate(false);
      toast.success("Cập nhật hạn chót đóng học phí thành công.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật hạn chót đóng học phí.");
    } finally {
      setIsSavingDueDate(false);
    }
  };

  const handleCollectCash = async (feeRecordId: number, data: CashPaymentRequest) => {
    await feeApi.collectCash(feeRecordId, data);
    toast.success("Thu tiền mặt thành công.");
    loadClassFees();
  };

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

  const handleCreateRule = async (data: ScheduleRuleRequest) => {
    try {
      await scheduleApi.createRule(cls.id, data);
      toast.success("Tạo quy tắc lịch lặp thành công.");
      setIsRuleModalOpen(false);
      loadSchedules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể tạo quy tắc lịch.");
    }
  };

  const handleGenerateRule = async (rule: ScheduleRuleResponse) => {
    try {
      setGeneratingRuleId(rule.id);
      const created = await scheduleApi.generateEvents(cls.id, rule.id);
      toast.success(`Đã sinh ${created.length} buổi học từ quy tắc.`);
      loadSchedules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể sinh lịch học.");
    } finally {
      setGeneratingRuleId(null);
    }
  };

  const handleCreateEvent = async (data: ScheduleEventRequest) => {
    try {
      await scheduleApi.createEvent(cls.id, data);
      toast.success("Tạo sự kiện lịch thành công.");
      setIsEventModalOpen(false);
      loadSchedules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể tạo sự kiện lịch.");
    }
  };

  const handleUpdateEvent = async (data: ScheduleEventRequest) => {
    if (!editingEvent) return;

    try {
      await scheduleApi.updateEvent(cls.id, editingEvent.id, data);
      toast.success("Cập nhật riêng buổi học thành công.");
      setEditingEvent(null);
      setIsEventModalOpen(false);
      loadSchedules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật buổi học.");
    }
  };

  const openEditEventModal = (event: ScheduleEventResponse) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setEditingEvent(null);
    setIsEventModalOpen(false);
  };

  const handleCancelEvent = async (event: ScheduleEventResponse) => {
    const confirmed = await confirm({
      title: "Hủy buổi học/sự kiện?",
      message: `Bạn có chắc muốn hủy sự kiện ngày ${new Date(event.eventDate).toLocaleDateString("vi-VN")} không? Rule gốc sẽ không bị thay đổi.`,
      confirmText: "Hủy sự kiện",
      variant: "warning",
    });
    if (!confirmed) return;

    try {
      await scheduleApi.cancelEvent(cls.id, event.id);
      toast.success("Đã hủy riêng sự kiện này.");
      loadSchedules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể hủy sự kiện.");
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
                <span className="text-gray-500">Học sinh đăng ký:</span>
                <span className="font-medium text-gray-950">{enrollments.length} học sinh</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Số lịch học trong tuần:</span>
                <span className="font-medium text-gray-955">{scheduleEvents.length} buổi</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Giáo viên gán:</span>
                <span className="font-medium text-gray-950 text-right truncate max-w-[180px]" title={cls.teacherName || undefined}>
                  {cls.teacherName || "Chưa gán"}
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
          {(["schedule", "students", "fees"] as Tab[]).map((t) => (
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
                  : "Học phí"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Schedule Tab ── */}
          {tab === "schedule" && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  className="border border-primary bg-primary text-white hover:bg-primary-hover px-3 py-1 text-xs font-medium rounded-lg"
                  onClick={() => setIsRuleModalOpen(true)}
                >
                  + Tạo lịch lặp
                </Button>
                <Button
                  variant="secondary"
                  className="px-3 py-1 text-xs font-medium rounded-lg"
                  onClick={() => {
                    setEditingEvent(null);
                    setIsEventModalOpen(true);
                  }}
                >
                  + Tạo sự kiện lẻ
                </Button>
              </div>
              {isLoadingSchedules ? (
                <div className="py-8 text-center text-sm text-gray-500">Đang tải...</div>
              ) : scheduleRules.length === 0 && scheduleEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
                  Chưa có lịch học nào cho lớp này.
                </div>
              ) : (
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Quy tắc lịch lặp</h3>
                      <p className="text-xs text-gray-500">Rule chỉ mô tả thứ/giờ/khoảng ngày. Nhấn Generate để sinh Lesson Events.</p>
                    </div>
                    {scheduleRules.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-500">
                        Chưa có rule lặp nào.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {scheduleRules.map((rule) => (
                          <div key={rule.id} className="rounded-card border border-surface-border bg-white p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                                  <span>{rule.daysOfWeek.map((day) => DAY_LABELS[day]).join(", ")}</span>
                                  {rule.timeSlotName && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{rule.timeSlotName}</span>}
                                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs text-primary">{rule.type === "ONLINE_CLASS" ? "Online" : "Học"}</span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  {new Date(rule.startDate).toLocaleDateString("vi-VN")} - {new Date(rule.endDate).toLocaleDateString("vi-VN")} · {rule.startTime.slice(0, 5)} - {rule.endTime.slice(0, 5)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  GV: {rule.teacherUserFullName} · Phòng: {rule.roomName} · Đã sinh: {rule.generatedEventCount} buổi
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleGenerateRule(rule)}
                                isLoading={generatingRuleId === rule.id}
                              >
                                Tạo lịch
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Lesson / Exam / Practice Events</h3>
                      <p className="text-xs text-gray-500">Đây là các buổi thật. Hủy/đổi phòng/đổi giờ ở đây sẽ không phá rule gốc.</p>
                    </div>
                    {scheduleEvents.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-500">
                        Chưa có event nào được sinh hoặc tạo riêng.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {scheduleEvents.map((event) => (
                          <div key={event.id} className={`flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-center sm:justify-between ${event.status === "CANCELLED" ? "border-red-200 bg-red-50/60" : "border-surface-border bg-white"}`}>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                                <span>{event.lessonNumber ? `Lesson #${event.lessonNumber}` : event.title || event.eventType}</span>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{event.eventType}</span>
                                {event.status !== "SCHEDULED" && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{event.status}</span>}
                              </div>
                              <p className="mt-1 text-xs text-gray-500">
                                {new Date(event.eventDate).toLocaleDateString("vi-VN")} · {event.startTime.slice(0, 5)} - {event.endTime.slice(0, 5)} · Phòng: {event.roomName || "—"}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">GV: {event.teacherUserFullName || "—"}</p>
                            </div>
                            <div className="flex self-start gap-2 sm:self-auto">
                              <button
                                type="button"
                                onClick={() => openEditEventModal(event)}
                                className="rounded-btn border border-surface-border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-surface-hover"
                              >
                                Sửa
                              </button>
                              {event.status !== "CANCELLED" && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelEvent(event)}
                                  className="rounded-btn border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  Hủy buổi này
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

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
                học sinh đang ghi danh
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
            <div className="space-y-5">
              {/* 1. Configuration Banner */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">Hạn chót đóng học phí</span>
                      {dueDateInput && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            new Date(dueDateInput) < new Date(new Date().setHours(0, 0, 0, 0))
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {new Date(dueDateInput) < new Date(new Date().setHours(0, 0, 0, 0))
                            ? "Đã qua hạn"
                            : "Đang áp dụng"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Cấu hình hạn chót đóng học phí cho tất cả học sinh trong lớp. Học sinh chưa đóng sau hạn này sẽ tự động được xếp thành <span className="font-semibold text-red-600">Học phí quá hạn</span>.
                    </p>
                  </div>

                  {!isEditingDueDate && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDueDate(true)}
                      className="self-start sm:self-auto shrink-0 rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
                    >
                      {dueDateInput ? "Chỉnh sửa hạn chót" : "+ Đặt hạn chót"}
                    </button>
                  )}
                </div>

                {/* Form edit due date */}
                {isEditingDueDate ? (
                  <form onSubmit={handleUpdateDueDate} className="mt-3 pt-3 border-t border-amber-200/60 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-700">Chọn ngày hạn chót:</label>
                      <input
                        type="date"
                        value={dueDateInput}
                        onChange={(e) => setDueDateInput(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 bg-white focus:border-primary focus:outline-hidden"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isSavingDueDate}
                        className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isSavingDueDate ? "Đang lưu..." : "Lưu hạn chót"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDueDate(false)}
                        className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <span className="text-gray-500">Hạn chót hiện tại:</span>
                      <span className="font-bold text-gray-900">
                        {dueDateInput ? new Date(dueDateInput).toLocaleDateString("vi-VN") : "Chưa thiết lập"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Summary stats cards */}
              {classFees.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-2xs">
                    <p className="text-[11px] font-medium text-gray-500 uppercase">Tổng học phí</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {formatMoney(String(classFees.reduce((acc, f) => acc + Number(f.amount || 0), 0)))}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-2xs">
                    <p className="text-[11px] font-medium text-emerald-600 uppercase">Đã thu</p>
                    <p className="mt-1 text-sm font-bold text-emerald-600">
                      {formatMoney(String(classFees.reduce((acc, f) => acc + Number(f.paidAmount || 0), 0)))}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-2xs">
                    <p className="text-[11px] font-medium text-red-600 uppercase">Còn nợ / Quá hạn</p>
                    <p className="mt-1 text-sm font-bold text-red-600">
                      {formatMoney(String(classFees.reduce((acc, f) => acc + Number(f.remainingAmount || 0), 0)))}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Fee Records Table */}
              {isLoadingFees ? (
                <div className="py-8 text-center text-sm text-gray-500">Đang tải danh sách học phí...</div>
              ) : classFees.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500 space-y-1">
                  <p className="font-medium text-gray-700">Chưa có bản ghi học phí nào cho lớp này.</p>
                  <p className="text-xs text-gray-400">Học phí được tạo tự động khi học sinh ghi danh vào lớp.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50/80 text-left font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="px-3 py-2.5">Học sinh</th>
                        <th className="px-3 py-2.5">Tháng</th>
                        <th className="px-3 py-2.5 text-right">Học phí</th>
                        <th className="px-3 py-2.5 text-right">Đã đóng</th>
                        <th className="px-3 py-2.5 text-right">Còn nợ</th>
                        <th className="px-3 py-2.5 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {classFees.map((fee) => {
                        const badgeVariant =
                          fee.status === "PAID"
                            ? "success"
                            : fee.status === "OVERDUE"
                            ? "error"
                            : fee.status === "PARTIAL"
                            ? "info"
                            : "warning";

                        return (
                          <tr key={fee.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-3 py-2.5 font-medium text-gray-900">
                              <div>{fee.studentFullName}</div>
                              <div className="text-[10px] text-gray-400 font-normal">{fee.studentPhoneNumber}</div>
                            </td>
                            <td className="px-3 py-2.5 text-gray-600">{fee.month}</td>
                            <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                              {formatMoney(fee.amount)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-emerald-600">
                              {formatMoney(fee.paidAmount)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                              {formatMoney(fee.remainingAmount)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Badge variant={badgeVariant}>
                                {FEE_STATUS_LABELS[fee.status] ?? fee.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Tạo lịch học lặp"
        maxWidth="max-w-xl"
      >
        <ScheduleRuleForm
          teachers={teachers}
          onSubmit={handleCreateRule}
          onCancel={() => setIsRuleModalOpen(false)}
        />
      </Modal>
      <Modal
        isOpen={isEventModalOpen}
        onClose={closeEventModal}
        title={editingEvent ? "Chỉnh sửa riêng buổi học" : "Tạo sự kiện lịch lẻ"}
      >
        <ScheduleEventForm
          teachers={teachers}
          initialData={editingEvent ?? undefined}
          onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
          onCancel={closeEventModal}
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
      <CollectFeeModal
        isOpen={isCollectModalOpen}
        onClose={() => {
          setIsCollectModalOpen(false);
          setSelectedFeeRecord(null);
        }}
        feeRecord={selectedFeeRecord}
        onSubmit={handleCollectCash}
      />

    </div>
  );
};
