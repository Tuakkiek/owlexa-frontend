import { useEffect, useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { questionBankApi } from "../../../api/questionBankApi";
import type { QuestionResponse } from "../../../types/questionBank";
import { editorDocumentToPlainText } from "../types";

export const AssessmentQuestionNodeView = (props: NodeViewProps) => {
  const { node, updateAttributes, deleteNode, editor } = props;
  const questionId: number | null = node.attrs.questionId;
  const points: number | null = node.attrs.points;

  const [question, setQuestion] = useState<QuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditable = editor.isEditable;

  useEffect(() => {
    if (!questionId) return;
    let isMounted = true;
    setLoading(true);
    setError("");

    questionBankApi
      .findById(questionId)
      .then((data) => {
        if (isMounted) {
          setQuestion(data);
          if (points == null && data.points != null) {
            updateAttributes({ points: data.points });
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(`Không thể tải thông tin câu hỏi #${questionId}`);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [questionId, points, updateAttributes]);

  const previewText = question
    ? editorDocumentToPlainText(question.content) || "Không có nội dung văn bản"
    : "";

  return (
    <NodeViewWrapper className="owlexa-question-node-wrapper my-4">
      <div
        contentEditable={false}
        className="rounded-card border-2 border-primary/20 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 px-2.5 items-center justify-center rounded-md bg-primary text-xs font-bold text-white shadow-xs">
              Câu hỏi #{questionId}
            </span>
            {question && (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 shadow-xs border border-gray-200">
                {question.type === "MULTIPLE_CHOICE" ? "Trắc nghiệm" : "Tự luận"}
              </span>
            )}
            {question?.sectionCode && (
              <span className="text-xs text-gray-500">
                Section: {question.sectionCode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-gray-600">Điểm:</label>
              {isEditable ? (
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={points ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    updateAttributes({ points: val });
                  }}
                  className="w-20 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs focus:border-primary focus:outline-none"
                  placeholder="Điểm"
                />
              ) : (
                <span className="text-xs font-bold text-primary">
                  {points ?? question?.points ?? "-"} điểm
                </span>
              )}
            </div>

            {isEditable && (
              <button
                type="button"
                onClick={deleteNode}
                className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Xóa câu hỏi khỏi block"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-2 text-xs text-gray-400 animate-pulse">
            Đang tải chi tiết câu hỏi...
          </div>
        ) : error ? (
          <div className="text-xs text-red-500">{error}</div>
        ) : (
          <div className="space-y-3">
            {previewText && (
              <div className="text-sm font-medium text-gray-800">
                {previewText}
              </div>
            )}
            {question?.type === "MULTIPLE_CHOICE" && question.options && question.options.length > 0 && (
              <div className="grid grid-cols-1 gap-1.5 pt-1 sm:grid-cols-2">
                {question.options
                  .slice()
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((option, index) => (
                    <div
                      key={option.id ?? index}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs bg-white shadow-2xs ${
                        option.isCorrect
                          ? "border-emerald-300 bg-emerald-50/60 font-semibold text-emerald-900"
                          : "border-gray-200 text-gray-700"
                      }`}
                    >
                      <span className="font-bold text-gray-500">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="flex-1 min-w-0 break-words">
                        {option.content.replace(/<[^>]*>/g, "") || "-"}
                      </span>
                      {option.isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Đúng
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
