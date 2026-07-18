export interface UserInfo {
  userId?: number;
  phoneNumber?: string;
  email?: string;
  fullName?: string;
  roleName: "ADMIN" | "OWNER" | "TEACHER" | "STUDENT" | "CASHIER" | "MANAGER" | "ACADEMIC_STAFF";
  centerName?: string;
  centerId?: number | null;
  permissions?: string[];
}

export interface AuthResponse {
  accessToken: string;
  sessionId?: string;
  phoneNumber?: string;
  email?: string;
  fullName?: string;
  roleName: "ADMIN" | "OWNER" | "TEACHER" | "STUDENT" | "CASHIER" | "MANAGER" | "ACADEMIC_STAFF";
  centerName?: string;
  centerId?: number | null;
  permissions?: string[];
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
  deviceName?: string;
  deviceType?: "DESKTOP" | "MOBILE" | "TABLET" | "UNKNOWN";
}
