export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

export interface AttendanceResponse {
  id: number;
  scheduleId: number;
  classId: number;
  centerId: number;
  studentUserId: number;
  studentPhoneNumber: string;
  studentFullName: string;
  sessionDate: string;
  status: AttendanceStatus;
  note?: string;
  notedByUserId: number;
  createdAt: string;
}

export interface AttendanceMarkItem {
  studentUserId: number;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceMarkRequest {
  sessionDate: string;
  records: AttendanceMarkItem[];
}
