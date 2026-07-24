import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import homeworkApi from "../../api/homeworkApi";
import { Button } from "../../components/ui/Button";
import { PageHeader, ErrorBanner, LoadingSkeleton, Badge } from "../../components/ui/SharedComponents";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import type { HomeworkAssignmentResponse, HomeworkAssignmentStatus } from "../../types/homework";

const statusLabels: Record<HomeworkAssignmentStatus, string> = {
  DRAFT: "Bản nháp",
  SCHEDULED: "Đã lên lịch",
  OPEN: "Đang mở",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã hủy",
  ARCHIVED: "Đã lưu trữ",
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

export default function TeacherHomeworkAssignmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [assignment, setAssignment] = useState<HomeworkAssignmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      // Since there's no specific GET /id, we'll fetch from library by ID
      const data = await homeworkApi.getAssignmentLibrary();
      const match = data.find(a => a.id === Number(id));
      if (match) {
        setAssignment(match);
      } else {
        setError("Không tìm thấy bài tập giao.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải chi tiết bài tập.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (action: 'schedule' | 'close' | 'releaseGrades' | 'cancel' | 'reopen') => {
    try {
      setIsProcessing(true);
      if (action === 'schedule') {
        await homeworkApi.scheduleAssignment(Number(id));
        showToast("Đã lên lịch bài tập.", "success");
      } else if (action === 'close') {
        await homeworkApi.closeAssignment(Number(id));
        showToast("Đã đóng bài tập.", "success");
      } else if (action === 'releaseGrades') {
        await homeworkApi.releaseGrades(Number(id));
        showToast("Đã công bố điểm cho học sinh.", "success");
      } else if (action === 'cancel') {
        await homeworkApi.cancelAssignment(Number(id));
        showToast("Đã hủy bài tập.", "success");
      } else if (action === 'reopen') {
        await homeworkApi.reopenAssignment(Number(id));
        showToast("Đã mở lại bài tập.", "success");
      }
      await loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Thao tác thất bại.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsProcessing(true);
      await homeworkApi.deleteAssignment(Number(id));
      showToast("Đã xóa bài tập.", "success");
      navigate("/teacher/homework-assignments");
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Không thể xóa bài tập.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <LoadingSkeleton count={3} height="h-32" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <ErrorBanner message={error || "Không tìm thấy dữ liệu"} />
        <Button className="mt-4" onClick={() => navigate("/teacher/homework-assignments")}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <PageHeader title="Chi tiết Bài tập Giao">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate("/teacher/homework-assignments")}>
            Quay lại
          </Button>
          
          {assignment.status === "DRAFT" && (
            <>
              <ConfirmDialog
                title="Lên lịch bài tập"
                message="Khi lên lịch, bài tập sẽ tự động mở vào thời gian đã cấu hình. Học sinh trong lớp sẽ nhận được thông báo. Bạn có chắc chắn?"
                onConfirm={() => handleAction('schedule')}
              >
                <Button size="sm" isLoading={isProcessing}>Lên lịch phát hành</Button>
              </ConfirmDialog>
              <ConfirmDialog
                title="Xóa bài tập"
                message="Bạn có chắc chắn muốn xóa bài tập nháp này không?"
                onConfirm={handleDelete}
              >
                <Button variant="danger" size="sm" isLoading={isProcessing}>Xóa</Button>
              </ConfirmDialog>
            </>
          )}

          {assignment.status === "OPEN" && (
            <ConfirmDialog
              title="Đóng bài tập sớm"
              message="Đóng bài tập ngay bây giờ? Học sinh sẽ không thể tiếp tục nộp bài."
              onConfirm={() => handleAction('close')}
            >
              <Button variant="danger" size="sm" isLoading={isProcessing}>Đóng bài ngay</Button>
            </ConfirmDialog>
          )}

          {(assignment.status === "SCHEDULED" || assignment.status === "OPEN") && (
            <ConfirmDialog
              title="Hủy bài tập"
              message="Bạn có chắc chắn muốn hủy bài tập này? Học sinh sẽ không thể làm bài."
              onConfirm={() => handleAction('cancel')}
            >
              <Button variant="danger" size="sm" isLoading={isProcessing}>Hủy bài tập</Button>
            </ConfirmDialog>
          )}

          {assignment.status === "CANCELLED" && (
            <ConfirmDialog
              title="Mở lại bài tập"
              message="Khôi phục lại bài tập này về trạng thái DRAFT?"
              onConfirm={() => handleAction('reopen')}
            >
              <Button variant="secondary" size="sm" isLoading={isProcessing}>Mở lại bài tập</Button>
            </ConfirmDialog>
          )}

          {(assignment.status === "OPEN" || assignment.status === "CLOSED") && !assignment.isGradesReleased && (
            <ConfirmDialog
              title="Công bố điểm"
              message="Học sinh sẽ có thể xem điểm và đánh giá của giáo viên. Bạn có chắc chắn?"
              onConfirm={() => handleAction('releaseGrades')}
            >
              <Button size="sm" isLoading={isProcessing}>Công bố điểm</Button>
            </ConfirmDialog>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <section className="rounded-card border border-surface-border bg-white p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{assignment.templateTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">Lớp học: <span className="font-semibold text-gray-800">{assignment.clazzName}</span></p>
              </div>
              <Badge 
                variant={
                  assignment.status === "OPEN" ? "success" : 
                  assignment.status === "SCHEDULED" ? "warning" :
                  assignment.status === "CLOSED" ? "error" :
                  "info"
                }
              >
                {statusLabels[assignment.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-border">
              <div>
                <p className="text-xs text-gray-500">Giáo viên phụ trách</p>
                <p className="font-medium text-gray-900">{assignment.teacherFullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng điểm</p>
                <p className="font-medium text-gray-900">{assignment.maxScore} điểm</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ngày giao</p>
                <p className="font-medium text-gray-900">{formatDateTime(assignment.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mẫu bài tập gốc (ID)</p>
                <p className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/teacher/homework-templates/${assignment.templateId}`)}>
                  #{assignment.templateId}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-card border border-surface-border bg-white p-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Cài đặt bài tập</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="flex justify-between border-b border-surface-hover pb-2 pr-4">
                <span className="text-gray-600">Nộp muộn</span>
                <span className="font-medium">{assignment.allowLateSubmission ? "Có" : "Không"}</span>
              </div>
              <div className="flex justify-between border-b border-surface-hover pb-2 pl-4">
                <span className="text-gray-600">Nộp lại</span>
                <span className="font-medium">{assignment.allowResubmit ? "Có" : "Không"}</span>
              </div>
              <div className="flex justify-between border-b border-surface-hover pb-2 pr-4">
                <span className="text-gray-600">Công bố điểm tự động</span>
                <span className="font-medium">{assignment.publishScoreImmediately ? "Có" : "Không"}</span>
              </div>
              <div className="flex justify-between border-b border-surface-hover pb-2 pl-4">
                <span className="text-gray-600">Hiện đáp án sau chấm</span>
                <span className="font-medium">{assignment.showAnswerAfterGrading ? "Có" : "Không"}</span>
              </div>
              <div className="flex justify-between border-b border-surface-hover pb-2 pr-4">
                <span className="text-gray-600">Trạng thái công bố điểm</span>
                <span className="font-medium">{assignment.isGradesReleased ? "Đã công bố" : "Chưa công bố"}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Timeline & Progress */}
        <div className="space-y-6">
          <section className="rounded-card border border-surface-border bg-white p-6">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4 uppercase tracking-wider">Tiến trình nộp bài</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Đã nộp</span>
                  <span className="font-bold text-primary">{assignment.submittedCount} / {assignment.totalStudents}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 flex overflow-hidden">
                  <div 
                    className="bg-primary h-full" 
                    title="Nộp đúng hạn"
                    style={{ width: `${assignment.totalStudents > 0 ? ((assignment.submittedCount - (assignment.lateCount || 0)) / assignment.totalStudents) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="bg-yellow-400 h-full" 
                    title="Nộp muộn"
                    style={{ width: `${assignment.totalStudents > 0 ? ((assignment.lateCount || 0) / assignment.totalStudents) * 100 : 0}%` }}
                  ></div>
                </div>
                {assignment.lateCount > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">*{assignment.lateCount} bài nộp muộn</p>
                )}
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Chưa nộp</span>
                  <span className="font-bold text-gray-500">{assignment.missingCount} / {assignment.totalStudents}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Đã chấm</span>
                  <span className="font-bold text-success">{assignment.gradedCount} / {assignment.submittedCount}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-success h-2 rounded-full" 
                    style={{ width: `${assignment.submittedCount > 0 ? (assignment.gradedCount / assignment.submittedCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <Button className="w-full mt-4" variant="secondary" onClick={() => navigate(`/teacher/essays`)}>
                Xem danh sách chấm bài
              </Button>
            </div>
          </section>

          <section className="rounded-card border border-surface-border bg-white p-6">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4 uppercase tracking-wider">Lịch trình</h3>
            
            <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
              
              <div className="relative">
                <div className={`absolute -left-[21px] h-3 w-3 rounded-full border-2 border-white bg-primary`}></div>
                <p className="text-xs font-semibold text-gray-900">Tạo bản nháp</p>
                <p className="text-xs text-gray-500">{formatDateTime(assignment.createdAt)}</p>
              </div>

              <div className="relative">
                <div className={`absolute -left-[21px] h-3 w-3 rounded-full border-2 border-white ${(assignment.scheduledAt || assignment.openedAt) ? 'bg-primary' : 'bg-gray-300'}`}></div>
                <p className="text-xs font-semibold text-gray-900">Lên lịch</p>
                <p className="text-xs text-gray-500">{formatDateTime(assignment.scheduledAt)}</p>
              </div>

              <div className="relative">
                <div className={`absolute -left-[21px] h-3 w-3 rounded-full border-2 border-white ${assignment.openedAt ? 'bg-primary' : (assignment.status === 'SCHEDULED' ? 'bg-blue-300 animate-pulse' : 'bg-gray-300')}`}></div>
                <p className="text-xs font-semibold text-gray-900">Mở bài (Từ)</p>
                <p className="text-xs text-gray-500">{formatDateTime(assignment.availableFrom)}</p>
              </div>

              <div className="relative">
                <div className={`absolute -left-[21px] h-3 w-3 rounded-full border-2 border-white ${assignment.status === 'CLOSED' ? 'bg-red-500' : (assignment.status === 'OPEN' ? 'bg-red-300 animate-pulse' : 'bg-gray-300')}`}></div>
                <p className="text-xs font-semibold text-red-500">Hạn chót</p>
                <p className="text-xs text-gray-500">{formatDateTime(assignment.dueDate)}</p>
              </div>

              <div className="relative">
                <div className={`absolute -left-[21px] h-3 w-3 rounded-full border-2 border-white ${assignment.closedAt ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                <p className="text-xs font-semibold text-gray-900">Đóng bài</p>
                <p className="text-xs text-gray-500">{formatDateTime(assignment.closeAt || assignment.closedAt)}</p>
              </div>

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
