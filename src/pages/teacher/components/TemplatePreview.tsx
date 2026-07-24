import type { TeacherHomeworkTemplateSaveRequest } from "../../../types/homework";

interface TemplatePreviewProps {
  data: TeacherHomeworkTemplateSaveRequest;
}

export function TemplatePreview({ data }: TemplatePreviewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-card border border-surface-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{data.title || "Chưa có tiêu đề"}</h1>
        {data.description && <p className="mt-2 text-sm text-gray-600">{data.description}</p>}
        {data.instructions && (
          <div className="mt-4 rounded bg-surface-page p-4 text-sm text-gray-700">
            <strong>Hướng dẫn:</strong> {data.instructions}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {data.questions?.map((q, idx) => (
          <div key={idx} className="rounded-card border border-surface-border bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{q.questionText}</p>
                  <span className="flex-shrink-0 text-xs font-semibold text-gray-500">{q.maxScore} điểm</span>
                </div>

                {q.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2">
                    {q.options?.map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center gap-3 rounded border border-surface-border p-3 cursor-pointer hover:bg-surface-hover">
                        <input type="radio" disabled name={`preview-q-${idx}`} className="h-4 w-4 text-primary" />
                        <span className="text-sm text-gray-700">{opt.optionText}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "ESSAY" && (
                  <textarea
                    disabled
                    className="w-full rounded-input border border-surface-border bg-surface-page px-3 py-2 text-sm text-gray-500"
                    rows={4}
                    placeholder="Học sinh sẽ nhập câu trả lời tự luận tại đây..."
                  />
                )}

                {q.type === "FILE_UPLOAD" && (
                  <div className="flex flex-col items-center justify-center rounded border border-dashed border-surface-border bg-surface-page py-6 text-gray-400">
                    <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm">Học sinh sẽ tải tệp lên tại đây</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!data.questions || data.questions.length === 0) && (
          <div className="text-center py-10 text-gray-500 text-sm">
            Mẫu bài tập chưa có câu hỏi nào.
          </div>
        )}
      </div>
    </div>
  );
}
