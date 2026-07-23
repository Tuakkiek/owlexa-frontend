export interface RoomRequest {
  code: string;
  name: string;
  capacity?: number;
  description?: string;
  isActive?: boolean;
}

export interface RoomResponse {
  id: number;
  code: string;
  name: string;
  capacity: number | null;
  description: string | null;
  isActive: boolean;
  centerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomScheduleSummaryResponse {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  className: string;
  teacherName: string;
  type: string;
}

export interface RoomDependencyDto {
  className: string;
  teacherName: string;
  dayOfWeek: string;
  timeRange: string;
}

export interface RoomDeleteValidationResponse {
  canDelete: boolean;
  message: string;
  dependencies: RoomDependencyDto[];
}
