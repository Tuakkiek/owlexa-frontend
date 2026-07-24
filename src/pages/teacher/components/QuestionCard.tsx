import { memo } from "react";
import { Button } from "../../../components/ui/Button";
import type { HomeworkQuestion, HomeworkQuestionType, HomeworkQuestionOption, HomeworkRubricCriterion } from "../../../types/homework";

interface QuestionCardProps {
  index: number;
  total: number;
  question: HomeworkQuestion;
  isExpanded: boolean;
  onUpdate: (index: number, updates: Partial<HomeworkQuestion>) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleExpand: (index: number) => void;
  errors?: Record<string, string>; // mapping from field path to error message
}

export const QuestionCard = memo(function QuestionCard({
  index,
  total,
  question,
  isExpanded,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onToggleExpand,
  errors = {},
}: QuestionCardProps) {
  
  // Option handlers
  const addOption = () => {
    const newOpts = [...(question.options || [])];
    newOpts.push({ optionText: "", isCorrect: false, sortOrder: newOpts.length });
    onUpdate(index, { options: newOpts });
  };

  const updateOption = (optIdx: number, updates: Partial<HomeworkQuestionOption>) => {
    const newOpts = [...(question.options || [])];
    newOpts[optIdx] = { ...newOpts[optIdx], ...updates };
    onUpdate(index, { options: newOpts });
  };

  const deleteOption = (optIdx: number) => {
    const newOpts = [...(question.options || [])];
    newOpts.splice(optIdx, 1);
    onUpdate(index, { options: newOpts });
  };

  const moveOption = (optIdx: number, dir: -1 | 1) => {
    if (optIdx + dir < 0 || optIdx + dir >= (question.options?.length || 0)) return;
    const newOpts = [...(question.options || [])];
    const temp = newOpts[optIdx];
    newOpts[optIdx] = newOpts[optIdx + dir];
    newOpts[optIdx + dir] = temp;
    // Re-calculate sortOrder just in case
    newOpts.forEach((o, i) => o.sortOrder = i);
    onUpdate(index, { options: newOpts });
  };

  const markCorrect = (optIdx: number) => {
    const newOpts = question.options?.map((o, i) => ({ ...o, isCorrect: i === optIdx }));
    onUpdate(index, { options: newOpts });
  };

  // Rubric handlers
  const addCriterion = () => {
    const newCrit = [...(question.rubric?.criteria || [])];
    newCrit.push({ name: "", maxScore: 0, sortOrder: newCrit.length });
    onUpdate(index, { rubric: { criteria: newCrit } });
  };

  const updateCriterion = (cIdx: number, updates: Partial<HomeworkRubricCriterion>) => {
    const newCrit = [...(question.rubric?.criteria || [])];
    newCrit[cIdx] = { ...newCrit[cIdx], ...updates };
    // Auto sync max score of question with criteria total
    const totalScore = newCrit.reduce((sum, c) => sum + (Number(c.maxScore) || 0), 0);
    onUpdate(index, { rubric: { criteria: newCrit }, maxScore: totalScore });
  };

  const deleteCriterion = (cIdx: number) => {
    const newCrit = [...(question.rubric?.criteria || [])];
    newCrit.splice(cIdx, 1);
    const totalScore = newCrit.reduce((sum, c) => sum + (Number(c.maxScore) || 0), 0);
    onUpdate(index, { rubric: { criteria: newCrit }, maxScore: totalScore });
  };

  const moveCriterion = (cIdx: number, dir: -1 | 1) => {
    const newCrit = [...(question.rubric?.criteria || [])];
    if (cIdx + dir < 0 || cIdx + dir >= newCrit.length) return;
    const temp = newCrit[cIdx];
    newCrit[cIdx] = newCrit[cIdx + dir];
    newCrit[cIdx + dir] = temp;
    newCrit.forEach((c, i) => c.sortOrder = i);
    onUpdate(index, { rubric: { criteria: newCrit } });
  };

  return (
    <div className={`rounded-card border ${errors.questionText ? "border-red-300" : "border-surface-border"} bg-white shadow-sm overflow-hidden`}>
      {/* Header / Summary */}
      <div className="flex items-center justify-between bg-surface-page px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => onToggleExpand(index)}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {question.type === "MULTIPLE_CHOICE" ? "Trắc nghiệm" : question.type === "ESSAY" ? "Tự luận" : "Nộp tệp"}
          </span>
          <span className="text-xs text-gray-500 truncate max-w-sm">
            {question.questionText ? question.questionText : "(Chưa có nội dung)"}
          </span>
          <span className="text-xs font-semibold text-gray-700 ml-auto mr-4">
            {question.maxScore} điểm
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMoveUp(index)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Lên">
            ↑
          </button>
          <button onClick={() => onMoveDown(index)} disabled={index === total - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Xuống">
            ↓
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          <button onClick={() => onDuplicate(index)} className="p-1 text-blue-500 hover:text-blue-700" title="Nhân bản">
            ⎘
          </button>
          <button onClick={() => onDelete(index)} className="p-1 text-red-500 hover:text-red-700" title="Xóa">
            ×
          </button>
          <button onClick={() => onToggleExpand(index)} className="p-1 text-gray-500 ml-2">
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-gray-700">Nội dung câu hỏi</label>
              <textarea
                className={`w-full rounded-input border ${errors.questionText ? "border-red-300" : "border-surface-border"} bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary`}
                value={question.questionText}
                onChange={(e) => onUpdate(index, { questionText: e.target.value })}
                placeholder="Nhập nội dung..."
                rows={3}
              />
              {errors.questionText && <p className="text-xs text-red-500">{errors.questionText}</p>}
            </div>
            <div className="w-48 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Loại</label>
                <select
                  className="w-full rounded-md border border-surface-border bg-white px-2 py-1.5 text-sm text-gray-700 outline-none"
                  value={question.type}
                  onChange={(e) => onUpdate(index, { type: e.target.value as HomeworkQuestionType })}
                >
                  <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                  <option value="ESSAY">Tự luận</option>
                  <option value="FILE_UPLOAD">Nộp tệp</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Điểm tối đa</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  disabled={question.type === "ESSAY"} // Essay derives from rubric
                  className={`w-full rounded-md border ${errors.maxScore ? "border-red-300" : "border-surface-border"} bg-gray-50 px-2 py-1.5 text-sm outline-none`}
                  value={question.maxScore}
                  onChange={(e) => onUpdate(index, { maxScore: Number(e.target.value) })}
                />
                {errors.maxScore && <p className="text-xs text-red-500">{errors.maxScore}</p>}
                {question.type === "ESSAY" && <p className="text-[10px] text-gray-400">Tự động tính từ tiêu chí</p>}
              </div>
            </div>
          </div>

          {/* Options (If Multiple Choice) */}
          {question.type === "MULTIPLE_CHOICE" && (
            <div className="rounded-card bg-surface-page p-4 space-y-3">
              <p className="text-xs font-medium text-gray-700">Các đáp án (Chọn đáp án đúng)</p>
              {errors.options && <p className="text-xs text-red-500">{errors.options}</p>}
              {question.options?.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button onClick={() => moveOption(optIdx, -1)} disabled={optIdx === 0} className="text-[10px] text-gray-400 disabled:opacity-30">▲</button>
                    <button onClick={() => moveOption(optIdx, 1)} disabled={optIdx === (question.options?.length || 0) - 1} className="text-[10px] text-gray-400 disabled:opacity-30">▼</button>
                  </div>
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={opt.isCorrect}
                    onChange={() => markCorrect(optIdx)}
                    className="h-4 w-4 text-primary"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      className={`w-full rounded-input border ${errors[`optionText_${optIdx}`] ? "border-red-300" : "border-surface-border"} bg-white px-3 py-1.5 text-sm text-gray-900 outline-none`}
                      value={opt.optionText}
                      onChange={(e) => updateOption(optIdx, { optionText: e.target.value })}
                      placeholder={`Đáp án ${optIdx + 1}`}
                    />
                    {errors[`optionText_${optIdx}`] && <p className="text-xs text-red-500 mt-1">{errors[`optionText_${optIdx}`]}</p>}
                  </div>
                  <button onClick={() => deleteOption(optIdx)} className="text-gray-400 hover:text-red-500 px-2">×</button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={addOption}>
                + Thêm đáp án
              </Button>
            </div>
          )}

          {/* Rubrics (If Essay) */}
          {question.type === "ESSAY" && (
            <div className="rounded-card bg-surface-page p-4 space-y-3">
              <p className="text-xs font-medium text-gray-700">Tiêu chí chấm điểm (Barem)</p>
              {errors.rubric && <p className="text-xs text-red-500">{errors.rubric}</p>}
              {question.rubric?.criteria?.map((c, cIdx) => (
                <div key={cIdx} className="flex items-start gap-2 bg-white p-2 rounded border border-surface-border">
                  <div className="flex flex-col mt-1">
                    <button onClick={() => moveCriterion(cIdx, -1)} disabled={cIdx === 0} className="text-[10px] text-gray-400 disabled:opacity-30">▲</button>
                    <button onClick={() => moveCriterion(cIdx, 1)} disabled={cIdx === (question.rubric?.criteria?.length || 0) - 1} className="text-[10px] text-gray-400 disabled:opacity-30">▼</button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      className={`w-full rounded-input border ${errors[`criterionName_${cIdx}`] ? "border-red-300" : "border-surface-border"} bg-white px-3 py-1.5 text-sm outline-none`}
                      value={c.name}
                      onChange={(e) => updateCriterion(cIdx, { name: e.target.value })}
                      placeholder="Tên tiêu chí..."
                    />
                    {errors[`criterionName_${cIdx}`] && <p className="text-xs text-red-500">{errors[`criterionName_${cIdx}`]}</p>}
                    <textarea
                      className="w-full rounded-input border border-surface-border bg-white px-3 py-1.5 text-xs outline-none"
                      value={c.description || ""}
                      onChange={(e) => updateCriterion(cIdx, { description: e.target.value })}
                      placeholder="Mô tả chi tiết..."
                      rows={2}
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      className={`w-full rounded-input border ${errors[`criterionScore_${cIdx}`] ? "border-red-300" : "border-surface-border"} bg-white px-2 py-1.5 text-sm outline-none`}
                      value={c.maxScore}
                      onChange={(e) => updateCriterion(cIdx, { maxScore: Number(e.target.value) })}
                      placeholder="Điểm"
                    />
                  </div>
                  <button onClick={() => deleteCriterion(cIdx)} className="text-gray-400 hover:text-red-500 px-2 mt-1">×</button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={addCriterion}>
                + Thêm tiêu chí
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
