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
  success: boolean;
  message?: string;
}
