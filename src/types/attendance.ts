export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceRecord {
  studentUserId: number;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceMarkRequest {
  date: string;
  records: AttendanceRecord[];
}

export interface AttendanceResponse {
  id: number;
  scheduleId: number;
  classId: number;
  centerId: number;
  studentUserId: number;
  studentPhoneNumber: string;
  studentFullName: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  markedByUserId: number | null;
  createdAt: string;
}

export const STATUS_META: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  PRESENT: {
    label: "Có mặt",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  ABSENT: {
    label: "Vắng",
    className: "border-rose-300 bg-rose-50 text-rose-700",
  },
  LATE: {
    label: "Muộn",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  EXCUSED: {
    label: "Xin phép",
    className: "border-blue-300 bg-blue-50 text-blue-700",
  },
};
