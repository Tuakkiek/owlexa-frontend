import { useEffect, useState, useCallback, useMemo } from "react";
import axiosClient from "../../api/axiosClient";
import type { ClassResponse } from "../../types/class";

interface EssayRubric {
  id: number;
  classId: number;
  className: string;
  title: string;
  description: string;
  maxScore: number;
  criteria: RubricCriterion[];
  createdAt: string;
  isActive: boolean;
}

interface RubricCriterion {
  id: number;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

const TeacherEssayRubricsPage = () => {
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [rubrics, setRubrics] = useState<EssayRubric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maxScore: 10,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [classesRes, rubricsRes] = await Promise.all([
        axiosClient.get<ClassResponse[]>("/teacher/classes/me"),
        axiosClient.get<EssayRubric[]>("/teacher/essay-rubrics/me"),
      ]);
      setClasses(classesRes.data ?? []);
      setRubrics(rubricsRes.data ?? []);
      if (classesRes.data && classesRes.data.length > 0 && !selectedClassId) {
        setSelectedClassId(classesRes.data[0].id);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedClassRubrics = useMemo(
    () => rubrics.filter((r) => r.classId === selectedClassId),
    [rubrics, selectedClassId],
  );

  const handleCreateRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !formData.title) {
      alert("Vui lòng điền đủ thông tin");
      return;
    }

    try {
      await axiosClient.post("/teacher/essay-rubrics", {
        classId: selectedClassId,
        ...formData,
        criteria: [
          {
            name: "Content & Ideas",
            description: "Nội dung, ý tưởng, triển khai ý chính",
            weight: 0.4,
            maxScore: 4,
          },
          {
            name: "Organization",
            description: "Cấu trúc bài, tổ chức ý tưởng hợp lý",
            weight: 0.25,
            maxScore: 2.5,
          },
          {
            name: "Language Use",
            description: "Ngữ pháp, từ vựng, độc lập thành câu",
            weight: 0.25,
            maxScore: 2.5,
          },
          {
            name: "Mechanics",
            description: "Chính tả, dấu câu",
            weight: 0.1,
            maxScore: 1,
          },
        ],
      });
      alert("Tạo rubric thành công");
      setFormData({ title: "", description: "", maxScore: 10 });
      setIsCreating(false);
      loadData();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Tạo rubric thất bại");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Rubric chấm Essay
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo tiêu chí chấm bài essay cho từng lớp
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
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

      {/* Create Rubric Form */}
      {isCreating ? (
        <form
          onSubmit={handleCreateRubric}
          className="rounded-3xl border border-gray-200 bg-white p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-900">Tạo rubric mới</h3>

          <input
            type="text"
            placeholder="Tên rubric (ví dụ: Essay chủ đề 'My Dream')"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none focus:border-black"
            required
          />

          <textarea
            placeholder="Mô tả chi tiết rubric để AI có thể hiểu rõ cách chấm..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none focus:border-black min-h-[100px]"
            rows={4}
          />

          <div>
            <label className="text-sm font-medium text-gray-700">
              Điểm tối đa
            </label>
            <input
              type="number"
              value={formData.maxScore}
              onChange={(e) =>
                setFormData({ ...formData, maxScore: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none focus:border-black mt-1"
              min={1}
              max={100}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium">ℹ️ Hệ thống rubric mặc định:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>
                • <strong>Content & Ideas</strong> (40%): Nội dung, triển khai ý
                chính
              </li>
              <li>
                • <strong>Organization</strong> (25%): Cấu trúc, tổ chức bài
              </li>
              <li>
                • <strong>Language Use</strong> (25%): Ngữ pháp, từ vựng
              </li>
              <li>
                • <strong>Mechanics</strong> (10%): Chính tả, dấu câu
              </li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              Tạo rubric
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setFormData({ title: "", description: "", maxScore: 10 });
              }}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Huỷ
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center hover:border-gray-400 transition"
        >
          <p className="text-2xl mb-2">+</p>
          <p className="text-sm font-medium text-gray-700">
            Tạo rubric mới cho lớp này
          </p>
        </button>
      )}

      {/* Rubrics List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))
        ) : selectedClassRubrics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-600">Chưa có rubric nào cho lớp này.</p>
          </div>
        ) : (
          selectedClassRubrics.map((rubric) => (
            <div
              key={rubric.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {rubric.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {rubric.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {rubric.maxScore} điểm
                  </p>
                  {rubric.isActive && (
                    <p className="text-xs text-green-600 mt-1">✓ Đang dùng</p>
                  )}
                </div>
              </div>

              {/* Criteria */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                {rubric.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {criterion.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {criterion.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {criterion.maxScore}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(criterion.weight * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Tạo lúc:{" "}
                {new Date(rubric.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherEssayRubricsPage;
