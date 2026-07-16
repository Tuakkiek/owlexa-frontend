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
