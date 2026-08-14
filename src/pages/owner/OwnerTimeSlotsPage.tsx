import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { timeSlotApi } from "../../api/timeSlotApi";
import type {
  TeachingTimeSlotResponse,
  TeachingTimeSlotRequest,
  QuickSetupRequest,
  TimeSlotPeriod,
} from "../../types/timeSlot";
import { TIME_SLOT_PERIOD_LABELS } from "../../types/timeSlot";

const PERIOD_ORDER: TimeSlotPeriod[] = ["MORNING", "AFTERNOON", "EVENING"];

export const OwnerTimeSlotsPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [timeSlots, setTimeSlots] = useState<TeachingTimeSlotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick setup state
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [gapMinutes, setGapMinutes] = useState(5);
  const [morningStart, setMorningStart] = useState("07:00");
  const [morningCount, setMorningCount] = useState(2);
  const [afternoonStart, setAfternoonStart] = useState("13:00");
  const [afternoonCount, setAfternoonCount] = useState(2);
  const [eveningStart, setEveningStart] = useState("18:15");
  const [eveningCount, setEveningCount] = useState(2);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isQuickSetupSaving, setIsQuickSetupSaving] = useState(false);

  // Single slot modal state
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TeachingTimeSlotResponse | null>(null);
  const [slotName, setSlotName] = useState("");
  const [slotPeriod, setSlotPeriod] = useState<TimeSlotPeriod>("MORNING");
  const [slotStartTime, setSlotStartTime] = useState("07:00");
  const [slotEndTime, setSlotEndTime] = useState("08:30");
  const [slotDisplayOrder, setSlotDisplayOrder] = useState(1);
  const [slotIsActive, setSlotIsActive] = useState(true);
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [singleError, setSingleError] = useState("");

  const loadTimeSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await timeSlotApi.findAllForOwner();
      setTimeSlots(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể tải danh sách ca học.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTimeSlots();
  }, [loadTimeSlots]);

  // Generated preview calculation
  const generatedPreview = useMemo(() => {
    const slots: { period: TimeSlotPeriod; name: string; startTime: string; endTime: string }[] = [];
    const addMinutes = (timeStr: string, mins: number) => {
      const [h, m] = timeStr.split(":").map(Number);
      const totalMins = h * 60 + m + mins;
      const endH = Math.floor(totalMins / 60) % 24;
      const endM = totalMins % 60;
      return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    };

    // Morning
    if (morningCount > 0 && morningStart) {
      let curr = morningStart;
      for (let i = 1; i <= morningCount; i++) {
        const end = addMinutes(curr, durationMinutes);
        slots.push({ period: "MORNING", name: `Ca sáng ${i}`, startTime: curr, endTime: end });
        curr = addMinutes(end, gapMinutes);
      }
    }

    // Afternoon
    if (afternoonCount > 0 && afternoonStart) {
      let curr = afternoonStart;
      for (let i = 1; i <= afternoonCount; i++) {
        const end = addMinutes(curr, durationMinutes);
        slots.push({ period: "AFTERNOON", name: `Ca chiều ${i}`, startTime: curr, endTime: end });
        curr = addMinutes(end, gapMinutes);
      }
    }

    // Evening
    if (eveningCount > 0 && eveningStart) {
      let curr = eveningStart;
      for (let i = 1; i <= eveningCount; i++) {
        const end = addMinutes(curr, durationMinutes);
        slots.push({ period: "EVENING", name: `Ca tối ${i}`, startTime: curr, endTime: end });
        curr = addMinutes(end, gapMinutes);
      }
    }

    return slots;
  }, [durationMinutes, gapMinutes, morningStart, morningCount, afternoonStart, afternoonCount, eveningStart, eveningCount]);

  const handleOpenPreview = () => {
    if (generatedPreview.length === 0) {
      toast.error("Vui lòng nhập ít nhất 1 ca học để thiết lập.");
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleConfirmQuickSetup = async () => {
    const payload: QuickSetupRequest = {
      durationMinutes,
      gapMinutes,
      morningStart: morningCount > 0 ? morningStart : undefined,
      morningCount,
      afternoonStart: afternoonCount > 0 ? afternoonStart : undefined,
      afternoonCount,
      eveningStart: eveningCount > 0 ? eveningStart : undefined,
      eveningCount,
    };

    try {
      setIsQuickSetupSaving(true);
      await timeSlotApi.quickSetup(payload);
      toast.success(`Đã phát sinh ${generatedPreview.length} ca học thành công.`);
      setIsPreviewOpen(false);
      loadTimeSlots();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể khởi tạo ca học nhanh.");
    } finally {
      setIsQuickSetupSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingSlot(null);
    setSlotName("");
    setSlotPeriod("MORNING");
    setSlotStartTime("07:00");
    setSlotEndTime("08:30");
    setSlotDisplayOrder(timeSlots.length + 1);
    setSlotIsActive(true);
    setSingleError("");
    setIsSingleModalOpen(true);
  };

  const openEditModal = (slot: TeachingTimeSlotResponse) => {
    setEditingSlot(slot);
    setSlotName(slot.name);
    setSlotPeriod(slot.period);
    setSlotStartTime(slot.startTime.slice(0, 5));
    setSlotEndTime(slot.endTime.slice(0, 5));
    setSlotDisplayOrder(slot.displayOrder);
    setSlotIsActive(slot.isActive);
    setSingleError("");
    setIsSingleModalOpen(true);
  };

  const handleSaveSingleSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError("");

    if (!slotName.trim()) {
      setSingleError("Vui lòng nhập tên ca học.");
      return;
    }
    if (slotStartTime >= slotEndTime) {
      setSingleError("Giờ bắt đầu phải trước giờ kết thúc.");
      return;
    }

    const payload: TeachingTimeSlotRequest = {
      name: slotName.trim(),
      period: slotPeriod,
      startTime: slotStartTime,
      endTime: slotEndTime,
      displayOrder: Number(slotDisplayOrder),
      isActive: slotIsActive,
    };

    try {
      setIsSavingSlot(true);
      if (editingSlot) {
        await timeSlotApi.update(editingSlot.id, payload);
        toast.success("Cập nhật ca học thành công.");
      } else {
        await timeSlotApi.create(payload);
        toast.success("Thêm ca học thành công.");
      }
      setIsSingleModalOpen(false);
      loadTimeSlots();
    } catch (err: any) {
      setSingleError(err?.response?.data?.message || "Không thể lưu thông tin ca học.");
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleDeleteOrDeactivate = async (slot: TeachingTimeSlotResponse) => {
    if (slot.isUsed) {
      const confirmed = await confirm({
        title: "Tắt hoạt động ca học?",
        message: `Ca học "${slot.name}" (${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}) đang được sử dụng trong các lịch học. Ca học này sẽ bị tắt hoạt động để không cho chọn khi tạo lịch mới, nhưng dữ liệu lịch lịch sử sẽ được bảo toàn nguyên vẹn.`,
        confirmText: "Ngừng hoạt động",
        variant: "warning",
      });
      if (!confirmed) return;

      try {
        await timeSlotApi.deleteOrDeactivate(slot.id);
        toast.success("Đã chuyển ca học sang trạng thái ngưng hoạt động.");
        loadTimeSlots();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Xử lý thất bại.");
      }
    } else {
      const confirmed = await confirm({
        title: "Xóa ca học?",
        message: `Bạn có chắc chắn muốn xóa hẳn ca học "${slot.name}" không?`,
        confirmText: "Xóa",
        variant: "danger",
      });
      if (!confirmed) return;

      try {
        await timeSlotApi.deleteOrDeactivate(slot.id);
        toast.success("Đã xóa ca học thành công.");
        loadTimeSlots();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Không thể xóa ca học.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ca học</h1>
          
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-1.5" />
          Thêm ca học
        </Button>
      </div>

      {/* Quick Setup Card */}
      <div className="rounded-card border border-surface-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Thiết lập nhanh</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Thời lượng mỗi ca (phút)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              min={15}
              max={300}
              className="mt-1 w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Thời gian nghỉ giữa ca (phút)</label>
            <input
              type="number"
              value={gapMinutes}
              onChange={(e) => setGapMinutes(Number(e.target.value))}
              min={0}
              max={120}
              className="mt-1 w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <hr className="my-5 border-surface-border" />

        <div className="grid gap-6 md:grid-cols-3">
          {/* Morning */}
          <div className="space-y-3 rounded-card border border-surface-border bg-surface-page p-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              Buổi sáng
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600">Bắt đầu</label>
                <input
                  type="time"
                  value={morningStart}
                  onChange={(e) => setMorningStart(e.target.value)}
                  className="mt-1 w-full rounded-input border border-surface-border bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Số ca</label>
                <input
                  type="number"
                  value={morningCount}
                  onChange={(e) => setMorningCount(Number(e.target.value))}
                  min={0}
                  max={10}
                  className="mt-1 w-full rounded-input border border-surface-border bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Afternoon */}
          <div className="space-y-3 rounded-card border border-surface-border bg-surface-page p-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              Buổi chiều
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600">Bắt đầu</label>
                <input
                  type="time"
                  value={afternoonStart}
                  onChange={(e) => setAfternoonStart(e.target.value)}
                  className="mt-1 w-full rounded-input border border-surface-border bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Số ca</label>
                <input
                  type="number"
                  value={afternoonCount}
                  onChange={(e) => setAfternoonCount(Number(e.target.value))}
                  min={0}
                  max={10}
                  className="mt-1 w-full rounded-input border border-surface-border bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Evening */}
          <div className="space-y-3 rounded-card border border-surface-border bg-surface-page p-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              Buổi tối
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600">Bắt đầu</label>
                <input
                  type="time"
                  value={eveningStart}
                  onChange={(e) => setEveningStart(e.target.value)}
                  className="mt-1 w-full rounded-input border border-surface-border bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Số ca</label>
                <input
                  type="number"
                  value={eveningCount}
                  onChange={(e) => setEveningCount(Number(e.target.value))}
                  min={0}
                  max={10}
                  className="mt-1 w-full rounded-input border border-surface-border bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <Button onClick={handleOpenPreview}>Xem trước ca học</Button>
        </div>
      </div>

      {/* Current Time Slot List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Danh sách ca học hiện tại</h2>

        {isLoading ? (
          <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-500">
            Đang tải ca học...
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="rounded-card border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-500">
            Trung tâm chưa có ca học nào
          </div>
        ) : (
          PERIOD_ORDER.map((period) => {
            const periodSlots = timeSlots.filter((slot) => slot.period === period);
            if (periodSlots.length === 0) return null;

            return (
              <div key={period} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {period === "MORNING" && "Sáng"}
                  {period === "AFTERNOON" && "Chiều"}
                  {period === "EVENING" && "Tối"}
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {periodSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`rounded-card border bg-white p-4 transition-shadow hover:shadow-sm ${
                        slot.isActive ? "border-surface-border" : "border-gray-200 bg-gray-50/60"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{slot.name}</span>
                            {!slot.isActive && (
                              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                Ngưng dùng
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-medium text-primary">
                            {slot.startTime.slice(0, 5)} – {slot.endTime.slice(0, 5)}
                          </p>
                          {slot.isUsed && (
                            <p className="mt-1 text-[11px] text-gray-400">Đang dùng trong lịch học</p>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(slot)}
                            className="rounded-btn border border-surface-border bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-surface-hover"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrDeactivate(slot)}
                            className="rounded-btn border border-red-200 bg-white px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            {slot.isUsed ? "Ngưng" : "Xóa"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview Modal for Quick Setup */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Xem trước cấu hình Ca học"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Hệ thống sẽ khởi tạo <strong className="text-gray-900">{generatedPreview.length} ca học</strong> dưới đây:
          </p>

          <div className="max-h-72 overflow-y-auto space-y-4 border border-surface-border rounded-card p-4 bg-surface-page">
            {PERIOD_ORDER.map((period) => {
              const pSlots = generatedPreview.filter((s) => s.period === period);
              if (pSlots.length === 0) return null;
              return (
                <div key={period} className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase">
                    {TIME_SLOT_PERIOD_LABELS[period]}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {pSlots.map((s, idx) => (
                      <div key={idx} className="rounded-input border border-surface-border bg-white p-2.5 text-xs">
                        <div className="font-semibold text-gray-900">{s.name}</div>
                        <div className="text-primary font-medium mt-0.5">
                          {s.startTime} – {s.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>
              Quay lại
            </Button>
            <Button isLoading={isQuickSetupSaving} onClick={handleConfirmQuickSetup}>
              Tạo {generatedPreview.length} ca học
            </Button>
          </div>
        </div>
      </Modal>

      {/* Single Time Slot Modal */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        title={editingSlot ? "Chỉnh sửa ca học" : "Thêm ca học thủ công"}
      >
        <form onSubmit={handleSaveSingleSlot} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tên ca học *</label>
            <input
              type="text"
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
              placeholder="ví dụ: Ca sáng 1"
              className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Buổi *</label>
            <select
              value={slotPeriod}
              onChange={(e) => setSlotPeriod(e.target.value as TimeSlotPeriod)}
              className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="MORNING">Sáng</option>
              <option value="AFTERNOON">Chiều</option>
              <option value="EVENING">Tối</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Giờ bắt đầu *</label>
              <input
                type="time"
                value={slotStartTime}
                onChange={(e) => setSlotStartTime(e.target.value)}
                disabled={editingSlot ? editingSlot.isUsed : false}
                className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Giờ kết thúc *</label>
              <input
                type="time"
                value={slotEndTime}
                onChange={(e) => setSlotEndTime(e.target.value)}
                disabled={editingSlot ? editingSlot.isUsed : false}
                className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          </div>

          {editingSlot?.isUsed && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-card border border-amber-200">
              Ca học này đang được dùng trong các lịch học. Không thể sửa giờ bắt đầu / giờ kết thúc để bảo đảm dữ liệu lịch sử.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
              <input
                type="number"
                value={slotDisplayOrder}
                onChange={(e) => setSlotDisplayOrder(Number(e.target.value))}
                min={0}
                className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slotIsActive}
                  onChange={(e) => setSlotIsActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                Đang hoạt động
              </label>
            </div>
          </div>

          {singleError && <p className="text-xs text-red-600">{singleError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsSingleModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isSavingSlot}>
              {editingSlot ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
