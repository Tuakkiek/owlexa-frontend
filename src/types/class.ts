export interface ClassRequest {
  name: string;
  vstepLevel: string;
  maxStudent: number;
  monthlyFee: number;
}

export interface ClassResponse {
  id: number;
  name: string;
  vstepLevel: string;
  maxStudents: number;
  monthFee: number;
  isActive: boolean;
  centerId: number;
}
