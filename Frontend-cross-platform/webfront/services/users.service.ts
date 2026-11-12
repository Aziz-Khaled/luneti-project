import { apiRequest, JsonRecord, queryString } from "./api";
import type { User } from "./auth.service";

export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const usersService = {
  me: () => apiRequest<User>("users/me"),
  updateMe: (input: JsonRecord) =>
    apiRequest<User>("users/me", { method: "PATCH", body: JSON.stringify(input) }),
  list: (page = 1) => apiRequest<Page<User>>(`users${queryString({ page, limit: 20 })}`),
  publicProfile: (id: string) => apiRequest<User>(`users/${id}`),
  followers: (id: string, page = 1) =>
    apiRequest<Page<User>>(`users/${id}/followers${queryString({ page, limit: 20 })}`),
  following: (id: string, page = 1) =>
    apiRequest<Page<User>>(`users/${id}/following${queryString({ page, limit: 20 })}`),
  follow: (id: string) => apiRequest<JsonRecord>(`users/${id}/follow`, { method: "POST" }),
  unfollow: (id: string) =>
    apiRequest<JsonRecord>(`users/${id}/follow`, { method: "DELETE" }),
};
