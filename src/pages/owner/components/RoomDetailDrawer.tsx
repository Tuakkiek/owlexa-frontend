import { useCallback, useEffect, useMemo, useState } from "react";
import { roomApi } from "../../../api/roomApi";
import { Badge } from "../../../components/ui/SharedComponents";
import type { RoomResponse, RoomScheduleSummaryResponse } from "../../../types/room";
import { DAY_OF_WEEK_LABELS, SCHEDULE_TYPE_LABELS } from "../../../types/schedule";

interface RoomDetailDrawerProps {
  room: RoomResponse;
  onClose: () => void;
  onRefresh: () => void;
}

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const SOURCE_LABELS: Record<string, string> = {
  EVENT: "Buổi học",
  LEGACY: "Lịch cũ",
};

export const RoomDetailDrawer = ({
  room,
  onClose,
  onRefresh,
}: RoomDetailDrawerProps) => {
  const [schedules, setSchedules] = useState<RoomScheduleSummaryResponse[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);
  const [editCode, setEditCode] = useState(room.code);
  const [editCapacity, setEditCapacity] = useState(room.capacity ?? 30);
  const [editDescription, setEditDescription] = useState(room.description ?? "");
  const [editIsActive, setEditIsActive] = useState(room.isActive);
  const [isSaving, setIsSaving] = useState(false);

  const loadSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    try {
      const summary = await roomApi.getScheduleSummary(room.id);
      setSchedules(summary.filter((schedule) => schedule.source !== "RULE"));
    } catch {
      setSchedules([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [room.id]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    setEditName(room.name);
    setEditCode(room.code);
    setEditCapacity(room.capacity ?? 30);
    setEditDescription(room.description ?? "");
    setEditIsActive(room.isActive);
  }, [room]);

  const groupedSchedules = useMemo(
    () =>
      DAYS_OF_WEEK.reduce(
        (acc, day) => {
          const daySchedules = schedules
            .filter((schedule) => schedule.dayOfWeek === day)
            .sort((a, b) => {
              const dateCompare = (a.eventDate ?? "").localeCompare(b.eventDate ?? "");
              if (dateCompare !== 0) return dateCompare;
              return a.startTime.localeCompare(b.startTime);
            });
          if (daySchedules.length > 0) {
            acc[day] = daySchedules;
          }
          return acc;
        },
        {} as Record<string, RoomScheduleSummaryResponse[]>,
      ),
    [schedules],
  );

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editName.trim() || !editCode.trim()) {
      alert("Tên và mã phòng không được để trống.");
      return;
    }

    try {
      setIsSaving(true);
      await roomApi.update(room.id, {
        name: editName.trim(),
        code: editCode.trim(),
        capacity: editCapacity,
        description: editDescription.trim(),
        isActive: editIsActive,
      });
      setIsEditing(false);
      onRefresh();
      await loadSchedules();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Không thể lưu thông tin phòng.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetEdit = () => {
    setIsEditing(false);
    setEditName(room.name);
    setEditCode(room.code);
    setEditCapacity(room.capacity ?? 30);
    setEditDescription(room.description ?? "");
    setEditIsActive(room.isActive);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết phòng học</h2>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100"
            >
              Đóng
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 border-b bg-gray-50/50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-950">
              Sửa thông tin cơ bản
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-xs font-medium text-gray-700">
                Mã phòng *
                <input
                  type="text"
                  value={editCode}
                  onChange={(event) => setEditCode(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-950 focus:border-primary focus:outline-none"
                  required
                />
              </label>
              <label className="block text-xs font-medium text-gray-700">
                Tên phòng *
                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-950 focus:border-primary focus:outline-none"
                  required
                />
              </label>
              <label className="block text-xs font-medium text-gray-700">
                Sức chứa
                <input
                  type="number"
                  value={editCapacity}
                  onChange={(event) => setEditCapacity(Number(event.target.value))}
                  min={1}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-950 focus:border-primary focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-gray-700">
                Trạng thái hoạt động
                <select
                  value={editIsActive ? "true" : "false"}
                  onChange={(event) => setEditIsActive(event.target.value === "true")}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-950 focus:border-primary focus:outline-none"
                >
                  <option value="true">Hoạt động</option>
                  <option value="false">Không hoạt động</option>
                </select>
              </label>
              <label className="col-span-2 block text-xs font-medium text-gray-700">
                Mô tả
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-950 focus:border-primary focus:outline-none"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetEdit}
                className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        ) : (
          <div className="border-b bg-gray-50/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-950">
                {room.name} ({room.code})
              </h3>
              <Badge variant={room.isActive ? "success" : "default"}>
                {room.isActive ? "Hoạt động" : "Không hoạt động"}
              </Badge>
              <Badge variant={room.isInUse ? "warning" : "default"}>
                {room.isInUse ? `Đang dùng (${room.usageCount})` : "Chưa dùng"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Mã phòng:</span>
                <span className="font-medium text-gray-950">{room.code}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Sức chứa:</span>
                <span className="font-medium text-gray-950">
                  {room.capacity ?? "-"} học sinh
                </span>
              </div>
              <div className="col-span-2 flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Sử dụng:</span>
                <span className="font-medium text-gray-950">
                  {room.isInUse
                    ? `Đang được sử dụng trong ${room.usageCount} mục lịch`
                    : "Chưa được xếp lịch"}
                </span>
              </div>
              <div className="col-span-2 flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Mô tả:</span>
                <span className="font-medium text-gray-950">
                  {room.description || "Chưa có mô tả."}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950">
            Thời khóa biểu sử dụng phòng
          </h3>
          {isLoadingSchedules ? (
            <div className="py-8 text-center text-sm text-gray-500">Đang tải lịch học...</div>
          ) : Object.keys(groupedSchedules).length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
              Phòng học này hiện chưa được xếp lịch cho lớp nào.
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS_OF_WEEK.map((day) => {
                const daySchedules = groupedSchedules[day];
                if (!daySchedules) return null;
                return (
                  <div key={day} className="space-y-2">
                    <h4 className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {DAY_OF_WEEK_LABELS[day] ?? day}
                    </h4>
                    <div className="divide-y divide-gray-100">
                      {daySchedules.map((schedule) => (
                        <div
                          key={`${schedule.source}-${schedule.id}-${schedule.dayOfWeek}-${schedule.eventDate ?? ""}`}
                          className="flex items-center justify-between py-3 text-sm"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}
                              </span>
                              <span className="font-medium text-primary">
                                {schedule.className}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {SOURCE_LABELS[schedule.source] ?? schedule.source}
                              {schedule.eventDate ? ` - ${schedule.eventDate}` : ""} - Giáo viên: {schedule.teacherName}
                            </div>
                          </div>
                          <Badge
                            variant={
                              schedule.type === "THEORY_CLASS"
                                ? "success"
                                : schedule.type === "ONLINE_CLASS"
                                  ? "info"
                                  : schedule.type === "EXAM"
                                    ? "warning"
                                    : "error"
                            }
                          >
                            {SCHEDULE_TYPE_LABELS[schedule.type] ?? schedule.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
