export type EnrollmentStatus = "ACTIVE" | "DROPPED";

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
