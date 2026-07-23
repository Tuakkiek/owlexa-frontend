import { useEffect, useState, useCallback } from "react";
import { Badge } from "../../../components/ui/SharedComponents";
import { courseApi } from "../../../api/courseApi";
import { classApi } from "../../../api/classApi";
import type { CourseResponse, CourseStatisticsResponse, CourseClassResponse } from "../../../types/course";
import type { ClassResponse } from "../../../types/class";
import { CLASS_STATUS_LABELS } from "../../../types/class";
import { formatCurrency } from "../../../utils/money";
import { ClassDetailDrawer } from "./ClassDetailDrawer";

interface CourseDetailDrawerProps {
  course: CourseResponse;
  onClose: () => void;
  onRefresh: () => void;
}

export const CourseDetailDrawer = ({ course, onClose, onRefresh }: CourseDetailDrawerProps) => {
  const [stats, setStats] = useState<CourseStatisticsResponse | null>(null);
  const [classes, setClasses] = useState<CourseClassResponse[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(course.name);
  const [editCode, setEditCode] = useState(course.code);
  const [editDescription, setEditDescription] = useState(course.description ?? "");
  const [editMonthlyFee, setEditMonthlyFee] = useState(course.defaultMonthlyFee ?? 0);
  const [editMaxStudents, setEditMaxStudents] = useState(course.defaultMaxStudents ?? 30);
  const [editIsActive, setEditIsActive] = useState(course.isActive);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState<ClassResponse | null>(null);

  const loadDetails = useCallback(async () => {
    setIsLoadingDetails(true);
    try {
      const [s, c] = await Promise.all([
        courseApi.getStatistics(course.id),
        courseApi.getClasses(course.id),
      ]);
      setStats(s);
      setClasses(c);
    } catch {
      // silent
    } finally {
      setIsLoadingDetails(false);
    }
  }, [course.id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    setEditName(course.name);
    setEditCode(course.code);
    setEditDescription(course.description ?? "");
    setEditMonthlyFee(course.defaultMonthlyFee ?? 0);
    setEditMaxStudents(course.defaultMaxStudents ?? 30);
    setEditIsActive(course.isActive);
  }, [course]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editCode.trim()) {
      alert("Tên và mã khóa học không được để trống");
      return;
    }
    try {
      setIsSaving(true);
      await courseApi.update(course.id, {
        name: editName.trim(),
        code: editCode.trim(),
        description: editDescription.trim(),
        defaultMonthlyFee: editMonthlyFee,
        defaultMaxStudents: editMaxStudents,
        isActive: editIsActive,
      });
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Không thể lưu thông tin khóa học.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClassClick = async (classId: number) => {
    try {
      const clsDetail = await classApi.findById(classId);
      setSelectedClass(clsDetail);
    } catch {
      alert("Không thể tải thông tin chi tiết lớp học.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-3xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết khóa học</h2>
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
                <label className="block text-xs font-medium text-gray-700">Mã khóa học *</label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-955"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Tên khóa học *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-955"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Học phí mặc định (VNĐ)</label>
                <input
                  type="number"
                  value={editMonthlyFee}
                  onChange={(e) => setEditMonthlyFee(Number(e.target.value))}
                  min={0}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-955"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Sĩ số mặc định</label>
                <input
                  type="number"
                  value={editMaxStudents}
                  onChange={(e) => setEditMaxStudents(Number(e.target.value))}
                  min={1}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-955"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Trạng thái hoạt động</label>
                <select
                  value={editIsActive ? "true" : "false"}
                  onChange={(e) => setEditIsActive(e.target.value === "true")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-955"
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
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none bg-white text-gray-955"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(course.name);
                  setEditCode(course.code);
                  setEditDescription(course.description ?? "");
                  setEditMonthlyFee(course.defaultMonthlyFee ?? 0);
                  setEditMaxStudents(course.defaultMaxStudents ?? 30);
                  setEditIsActive(course.isActive);
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
              <h3 className="text-lg font-bold text-gray-950">{course.name} ({course.code})</h3>
              <Badge variant={course.isActive ? "success" : "default"}>
                {course.isActive ? "Hoạt động" : "Không hoạt động"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Mã khóa học:</span>
                <span className="font-medium text-gray-950">{course.code}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Học phí mặc định:</span>
                <span className="font-medium text-gray-955">{formatCurrency(course.defaultMonthlyFee)}/tháng</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 col-span-2">
                <span className="text-gray-500">Mô tả:</span>
                <span className="font-medium text-gray-955">{course.description || "Chưa có mô tả."}</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 border-b bg-gray-50/30 p-6 text-center">
            <div className="rounded-lg border bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Tổng số lớp</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{stats.totalClasses}</p>
            </div>
            <div className="rounded-lg border bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Học sinh đăng ký</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{stats.totalEnrolledStudents}</p>
            </div>
            <div className="rounded-lg border bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Đang dạy</p>
              <p className="mt-1 text-xl font-bold text-blue-600">{stats.activeClasses}</p>
            </div>
            <div className="rounded-lg border bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Lên kế hoạch</p>
              <p className="mt-1 text-xl font-bold text-amber-500">{stats.plannedClasses}</p>
            </div>
            <div className="rounded-lg border bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Hoàn thành</p>
              <p className="mt-1 text-xl font-bold text-gray-500">{stats.finishedClasses}</p>
            </div>
          </div>
        )}

        {/* Classes Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">Danh sách lớp học sử dụng khóa học</h3>
          {isLoadingDetails ? (
            <div className="py-8 text-center text-sm text-gray-500">Đang tải danh sách lớp...</div>
          ) : classes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
              Khóa học này hiện chưa được mở lớp nào.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 py-3">Tên lớp</th>
                    <th className="px-4 py-3">Giáo viên</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Học sinh</th>
                    <th className="px-4 py-3">Schedules</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classes.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleClassClick(c.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900 underline hover:text-primary">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[120px]" title={c.teachers.join(", ")}>
                        {c.teachers.join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            c.status === "ACTIVE"
                              ? "success"
                              : c.status === "PLANNED"
                                ? "warning"
                                : "default"
                          }
                        >
                          {CLASS_STATUS_LABELS[c.status] ?? c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.studentCount}</td>
                      <td className="px-4 py-3 text-gray-500">{c.scheduleCount} buổi/tuần</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedClass && (
        <ClassDetailDrawer
          cls={selectedClass}
          onClose={() => setSelectedClass(null)}
          onRefresh={async () => {
            // refresh data inside course classes table
            await loadDetails();
            try {
              const updated = await classApi.findById(selectedClass.id);
              setSelectedClass(updated);
            } catch {
              setSelectedClass(null);
            }
          }}
        />
      )}
    </div>
  );
};
