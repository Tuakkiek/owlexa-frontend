import { useEffect, useState, useCallback } from "react";
import { Badge } from "../../../components/ui/SharedComponents";
import { roomApi } from "../../../api/roomApi";
import type { RoomResponse, RoomScheduleSummaryResponse } from "../../../types/room";
import { DAY_OF_WEEK_LABELS, SCHEDULE_TYPE_LABELS } from "../../../types/schedule";

interface RoomDetailDrawerProps {
  room: RoomResponse;
  onClose: () => void;
  onRefresh: () => void;
}

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export const RoomDetailDrawer = ({ room, onClose, onRefresh }: RoomDetailDrawerProps) => {
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
      setSchedules(summary);
    } catch {
      // silent
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editCode.trim()) {
      alert("Tên và mã phòng không được để trống");
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
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Không thể lưu thông tin phòng.");
    } finally {
      setIsSaving(false);
    }
  };

  // Group schedules by day of week for the schedule timeline
  const groupedSchedules = DAYS_OF_WEEK.reduce((acc, day) => {
    const daySchedules = schedules
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (daySchedules.length > 0) {
      acc[day] = daySchedules;
    }
    return acc;
  }, {} as Record<string, RoomScheduleSummaryResponse[]>);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết phòng học</h2>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-primary text-white hover:bg-primary-hover px-4 py-1.5 text-sm font-medium transition-colors"
              >
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium bg-white hover:bg-gray-100 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Basic Info Form or View */}
        {isEditing ? (
          <form onSubmit={handleSave} className="border-b bg-gray-50/50 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-950 uppercase tracking-wider">Sửa thông tin cơ bản</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Mã phòng *</label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Tên phòng *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Sức chứa</label>
                <input
                  type="number"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(Number(e.target.value))}
                  min={1}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Trạng thái hoạt động</label>
                <select
                  value={editIsActive ? "true" : "false"}
                  onChange={(e) => setEditIsActive(e.target.value === "true")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                >
                  <option value="true">Hoạt động</option>
                  <option value="false">Không hoạt động</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700">Mô tả</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-950"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(room.name);
                  setEditCode(room.code);
                  setEditCapacity(room.capacity ?? 30);
                  setEditDescription(room.description ?? "");
                  setEditIsActive(room.isActive);
                }}
                className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-primary text-white hover:bg-primary-hover px-4 py-1.5 text-sm font-medium"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        ) : (
          <div className="border-b bg-gray-50/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-950">{room.name} ({room.code})</h3>
              <Badge variant={room.isActive ? "success" : "default"}>
                {room.isActive ? "Hoạt động" : "Không hoạt động"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Mã phòng:</span>
                <span className="font-medium text-gray-950">{room.code}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Sức chứa:</span>
                <span className="font-medium text-gray-955">{room.capacity ?? "—"} học sinh</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 col-span-2">
                <span className="text-gray-500">Mô tả:</span>
                <span className="font-medium text-gray-955">{room.description || "Chưa có mô tả."}</span>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">Thời khóa biểu sử dụng phòng</h3>
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
                    <h4 className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                      {DAY_OF_WEEK_LABELS[day] ?? day}
                    </h4>
                    <div className="divide-y divide-gray-100">
                      {daySchedules.map((s) => (
                        <div key={s.id} className="py-3 flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}
                              </span>
                              <span className="font-medium text-primary">{s.className}</span>
                            </div>
                            <div className="text-xs text-gray-500">Giáo viên: {s.teacherName}</div>
                          </div>
                          <Badge
                            variant={
                              s.type === "THEORY_CLASS"
                                ? "success"
                                : s.type === "ONLINE_CLASS"
                                  ? "info"
                                  : s.type === "EXAM"
                                    ? "warning"
                                    : "error"
                            }
                          >
                            {SCHEDULE_TYPE_LABELS[s.type] ?? s.type}
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
