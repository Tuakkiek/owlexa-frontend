import { useCallback, useEffect, useMemo, useState } from "react";
import { roomApi } from "../../api/roomApi";
import { Button } from "../../components/ui/Button";
import { TableActionButton, tableActionIcons } from "../../components/ui/TableActionButton";
import { Modal } from "../../components/ui/Modal";
import {
  Badge,
  ErrorBanner,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
} from "../../components/ui/SharedComponents";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import type { RoomRequest, RoomResponse } from "../../types/room";
import { RoomDetailDrawer } from "./components/RoomDetailDrawer";
import { RoomForm } from "./components/RoomForm";

const RoomsPage = () => {
  const confirm = useConfirm();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomResponse | null>(null);

  const loadRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setRooms(await roomApi.findAll());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải danh sách phòng học.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(q) ||
        room.code.toLowerCase().includes(q),
    );
  }, [rooms, query]);

  const openCreate = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const openEdit = (room: RoomResponse) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleSave = async (request: RoomRequest) => {
    if (editingRoom) {
      const confirmed = await confirm({
        title: "Cập nhật phòng học?",
        message: `Bạn có chắc chắn muốn cập nhật phòng "${editingRoom.name}"?`,
        confirmText: "Lưu thay đổi",
        variant: "primary",
      });
      if (!confirmed) return;

      try {
        await roomApi.update(editingRoom.id, request);
        toast.success("Cập nhật phòng học thành công.");
        setIsModalOpen(false);
        setEditingRoom(null);
        await loadRooms();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Không thể cập nhật phòng học.");
      }
      return;
    }

    try {
      await roomApi.create(request);
      toast.success("Tạo phòng học thành công.");
      setIsModalOpen(false);
      setEditingRoom(null);
      await loadRooms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể tạo phòng học.");
    }
  };

  const handleDelete = async (room: RoomResponse) => {
    try {
      const validation = await roomApi.validateDelete(room.id);
      if (!validation.canDelete) {
        let msg = `${validation.message}\n\nĐang được sử dụng bởi các lịch:\n`;
        validation.dependencies.forEach((dependency) => {
          msg += `- Lớp ${dependency.className} (${dependency.dayOfWeek} ${dependency.timeRange})\n`;
        });
        msg += "\nVui lòng điều chỉnh hoặc hủy các lịch này trước khi xóa.";
        toast.warning(msg);
        return;
      }

      const confirmed = await confirm({
        title: "Xóa phòng học?",
        message: `Bạn có chắc chắn muốn xóa phòng học "${room.name}" không?`,
        confirmText: "Xóa",
        variant: "danger",
      });
      if (!confirmed) return;

      await roomApi.delete(room.id);
      toast.success("Xóa phòng học thành công.");
      await loadRooms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa phòng học.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Phòng học"
        description="Quản lý phòng học của trung tâm"
      >
        <Button onClick={openCreate}>Tạo phòng học</Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tìm theo tên hoặc mã phòng..."
      />

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-16" />
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Chưa có phòng học nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-page text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-6 py-3">Mã</th>
                <th className="px-6 py-3">Tên phòng</th>
                <th className="px-6 py-3">Sức chứa</th>
                <th className="px-6 py-3">Sử dụng</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((room) => (
                <tr
                  key={room.id}
                  className="cursor-pointer hover:bg-surface-hover"
                  onClick={() => setSelectedRoom(room)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {room.code}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{room.name}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {room.capacity ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={room.isInUse ? "warning" : "default"}>
                      {room.isInUse ? `Đang dùng (${room.usageCount})` : "Chưa dùng"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={room.isActive ? "success" : "default"}>
                      {room.isActive ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </td>
                  <td
                    className="px-6 py-4 text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1.5">
                      <TableActionButton
                        variant="secondary"
                        icon={tableActionIcons.edit()}
                        onClick={() => openEdit(room)}
                      >
                        Sửa
                      </TableActionButton>
                      <TableActionButton
                        variant="danger"
                        icon={tableActionIcons.delete()}
                        onClick={() => handleDelete(room)}
                      >
                        Xóa
                      </TableActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRoom(null);
        }}
        title={editingRoom ? "Chỉnh sửa phòng học" : "Tạo phòng học mới"}
      >
        <RoomForm
          initialData={editingRoom ?? undefined}
          onSubmit={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingRoom(null);
          }}
        />
      </Modal>

      {selectedRoom && (
        <RoomDetailDrawer
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onRefresh={async () => {
            await loadRooms();
            try {
              const updated = await roomApi.findById(selectedRoom.id);
              setSelectedRoom(updated);
            } catch {
              setSelectedRoom(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default RoomsPage;
