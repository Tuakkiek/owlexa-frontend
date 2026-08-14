export type EnrollmentStatus = "PENDING" | "ACTIVE" | "DROPPED" | "SUSPENDED";

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING: "Chờ duyệt",
  ACTIVE: "Đang học",
  DROPPED: "Đã rời lớp",
  SUSPENDED: "Tạm dừng",
};

export type DropReason = "PERSONAL" | "RELOCATION" | "DISSATISFACTION" | "FINANCIAL" | "OTHER";

export interface EnrollmentResponse {
  id: number;
  classId: number;
  centerId: number;
  studentUserId: number;
  studentPhoneNumber: string;
  studentFullName: string;
  enrollmentByUserId: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  dropReason?: DropReason;
  droppedAt?: string;
}

export interface EnrollmentRequest {
  studentId: number;
}

export interface DropEnrollmentRequest {
  reason: DropReason;
  note?: string;
}

