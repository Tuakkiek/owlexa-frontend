import { useEffect, useState, useCallback } from "react";
import mocktestApi from "../../api/mocktestApi";
import type { MockTest } from "../../types/mocktest";

const LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "🔰 Sơ cấp" },
  { value: "INTERMEDIATE", label: "⭐ Trung cấp" },
  { value: "ADVANCED", label: "⭐⭐ Nâng cao" },
];

const OwnerMockTestsPage = () => {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    level: MockTest["level"];
    duration: number;
    totalQuestions: number;
  }>({
    title: "",
    description: "",
    level: "INTERMEDIATE",
    duration: 90,
    totalQuestions: 50,
  });

  const loadTests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await mocktestApi.getAllTests();
      setTests(data);
    } catch (error) {
      console.error("Failed to load tests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert("Vui lòng nhập tên đề thi");
      return;
    }

    try {
      if (editingId) {
        await mocktestApi.updateTest(editingId, formData);
        alert("Cập nhật đề thi thành công");
      } else {
        await mocktestApi.createTest(formData);
        alert("Tạo đề thi thành công");
      }
      setFormData({
        title: "",
        description: "",
        level: "INTERMEDIATE",
        duration: 90,
        totalQuestions: 50,
      });
      setShowForm(false);
      setEditingId(null);
      loadTests();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Thao tác thất bại");
    }
  };

  const handleEdit = (test: MockTest) => {
    setFormData({
      title: test.title,
      description: test.description,
      level: test.level,
      duration: test.duration,
      totalQuestions: test.totalQuestions,
    });
    setEditingId(test.id);
    setShowForm(true);
  };

  const handleDelete = async (testId: number) => {
    if (!confirm("Bạn chắc chắn muốn xoá đề thi này?")) return;

    try {
      await mocktestApi.deleteTest(testId);
      alert("Xoá đề thi thành công");
      loadTests();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Xoá thất bại");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      level: "INTERMEDIATE",
      duration: 90,
      totalQuestions: 50,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Quản lý đề thi VSTEP
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo và quản lý các bộ đề thi thử
          </p>
        </div>
        <button
          onClick={loadTests}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Form */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-gray-200 bg-white p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-900">
            {editingId ? "Chỉnh sửa" : "Tạo"} đề thi
          </h3>

          <input
            type="text"
            placeholder="Tên đề thi"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none focus:border-black"
            required
          />

          <textarea
            placeholder="Mô tả đề thi"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none focus:border-black min-h-20"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Cấp độ
              </label>
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: e.target.value as MockTest["level"],
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 mt-1"
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Thời gian (phút)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 mt-1"
                min={10}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Số câu hỏi
            </label>
            <input
              type="number"
              value={formData.totalQuestions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  totalQuestions: Number(e.target.value),
                })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 mt-1"
              min={1}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              {editingId ? "Cập nhật" : "Tạo"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Huỷ
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center hover:border-gray-400 transition"
        >
          <p className="text-2xl mb-2">+</p>
          <p className="text-sm font-medium text-gray-700">Tạo đề thi mới</p>
        </button>
      )}

      {/* Tests List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))
        ) : tests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-600">
              Chưa có đề thi nào. Hãy tạo đề thi đầu tiên!
            </p>
          </div>
        ) : (
          tests.map((test) => (
            <div
              key={test.id}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {test.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {test.description}
                  </p>
                  <div className="flex gap-3 mt-3 text-sm text-gray-500">
                    <span>
                      {LEVEL_OPTIONS.find((o) => o.value === test.level)?.label}
                    </span>
                    <span>⏱️ {test.duration}min</span>
                    <span>📝 {test.totalQuestions}câu</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(test)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(test.id)}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Xoá
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {test.isActive ? "✓ Hoạt động" : "✕ Tạm dừng"} · Tạo lúc:{" "}
                {new Date(test.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OwnerMockTestsPage;
