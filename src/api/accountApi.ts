import axiosClient from "./axiosClient";

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

export const accountApi = {
  getMyAccount: async (): Promise<AccountResponse> => {
    const response = await axiosClient.get("/account");
    return response.data;
  },

  updateMyAccount: async (request: UpdateAccountRequest): Promise<AccountResponse> => {
    const response = await axiosClient.put("/account", request);
    return response.data;
  },

  changePassword: async (request: ChangePasswordRequest): Promise<void> => {
    await axiosClient.patch("/account/password", request);
  },
};
