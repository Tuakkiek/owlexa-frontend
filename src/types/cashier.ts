export interface CashierRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface CashierResponse {
  userId: number;
  fullName: string;
  phoneNumber: string;
  centerId: number;
  temporaryPassword?: string;
}
