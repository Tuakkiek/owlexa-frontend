import axiosClient from "./axiosClient";
import type {
  PermissionResponse,
  UserPermissionsResponse,
  BulkPermissionOverrideRequest,
  SinglePermissionOverrideRequest,
  EffectivePermission,
} from "../types/permission";

const BASE = "/owner";

export const permissionApi = {
  /** Get all available permissions (catalog). */
  listAll: async (): Promise<PermissionResponse[]> => {
    const response = await axiosClient.get<PermissionResponse[]>(
      `${BASE}/permissions`,
    );
    return response.data;
  },

  /** Get effective permissions for a user (with source annotations). */
  getUserPermissions: async (
    userId: number,
  ): Promise<UserPermissionsResponse> => {
    const response = await axiosClient.get<UserPermissionsResponse>(
      `${BASE}/users/${userId}/permissions`,
    );
    return response.data;
  },

  /** Bulk replace all permission overrides for a user. */
  bulkUpdateOverrides: async (
    userId: number,
    request: BulkPermissionOverrideRequest,
  ): Promise<UserPermissionsResponse> => {
    const response = await axiosClient.put<UserPermissionsResponse>(
      `${BASE}/users/${userId}/permissions`,
      request,
    );
    return response.data;
  },

  /** Update a single permission override. */
  updateSingleOverride: async (
    userId: number,
    permissionCode: string,
    request: SinglePermissionOverrideRequest,
  ): Promise<EffectivePermission> => {
    const response = await axiosClient.patch<EffectivePermission>(
      `${BASE}/users/${userId}/permissions/${permissionCode}`,
      request,
    );
    return response.data;
  },

  /** Remove all permission overrides (restore role defaults). */
  removeAllOverrides: async (userId: number): Promise<void> => {
    await axiosClient.delete(`${BASE}/users/${userId}/permissions`);
  },
};
