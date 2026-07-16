import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  PageHeader,
  SearchInput,
  ErrorBanner,
  LoadingSkeleton,
  Badge,
} from "../../components/ui/SharedComponents";
import { RoomForm } from "./components/RoomForm";
import { roomApi } from "../../api/roomApi";
import type { RoomRequest, RoomResponse } from "../../types/room";

const RoomsPage = () => {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null);

  const loadRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setRooms(await roomApi.findAll());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách phòng học.",
      );
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
      (r) =>
        r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
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
      await roomApi.update(editingRoom.id, request);
    } else {
      await roomApi.create(request);
    }
    setIsModalOpen(false);
    setEditingRoom(null);
    await loadRooms();
  };

  const handleDelete = async (room: RoomResponse) => {
    if (!window.confirm(`Xóa phòng "${room.name}"?`)) return;
    try {
      await roomApi.delete(room.id);
      await loadRooms();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể xóa phòng học.");
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
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((room) => (
                <tr key={room.id} className="hover:bg-surface-hover">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {room.code}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{room.name}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {room.capacity ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={room.isActive ? "success" : "default"}>
                      {room.isActive ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="text-xs text-blue-600 underline"
                        onClick={() => openEdit(room)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-xs text-red-600 underline"
                        onClick={() => handleDelete(room)}
                      >
                        Xóa
                      </button>
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
    </div>
  );
};

export default RoomsPage;
