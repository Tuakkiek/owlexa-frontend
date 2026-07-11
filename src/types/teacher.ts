export interface TeacherRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface TeacherResponse {
  userId: number;
  fullName: string;
  phoneNumber: string;
  centerId: number;
  temporaryPassword?: string;
  salary?: string | null;
  currency?: string | null;
}

export interface TeacherSalaryRequest {
  salary: string;
  currency?: string;
}

export interface TeacherSalaryResponse {
  teacherUserId: number;
  centerId: number;
  teacherFullName: string;
  teacherPhoneNumber: string;
  salary: string | null;
  currency: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BulkTeacherItem {
  phoneNumber: string;
  fullName: string;
  email: string;
}

export interface BulkTeacherRequest {
  teachers: BulkTeacherItem[];
}

export interface BulkTeacherResult {
  phoneNumber: string;
  temporaryPassword?: string;
  status: string;
}
