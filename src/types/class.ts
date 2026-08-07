export type ClassStatus = "PLANNED" | "ACTIVE" | "FINISHED";

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  PLANNED: "Đã lên kế hoạch",
  ACTIVE: "Đang hoạt động",
  FINISHED: "Đã kết thúc",
};

export interface ClassRequest {
  name: string;
  courseId: number;
  startDate?: string;
  teacherUserId?: number;
  monthlyFee?: number;
  status?: ClassStatus;
}

export interface ClassResponse {
  id: number;
  name: string;
  monthFee: number;
  status: ClassStatus;
  isActive: boolean;
  centerId: number;
  courseId: number | null;
  courseName: string | null;
  courseCode: string | null;
  startDate?: string | null;
  endDate?: string | null;
  teacherUserId?: number | null;
  teacherName?: string | null;
  studentCount: number;
  scheduleCount?: number;
  teachers?: string[];
  createdAt?: string;
}
