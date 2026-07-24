import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import homeworkApi from "../../api/homeworkApi";
import { Button } from "../../components/ui/Button";
import { PageHeader, ErrorBanner, LoadingSkeleton, Badge } from "../../components/ui/SharedComponents";
import { useToast } from "../../components/ui/Toast";
import { QuestionCard } from "./components/QuestionCard";
import { TemplatePreview } from "./components/TemplatePreview";
import type { TeacherHomeworkTemplateSaveRequest, HomeworkQuestion, HomeworkType, HomeworkDifficulty, HomeworkQuestionType } from "../../types/homework";

const INITIAL_FORM: TeacherHomeworkTemplateSaveRequest = {
  title: "",
  description: "",
  instructions: "",
  homeworkType: "MIXED",
  estimatedTime: 0,
  difficulty: "MEDIUM",
  maxScore: 0,
  questions: [],
};

export default function TeacherHomeworkTemplateBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const isEditing = id && id !== "new";
  const [isLoading, setIsLoading] = useState(isEditing);
  const [error, setError] = useState("");
  
  // Data state
  const [formData, setFormData] = useState<TeacherHomeworkTemplateSaveRequest>(INITIAL_FORM);
  const [originalData, setOriginalData] = useState<string>(JSON.stringify(INITIAL_FORM));
  
  // Meta state (loaded from library)
  const [templateVersion, setTemplateVersion] = useState(1);
  const [parentTemplateId, setParentTemplateId] = useState<number | null>(null);
  const [templateStatus, setTemplateStatus] = useState<string>("DRAFT");
  
  // UI state
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [mode, setMode] = useState<"EDIT" | "PREVIEW">("EDIT");

  // Unsaved changes check
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formData) !== originalData;
  }, [formData, originalData]);



  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formData]);

  useEffect(() => {
    if (isEditing) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      const library = await homeworkApi.getTemplateLibrary();
      const template = library.find(t => t.id === Number(id));
      if (template) {
        const d = {
          title: template.title,
          description: template.description,
          instructions: template.instructions,
          homeworkType: template.homeworkType,
          estimatedTime: template.estimatedTime,
          difficulty: template.difficulty,
          maxScore: template.maxScore,
          questions: template.questions || [],
        };
        setFormData(d);
        setOriginalData(JSON.stringify(d));
        setTemplateVersion(template.version);
        setParentTemplateId(template.parentTemplateId || null);
        setTemplateStatus(template.status || "DRAFT");
        
        if (d.questions.length > 0) {
          setExpandedQuestions({ 0: true });
        }
      } else {
        setError("Không tìm thấy mẫu bài tập.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi tải mẫu bài tập");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) {
      errors.title = "Tiêu đề không được để trống";
    }
    if (formData.estimatedTime && formData.estimatedTime < 0) {
      errors.estimatedTime = "Thời gian không hợp lệ";
    }

    const titles = new Set<string>();
    formData.questions?.forEach((q, idx) => {
      if (!q.questionText?.trim()) {
        errors[`q_${idx}_questionText`] = "Nội dung câu hỏi không được để trống";
      } else {
        if (titles.has(q.questionText.trim())) {
          errors[`q_${idx}_questionText`] = "Trùng lặp nội dung câu hỏi";
        }
        titles.add(q.questionText.trim());
      }
      
      if (q.maxScore < 0) {
        errors[`q_${idx}_maxScore`] = "Điểm không được âm";
      }

      if (q.type === "MULTIPLE_CHOICE") {
        if (!q.options || q.options.length < 2) {
          errors[`q_${idx}_options`] = "Phải có ít nhất 2 đáp án";
        } else {
          let hasCorrect = false;
          q.options.forEach((opt, oIdx) => {
            if (!opt.optionText.trim()) {
              errors[`q_${idx}_optionText_${oIdx}`] = "Đáp án không được để trống";
            }
            if (opt.isCorrect) hasCorrect = true;
          });
          if (!hasCorrect) {
            errors[`q_${idx}_options`] = "Phải có ít nhất 1 đáp án đúng";
          }
        }
      }

      if (q.type === "ESSAY") {
        if (!q.rubric?.criteria || q.rubric.criteria.length === 0) {
          errors[`q_${idx}_rubric`] = "Phải có ít nhất 1 tiêu chí chấm điểm";
        } else {
          q.rubric.criteria.forEach((crit, cIdx) => {
            if (!crit.name.trim()) {
              errors[`q_${idx}_criterionName_${cIdx}`] = "Tên tiêu chí không được trống";
            }
            if (crit.maxScore < 0) {
              errors[`q_${idx}_criterionScore_${cIdx}`] = "Điểm không được âm";
            }
          });
        }
      }
    });

    setValidationErrors(errors);
    return errors;
  };

  const scrollToError = (fieldPath: string) => {
    setShowValidationSummary(false);
    
    // Switch to edit mode if we are in preview
    if (mode !== "EDIT") setMode("EDIT");

    // fieldPath example: q_2_options or title
    setTimeout(() => {
      if (fieldPath.startsWith("q_")) {
        const parts = fieldPath.split("_");
        const idx = parseInt(parts[1], 10);
        // ensure question is expanded
        setExpandedQuestions(prev => ({ ...prev, [idx]: true }));
        
        setTimeout(() => {
          const el = document.getElementById(`question-${idx}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      } else {
        const el = document.getElementById(`field-${fieldPath}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setShowValidationSummary(true);
      return;
    }
    setError("");

    const calculatedScore = formData.questions?.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0) || 0;
    
    const payload = {
      ...formData,
      maxScore: calculatedScore,
      questions: formData.questions?.map((q, idx) => ({
        ...q,
        sortOrder: idx,
      })),
    };

    try {
      setIsLoading(true);
      if (isEditing) {
        await homeworkApi.updateTemplate(Number(id), payload);
        showToast("Cập nhật mẫu bài tập thành công", "success");
      } else {
        await homeworkApi.createTemplate(payload);
        showToast("Tạo mẫu bài tập thành công", "success");
      }
      setOriginalData(JSON.stringify(payload));
      navigate("/teacher/homework-templates");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi khi lưu mẫu bài tập");
    } finally {
      setIsLoading(false);
    }
  };

  // Question CRUD Handlers...
  const addQuestion = useCallback(() => {
    setFormData(prev => {
      const qLen = prev.questions?.length || 0;
      setExpandedQuestions(e => ({ ...e, [qLen]: true }));
      return {
        ...prev,
        questions: [
          ...(prev.questions || []),
          {
            type: "MULTIPLE_CHOICE" as HomeworkQuestionType,
            questionText: "",
            maxScore: 10,
            sortOrder: qLen,
            options: [
              { optionText: "", isCorrect: true, sortOrder: 0 },
              { optionText: "", isCorrect: false, sortOrder: 1 },
            ]
          }
        ]
      };
    });
  }, []);

  const updateQuestion = useCallback((index: number, updates: Partial<HomeworkQuestion>) => {
    setFormData(prev => {
      const qList = [...(prev.questions || [])];
      qList[index] = { ...qList[index], ...updates };
      const newMaxScore = qList.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0);
      return { ...prev, questions: qList, maxScore: newMaxScore };
    });
  }, []);

  const duplicateQuestion = useCallback((index: number) => {
    setFormData(prev => {
      const qList = [...(prev.questions || [])];
      const qToDuplicate = { ...qList[index] };
      qToDuplicate.questionText = qToDuplicate.questionText + " (Bản sao)";
      if (qToDuplicate.options) qToDuplicate.options = qToDuplicate.options.map(o => ({...o}));
      if (qToDuplicate.rubric) {
        qToDuplicate.rubric = { criteria: qToDuplicate.rubric.criteria?.map(c => ({...c})) || [] };
      }
      qList.splice(index + 1, 0, qToDuplicate);
      qList.forEach((q, i) => q.sortOrder = i);
      const newMaxScore = qList.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0);
      setExpandedQuestions(e => ({ ...e, [index + 1]: true }));
      return { ...prev, questions: qList, maxScore: newMaxScore };
    });
  }, []);

  const deleteQuestion = useCallback((index: number) => {
    setFormData(prev => {
      const qList = [...(prev.questions || [])];
      qList.splice(index, 1);
      qList.forEach((q, i) => q.sortOrder = i);
      const newMaxScore = qList.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0);
      return { ...prev, questions: qList, maxScore: newMaxScore };
    });
  }, []);

  const moveQuestion = useCallback((index: number, dir: -1 | 1) => {
    setFormData(prev => {
      const qList = [...(prev.questions || [])];
      if (index + dir < 0 || index + dir >= qList.length) return prev;
      const temp = qList[index];
      qList[index] = qList[index + dir];
      qList[index + dir] = temp;
      qList.forEach((q, i) => q.sortOrder = i);
      setExpandedQuestions(e => {
        const next = { ...e };
        const tempState = next[index];
        next[index] = next[index + dir];
        next[index + dir] = tempState;
        return next;
      });
      return { ...prev, questions: qList };
    });
  }, []);

  const moveQuestionUp = useCallback((index: number) => moveQuestion(index, -1), [moveQuestion]);
  const moveQuestionDown = useCallback((index: number) => moveQuestion(index, 1), [moveQuestion]);

  const toggleExpand = useCallback((index: number) => {
    setExpandedQuestions(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

  if (isLoading && isEditing && formData.title === "") {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <LoadingSkeleton count={1} height="h-32" />
        <LoadingSkeleton count={3} height="h-64" />
      </div>
    );
  }

  const calculatedTotalScore = formData.questions?.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0) || 0;

  return (
    <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 pb-20 pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Chỉnh sửa mẫu bài tập" : "Tạo mẫu bài tập mới"}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-gray-500">Biên soạn nội dung bài tập, câu hỏi và barem điểm.</p>
            {isEditing && (
              <>
                <span className="text-gray-300">•</span>
                <Badge variant={templateStatus === "ACTIVE" ? "success" : templateStatus === "ARCHIVED" ? "error" : "info"}>
                  {templateStatus === "ACTIVE" ? "Hoạt động" : templateStatus === "ARCHIVED" ? "Đã lưu trữ" : "Bản nháp"}
                </Badge>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setMode("EDIT")}
              className={`rounded-l-md border border-surface-border px-4 py-2 text-sm font-medium transition-colors ${mode === "EDIT" ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setMode("PREVIEW")}
              className={`rounded-r-md border border-l-0 border-surface-border px-4 py-2 text-sm font-medium transition-colors ${mode === "PREVIEW" ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              Xem thử
            </button>
          </div>
          <Button variant="secondary" onClick={() => navigate("/teacher/homework-templates")}>
            Hủy
          </Button>
          <Button onClick={handleSave} isLoading={isLoading}>
            Lưu mẫu (Ctrl+S)
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start">
        {/* LEFT NAV PANEL */}
        <div className="hidden lg:block w-64 flex-shrink-0 sticky top-24">
          <div className="rounded-card border border-surface-border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Chuyển hướng nhanh</h3>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <button
                onClick={() => scrollToError("title")}
                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-surface-hover rounded transition-colors"
              >
                Thông tin chung
              </button>
              {formData.questions?.map((q, idx) => {
                const hasErr = Object.keys(validationErrors).some(k => k.startsWith(`q_${idx}_`));
                return (
                  <button
                    key={idx}
                    onClick={() => scrollToError(`q_${idx}_`)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 text-xs text-gray-600 hover:bg-surface-hover rounded transition-colors"
                  >
                    <span className="truncate">Câu hỏi {idx + 1}</span>
                    {hasErr && <span className="h-2 w-2 rounded-full bg-red-500"></span>}
                  </button>
                );
              })}
            </div>
            {mode === "EDIT" && (
              <Button size="sm" className="w-full mt-4" onClick={addQuestion}>+ Thêm câu hỏi</Button>
            )}
          </div>
        </div>

        {/* CENTER MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          {mode === "PREVIEW" ? (
            <TemplatePreview data={formData} />
          ) : (
            <div className="space-y-6">
              {/* General Info */}
              <section id="field-title" className="rounded-card border border-surface-border bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Thông tin chung</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Tiêu đề *</label>
                    <input
                      type="text"
                      className={`w-full rounded-input border ${validationErrors.title ? "border-red-300" : "border-surface-border"} bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary`}
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="VD: Bài tập cuối kỳ..."
                    />
                    {validationErrors.title && <p className="text-xs text-red-500">{validationErrors.title}</p>}
                  </div>
                  
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Mô tả / Hướng dẫn chung</label>
                    <textarea
                      className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
                      value={formData.instructions || formData.description}
                      onChange={e => setFormData({ ...formData, instructions: e.target.value, description: e.target.value })}
                      rows={3}
                      placeholder="Nhập hướng dẫn làm bài cho học sinh..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Loại bài tập</label>
                    <select
                      className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
                      value={formData.homeworkType}
                      onChange={e => setFormData({ ...formData, homeworkType: e.target.value as HomeworkType })}
                    >
                      <option value="QUIZ">Trắc nghiệm</option>
                      <option value="ESSAY">Tự luận</option>
                      <option value="MIXED">Hỗn hợp</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Độ khó</label>
                    <select
                      className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
                      value={formData.difficulty}
                      onChange={e => setFormData({ ...formData, difficulty: e.target.value as HomeworkDifficulty })}
                    >
                      <option value="EASY">Dễ</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HARD">Khó</option>
                    </select>
                  </div>

                  <div id="field-estimatedTime" className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Thời gian làm bài (Phút)</label>
                    <input
                      type="number"
                      min={0}
                      className={`w-full rounded-input border ${validationErrors.estimatedTime ? "border-red-300" : "border-surface-border"} bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary`}
                      value={formData.estimatedTime}
                      onChange={e => setFormData({ ...formData, estimatedTime: Number(e.target.value) })}
                    />
                    {validationErrors.estimatedTime && <p className="text-xs text-red-500">{validationErrors.estimatedTime}</p>}
                  </div>
                </div>
              </section>

              {/* Questions */}
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Danh sách câu hỏi
                  </h2>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => {
                      const ex: Record<number, boolean> = {};
                      formData.questions?.forEach((_, i) => ex[i] = true);
                      setExpandedQuestions(ex);
                    }}>Mở tất cả</Button>
                    <Button size="sm" variant="secondary" onClick={() => setExpandedQuestions({})}>Thu gọn</Button>
                  </div>
                </div>

                {formData.questions?.length === 0 ? (
                  <div className="rounded-card border border-dashed border-surface-border bg-surface-page py-12 text-center text-sm text-gray-500">
                    Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.questions?.map((q, idx) => {
                      const qErrors = Object.keys(validationErrors)
                        .filter(k => k.startsWith(`q_${idx}_`))
                        .reduce((acc, k) => ({ ...acc, [k.replace(`q_${idx}_`, "")]: validationErrors[k] }), {});

                      return (
                        <div id={`question-${idx}`} key={idx}>
                          <QuestionCard
                            index={idx}
                            total={formData.questions?.length || 0}
                            question={q}
                            isExpanded={!!expandedQuestions[idx]}
                            onUpdate={updateQuestion}
                            onDuplicate={duplicateQuestion}
                            onDelete={deleteQuestion}
                            onMoveUp={moveQuestionUp}
                            onMoveDown={moveQuestionDown}
                            onToggleExpand={toggleExpand}
                            errors={qErrors}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* RIGHT SUMMARY PANEL */}
        <div className="hidden lg:block w-72 flex-shrink-0 sticky top-24">
          <div className="rounded-card border border-surface-border bg-white p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-surface-border pb-2">Tổng quan mẫu</h3>
            
            <div className="space-y-3">
              {isEditing && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Phiên bản</span>
                  <span className="font-medium text-gray-900">v{templateVersion}</span>
                </div>
              )}
              {parentTemplateId && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Tạo từ</span>
                  <span className="font-medium text-blue-600">Mẫu #{parentTemplateId}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Số câu hỏi</span>
                <span className="font-medium text-gray-900">{formData.questions?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Tổng điểm</span>
                <span className="font-semibold text-primary">{calculatedTotalScore}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Thời gian (phút)</span>
                <span className="font-medium text-gray-900">{formData.estimatedTime || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Summary Modal */}
      {showValidationSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-card bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Không thể lưu mẫu
            </h3>
            <p className="text-sm text-gray-600 mb-4">Vui lòng sửa các lỗi sau trước khi lưu:</p>
            <div className="max-h-64 overflow-y-auto space-y-2 rounded border border-surface-border bg-surface-page p-3">
              {Object.entries(validationErrors).map(([key, msg]) => {
                let displayKey = "Thông tin chung";
                if (key.startsWith("q_")) {
                  const idx = parseInt(key.split("_")[1], 10);
                  displayKey = `Câu hỏi ${idx + 1}`;
                }
                return (
                  <button
                    key={key}
                    onClick={() => scrollToError(key)}
                    className="w-full text-left text-sm text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors flex items-start gap-2"
                  >
                    <span>•</span>
                    <span><strong>{displayKey}:</strong> {msg}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowValidationSummary(false)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
