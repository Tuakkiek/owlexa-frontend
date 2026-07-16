export type ClassStatus =
  | "PLANNING"
  | "OPEN"
  | "FULL"
  | "IN_PROGRESS"
  | "FINISHED"
  | "ARCHIVED"
  | "CANCELLED";

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  PLANNING: "Lên kế hoạch",
  OPEN: "Mở đăng ký",
  FULL: "Đã đầy",
  IN_PROGRESS: "Đang học",
  FINISHED: "Đã kết thúc",
  ARCHIVED: "Đã lưu trữ",
  CANCELLED: "Đã hủy",
};

export interface ClassRequest {
  name: string;
  courseId: number;
  teacherUserId?: number;
  vstepLevel: string;
  maxStudent: number;
  monthlyFee: number;
}

export interface ClassResponse {
  id: number;
  name: string;
  vstepLevel: string;
  maxStudents: number;
  monthFee: number;
  status: ClassStatus;
  isActive: boolean;
  centerId: number;
  courseId: number | null;
  courseName: string | null;
  courseCode: string | null;
  teacherUserId: number | null;
  teacherFullName: string | null;
  teacherPhoneNumber: string | null;
}
