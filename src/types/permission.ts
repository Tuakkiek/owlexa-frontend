export interface PermissionResponse {
  code: string;
  description: string;
}

export interface EffectivePermission {
  code: string;
  description: string;
  /** ENABLED = permission is active; DISABLED = permission revoked by Owner */
  source: "ENABLED" | "DISABLED";
}

export interface UserPermissionsResponse {
  userId: number;
  roleName: string;
  permissions: EffectivePermission[];
}

export interface PermissionOverrideItem {
  permissionCode: string;
  type: "DISABLED";
}

export interface BulkPermissionOverrideRequest {
  overrides: PermissionOverrideItem[];
}

export interface SinglePermissionOverrideRequest {
  type: "DISABLED";
}
