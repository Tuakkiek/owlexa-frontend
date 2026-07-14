import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import type { StudentResponse } from "../../../types/student";

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: (studentId: number) => Promise<void>;
  className: string;
  students: StudentResponse[];
  enrolledStudentIds: number[];
}

export const EnrollStudentModal = ({
  isOpen,
  onClose,
  onEnroll,
  className,
  students,
  enrolledStudentIds,
}: EnrollStudentModalProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelected(null);
      setError("");
    }
  }, [isOpen]);

  const available = students.filter(
    (s) =>
      !enrolledStudentIds.includes(s.userId) &&
      (s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.phoneNumber.includes(search)),
  );

  const handleSubmit = async () => {
    if (!selected) {
      setError("Vui lòng chọn một học sinh.");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      await onEnroll(selected);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể ghi danh học sinh.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ghi danh học sinh vào lớp ${className}`}
    >
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc SĐT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />

        {error && (
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 p-2">
            {error}
          </p>
        )}

        <div className="max-h-64 overflow-y-auto border border-gray-200">
          {available.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Không có học sinh nào phù hợp.
            </div>
          ) : (
            available.map((student) => (
              <label
                key={student.userId}
                className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 p-3 last:border-0 hover:bg-gray-50 ${
                  selected === student.userId ? "bg-blue-50" : ""
                }`}
              >
                <input
                  type="radio"
                  name="student"
                  value={student.userId}
                  checked={selected === student.userId}
                  onChange={() => setSelected(student.userId)}
                  className="accent-black"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {student.fullName}
                  </p>
                  <p className="text-xs text-gray-500">{student.phoneNumber}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!selected}
          >
            Ghi danh
          </Button>
        </div>
      </div>
    </Modal>
  );
};
