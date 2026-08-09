import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { roomApi } from "../../../api/roomApi";
import { timeSlotApi } from "../../../api/timeSlotApi";
import type { RoomResponse } from "../../../types/room";
import type { ScheduleRuleRequest } from "../../../types/schedule";
import type { TeacherResponse } from "../../../types/teacher";
import type { TeachingTimeSlotResponse } from "../../../types/timeSlot";
import { TIME_SLOT_PERIOD_LABELS } from "../../../types/timeSlot";

interface ScheduleRuleFormProps {
  teachers: TeacherResponse[];
  onSubmit: (data: ScheduleRuleRequest) => Promise<void>;
  onCancel: () => void;
}

const DAY_OPTIONS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 7, label: "CN" },
];

export const ScheduleRuleForm = ({ teachers, onSubmit, onCancel }: ScheduleRuleFormProps) => {
  const navigate = useNavigate();

  const [teacherUserId, setTeacherUserId] = useState<number | "">("");
  const [roomId, setRoomId] = useState<number | "">("");
  const [timeSlotId, setTimeSlotId] = useState<number | "">("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [startDate, setStartDate] = useState("");
  const [type, setType] = useState<"THEORY_CLASS" | "ONLINE_CLASS">("THEORY_CLASS");
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [timeSlots, setTimeSlots] = useState<TeachingTimeSlotResponse[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    roomApi.findAll().then(setRooms).catch(() => {});
    setIsLoadingTimeSlots(true);
    timeSlotApi
      .findAllActive()
      .then((slots) => {
        setTimeSlots(slots);
        if (slots.length > 0) {
          setTimeSlotId(slots[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingTimeSlots(false));
  }, []);

  const preview = useMemo(
    () => DAY_OPTIONS.filter((day) => daysOfWeek.includes(day.value)).map((day) => day.label).join(", "),
    [daysOfWeek],
  );

  const selectedSlot = useMemo(
    () => timeSlots.find((slot) => slot.id === Number(timeSlotId)),
    [timeSlots, timeSlotId],
  );

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!teacherUserId) return setError("Vui lòng chọn giáo viên.");
    if (!roomId) return setError("Vui lòng chọn phòng học.");
    if (!timeSlotId) return setError("Vui lòng chọn ca học.");
    if (daysOfWeek.length === 0) return setError("Vui lòng chọn ít nhất một thứ trong tuần.");
    if (!startDate) return setError("Vui lòng chọn ngày bắt đầu.");

    try {
      setIsSubmitting(true);
      await onSubmit({
        teacherUserId: teacherUserId as number,
        roomId: roomId as number,
        daysOfWeek,
        startDate,
        timeSlotId: timeSlotId as number,
        type,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoadingTimeSlots && timeSlots.length === 0) {
    return (
      <div className="space-y-4 rounded-card border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
        <p className="font-semibold text-base">Trung tâm chưa thiết lập ca học.</p>
        <p className="text-xs text-amber-700">
          Bạn cần thiết lập các ca học khung thời gian trước khi tạo lịch học lặp cho lớp.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => {
              onCancel();
              navigate("/owner/settings/time-slots");
            }}
          >
            Thiết lập ca học
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-card border border-surface-border bg-surface-page p-4 text-sm text-gray-600">
        Quy tắc này chọn ca học và ngày bắt đầu. Hệ thống sẽ lặp theo số buổi của khóa học và tự tính ngày kết thúc.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Giáo viên *</span>
          <select
            value={teacherUserId}
            onChange={(e) => setTeacherUserId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">-- Chọn giáo viên --</option>
            {teachers.map((teacher) => (
              <option key={teacher.userId} value={teacher.userId}>
                {teacher.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Phòng học *</span>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.code} - {room.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">Lặp hằng tuần *</span>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                daysOfWeek.includes(day.value)
                  ? "border-primary bg-primary-light text-primary"
                  : "border-surface-border bg-white text-gray-600 hover:bg-surface-hover"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">Đang chọn: {preview || "Chưa chọn"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Từ ngày *</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Ca học *</span>
          <select
            value={timeSlotId}
            onChange={(e) => setTimeSlotId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">-- Chọn ca học --</option>
            {(["MORNING", "AFTERNOON", "EVENING"] as const).map((period) => {
              const groupSlots = timeSlots.filter((slot) => slot.period === period);
              if (groupSlots.length === 0) return null;
              return (
                <optgroup key={period} label={TIME_SLOT_PERIOD_LABELS[period].toUpperCase()}>
                  {groupSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.name} ({slot.startTime.slice(0, 5)} – {slot.endTime.slice(0, 5)})
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          {selectedSlot && (
            <p className="mt-1.5 text-xs text-primary font-medium">
              Khung giờ: {selectedSlot.startTime.slice(0, 5)} – {selectedSlot.endTime.slice(0, 5)} ({TIME_SLOT_PERIOD_LABELS[selectedSlot.period]})
            </p>
          )}
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Loại lịch lặp</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "THEORY_CLASS" | "ONLINE_CLASS")}
          className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="THEORY_CLASS">Lịch học</option>
          <option value="ONLINE_CLASS">Lịch học trực tuyến</option>
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Tạo rule
        </Button>
      </div>
    </form>
  );
};
