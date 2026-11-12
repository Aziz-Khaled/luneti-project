import { apiRequest, type JsonRecord } from "./api";

export interface EmployeeStore {
  membershipId: string;
  storeId: string;
  store: {
    id: string;
    nom: string;
    slug: string;
    devise: string;
  };
  role: string;
  preset: string | null;
  permissions: string[];
  permissionsUpdatedAt: string | null;
}

export interface PermissionDefinition {
  code: string;
  module: string;
  action: string;
}

export interface PermissionPreset {
  code: string;
  permissions: string[];
}

export interface PermissionCatalog {
  permissions: PermissionDefinition[];
  presets: PermissionPreset[];
}

export interface MemberPermissions {
  member: JsonRecord;
  preset: string | null;
  overrides: { code: string; allowed: boolean }[];
  effectivePermissions: string[];
  updatedAt: string | null;
  updatedBy: string | null;
}

export const employeeService = {
  me: () => apiRequest<{ stores: EmployeeStore[] }>("employee/me"),
  stores: () => apiRequest<{ stores: EmployeeStore[] }>("employee/stores"),
  catalog: (storeId: string) =>
    apiRequest<PermissionCatalog>(`stores/${storeId}/permissions/catalog`),
  memberPermissions: (storeId: string, memberId: string) =>
    apiRequest<MemberPermissions>(`stores/${storeId}/members/${memberId}/permissions`),
  updateMemberPermissions: (
    storeId: string,
    memberId: string,
    input: { preset: string; overrides: { code: string; allowed: boolean }[] },
  ) =>
    apiRequest<MemberPermissions>(`stores/${storeId}/members/${memberId}/permissions`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};
