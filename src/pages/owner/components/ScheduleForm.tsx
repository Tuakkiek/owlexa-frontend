import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { roomApi } from "../../../api/roomApi";
import type { ScheduleRequest, ScheduleType } from "../../../types/schedule";
import type { TeacherResponse } from "../../../types/teacher";
import type { RoomResponse } from "../../../types/room";
import { DAY_LABELS } from "../../../types/schedule";

interface ScheduleFormProps {
  initialData?: Partial<ScheduleRequest>;
  teachers: TeacherResponse[];
  onSubmit: (data: ScheduleRequest) => Promise<void>;
  onCancel: () => void;
}

const DAYS = Object.entries(DAY_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

const TIME_OPTIONS = (() => {
  const times: string[] = [];
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
})();

export const ScheduleForm = ({
  initialData,
  teachers,
  onSubmit,
  onCancel,
}: ScheduleFormProps) => {
  const [teacherId, setTeacherId] = useState<number | "">(
    initialData?.teacherUserId ?? "",
  );
  const [dayOfWeek, setDayOfWeek] = useState<number>(
    initialData?.dayOfWeek ?? 1,
  );
  const [startTime, setStartTime] = useState(initialData?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(initialData?.endTime ?? "10:00");
  const [roomId, setRoomId] = useState<number | "">(initialData?.roomId ?? "");
  const [type, setType] = useState<ScheduleType>(initialData?.type ?? "THEORY_CLASS");
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);

  useEffect(() => {
    roomApi
      .findAll()
      .then(setRooms)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData?.teacherUserId) {
      setTeacherId(initialData.teacherUserId);
    }
    if (initialData?.dayOfWeek !== undefined) {
      setDayOfWeek(initialData.dayOfWeek);
    }
    if (initialData?.startTime) {
      setStartTime(initialData.startTime.slice(0, 5));
    }
    if (initialData?.endTime) {
      setEndTime(initialData.endTime.slice(0, 5));
    }
    if (initialData?.roomId) {
      setRoomId(initialData.roomId);
    }
    if (initialData?.type) {
      setType(initialData.type);
    }
    setSubmitError(null);
    setErrorField(null);
  }, [initialData]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!teacherId) errs.teacherId = "Vui lòng chọn giáo viên";
    if (startTime >= endTime) errs.time = "Giờ bắt đầu phải trước giờ kết thúc";
    if (!roomId) errs.roomId = "Vui lòng chọn phòng học";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearErrors = () => {
    setSubmitError(null);
    setErrorField(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!validate() || !teacherId || !roomId) return;
    try {
      setIsLoading(true);
      await onSubmit({
        teacherUserId: teacherId as number,
        roomId: roomId as number,
        dayOfWeek,
        startTime,
        endTime,
        type,
      });
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && data.code) {
        setSubmitError(data.message);
        if (data.code === "ROOM_CONFLICT") {
          setErrorField("roomId");
        } else if (data.code === "TEACHER_CONFLICT") {
          setErrorField("teacherId");
        } else if (data.code === "INVALID_TIME_RANGE") {
          setErrorField("time");
        }
      } else {
        setSubmitError(data?.message || err?.message || "Đã xảy ra lỗi không xác định.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 font-medium">
          ❌ {submitError}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Giáo viên
        </label>
        <select
          value={teacherId}
          onChange={(e) => {
            setTeacherId(e.target.value ? Number(e.target.value) : "");
            clearErrors();
          }}
          className={`w-full border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-primary ${
            errorField === "teacherId" ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
          }`}
        >
          <option value="">-- Chọn giáo viên --</option>
          {teachers.map((t) => (
            <option key={t.userId} value={t.userId}>
              {t.fullName} ({t.phoneNumber})
            </option>
          ))}
        </select>
        {errors.teacherId && (
          <p className="mt-1 text-xs text-red-500">{errors.teacherId}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Loại lịch học
        </label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as ScheduleType);
            clearErrors();
          }}
          className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none"
        >
          <option value="THEORY_CLASS">Lịch học lý thuyết (Theory Class)</option>
          <option value="ONLINE_CLASS">Lịch học trực tuyến (Online Class)</option>
          <option value="EXAM">Lịch thi (Exam)</option>
          <option value="CANCELLED">Lịch tạm ngưng (Cancelled)</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Thứ trong tuần
        </label>
        <select
          value={dayOfWeek}
          onChange={(e) => {
            setDayOfWeek(Number(e.target.value));
            clearErrors();
          }}
          className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none"
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Giờ bắt đầu
          </label>
          <select
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              clearErrors();
            }}
            className={`w-full border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-primary ${
              errorField === "time" ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
            }`}
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Giờ kết thúc
          </label>
          <select
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              clearErrors();
            }}
            className={`w-full border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-primary ${
              errorField === "time" ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
            }`}
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      {errors.time && <p className="text-xs text-red-500">{errors.time}</p>}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Phòng học
        </label>
        <select
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value ? Number(e.target.value) : "");
            clearErrors();
          }}
          className={`w-full border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary ${
            errors.roomId || errorField === "roomId" ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        >
          <option value="">-- Chọn phòng học --</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.code} — {r.name}
            </option>
          ))}
        </select>
        {errors.roomId && (
          <p className="mt-1 text-xs text-red-500">{errors.roomId}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Cập nhật" : "Thêm buổi học"}
        </Button>
      </div>
    </form>
  );
};
