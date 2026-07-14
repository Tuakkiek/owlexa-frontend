import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { teacherApi } from "../../../api/teacherApi";
import type {
  TeacherResponse,
  TeacherSalaryResponse,
} from "../../../types/teacher";

interface TeacherSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherResponse | null;
  onSaved: (updated: TeacherSalaryResponse) => void;
}

const SUPPORTED_CURRENCIES = ["VND", "USD"];

const formatCurrency = (value: string | null, currency: string | null) => {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  const code = currency ?? "VND";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(numeric);
};

export const TeacherSalaryModal = ({
  isOpen,
  onClose,
  teacher,
  onSaved,
}: TeacherSalaryModalProps) => {
  const [salary, setSalary] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [current, setCurrent] = useState<TeacherSalaryResponse | null>(null);

  const reset = () => {
    setSalary("");
    setCurrency("VND");
    setError("");
    setSuccess(false);
    setCurrent(null);
  };

  useEffect(() => {
    if (!isOpen || !teacher) {
      reset();
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await teacherApi.getSalary(teacher.userId);
        setCurrent(data);
        if (data.salary !== null && data.salary !== undefined) {
          setSalary(data.salary);
        } else {
          setSalary("");
        }
        if (data.currency) {
          setCurrency(data.currency);
        } else {
          setCurrency("VND");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ?? "Không thể tải thông tin lương.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isOpen, teacher]);

  if (!teacher) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const trimmed = salary.trim();
    if (!trimmed) {
      setError("Vui lòng nhập số tiền lương.");
      return;
    }
    if (Number.isNaN(Number(trimmed))) {
      setError("Số tiền không hợp lệ.");
      return;
    }
    if (Number(trimmed) < 0) {
      setError("Lương phải lớn hơn hoặc bằng 0.");
      return;
    }

    try {
      setIsSaving(true);
      const result = await teacherApi.upsertSalary(teacher.userId, {
        salary: trimmed,
        currency,
      });
      setCurrent(result);
      setSalary(result.salary ?? trimmed);
      setSuccess(true);
      onSaved(result);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu lương.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (
      !window.confirm(
        `Xóa thông tin lương của giáo viên "${teacher.fullName}"?`,
      )
    ) {
      return;
    }

    try {
      setIsClearing(true);
      setError("");
      const result = await teacherApi.clearSalary(teacher.userId);
      setCurrent(result);
      setSalary("");
      setSuccess(true);
      onSaved(result);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể xóa lương.");
    } finally {
      setIsClearing(false);
    }
  };

  const hasExistingSalary =
    current !== null &&
    current.salary !== null &&
    current.salary !== undefined &&
    current.salary !== "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lương giáo viên — ${teacher.fullName}`}
    >
      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-500">
          Đang tải thông tin lương...
        </div>
      ) : success ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-emerald-700">
            Lưu lương thành công
          </p>
          <p className="mt-1 text-sm text-gray-500">Đang đóng...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Giáo viên:</span>
              <span className="font-semibold text-gray-900">
                {teacher.fullName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số điện thoại:</span>
              <span className="font-medium text-gray-900">
                {teacher.phoneNumber}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-500">Lương hiện tại:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(
                  current?.salary ?? null,
                  current?.currency ?? null,
                )}
              </span>
            </div>
            {current?.updatedAt && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Cập nhật lần cuối:</span>
                <span>
                  {new Date(current.updatedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Số tiền lương
            </label>
            <Input
              label=""
              type="number"
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
              placeholder="VD: 8000000"
              min={0}
              step="any"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Loại tiền tệ
            </label>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <div>
              {hasExistingSalary && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClear}
                  isLoading={isClearing}
                  disabled={isSaving}
                >
                  Xóa lương
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSaving || isClearing}
              >
                Đóng
              </Button>
              <Button type="submit" isLoading={isSaving}>
                {hasExistingSalary ? "Cập nhật lương" : "Lưu lương"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default TeacherSalaryModal;
