export interface TeacherStudentInfo {
  userId: number;
  phoneNumber: string;
  fullName: string;
  centerId: number;
}

export interface TeacherClassStudents {
  id: number;
  className: string;
  studentCount: number;
  students: TeacherStudentInfo[];
}
