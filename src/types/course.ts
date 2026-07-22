export interface CourseRequest {
  code: string;
  name: string;
  description?: string;
  defaultDuration?: number;
  defaultMonthlyFee?: number;
  defaultMaxStudents?: number;
  isActive?: boolean;
}

export interface CourseResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  defaultDuration: number | null;
  defaultMonthlyFee: number | null;
  defaultMaxStudents: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
