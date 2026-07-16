import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { RoomRequest, RoomResponse } from "../../../types/room";

interface RoomFormProps {
  initialData?: RoomResponse;
  onSubmit: (data: RoomRequest) => Promise<void>;
  onCancel: () => void;
}

export const RoomForm = ({
  initialData,
  onSubmit,
  onCancel,
}: RoomFormProps) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setCapacity(initialData.capacity?.toString() ?? "");
      setDescription(initialData.description ?? "");
      setIsActive(initialData.isActive);
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Mã phòng không được để trống.");
      return;
    }
    if (!name.trim()) {
      setError("Tên phòng không được để trống.");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        capacity: capacity ? Number(capacity) : undefined,
        description: description.trim() || undefined,
        isActive,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu phòng học.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Mã phòng *
        </label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="VD: P201"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tên phòng *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Phòng 201"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Sức chứa
        </label>
        <Input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="VD: 30"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Mô tả
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-input border border-surface-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="Mô tả phòng học..."
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="accent-primary"
        />
        <span className="text-gray-700">Đang hoạt động</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );
};
