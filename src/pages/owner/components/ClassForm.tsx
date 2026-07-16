import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { courseApi } from "../../../api/courseApi";
import { teacherApi } from "../../../api/teacherApi";
import type { ClassRequest } from "../../../types/class";
import type { CourseResponse } from "../../../types/course";
import type { TeacherResponse } from "../../../types/teacher";

const VSTEP_LEVELS = [
  { value: "A1", label: "A1 - Sơ cấp" },
  { value: "A2", label: "A2 - Sơ cấp" },
  { value: "B1", label: "B1 - Trung cấp" },
  { value: "B2", label: "B2 - Trung cấp" },
  { value: "C1", label: "C1 - Nâng cao" },
  { value: "C2", label: "C2 - Nâng cao" },
  { value: "IELTS 4.0", label: "IELTS 4.0" },
  { value: "IELTS 5.0", label: "IELTS 5.0" },
  { value: "IELTS 6.0", label: "IELTS 6.0" },
  { value: "IELTS 7.0+", label: "IELTS 7.0+" },
  { value: "Khác", label: "Khác" },
];

interface ClassFormProps {
  initialData?: Partial<ClassRequest>;
  onSubmit: (data: ClassRequest) => Promise<void>;
  onCancel: () => void;
}

export const ClassForm = ({
  initialData,
  onSubmit,
  onCancel,
}: ClassFormProps) => {
  const [name, setName] = useState(initialData?.name ?? "");
  const [courseId, setCourseId] = useState<number | "">(
    initialData?.courseId ?? "",
  );
  const [teacherUserId, setTeacherUserId] = useState<number | "">(
    initialData?.teacherUserId ?? "",
  );
  const [vstepLevel, setVstepLevel] = useState(initialData?.vstepLevel ?? "");
  const [maxStudent, setMaxStudent] = useState(initialData?.maxStudent ?? 20);
  const [monthlyFee, setMonthlyFee] = useState(initialData?.monthlyFee ?? 0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);

  useEffect(() => {
    courseApi
      .findAll()
      .then(setCourses)
      .catch(() => {});
    teacherApi
      .findAll()
      .then(setTeachers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setCourseId(initialData.courseId ?? "");
      setTeacherUserId(initialData.teacherUserId ?? "");
      setVstepLevel(initialData.vstepLevel ?? "");
      setMaxStudent(initialData.maxStudent ?? 20);
      setMonthlyFee(initialData.monthlyFee ?? 0);
    }
  }, [initialData]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Tên lớp không được để trống";
    if (!courseId) errs.courseId = "Vui lòng chọn khóa học";
    if (!vstepLevel) errs.vstepLevel = "Vui lòng chọn cấp độ VSTEP";
    if (maxStudent < 1) errs.maxStudent = "Sĩ số tối thiểu là 1";
    if (monthlyFee < 0) errs.monthlyFee = "Học phí không được âm";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsLoading(true);
      await onSubmit({
        name: name.trim(),
        courseId: Number(courseId),
        teacherUserId: teacherUserId ? Number(teacherUserId) : undefined,
        vstepLevel,
        maxStudent,
        monthlyFee,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Tên lớp"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="VD: B1 Intensive Thứ 2-4-6"
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Khóa học *
        </label>
        <select
          value={courseId}
          onChange={(e) => {
            const val = e.target.value;
            setCourseId(val ? Number(val) : "");
            if (val) {
              const c = courses.find((co) => co.id === Number(val));
              if (c && c.defaultMonthlyFee) setMonthlyFee(c.defaultMonthlyFee);
              if (c && c.defaultMaxStudents)
                setMaxStudent(c.defaultMaxStudents);
              if (c && c.level) setVstepLevel(c.level);
            }
          }}
          className={`w-full border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary ${
            errors.courseId ? "border-red-400" : "border-gray-300"
          }`}
        >
          <option value="">-- Chọn khóa học --</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
        {errors.courseId && (
          <p className="mt-1 text-xs text-red-500">{errors.courseId}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Giáo viên phụ trách
        </label>
        <select
          value={teacherUserId}
          onChange={(e) =>
            setTeacherUserId(e.target.value ? Number(e.target.value) : "")
          }
          className="w-full border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">-- Chọn giáo viên (tùy chọn) --</option>
          {teachers.map((t) => (
            <option key={t.userId} value={t.userId}>
              {t.fullName} ({t.phoneNumber})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Cấp độ VSTEP
        </label>
        <select
          value={vstepLevel}
          onChange={(e) => setVstepLevel(e.target.value)}
          className={`w-full border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary ${
            errors.vstepLevel ? "border-red-400" : "border-gray-300"
          }`}
        >
          <option value="">-- Chọn cấp độ --</option>
          {VSTEP_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        {errors.vstepLevel && (
          <p className="mt-1 text-xs text-red-500">{errors.vstepLevel}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Sĩ số tối đa"
          type="number"
          value={maxStudent}
          onChange={(e) => setMaxStudent(Number(e.target.value))}
          error={errors.maxStudent}
          min={1}
        />
        <Input
          label="Học phí / tháng (VND)"
          type="number"
          value={monthlyFee}
          onChange={(e) => setMonthlyFee(Number(e.target.value))}
          error={errors.monthlyFee}
          min={0}
          placeholder="VD: 500000"
        />
      </div>

      {monthlyFee > 0 && (
        <p className="text-xs text-gray-500">
          Học phí:{" "}
          <strong>
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(monthlyFee)}
          </strong>
          /tháng
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Cập nhật lớp" : "Tạo lớp học"}
        </Button>
      </div>
    </form>
  );
};
