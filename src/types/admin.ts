import type { PageResponse } from "./pagination";

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalTeachers: number;
  totalStudents: number;
  totalCashiers: number;
  totalAdmins: number;
  totalCenters: number;
}

export type AdminRole =
  | "ADMIN"
  | "OWNER"
  | "MANAGER"
  | "ACADEMIC_STAFF"
  | "TEACHER"
  | "STUDENT"
  | "CASHIER";

export interface AdminUser {
  id: number;
  fullName?: string;
  phoneNumber: string;
  email?: string;
  role: AdminRole;
  centerId?: number;
  centerName?: string;
  active: boolean;
}

export interface AdminCenter {
  id: number;
  name: string;
  subdomain: string;
  ownerId: number;
  ownerName?: string;
  ownerPhoneNumber: string;
  memberCount: number;
  createdAt: string;
  active: boolean;
}

export type AdminUserPage = PageResponse<AdminUser>;
export type AdminCenterPage = PageResponse<AdminCenter>;

export type AdminAuditAction =
  | "USER_LOCKED"
  | "USER_UNLOCKED"
  | "CENTER_LOCKED"
  | "CENTER_UNLOCKED";

export type AdminAuditTargetType = "USER" | "CENTER";

export interface AdminAuditLog {
  id: number;
  adminUserId: number;
  adminName?: string;
  adminPhoneNumber: string;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId: number;
  targetName: string;
  previousStatus: "ACTIVE" | "INACTIVE";
  newStatus: "ACTIVE" | "INACTIVE";
  reason: string;
  createdAt: string;
}

export type AdminAuditLogPage = PageResponse<AdminAuditLog>;
