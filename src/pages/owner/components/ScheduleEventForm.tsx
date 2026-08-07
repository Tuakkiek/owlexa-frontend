import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { roomApi } from "../../../api/roomApi";
import type { RoomResponse } from "../../../types/room";
import type { ScheduleEventRequest, ScheduleEventResponse } from "../../../types/schedule";
import type { TeacherResponse } from "../../../types/teacher";

interface ScheduleEventFormProps {
  teachers: TeacherResponse[];
  initialData?: ScheduleEventResponse;
  onSubmit: (data: ScheduleEventRequest) => Promise<void>;
  onCancel: () => void;
}

export const ScheduleEventForm = ({
  teachers,
  initialData,
  onSubmit,
  onCancel,
}: ScheduleEventFormProps) => {
  const [teacherUserId, setTeacherUserId] = useState<number | "">("");
  const [roomId, setRoomId] = useState<number | "">("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("19:45");
  const [endTime, setEndTime] = useState("21:15");
  const [eventType, setEventType] = useState<ScheduleEventRequest["eventType"]>("EXAM");
  const [status, setStatus] = useState<ScheduleEventRequest["status"]>("SCHEDULED");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    roomApi.findAll().then(setRooms).catch(() => {});
  }, []);

  useEffect(() => {
    if (!initialData) {
      setTeacherUserId("");
      setRoomId("");
      setEventDate("");
      setStartTime("19:45");
      setEndTime("21:15");
      setEventType("EXAM");
      setStatus("SCHEDULED");
      setTitle("");
      setNote("");
      return;
    }

    setTeacherUserId(initialData.teacherUserId ?? "");
    setRoomId(initialData.roomId ?? "");
    setEventDate(initialData.eventDate);
    setStartTime(initialData.startTime.slice(0, 5));
    setEndTime(initialData.endTime.slice(0, 5));
    setEventType(initialData.eventType);
    setStatus(initialData.status);
    setTitle(initialData.title ?? "");
    setNote(initialData.note ?? "");
  }, [initialData]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!eventDate) {
      setError("Vui lòng chọn ngày diễn ra.");
      return;
    }
    if (startTime >= endTime) {
      setError("Giờ bắt đầu phải trước giờ kết thúc.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        teacherUserId: teacherUserId || undefined,
        roomId: roomId || undefined,
        eventDate,
        startTime,
        endTime,
        eventType,
        status: status ?? "SCHEDULED",
        title: title.trim() || undefined,
        note: note.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-card border border-surface-border bg-surface-page p-4 text-sm text-gray-600">
        Chỉnh sửa ở đây chỉ áp dụng cho riêng buổi này. Quy tắc lịch lặp gốc không bị thay đổi.
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Tiêu đề</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="VD: Thi cuối khóa, học bù, đổi giáo viên..."
          className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Loại sự kiện</span>
          <select
            value={eventType}
            onChange={(event) => setEventType(event.target.value as ScheduleEventRequest["eventType"])}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="LESSON">Buổi học</option>
            <option value="ONLINE_LESSON">Buổi online</option>
            <option value="PRACTICE">Thực hành</option>
            <option value="EXAM">Thi</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ScheduleEventRequest["status"])}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="SCHEDULED">Đang xếp lịch</option>
            <option value="MOVED">Đã dời lịch</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Ngày</span>
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Giáo viên</span>
          <select
            value={teacherUserId}
            onChange={(event) => setTeacherUserId(event.target.value ? Number(event.target.value) : "")}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">-- Theo lớp / chưa gán --</option>
            {teachers.map((teacher) => (
              <option key={teacher.userId} value={teacher.userId}>
                {teacher.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Giờ bắt đầu</span>
          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Giờ kết thúc</span>
          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">Phòng</span>
          <select
            value={roomId}
            onChange={(event) => setRoomId(event.target.value ? Number(event.target.value) : "")}
            className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">-- Chưa gán --</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.code} - {room.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialData ? "Lưu thay đổi" : "Tạo sự kiện"}
        </Button>
      </div>
    </form>
  );
};
