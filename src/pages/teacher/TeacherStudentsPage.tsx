import { useEffect, useState, useCallback, useMemo } from "react";
import axiosClient from "../../api/axiosClient";

interface Student {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
}

interface ClassWithStudents {
  id: number;
  className: string;
  studentCount: number;
  students: Student[];
}

const TeacherStudentsPage = () => {
  const [classes, setClasses] = useState<ClassWithStudents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get<ClassWithStudents[]>(
        "/teacher/classes/with-students",
      );
      setClasses(res.data ?? []);
      if (res.data && res.data.length > 0) {
        setSelectedClassId(res.data[0].id);
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId],
  );

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phoneNumber.includes(searchQuery) ||
        s.email.toLowerCase().includes(searchQuery),
    );
  }, [selectedClass, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Danh sách học sinh
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem học sinh theo từng lớp
          </p>
        </div>
        <button
          onClick={loadClasses}
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
            onClick={() => {
              setSelectedClassId(cls.id);
              setSearchQuery("");
            }}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-medium transition ${
              selectedClassId === cls.id
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {cls.className} ({cls.studentCount})
          </button>
        ))}
      </div>

      {/* Search */}
      {selectedClass && selectedClass.students.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm học sinh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
          />
        </div>
      )}

      {/* Students Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : !selectedClass ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-600">
            Không có lớp nào được gán cho giáo viên.
          </p>
        </div>
      ) : selectedClass.students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-gray-600">
            Lớp {selectedClass.className} chưa có học sinh.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600">Không tìm thấy học sinh phù hợp.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {student.fullName}
                  </h3>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mt-1">
                    {student.gender === "MALE"
                      ? "👨"
                      : student.gender === "FEMALE"
                        ? "👩"
                        : "🧑"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-3">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-fit">📱</span>
                  <span>{student.phoneNumber}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-fit">✉️</span>
                  <span className="truncate">{student.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-fit">🎂</span>
                  <span>
                    {new Date(student.dateOfBirth).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-fit">📍</span>
                  <span className="truncate text-xs">{student.address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {selectedClass && filteredStudents.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Tổng: <strong>{filteredStudents.length}</strong> /{" "}
            {selectedClass.studentCount} học sinh
          </span>
        </div>
      )}
    </div>
  );
};

export default TeacherStudentsPage;
