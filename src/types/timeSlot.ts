export type TimeSlotPeriod = "MORNING" | "AFTERNOON" | "EVENING";

export const TIME_SLOT_PERIOD_LABELS: Record<TimeSlotPeriod, string> = {
  MORNING: "Sáng",
  AFTERNOON: "Chiều",
  EVENING: "Tối",
};

export interface TeachingTimeSlotResponse {
  id: number;
  centerId: number;
  name: string;
  period: TimeSlotPeriod;
  startTime: string;
  endTime: string;
  displayOrder: number;
  isActive: boolean;
  isUsed: boolean;
}

export interface TeachingTimeSlotRequest {
  name: string;
  period: TimeSlotPeriod;
  startTime: string;
  endTime: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface QuickSetupRequest {
  durationMinutes: number;
  gapMinutes: number;
  morningStart?: string;
  morningCount?: number;
  afternoonStart?: string;
  afternoonCount?: number;
  eveningStart?: string;
  eveningCount?: number;
}
