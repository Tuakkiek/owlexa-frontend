import axiosClient from "./axiosClient";
import type {
  AccountResponse,
  ChangePasswordRequest,
  UpdateAccountRequest,
} from "../types/account";

export type {
  AccountResponse,
  ChangePasswordRequest,
  UpdateAccountRequest,
} from "../types/account";

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
