export type ClassStatus = "PLANNED" | "ACTIVE" | "FINISHED";

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  PLANNED: "Đã lên kế hoạch",
  ACTIVE: "Đang hoạt động",
  FINISHED: "Đã kết thúc",
};

export interface ClassRequest {
  name: string;
  courseId: number;
  maxStudent?: number;
  monthlyFee?: number;
}

export interface ClassResponse {
  id: number;
  name: string;
  maxStudents: number;
  monthFee: number;
  status: ClassStatus;
  isActive: boolean;
  centerId: number;
  courseId: number | null;
  courseName: string | null;
  courseCode: string | null;
}
