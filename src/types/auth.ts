export interface UserInfo {
  phoneNumber?: string;
  email?: string;
  fullName?: string;
  roleName: "ADMIN" | "OWNER" | "TEACHER" | "STUDENT" | "CASHIER";
  centerName?: string;
  centerId?: number | null;
}

export interface AuthResponse {
  accessToken: string;
  sessionId: string;
  phoneNumber?: string;
  email?: string;
  fullName?: string;
  roleName: "ADMIN" | "OWNER" | "TEACHER" | "STUDENT" | "CASHIER";
  centerName?: string;
  centerId?: number | null;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
  deviceName?: string;
  deviceType?: "DESKTOP" | "MOBILE" | "TABLET" | "UNKNOWN";
}
