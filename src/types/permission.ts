export interface PermissionResponse {
  code: string;
  description: string;
}

export interface EffectivePermission {
  code: string;
  description: string;
  source: "ROLE_DEFAULT" | "ALLOW" | "DENY";
}

export interface UserPermissionsResponse {
  userId: number;
  roleName: string;
  permissions: EffectivePermission[];
}

export interface PermissionOverrideItem {
  permissionCode: string;
  type: "ALLOW" | "DENY" | "INHERIT";
}

export interface BulkPermissionOverrideRequest {
  overrides: PermissionOverrideItem[];
}

export interface SinglePermissionOverrideRequest {
  type: "ALLOW" | "DENY" | "INHERIT";
}
