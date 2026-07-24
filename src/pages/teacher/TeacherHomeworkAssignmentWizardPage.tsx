import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import homeworkApi from "../../api/homeworkApi";
import { classApi } from "../../api/classApi";
import { Button } from "../../components/ui/Button";
import { PageHeader, ErrorBanner, LoadingSkeleton } from "../../components/ui/SharedComponents";
import { useToast } from "../../components/ui/Toast";
import { TemplatePreview } from "./components/TemplatePreview";
import type { HomeworkTemplate, TeacherHomeworkTemplateSaveRequest, TeacherHomeworkAssignmentSaveRequest } from "../../types/homework";
import type { ClassResponse } from "../../types/class";

export default function TeacherHomeworkAssignmentWizardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Data
  const [templates, setTemplates] = useState<HomeworkTemplate[]>([]);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  
  // Selections
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState<TeacherHomeworkTemplateSaveRequest | null>(null);
  
  // Step 2 Form
  const [formData, setFormData] = useState<TeacherHomeworkAssignmentSaveRequest>({
    templateId: 0,
    clazzId: 0,
    availableFrom: "",
    dueDate: "",
    closeAt: "",
    allowLateSubmission: false,
    allowResubmit: false,
    publishScoreImmediately: true,
    showAnswerAfterGrading: true
  });
  
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tData, cData] = await Promise.all([
        homeworkApi.getTemplateLibrary(undefined, undefined, undefined, false),
        classApi.findMyClasses()
      ]);
      setTemplates(tData.filter(t => t.status !== "ARCHIVED"));
      setClasses(cData);
    } catch (err: any) {
      setError("Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleTemplateSelect = (t: HomeworkTemplate) => {
    setSelectedTemplateId(t.id);
    setSelectedTemplatePreview({
      title: t.title,
      description: t.description,
      instructions: t.instructions,
      homeworkType: t.homeworkType,
      estimatedTime: t.estimatedTime,
      difficulty: t.difficulty,
      maxScore: t.maxScore,
      questions: t.questions || []
    });
    setFormData(prev => ({ ...prev, templateId: t.id }));
  };

  const handleNextStep = () => {
    if (!selectedTemplateId) {
      setError("Vui lòng chọn một mẫu bài tập.");
      return;
    }
    
    // Set smart defaults for dates if not set yet
    if (!formData.availableFrom) {
      const now = new Date();
      // Round up to nearest 5 minutes
      now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
      now.setSeconds(0);
      now.setMilliseconds(0);
      
      // format as YYYY-MM-DDThh:mm (local time for datetime-local input)
      const pad = (n: number) => n.toString().padStart(2, '0');
      const defaultStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      
      setFormData(prev => ({ ...prev, availableFrom: defaultStr }));
    }

    setError("");
    setStep(2);
  };

  const toUTCString = (localDateTimeStr: string | null | undefined): string | null => {
    if (!localDateTimeStr) return null;
    return new Date(localDateTimeStr).toISOString();
  };

  const getTimelineErrors = () => {
    const errs: string[] = [];
    const available = formData.availableFrom ? new Date(formData.availableFrom) : null;
    const due = formData.dueDate ? new Date(formData.dueDate) : null;
    const close = formData.closeAt ? new Date(formData.closeAt) : null;
    
    if (available && due && available >= due) {
      errs.push("Ngày mở bài phải trước Ngày đến hạn.");
    }
    if (due && close && due >= close) {
      errs.push("Ngày đến hạn phải trước Ngày đóng bài.");
    }
    if (available && close && available >= close) {
      errs.push("Ngày mở bài phải trước Ngày đóng bài.");
    }
    return errs;
  };

  const timelineErrors = getTimelineErrors();

  const handleSubmit = async () => {
    setError("");
    if (!formData.clazzId) {
      setError("Vui lòng chọn lớp học.");
      return;
    }
    
    if (timelineErrors.length > 0) {
      setError("Vui lòng sửa các lỗi lịch trình trước khi lưu.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        availableFrom: toUTCString(formData.availableFrom),
        dueDate: toUTCString(formData.dueDate),
        closeAt: toUTCString(formData.closeAt),
      };
      await homeworkApi.createAssignment(payload);
      showToast("Tạo bài tập thành công (Bản nháp).", "success");
      navigate("/teacher/homework-assignments");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tạo bài tập.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <LoadingSkeleton count={3} height="h-32" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <PageHeader title="Giao Bài Tập Mới">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/teacher/homework-assignments")}>Hủy</Button>
          {step === 1 ? (
            <Button onClick={handleNextStep} disabled={!selectedTemplateId}>Tiếp theo: Cấu hình →</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setStep(1)}>← Quay lại</Button>
              <Button onClick={handleSubmit} isLoading={isSubmitting}>Lưu bài tập (Nháp)</Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${step >= 1 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>1</div>
          <span className={`font-medium ${step >= 1 ? "text-primary" : "text-gray-500"}`}>Chọn mẫu bài tập</span>
          <div className={`h-1 w-16 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}></div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${step >= 2 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
          <span className={`font-medium ${step >= 2 ? "text-primary" : "text-gray-500"}`}>Cấu hình bài tập</span>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {step === 1 && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2 flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {templates.length === 0 ? (
              <div className="mt-8">
                <EmptyState message="Không có mẫu bài tập nào khả dụng.">
                  <Button onClick={() => navigate("/teacher/homework-templates/new")}>
                    Tạo mẫu bài tập mới
                  </Button>
                </EmptyState>
              </div>
            ) : (
              templates.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => handleTemplateSelect(t)}
                  className={`cursor-pointer rounded-card border p-4 transition-all ${
                    selectedTemplateId === t.id 
                      ? "border-primary bg-primary-light shadow-md" 
                      : "border-surface-border bg-white hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900">{t.title}</h3>
                    <span className="text-xs font-semibold text-primary">{t.maxScore} điểm</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{t.description || "Không có mô tả"}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {t.homeworkType === "QUIZ" ? "Trắc nghiệm" : t.homeworkType === "ESSAY" ? "Tự luận" : "Hỗn hợp"}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      v{t.version}
                    </span>
                    {t.questions && <span className="text-xs text-gray-500 ml-auto">{t.questions.length} câu hỏi</span>}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="lg:w-1/2">
            <div className="sticky top-24 rounded-card border border-surface-border bg-white p-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Xem trước</h3>
              {selectedTemplatePreview ? (
                <TemplatePreview data={selectedTemplatePreview} />
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p>Chọn một mẫu bên trái để xem trước nội dung.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-card border border-surface-border bg-white p-6 max-w-3xl mx-auto space-y-8">
          
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Đối tượng giao bài</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lớp học *</label>
              <select
                className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
                value={formData.clazzId}
                onChange={e => setFormData({ ...formData, clazzId: Number(e.target.value) })}
              >
                <option value={0} disabled>-- Chọn lớp học --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Lịch trình & Thời hạn</h3>
            
            {timelineErrors.length > 0 && (
              <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700 border border-red-100">
                <ul className="list-disc pl-5">
                  {timelineErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ngày mở bài</label>
                <input
                  type="datetime-local"
                  className={`w-full rounded-input border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary ${
                    timelineErrors.some(e => e.includes("Ngày mở bài")) ? "border-red-400" : "border-surface-border"
                  }`}
                  value={formData.availableFrom || ""}
                  onChange={e => setFormData({ ...formData, availableFrom: e.target.value })}
                />
                <p className="text-xs text-gray-500">Học sinh không thể mở bài trước thời gian này.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ngày đến hạn</label>
                <input
                  type="datetime-local"
                  className={`w-full rounded-input border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary ${
                    timelineErrors.some(e => e.includes("Ngày đến hạn")) ? "border-red-400" : "border-surface-border"
                  }`}
                  value={formData.dueDate || ""}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                />
                <p className="text-xs text-gray-500">Thời hạn chính thức để hoàn thành.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ngày đóng bài</label>
                <input
                  type="datetime-local"
                  className={`w-full rounded-input border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary ${
                    timelineErrors.some(e => e.includes("Ngày đóng bài")) ? "border-red-400" : "border-surface-border"
                  }`}
                  value={formData.closeAt || ""}
                  onChange={e => setFormData({ ...formData, closeAt: e.target.value })}
                />
                <p className="text-xs text-gray-500">Học sinh không thể nộp bài sau thời gian này.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Cài đặt nâng cao</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex h-5 items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                    checked={formData.allowLateSubmission}
                    onChange={e => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                  />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Cho phép nộp muộn</p>
                  <p className="text-gray-500">Học sinh có thể nộp sau Ngày đến hạn (nhưng trước Ngày đóng bài).</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex h-5 items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                    checked={formData.allowResubmit}
                    onChange={e => setFormData({ ...formData, allowResubmit: e.target.checked })}
                  />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Cho phép nộp lại</p>
                  <p className="text-gray-500">Học sinh có thể nộp lại nhiều lần trước thời hạn đóng.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex h-5 items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                    checked={formData.publishScoreImmediately}
                    onChange={e => setFormData({ ...formData, publishScoreImmediately: e.target.checked })}
                  />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Công bố điểm ngay sau khi chấm</p>
                  <p className="text-gray-500">Đối với trắc nghiệm, điểm sẽ được hiển thị ngay lập tức.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex h-5 items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                    checked={formData.showAnswerAfterGrading}
                    onChange={e => setFormData({ ...formData, showAnswerAfterGrading: e.target.checked })}
                  />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Hiển thị đáp án sau khi có điểm</p>
                  <p className="text-gray-500">Học sinh có thể xem đáp án đúng và lời giải sau khi bài được chấm xong.</p>
                </div>
              </label>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
