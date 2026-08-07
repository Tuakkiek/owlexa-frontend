import type { ScheduleType } from "./schedule";

export interface RoomRequest {
  code: string;
  name: string;
  capacity?: number;
  description?: string;
  isActive?: boolean;
}

export interface RoomResponse {
  id: number;
  code: string;
  name: string;
  capacity: number | null;
  description: string | null;
  isActive: boolean;
  isInUse: boolean;
  usageCount: number;
  centerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomScheduleSummaryResponse {
  id: number;
  source: "RULE" | "EVENT" | "LEGACY" | string;
  eventDate?: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  className: string;
  teacherName: string;
  type: ScheduleType;
}

export interface RoomDependencyDto {
  className: string;
  teacherName: string;
  source?: string | null;
  dayOfWeek: string;
  timeRange: string;
}

export interface RoomDeleteValidationResponse {
  canDelete: boolean;
  message: string;
  dependencies: RoomDependencyDto[];
}
