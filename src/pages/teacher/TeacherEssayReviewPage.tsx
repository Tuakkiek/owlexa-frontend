import { useEffect, useState, useCallback, useMemo } from "react";
import { classApi } from "../../api/classApi";
import essayApi from "../../api/essayApi";
import type { ClassResponse } from "../../types/class";
import type { EssaySubmission } from "../../types/essay";

const TeacherEssayReviewPage = () => {
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [essays, setEssays] = useState<EssaySubmission[]>([]);
  const [, setIsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedEssayId, setSelectedEssayId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const teacherClasses = await classApi.findMyClasses();
      setClasses(teacherClasses);
      setSelectedClassId((current) => current ?? teacherClasses[0]?.id ?? null);
    } catch (error) {
      console.error("Failed to load classes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load essays for selected class
  useEffect(() => {
    if (!selectedClassId) return;

    const loadEssays = async () => {
      try {
        const data = await essayApi.getEssaysToReview(selectedClassId);
        setEssays(data);
      } catch (error) {
        console.error("Failed to load essays:", error);
      }
    };

    loadEssays();
  }, [selectedClassId]);

  const gradedEssays = useMemo(
    () => essays.filter((e) => e.status === "GRADED"),
    [essays],
  );
  const submittedEssays = useMemo(
    () => essays.filter((e) => e.status === "SUBMITTED"),
    [essays],
  );

  const selectedEssay = essays.find((e) => e.id === selectedEssayId);

  const handleAddFeedback = async (essayId: number) => {
    if (!feedback.trim()) {
      alert("Vui lòng nhập nhận xét");
      return;
    }

    try {
      setIsSubmitting(true);
      await essayApi.addManualFeedback(essayId, feedback);
      alert("Thêm nhận xét thành công");
      setFeedback("");
      setSelectedEssayId(null);
      // Reload essays
      if (selectedClassId) {
        const data = await essayApi.getEssaysToReview(selectedClassId);
        setEssays(data);
      }
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Thêm nhận xét thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Xem xét bài Essay
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Thêm nhận xét cho các bài đã chấm
          </p>
        </div>
      </div>

      {/* Class Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-medium transition ${
              selectedClassId === cls.id
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {cls.name}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Essays List */}
        <div className="lg:col-span-1 space-y-4">
          {submittedEssays.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                Đợi xem xét ({submittedEssays.length})
              </p>
              <div className="space-y-2">
                {submittedEssays.map((essay) => (
                  <button
                    key={essay.id}
                    onClick={() => setSelectedEssayId(essay.id)}
                    className={`w-full text-left rounded-2xl border-2 p-3 transition ${
                      selectedEssayId === essay.id
                        ? "border-black bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {essay.studentFullName}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Chưa có nhận xét
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {gradedEssays.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                Đã xem xét ({gradedEssays.length})
              </p>
              <div className="space-y-2">
                {gradedEssays.map((essay) => (
                  <button
                    key={essay.id}
                    onClick={() => setSelectedEssayId(essay.id)}
                    className={`w-full text-left rounded-2xl border-2 p-3 transition ${
                      selectedEssayId === essay.id
                        ? "border-black bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {essay.studentFullName}
                    </p>
                    <p className="text-xs text-green-600 mt-1">✓ Có nhận xét</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {submittedEssays.length === 0 && gradedEssays.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500 text-sm">
              Chưa có bài essay nào
            </div>
          )}
        </div>

        {/* Essay Viewer */}
        <div className="lg:col-span-2">
          {selectedEssay ? (
            <div className="space-y-4">
              {/* Essay Info */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">
                      Bài của {selectedEssay.studentFullName}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">
                      {selectedEssay.rubricTitle}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedEssay.status === "REVIEWED"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {selectedEssay.status === "REVIEWED"
                      ? "✓ Đã xem"
                      : "Đợi xem"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Nộp lúc:{" "}
                  {new Date(
                    selectedEssay.submittedAt || selectedEssay.createdAt,
                  ).toLocaleString("vi-VN")}
                </p>
              </div>

              {/* Content */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-3">
                  Nội dung bài viết
                </p>
                <div className="rounded-lg bg-gray-50 p-4 min-h-48 max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedEssay.content}
                  </p>
                </div>
              </div>

              {/* Feedback Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddFeedback(selectedEssay.id);
                }}
                className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4"
              >
                <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                  Thêm nhận xét
                </p>
                <textarea
                  placeholder="Nhập nhận xét chi tiết cho bài viết..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black min-h-32"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !feedback.trim()}
                  className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi nhận xét"}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-gray-600">Chọn bài để xem và thêm nhận xét</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherEssayReviewPage;
