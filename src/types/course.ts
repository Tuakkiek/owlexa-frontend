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

export interface CourseStatisticsResponse {
  totalClasses: number;
  totalEnrolledStudents: number;
  activeClasses: number;
  finishedClasses: number;
  plannedClasses: number;
}

export interface CourseClassResponse {
  id: number;
  name: string;
  teachers: string[];
  status: 'PLANNED' | 'ACTIVE' | 'FINISHED';
  studentCount: number;
  scheduleCount: number;
}

export interface CourseDependencyDto {
  className: string;
  status: string;
  teacherNames: string;
  studentCount: number;
}

export interface CourseDeleteValidationResponse {
  canDelete: boolean;
  message: string;
  dependencies: CourseDependencyDto[];
}
