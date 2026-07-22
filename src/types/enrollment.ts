export type EnrollmentStatus = "PENDING" | "ACTIVE" | "DROPPED" | "SUSPENDED";

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING: "Chờ duyệt",
  ACTIVE: "Đang học",
  DROPPED: "Đã rời lớp",
  SUSPENDED: "Tạm dừng",
};

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
}

export interface EnrollmentRequest {
  studentId: number;
}
