export interface StudentRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface StudentResponse {
  userId: number;
  fullName: string;
  phoneNumber: string;
  centerId: number;
  temporaryPassword?: string;
}

export interface BulkStudentItem {
  phoneNumber: string;
  fullName: string;
  email: string;
}

export interface BulkStudentRequest {
  students: BulkStudentItem[];
}

export interface BulkStudentResult {
  phoneNumber: string;
  temporaryPassword?: string;
  status: string;
}
