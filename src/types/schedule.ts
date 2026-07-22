export type ScheduleType = "THEORY_CLASS" | "ONLINE_CLASS" | "EXAM" | "CANCELLED";

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  THEORY_CLASS: "Lịch học lý thuyết",
  ONLINE_CLASS: "Lịch học trực tuyến",
  EXAM: "Lịch thi",
  CANCELLED: "Lịch tạm ngưng",
};

export interface ScheduleResponse {
  id: number;
  classId: number;
  className: string;
  centerId: number;
  teacherUserId: number;
  teacherUserFullName: string;
  teacherPhoneNumber: string;
  roomId: number;
  roomName: string;
  roomCode: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: ScheduleType;
  createdAt: string;
}

export interface ScheduleRequest {
  teacherUserId: number;
  roomId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type?: ScheduleType;
}

export const DAY_LABELS: Record<number, string> = {
  0: "Chủ Nhật",
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
};
