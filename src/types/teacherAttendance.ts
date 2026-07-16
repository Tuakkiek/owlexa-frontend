export type TeacherAttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE";

export interface TeacherAttendanceRecord {
  teacherUserId: number;
  status: TeacherAttendanceStatus;
  note?: string;
}

export interface TeacherAttendanceMarkRequest {
  date: string;
  records: TeacherAttendanceRecord[];
}

export interface TeacherAttendanceResponse {
  id: number;
  centerId: number;
  teacherUserId: number;
  teacherFullName: string;
  teacherPhoneNumber: string;
  date: string;
  status: TeacherAttendanceStatus;
  note?: string;
  markedByUserId: number | null;
  createdAt: string;
}

export const TEACHER_STATUS_META: Record<
  TeacherAttendanceStatus,
  { label: string; className: string }
> = {
  PRESENT: {
    label: "Có mặt",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  LATE: {
    label: "Muộn",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  ABSENT: {
    label: "Vắng",
    className: "border-rose-300 bg-rose-50 text-rose-700",
  },
  LEAVE: {
    label: "Nghỉ phép",
    className: "border-blue-300 bg-blue-50 text-blue-700",
  },
};
