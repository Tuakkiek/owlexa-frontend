import axiosClient from "./axiosClient";
import type {
  AdminCenterPage,
  AdminCenter,
  AdminAuditAction,
  AdminAuditLogPage,
  AdminAuditTargetType,
  AdminRole,
  AdminStats,
  AdminUser,
  AdminUserPage,
} from "../types/admin";

interface PageQuery {
  search?: string;
  page?: number;
  size?: number;
}

interface UserQuery extends PageQuery {
  role?: AdminRole;
}

interface AuditLogQuery extends PageQuery {
  targetType?: AdminAuditTargetType;
  action?: AdminAuditAction;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await axiosClient.get<AdminStats>("/admin/stats");
    return response.data;
  },

  getUsers: async (query: UserQuery = {}): Promise<AdminUserPage> => {
    const response = await axiosClient.get<AdminUserPage>("/admin/users", {
      params: query,
    });
    return response.data;
  },

  getCenters: async (query: PageQuery = {}): Promise<AdminCenterPage> => {
    const response = await axiosClient.get<AdminCenterPage>("/admin/centers", {
      params: query,
    });
    return response.data;
  },

  getUser: async (userId: number): Promise<AdminUser> => {
    const response = await axiosClient.get<AdminUser>(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (
    userId: number,
    active: boolean,
    reason: string,
  ): Promise<AdminUser> => {
    const response = await axiosClient.patch<AdminUser>(
      `/admin/users/${userId}/status`,
      { active, reason },
    );
    return response.data;
  },

  getCenter: async (centerId: number): Promise<AdminCenter> => {
    const response = await axiosClient.get<AdminCenter>(
      `/admin/centers/${centerId}`,
    );
    return response.data;
  },

  updateCenterStatus: async (
    centerId: number,
    active: boolean,
    reason: string,
  ): Promise<AdminCenter> => {
    const response = await axiosClient.patch<AdminCenter>(
      `/admin/centers/${centerId}/status`,
      { active, reason },
    );
    return response.data;
  },

  getAuditLogs: async (
    query: AuditLogQuery = {},
  ): Promise<AdminAuditLogPage> => {
    const response = await axiosClient.get<AdminAuditLogPage>(
      "/admin/audit-logs",
      { params: query },
    );
    return response.data;
  },
};
