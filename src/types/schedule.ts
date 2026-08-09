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
  eventDate?: string | null;
  lessonNumber?: number | null;
  eventStatus?: "SCHEDULED" | "CANCELLED" | "MOVED" | null;
  source?: "RECURRING_LEGACY" | "EVENT" | string | null;
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

export interface ScheduleRuleRequest {
  teacherUserId: number;
  roomId: number;
  daysOfWeek: number[];
  startDate: string;
  timeSlotId: number;
  type?: Exclude<ScheduleType, "CANCELLED">;
}

export interface ScheduleRuleResponse {
  id: number;
  classId: number;
  teacherUserId: number;
  teacherUserFullName: string;
  roomId: number;
  roomName: string;
  timeSlotId?: number;
  timeSlotName?: string;
  timeSlotPeriod?: "MORNING" | "AFTERNOON" | "EVENING";
  repeatType: "WEEKLY";
  daysOfWeek: number[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: Exclude<ScheduleType, "CANCELLED">;
  isActive: boolean;
  generatedEventCount: number;
}

export type ScheduleEventType = "LESSON" | "ONLINE_LESSON" | "PRACTICE" | "EXAM";
export type ScheduleEventStatus = "SCHEDULED" | "CANCELLED" | "MOVED";

export interface ScheduleEventRequest {
  teacherUserId?: number;
  roomId?: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  eventType: ScheduleEventType;
  status?: ScheduleEventStatus;
  title?: string;
  note?: string;
}

export interface ScheduleEventResponse {
  id: number;
  classId: number;
  className: string;
  recurringRuleId: number | null;
  teacherUserId: number | null;
  teacherUserFullName: string | null;
  roomId: number | null;
  roomName: string | null;
  eventDate: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  lessonNumber: number | null;
  eventType: ScheduleEventType;
  status: ScheduleEventStatus;
  title: string | null;
  note: string | null;
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

/** For backend responses that return DayOfWeek as a Java enum string (e.g. "MONDAY") */
export const DAY_OF_WEEK_LABELS: Record<string, string> = {
  MONDAY: "Thứ Hai",
  TUESDAY: "Thứ Ba",
  WEDNESDAY: "Thứ Tư",
  THURSDAY: "Thứ Năm",
  FRIDAY: "Thứ Sáu",
  SATURDAY: "Thứ Bảy",
  SUNDAY: "Chủ Nhật",
};
