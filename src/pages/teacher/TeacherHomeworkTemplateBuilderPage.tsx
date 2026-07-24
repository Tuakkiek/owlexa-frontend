import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import homeworkApi from "../../api/homeworkApi";
import { Button } from "../../components/ui/Button";
import { PageHeader, ErrorBanner, LoadingSkeleton } from "../../components/ui/SharedComponents";
import { useToast } from "../../components/ui/Toast";

export default function TeacherHomeworkTemplateBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const isEditing = id && id !== "new";
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [homeworkType, setHomeworkType] = useState<"QUIZ" | "ESSAY" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedTime, setEstimatedTime] = useState<number>(30);
  
  // Essay specific
  const [essayPrompt, setEssayPrompt] = useState("");
  const [gradingCriteriaId, setGradingCriteriaId] = useState<number | "">("");
  const [criteriaList, setCriteriaList] = useState<any[]>([]);

  // Quiz specific
  const [questionsJson, setQuestionsJson] = useState("");
  const [showSample, setShowSample] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadTemplate();
    }
    loadCriteriaList();
  }, [id]);

  const loadCriteriaList = async () => {
    try {
      const data = await homeworkApi.getGradingCriteriaList();
      setCriteriaList(data.content || []);
    } catch (e) {
      console.error("Failed to load criteria list", e);
    }
  };

  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      const library = await homeworkApi.getTemplateLibrary();
      const template = library.find(t => t.id === Number(id));
      if (template) {
        setTitle(template.title);
        setDescription(template.description || "");
        setHomeworkType(template.homeworkType === "QUIZ" || template.homeworkType === "ESSAY" ? template.homeworkType : null);
        setEstimatedTime(template.estimatedTime || 30);
        
        if (template.homeworkType === "ESSAY") {
          setEssayPrompt(template.instructions || "");
          // Ideally gradingCriteriaId would be returned from API
          // For MVP we just load it if available
          setGradingCriteriaId(template.gradingCriteriaId || "");
        } else if (template.homeworkType === "QUIZ") {
          // Editing Quiz JSON is harder if we don't have the original JSON
          // In a real MVP we might just fetch the questions and reconstruct JSON, but for now we leave it empty to re-paste
          setQuestionsJson("");
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

  const handleSave = async () => {
    if (!title.trim()) {
      showToast("Vui lòng nhập tiêu đề", "error");
      return;
    }

    if (homeworkType === "ESSAY" && !essayPrompt.trim()) {
      showToast("Vui lòng nhập đề bài Essay", "error");
      return;
    }

    if (homeworkType === "ESSAY" && !gradingCriteriaId) {
      showToast("Vui lòng chọn tiêu chí chấm bài", "error");
      return;
    }

    if (homeworkType === "QUIZ" && !questionsJson.trim() && !isEditing) {
      showToast("Vui lòng dán JSON câu hỏi", "error");
      return;
    }

    const payload: any = {
      title,
      description,
      homeworkType,
      estimatedTime,
      difficulty: "MEDIUM",
      maxScore: 100, // MVP default
      instructions: homeworkType === "ESSAY" ? essayPrompt : "",
      gradingCriteriaId: homeworkType === "ESSAY" ? Number(gradingCriteriaId) : null,
      questionsJson: homeworkType === "QUIZ" ? questionsJson : null,
    };

    try {
      setIsSaving(true);
      if (isEditing) {
        await homeworkApi.updateTemplate(Number(id), payload);
        showToast("Cập nhật mẫu bài tập thành công", "success");
      } else {
        await homeworkApi.createTemplate(payload);
        showToast("Tạo mẫu bài tập thành công", "success");
      }
      navigate("/teacher/homework-templates");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Lỗi khi lưu mẫu bài tập", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const sampleJson = `{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correctAnswer": 1
    },
    {
      "question": "2 + 2 = ?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1
    }
  ]
}`;

  if (isLoading && isEditing && title === "") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <LoadingSkeleton count={3} height="h-32" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20 pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title={isEditing ? "Chỉnh sửa Đề thi" : "Tạo Đề thi mới"} />
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate("/teacher/homework-templates")}>
            Hủy
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={!homeworkType}>
            Lưu Đề thi
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {!homeworkType ? (
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Chọn loại đề thi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <button
              onClick={() => setHomeworkType("QUIZ")}
              className="flex flex-col items-center justify-center p-8 border-2 border-surface-border rounded-xl bg-white hover:border-primary hover:bg-primary-light transition-all cursor-pointer"
            >
              <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Multiple Choice Quiz</h3>
              <p className="text-sm text-gray-500 text-center mt-2">Đề thi trắc nghiệm tạo từ JSON</p>
            </button>
            <button
              onClick={() => setHomeworkType("ESSAY")}
              className="flex flex-col items-center justify-center p-8 border-2 border-surface-border rounded-xl bg-white hover:border-primary hover:bg-primary-light transition-all cursor-pointer"
            >
              <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Essay</h3>
              <p className="text-sm text-gray-500 text-center mt-2">Đề thi tự luận với AI Scoring</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setHomeworkType(null)}>
              Đổi loại đề
            </Button>
          </div>

          <div className="rounded-card border border-surface-border bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-surface-border pb-2 mb-4">Thông tin cơ bản</h2>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Tiêu đề *</label>
              <input
                type="text"
                className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Đề kiểm tra 15 phút..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Mô tả (Optional)</label>
              <textarea
                className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Nhập mô tả..."
              />
            </div>
          </div>

          {homeworkType === "QUIZ" && (
            <div className="rounded-card border border-surface-border bg-white p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-surface-border pb-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Questions (JSON)</h2>
                <Button size="sm" variant="secondary" onClick={() => setShowSample(!showSample)}>
                  {showSample ? "Ẩn JSON Mẫu" : "Xem JSON Mẫu"}
                </Button>
              </div>

              {showSample && (
                <div className="bg-gray-800 text-gray-200 p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                  {sampleJson}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Dán JSON chứa câu hỏi *</label>
                <textarea
                  className="w-full h-64 rounded-input border border-surface-border bg-white px-3 py-2 text-sm outline-none font-mono focus:border-primary"
                  value={questionsJson}
                  onChange={e => setQuestionsJson(e.target.value)}
                  placeholder={'{\n  "questions": [\n    ...\n  ]\n}'}
                />
                <p className="text-xs text-gray-500 mt-1">Backend sẽ parse chuỗi JSON này để tạo toàn bộ câu hỏi. Không cần giao diện kéo thả.</p>
              </div>
            </div>
          )}

          {homeworkType === "ESSAY" && (
            <div className="rounded-card border border-surface-border bg-white p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 border-b border-surface-border pb-2 mb-4">Essay Prompt</h2>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Đề bài (Rich Text) *</label>
                  {/* Using standard textarea for MVP to emulate Rich Text editor quickly without setting up Tiptap dependency locally */}
                  <textarea
                    className="w-full h-40 rounded-input border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    value={essayPrompt}
                    onChange={e => setEssayPrompt(e.target.value)}
                    placeholder="Write an essay about the advantages and disadvantages of online learning..."
                  />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 border-b border-surface-border pb-2 mb-4">Select Grading Criteria</h2>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Tiêu chí chấm bài *</label>
                  <select
                    className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    value={gradingCriteriaId}
                    onChange={e => setGradingCriteriaId(Number(e.target.value))}
                  >
                    <option value="">-- Chọn tiêu chí chấm bài --</option>
                    {criteriaList.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Tiêu chí này sẽ được gửi kèm bài làm của học sinh sang DeepSeek AI để chấm tự động.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
