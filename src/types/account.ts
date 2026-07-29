export interface AccountResponse {
  userId: number;
  phoneNumber: string;
  email: string;
  fullName: string;
  roleName: string;
  centerName: string;
  centerId: number;
  permissions: string[];
}

export interface UpdateAccountRequest {
  fullName: string;
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
