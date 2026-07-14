import { useEffect, useMemo, useState } from "react";
import { classApi } from "../../api/classApi";
import type {
  TeacherClassStudents,
  TeacherStudentInfo,
} from "../../types/teacherClassStudents";

export default function TeacherStudentsPage() {
  const [classes, setClasses] = useState<TeacherClassStudents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await classApi.findMyClassesWithStudentsAsTeacher();
      setClasses(data);
      setSelectedClassId((current) => current ?? data[0]?.id ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách lớp.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const filteredStudents = useMemo<TeacherStudentInfo[]>(() => {
    if (!selectedClass) return [];
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return selectedClass.students;
    return selectedClass.students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(keyword) ||
        student.phoneNumber.includes(keyword),
    );
  }, [selectedClass, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Danh sách học sinh
          </h1>
        </div>

        <button
          onClick={loadClasses}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => {
              setSelectedClassId(cls.id);
              setSearchQuery("");
            }}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedClassId === cls.id
                ? "bg-primary text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {cls.className} ({cls.studentCount})
          </button>
        ))}
      </div>

      {selectedClass && selectedClass.students.length > 0 && (
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Tìm học sinh..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : !selectedClass ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-600">
          Không có lớp nào được gán cho giáo viên.
        </div>
      ) : selectedClass.students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-600">
          Lớp {selectedClass.className} chưa có học sinh.
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-600">
          Không tìm thấy học sinh phù hợp.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <div
              key={student.userId}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">
                {student.fullName}
              </h3>
              <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
                <div>{student.phoneNumber}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedClass && filteredStudents.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
          <span className="text-sm font-medium text-gray-700">
            Tổng: <strong>{filteredStudents.length}</strong> /{" "}
            {selectedClass.studentCount} học sinh
          </span>
        </div>
      )}
    </div>
  );
}
